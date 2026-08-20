/**
 * پیاده‌سازی حداقلی پروتکل MCP روی JSON-RPC 2.0.
 *
 * چرا SDK رسمی استفاده نشده؟
 *  ۱. یک وابستگی کمتر یعنی سطح حمله کمتر — این اندپوینت روی اینترنت باز
 *     است و هر پکیجی که اضافه کنیم باید برایش وصله‌ی امنیتی دنبال کنیم.
 *  ۲. کل چیزی که لازم داریم چهار متد است؛ SDK برای این حجم زیادی است.
 *  ۳. کد بدون وابستگی را می‌شود کامل تست کرد.
 *
 * مرجع: https://modelcontextprotocol.io
 */

export const PROTOCOL_VERSION = "2025-06-18";
export const SERVER_NAME = "psyg";
export const SERVER_VERSION = "1.0.0";

/* ─────────────────────────────  تایپ‌ها  ───────────────────────────── */

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type JsonRpcSuccess = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  result: unknown;
};

export type JsonRpcFailure = {
  jsonrpc: "2.0";
  id: JsonRpcId;
  error: { code: number; message: string; data?: unknown };
};

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

/** کدهای خطای استاندارد JSON-RPC */
export const RpcError = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

export function ok(id: JsonRpcId, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

export function fail(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcFailure {
  return { jsonrpc: "2.0", id, error: { code, message, data } };
}

/** اعتبارسنجی شکل درخواست JSON-RPC */
export function isJsonRpcRequest(value: unknown): value is JsonRpcRequest {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  if (candidate.jsonrpc !== "2.0") return false;
  if (typeof candidate.method !== "string") return false;

  if (
    "params" in candidate &&
    candidate.params !== undefined &&
    (typeof candidate.params !== "object" || candidate.params === null)
  ) {
    return false;
  }

  return true;
}

/**
 * نوتیفیکیشن یعنی درخواستی که `id` ندارد — طبق استاندارد نباید پاسخ
 * بگیرد. اگر این را رعایت نکنیم بعضی کلاینت‌ها گیر می‌کنند.
 */
export function isNotification(request: JsonRpcRequest): boolean {
  return request.id === undefined;
}

/* ───────────────────────────  خروجی ابزار  ─────────────────────────── */

export type ToolContent = { type: "text"; text: string };

export type ToolResult = {
  content: ToolContent[];
  structuredContent?: unknown;
  isError?: boolean;
};

/** خروجی موفق ابزار — هم متن خوانا هم داده‌ی ساختاریافته */
export function toolOk(data: unknown, summary?: string): ToolResult {
  const json = JSON.stringify(data, null, 2);
  return {
    content: [{ type: "text", text: summary ? `${summary}\n\n${json}` : json }],
    structuredContent: data,
  };
}

/**
 * خطای ابزار به‌شکل نتیجه برمی‌گردد، نه خطای JSON-RPC.
 * دلیلش این است که مدل باید خطا را ببیند و بتواند اصلاح کند —
 * خطای پروتکلی از دید مدل پنهان می‌ماند.
 */
export function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: `خطا: ${message}` }], isError: true };
}
