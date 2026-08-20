import { NextResponse } from "next/server";
import {
  PROTOCOL_VERSION,
  RpcError,
  SERVER_NAME,
  SERVER_VERSION,
  fail,
  isJsonRpcRequest,
  isNotification,
  ok,
  type JsonRpcRequest,
  type JsonRpcResponse,
} from "@/lib/mcp/protocol";
import { TOOLS_BY_NAME, toolsManifest } from "@/lib/mcp/tools";
import type { AuthResult } from "@/lib/mcp/auth";

/**
 * منطق مشترک اندپوینت MCP.
 *
 * دو مسیر ورودی دارد و هر دو دقیقاً همین کد را اجرا می‌کنند:
 *   • /api/mcp            با هدر Authorization: Bearer
 *   • /api/mcp/<token>    توکن داخل مسیر
 *
 * مسیر دوم برای کلاینت‌هایی است که فقط یک URL می‌گیرند و امکان
 * تنظیم هدر ندارند (مثل فرم افزودن کانکتور در کلاد).
 */

const MAX_BODY_BYTES = 64 * 1024;

const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
};

function jsonResponse(body: JsonRpcResponse | null, status = 200) {
  // نوتیفیکیشن‌ها طبق استاندارد بدنه‌ی پاسخ ندارند
  if (body === null) return new NextResponse(null, { status: 202 });

  return NextResponse.json(body, { status, headers: BASE_HEADERS });
}

/**
 * پاسخ به‌شکل Server-Sent Events.
 *
 * ترنسپورت «Streamable HTTP» در استاندارد MCP اجازه می‌دهد سرور پاسخ را
 * یا به‌صورت JSON ساده بدهد یا به‌صورت SSE. بعضی کلاینت‌ها — از جمله فرم
 * کانکتور کلاد — هدر `Accept: text/event-stream` می‌فرستند و انتظار
 * استریم دارند؛ اگر JSON خام بگیرند نمی‌توانند پارسش کنند و خطای
 * «Couldn't reach» می‌دهند.
 *
 * چون پاسخ ما تک‌پیامی است، یک رویداد می‌فرستیم و استریم را می‌بندیم.
 */
function sseResponse(body: JsonRpcResponse | null, status = 200) {
  if (body === null) return new NextResponse(null, { status: 202 });

  const payload = `event: message\ndata: ${JSON.stringify(body)}\n\n`;

  return new NextResponse(payload, {
    status,
    headers: {
      ...BASE_HEADERS,
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
    },
  });
}

/** کلاینت استریم می‌خواهد یا JSON؟ */
function prefersSse(request: Request): boolean {
  return (request.headers.get("accept") ?? "").includes("text/event-stream");
}

/**
 * پاسخ رد شدن احراز هویت.
 *
 * عمداً هدر `WWW-Authenticate` نمی‌فرستیم. طبق استاندارد MCP، آن هدر به
 * کلاینت می‌گوید «من با OAuth کار می‌کنم، برو سرویس احراز هویتم را پیدا
 * کن». ما OAuth نداریم و توکن ثابت استفاده می‌کنیم، پس فرستادن آن هدر
 * کلاینت را به مسیر اشتباه می‌برد و خطای گیج‌کننده‌ی
 * «Couldn't register with sign-in service» می‌دهد.
 */
function authFailure(auth: Extract<AuthResult, { ok: false }>) {
  return NextResponse.json(
    { error: auth.message },
    {
      status: auth.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

async function dispatch(
  request: JsonRpcRequest,
): Promise<JsonRpcResponse | null> {
  const id = request.id ?? null;

  switch (request.method) {
    case "initialize":
      return ok(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        instructions:
          "ابزارهای PsyG فقط-خواندنی هستند. برای دیدن وضعیت کلی از site_status و برای بررسی امنیت از security_audit استفاده کن.",
      });

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return ok(id, {});

    case "tools/list":
      return ok(id, { tools: toolsManifest() });

    case "tools/call": {
      const params = request.params ?? {};
      const name = params.name;

      if (typeof name !== "string") {
        return fail(id, RpcError.INVALID_PARAMS, "نام ابزار لازم است");
      }

      const tool = TOOLS_BY_NAME.get(name);
      if (!tool) {
        return fail(
          id,
          RpcError.INVALID_PARAMS,
          `ابزار «${name}» وجود ندارد. ابزارهای موجود: ${[...TOOLS_BY_NAME.keys()].join(", ")}`,
        );
      }

      const args =
        typeof params.arguments === "object" && params.arguments !== null
          ? (params.arguments as Record<string, unknown>)
          : {};

      try {
        return ok(id, await tool.handler(args));
      } catch (error) {
        // جزئیات خطا در لاگ سرور می‌ماند، نه در پاسخ — ساختار داخلی
        // برنامه نباید به بیرون درز کند
        console.error(`[mcp] ابزار ${name} شکست خورد:`, error);
        return fail(id, RpcError.INTERNAL, `اجرای ابزار «${name}» شکست خورد`);
      }
    }

    default:
      return fail(
        id,
        RpcError.METHOD_NOT_FOUND,
        `متد «${request.method}» پشتیبانی نمی‌شود`,
      );
  }
}

/** بدنه‌ی POST را می‌خواند، اعتبارسنجی می‌کند و پاسخ می‌دهد */
export async function handleMcpPost(
  request: Request,
  auth: AuthResult,
): Promise<NextResponse> {
  if (!auth.ok) return authFailure(auth);

  // قالب پاسخ را بر اساس چیزی که کلاینت پذیرفته انتخاب می‌کنیم
  const respond = prefersSse(request) ? sseResponse : jsonResponse;

  const raw = await request.text();

  if (raw.length > MAX_BODY_BYTES) {
    return respond(
      fail(null, RpcError.INVALID_REQUEST, "حجم درخواست بیش از حد مجاز است"),
      413,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return respond(fail(null, RpcError.PARSE, "JSON نامعتبر"), 400);
  }

  // درخواست دسته‌ای (batch)
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) {
      return respond(fail(null, RpcError.INVALID_REQUEST, "دسته‌ی خالی"), 400);
    }

    const responses: JsonRpcResponse[] = [];
    for (const item of parsed) {
      if (!isJsonRpcRequest(item)) {
        responses.push(fail(null, RpcError.INVALID_REQUEST, "درخواست نامعتبر"));
        continue;
      }
      const result = await dispatch(item);
      if (result && !isNotification(item)) responses.push(result);
    }

    if (responses.length === 0) return new NextResponse(null, { status: 202 });

    if (prefersSse(request)) {
      const payload = responses
        .map((item) => `event: message\ndata: ${JSON.stringify(item)}\n\n`)
        .join("");

      return new NextResponse(payload, {
        headers: {
          ...BASE_HEADERS,
          "Content-Type": "text/event-stream; charset=utf-8",
        },
      });
    }

    return NextResponse.json(responses, { headers: BASE_HEADERS });
  }

  if (!isJsonRpcRequest(parsed)) {
    return respond(
      fail(
        null,
        RpcError.INVALID_REQUEST,
        "بدنه باید یک درخواست JSON-RPC 2.0 باشد",
      ),
      400,
    );
  }

  const result = await dispatch(parsed);
  return respond(isNotification(parsed) ? null : result);
}

/**
 * پاسخ GET.
 *
 * استاندارد MCP می‌گوید اگر سرور روی این اندپوینت استریم SSE ارائه
 * نمی‌دهد، باید ۴۰۵ برگرداند. قبلاً اینجا یک JSON اطلاعاتی برمی‌گرداندیم
 * که کلاینت سعی می‌کرد به‌عنوان استریم بخواندش و شکست می‌خورد — همان
 * خطای «Couldn't reach».
 *
 * اطلاعات سرور در پاسخ `initialize` داده می‌شود، پس چیزی از دست نمی‌رود.
 */
export function handleMcpGet(auth: AuthResult): NextResponse {
  if (!auth.ok) return authFailure(auth);

  return NextResponse.json(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
      protocolVersion: PROTOCOL_VERSION,
      transport: "streamable-http",
      hint: "این اندپوینت فقط POST را می‌پذیرد. یک درخواست JSON-RPC 2.0 بفرست.",
      tools: [...TOOLS_BY_NAME.keys()],
      readOnly: true,
    },
    {
      status: 405,
      headers: { ...BASE_HEADERS, Allow: "POST" },
    },
  );
}
