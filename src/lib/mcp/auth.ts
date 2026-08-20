import { createHash, timingSafeEqual } from "node:crypto";

/**
 * احراز هویت اندپوینت MCP.
 *
 * سه تصمیم امنیتی که عمدی‌اند:
 *
 * ۱. **fail closed** — اگر `PSYG_MCP_TOKEN` ست نشده باشد، اندپوینت
 *    کاملاً غیرفعال است. حالت پیش‌فرض «بسته» است نه «باز»؛ فراموش کردن
 *    تنظیمات نباید سرور را در معرض قرار دهد.
 *
 * ۲. **حداقل طول توکن** — توکن کوتاه قابل حدس زدن است. زیر ۳۲ کاراکتر
 *    را رد می‌کنیم تا کسی با توکن «۱۲۳۴» سرورش را باز نگذارد.
 *
 * ۳. **مقایسه‌ی timing-safe** — مقایسه‌ی معمولی رشته‌ها به‌محض اولین
 *    کاراکتر متفاوت متوقف می‌شود. مهاجم با اندازه‌گیری زمان پاسخ
 *    می‌تواند توکن را کاراکتر‌به‌کاراکتر حدس بزند. هش کردن هر دو طرف
 *    قبل از مقایسه، طول را هم یکسان می‌کند و نشت طول را از بین می‌برد.
 */

export const MIN_TOKEN_LENGTH = 32;

export type AuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 403 | 503; message: string };

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

/** آیا اندپوینت اصلاً فعال است؟ */
export function isMcpEnabled(token = process.env.PSYG_MCP_TOKEN): boolean {
  return typeof token === "string" && token.length >= MIN_TOKEN_LENGTH;
}

/** بررسی اینکه سرور اصلاً پیکربندی شده و توکنش قابل قبول است */
function checkServerToken(token: string | undefined): AuthResult {
  if (!token || token.length === 0) {
    return {
      ok: false,
      status: 503,
      message: "اندپوینت MCP فعال نیست (PSYG_MCP_TOKEN تنظیم نشده)",
    };
  }

  if (token.length < MIN_TOKEN_LENGTH) {
    return {
      ok: false,
      status: 503,
      message: `PSYG_MCP_TOKEN باید حداقل ${MIN_TOKEN_LENGTH} کاراکتر باشد`,
    };
  }

  return { ok: true };
}

/**
 * مقایسه‌ی توکن خام با توکن سرور.
 *
 * از این هم مسیر هدری استفاده می‌کند هم مسیر مبتنی بر URL.
 */
export function authenticateToken(
  provided: string | undefined,
  token = process.env.PSYG_MCP_TOKEN,
): AuthResult {
  const serverCheck = checkServerToken(token);
  if (!serverCheck.ok) return serverCheck;

  if (!provided || provided.length === 0) {
    return { ok: false, status: 401, message: "توکن لازم است" };
  }

  if (!timingSafeEqual(sha256(provided), sha256(token as string))) {
    return { ok: false, status: 403, message: "توکن نامعتبر است" };
  }

  return { ok: true };
}

/** احراز هویت از روی هدر Authorization */
export function authenticate(
  authorizationHeader: string | null,
  token = process.env.PSYG_MCP_TOKEN,
): AuthResult {
  const serverCheck = checkServerToken(token);
  if (!serverCheck.ok) return serverCheck;

  if (!authorizationHeader) {
    return { ok: false, status: 401, message: "هدر Authorization لازم است" };
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorizationHeader.trim());
  if (!match) {
    return {
      ok: false,
      status: 401,
      message: "قالب درست: Authorization: Bearer <token>",
    };
  }

  return authenticateToken(match[1], token);
}
