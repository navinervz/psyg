import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  authenticate,
  authenticateToken,
  isMcpEnabled,
  MIN_TOKEN_LENGTH,
} from "@/lib/mcp/auth";
import {
  isJsonRpcRequest,
  isNotification,
  toolError,
  toolOk,
} from "@/lib/mcp/protocol";
import { TOOLS, TOOLS_BY_NAME, toolsManifest } from "@/lib/mcp/tools";
import { runSecurityAudit } from "@/lib/security-audit";

const VALID = "a".repeat(64);

describe("احراز هویت MCP", () => {
  test("بدون توکن سرور، اندپوینت غیرفعال است (fail closed)", () => {
    const result = authenticate("Bearer anything", undefined);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 503);
  });

  test("توکن خالی هم یعنی غیرفعال", () => {
    const result = authenticate("Bearer anything", "");
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 503);
  });

  test("توکن کوتاه پذیرفته نمی‌شود حتی اگر درست وارد شود", () => {
    const short = "short-token";
    const result = authenticate(`Bearer ${short}`, short);

    assert.equal(result.ok, false);
    assert.equal(
      result.ok === false && result.status,
      503,
      "توکن ضعیف نباید کار کند حتی وقتی مطابقت دارد",
    );
  });

  test("بدون هدر Authorization پاسخ ۴۰۱ است", () => {
    const result = authenticate(null, VALID);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 401);
  });

  test("قالب نادرست هدر رد می‌شود", () => {
    for (const header of [VALID, `Basic ${VALID}`, "Bearer", "Bearer "]) {
      const result = authenticate(header, VALID);
      assert.equal(result.ok, false, `این باید رد شود: «${header}»`);
    }
  });

  test("توکن اشتباه ۴۰۳ می‌گیرد", () => {
    const result = authenticate(`Bearer ${"b".repeat(64)}`, VALID);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 403);
  });

  test("توکن درست پذیرفته می‌شود", () => {
    assert.equal(authenticate(`Bearer ${VALID}`, VALID).ok, true);
  });

  test("Bearer به حروف بزرگ و کوچک حساس نیست", () => {
    assert.equal(authenticate(`bearer ${VALID}`, VALID).ok, true);
    assert.equal(authenticate(`BEARER ${VALID}`, VALID).ok, true);
  });

  test("پیشوند درست ولی ناقص، پذیرفته نمی‌شود", () => {
    // اگر مقایسه‌ی امن نبود، توکنی که پیشوند درست دارد ممکن بود
    // اطلاعات زمانی لو بدهد
    const result = authenticate(`Bearer ${VALID.slice(0, 60)}`, VALID);
    assert.equal(result.ok, false);
  });

  test("isMcpEnabled فقط با توکن به‌اندازه‌ی کافی بلند true است", () => {
    assert.equal(isMcpEnabled(undefined), false);
    assert.equal(isMcpEnabled(""), false);
    assert.equal(isMcpEnabled("x".repeat(MIN_TOKEN_LENGTH - 1)), false);
    assert.equal(isMcpEnabled("x".repeat(MIN_TOKEN_LENGTH)), true);
  });
});

describe("احراز هویت با توکن داخل مسیر", () => {
  /**
   * این مسیر برای فرم افزودن کانکتور کلاد لازم است که فقط URL می‌گیرد.
   * باید دقیقاً همان سخت‌گیری مسیر هدری را داشته باشد.
   */
  test("بدون توکن سرور غیرفعال است", () => {
    const result = authenticateToken(VALID, undefined);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 503);
  });

  test("توکن ضعیف سرور پذیرفته نمی‌شود", () => {
    const weak = "short";
    const result = authenticateToken(weak, weak);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 503);
  });

  test("توکن خالی ۴۰۱ می‌گیرد", () => {
    for (const value of [undefined, ""]) {
      const result = authenticateToken(value, VALID);
      assert.equal(result.ok, false);
      assert.equal(result.ok === false && result.status, 401);
    }
  });

  test("توکن اشتباه ۴۰۳ می‌گیرد", () => {
    const result = authenticateToken("b".repeat(64), VALID);
    assert.equal(result.ok, false);
    assert.equal(result.ok === false && result.status, 403);
  });

  test("توکن درست پذیرفته می‌شود", () => {
    assert.equal(authenticateToken(VALID, VALID).ok, true);
  });

  test("پیشوند درست ولی ناقص رد می‌شود", () => {
    assert.equal(authenticateToken(VALID.slice(0, 60), VALID).ok, false);
    assert.equal(authenticateToken(VALID + "x", VALID).ok, false);
  });

  test("هر دو مسیر برای ورودی یکسان نتیجه‌ی یکسان می‌دهند", () => {
    const cases = [VALID, "wrong-token-value-that-is-long-enough-to-compare"];

    for (const candidate of cases) {
      const viaHeader = authenticate(`Bearer ${candidate}`, VALID);
      const viaPath = authenticateToken(candidate, VALID);
      assert.equal(viaHeader.ok, viaPath.ok, `اختلاف رفتار برای ${candidate}`);
    }
  });
});

describe("پروتکل JSON-RPC", () => {
  test("درخواست معتبر تشخیص داده می‌شود", () => {
    assert.equal(isJsonRpcRequest({ jsonrpc: "2.0", method: "ping", id: 1 }), true);
    assert.equal(isJsonRpcRequest({ jsonrpc: "2.0", method: "ping" }), true);
  });

  test("درخواست نامعتبر رد می‌شود", () => {
    const invalid = [
      null,
      undefined,
      "string",
      42,
      {},
      { method: "ping" },
      { jsonrpc: "1.0", method: "ping" },
      { jsonrpc: "2.0" },
      { jsonrpc: "2.0", method: 42 },
      { jsonrpc: "2.0", method: "ping", params: "not-an-object" },
    ];

    for (const value of invalid) {
      assert.equal(isJsonRpcRequest(value), false, `باید رد شود: ${JSON.stringify(value)}`);
    }
  });

  test("نبود id یعنی نوتیفیکیشن", () => {
    assert.equal(isNotification({ jsonrpc: "2.0", method: "x" }), true);
    assert.equal(isNotification({ jsonrpc: "2.0", method: "x", id: 0 }), false);
    assert.equal(isNotification({ jsonrpc: "2.0", method: "x", id: null }), false);
  });

  test("toolOk هم متن می‌دهد هم داده‌ی ساختاریافته", () => {
    const result = toolOk({ a: 1 }, "خلاصه");
    assert.equal(result.content[0].type, "text");
    assert.match(result.content[0].text, /خلاصه/);
    assert.deepEqual(result.structuredContent, { a: 1 });
    assert.notEqual(result.isError, true);
  });

  test("toolError با پرچم خطا برمی‌گردد", () => {
    const result = toolError("مشکلی پیش آمد");
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /مشکلی پیش آمد/);
  });
});

describe("ابزارها", () => {
  test("نام‌ها یکتا و استاندارد هستند", () => {
    const names = TOOLS.map((t) => t.name);
    assert.equal(new Set(names).size, names.length, "نام تکراری");

    for (const name of names) {
      assert.match(name, /^[a-z][a-z0-9_]*$/, `نام نامناسب: ${name}`);
    }
  });

  test("هر ابزار توضیح معنادار دارد", () => {
    for (const tool of TOOLS) {
      assert.ok(tool.title.length > 2, tool.name);
      assert.ok(
        tool.description.length > 30,
        `${tool.name}: توضیح خیلی کوتاه است — مدل باید بفهمد کِی از آن استفاده کند`,
      );
    }
  });

  test("اسکیمای ورودی همه معتبر است", () => {
    for (const tool of TOOLS) {
      assert.equal(tool.inputSchema.type, "object", tool.name);
      assert.ok("properties" in tool.inputSchema, tool.name);
    }
  });

  test("manifest با فهرست ابزارها هم‌خوان است", () => {
    const manifest = toolsManifest();
    assert.equal(manifest.length, TOOLS.length);
    for (const entry of manifest) {
      assert.ok(TOOLS_BY_NAME.has(entry.name));
      assert.ok(!("handler" in entry), "handler نباید به بیرون درز کند");
    }
  });

  test("همه‌ی ابزارها فقط-خواندنی‌اند", () => {
    // اگر روزی کسی ابزار نوشتنی اضافه کرد، این تست باید عمداً به‌روز شود
    const writeVerbs = /^(create|update|delete|set|write|run|exec|deploy|edit)_/;

    for (const tool of TOOLS) {
      assert.ok(
        !writeVerbs.test(tool.name),
        `«${tool.name}» شبیه ابزار نوشتنی است. اندپوینت MCP روی اینترنت باز است؛ ابزار نوشتنی یعنی در پشتی.`,
      );
    }
  });

  test("site_status هیچ مقدار محرمانه‌ای برنمی‌گرداند", async () => {
    const tool = TOOLS_BY_NAME.get("site_status");
    assert.ok(tool);

    const result = await tool.handler({});
    const text = JSON.stringify(result);

    // فقط باید بگوید ست شده یا نه، نه اینکه مقدار چیست
    assert.match(text, /Configured/);
    assert.ok(!text.includes("PSYG_MCP_TOKEN"));
    assert.ok(!/token["']?\s*:\s*["'][^"']{10,}/i.test(text));
  });

  test("ابزارها با ورودی نامعتبر خطای خوانا می‌دهند نه استثنا", async () => {
    const cases: [string, Record<string, unknown>][] = [
      ["get_product", {}],
      ["get_product", { slug: "چیزی-که-نیست" }],
      ["search_products", {}],
      ["list_products", { category: "دسته‌ی-جعلی" }],
    ];

    for (const [name, args] of cases) {
      const tool = TOOLS_BY_NAME.get(name);
      assert.ok(tool, name);

      const result = await tool.handler(args);
      assert.equal(result.isError, true, `${name} باید خطا برگرداند`);
      assert.ok(result.content[0].text.length > 10);
    }
  });

  test("ابزارهای بدون ورودی سالم اجرا می‌شوند", async () => {
    for (const name of [
      "site_status",
      "price_analysis",
      "list_categories",
      "list_articles",
      "homepage_content",
    ]) {
      const tool = TOOLS_BY_NAME.get(name);
      assert.ok(tool, name);

      const result = await tool.handler({});
      assert.notEqual(result.isError, true, `${name} خطا داد`);
      assert.ok(result.structuredContent !== undefined, name);
    }
  });

  test("list_products محدودیت تعداد را رعایت می‌کند", async () => {
    const tool = TOOLS_BY_NAME.get("list_products");
    assert.ok(tool);

    const result = await tool.handler({ limit: 3 });
    const data = result.structuredContent as { items: unknown[] };
    assert.equal(data.items.length, 3);

    // مقدار خارج از بازه نباید باعث خطا شود
    const huge = await tool.handler({ limit: 99999 });
    assert.notEqual(huge.isError, true);
  });

  test("get_product تاریخچه و تحلیل کامل می‌دهد", async () => {
    const tool = TOOLS_BY_NAME.get("get_product");
    assert.ok(tool);

    const result = await tool.handler({ slug: "airpods-pro-2" });
    const data = result.structuredContent as Record<string, unknown>;

    assert.equal(data.slug, "airpods-pro-2");
    assert.ok(Array.isArray(data.history));
    assert.equal((data.history as unknown[]).length, 30);
    assert.ok(data.analysis);
    assert.match(String(data.affiliateExitPath), /^\/go\//);
  });
});

describe("ممیزی امنیتی", () => {
  test("بدون شبکه هم اجرا می‌شود", async () => {
    const report = await runSecurityAudit({ includeNetwork: false });

    assert.ok(report.findings.length > 0);
    assert.ok(report.score.total > 0);
    assert.ok(!Number.isNaN(Date.parse(report.checkedAt)));
  });

  test("هر یافته توضیح «چرا» دارد", async () => {
    const report = await runSecurityAudit({ includeNetwork: false });

    for (const finding of report.findings) {
      assert.ok(finding.id.length > 0);
      assert.ok(finding.title.length > 5, finding.id);
      assert.ok(
        finding.why.length > 20,
        `${finding.id}: توصیه بدون توضیح یا نادیده گرفته می‌شود یا کورکورانه اجرا`,
      );
    }
  });

  test("یافته‌های غیرسالم راه‌حل دارند", async () => {
    const report = await runSecurityAudit({ includeNetwork: false });

    for (const finding of report.findings) {
      if (finding.severity !== "ok") {
        assert.ok(finding.fix, `${finding.id} راه‌حل ندارد`);
      }
    }
  });

  test("توکن ضعیف بحرانی گزارش می‌شود", async () => {
    const original = process.env.PSYG_MCP_TOKEN;
    process.env.PSYG_MCP_TOKEN = "1234";

    try {
      const report = await runSecurityAudit({ includeNetwork: false });
      const finding = report.findings.find((f) => f.id === "env.mcp-token-weak");

      assert.ok(finding, "توکن ضعیف باید گزارش شود");
      assert.equal(finding.severity, "critical");
      assert.equal(report.worstSeverity, "critical");
    } finally {
      if (original === undefined) delete process.env.PSYG_MCP_TOKEN;
      else process.env.PSYG_MCP_TOKEN = original;
    }
  });

  test("متغیر محرمانه با پیشوند عمومی بحرانی گزارش می‌شود", async () => {
    process.env.NEXT_PUBLIC_TEST_SECRET_KEY = "oops";

    try {
      const report = await runSecurityAudit({ includeNetwork: false });
      const finding = report.findings.find((f) => f.id === "env.public-secret");

      assert.ok(finding);
      assert.equal(finding.severity, "critical");
    } finally {
      delete process.env.NEXT_PUBLIC_TEST_SECRET_KEY;
    }
  });

  test("یافته‌ها از بحرانی به سالم مرتب می‌شوند", async () => {
    const order = ["critical", "high", "medium", "low", "ok"];
    const report = await runSecurityAudit({ includeNetwork: false });

    let previous = -1;
    for (const finding of report.findings) {
      const rank = order.indexOf(finding.severity);
      assert.ok(rank >= previous, "ترتیب اهمیت رعایت نشده");
      previous = rank;
    }
  });
});
