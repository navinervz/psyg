import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * احراز هویت پنل ادمین.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا رمز در متغیر محیطی و نه دیتابیس کاربران
 * ─────────────────────────────────────────────────────────────────────
 * این پنل یک کاربر دارد: خودِ صاحب سایت. ساختن جدول کاربر، هش رمز و
 * جریان بازیابی، برای یک نفر فقط سطح حمله را بزرگ‌تر می‌کرد. اگر روزی
 * چند ادمین لازم شد، همین ماژول جایش را به یک لایه‌ی واقعی می‌دهد و
 * بقیه‌ی پنل دست نمی‌خورد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا کوکی امضا می‌شود و نه اینکه خود رمز داخلش برود
 * ─────────────────────────────────────────────────────────────────────
 * اگر رمز در کوکی می‌رفت، هر کسی که یک بار کوکی را می‌دید رمز را داشت.
 * به‌جایش یک بلیت امضاشده می‌گذاریم: تاریخ انقضا + امضای HMAC. سرور
 * می‌تواند اعتبارش را بسنجد ولی مهاجم نمی‌تواند بلیت جعلی بسازد، چون
 * کلید امضا هرگز از سرور بیرون نمی‌رود.
 */

export const ADMIN_COOKIE = "psyg_admin";

/** بلیت بعد از این مدت باطل می‌شود و باید دوباره وارد شد */
const SESSION_MS = 12 * 60 * 60 * 1000;

/**
 * رمز کوتاه یعنی پنل عملاً باز است.
 *
 * ۱۶ کاراکتر سقف پایینی است، نه توصیه. رمز واقعی باید تصادفی باشد:
 *     openssl rand -base64 24
 */
const MIN_PASSWORD_LENGTH = 16;

function password(): string | null {
  const value = process.env.PSYG_ADMIN_PASSWORD;
  if (!value || value.length < MIN_PASSWORD_LENGTH) return null;
  return value;
}

/**
 * اگر رمز ست نشده باشد، پنل کاملاً غیرفعال است.
 *
 * حالت امن پیش‌فرض: فراموش کردن تنظیم رمز نباید یعنی پنلی که هر کسی
 * می‌تواند واردش شود. همان الگویی که برای MCP و ingest هم به‌کار رفت.
 */
export function isAdminEnabled(): boolean {
  return password() !== null;
}

/** مقایسه‌ی مقاوم در برابر حمله‌ی زمانی */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function checkPassword(input: unknown): boolean {
  const secret = password();
  if (!secret || typeof input !== "string") return false;
  return safeEqual(input, secret);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** بلیت جدید: زمان انقضا به‌همراه امضایش */
export function issueTicket(): string | null {
  const secret = password();
  if (!secret) return null;

  const expires = String(Date.now() + SESSION_MS);
  return `${expires}.${sign(expires, secret)}`;
}

export function verifyTicket(ticket: unknown): boolean {
  const secret = password();
  if (!secret || typeof ticket !== "string") return false;

  const [expires, signature] = ticket.split(".");
  if (!expires || !signature) return false;

  // امضا اول بررسی می‌شود تا مهاجم نتواند با تغییر تاریخ چیزی یاد بگیرد
  if (!safeEqual(signature, sign(expires, secret))) return false;

  const at = Number(expires);
  return Number.isFinite(at) && at > Date.now();
}

/** گزینه‌های کوکی — همه‌ی دفاع‌های استاندارد یکجا */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  // جاوااسکریپت صفحه نباید بتواند بخواندش
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_MS / 1000,
};
