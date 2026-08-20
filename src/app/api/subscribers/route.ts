import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { readSubscribers } from "@/lib/subscriber-store";

/**
 * فهرست مشترکان — فقط برای ورک‌فلوی خبرنامه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فقط-خواندنی و با توکن جدا
 * ─────────────────────────────────────────────────────────────────────
 * این اندپوینت نشانی ایمیل آدم‌های واقعی را برمی‌گرداند. لو رفتن آن
 * یعنی فهرست ایمیل کاربران ما دست کسی که آن را برای اسپم می‌فروشد.
 *
 * سه محدودیت:
 *
 * ۱. **توکن مخصوص خودش.** نه توکن `ingest` و نه `content`. اگر یکی از
 *    آن‌ها لو رفت، این فهرست همچنان بسته می‌ماند.
 * ۲. **فقط GET.** هیچ راهی برای اضافه یا حذف کردن از اینجا نیست؛ ثبت
 *    فقط از فرم سایت انجام می‌شود.
 * ۳. **فقط فعال‌ها.** کسی که لغو اشتراک کرده اصلاً برنمی‌گردد، تا
 *    اشتباهِ ورک‌فلو نتواند برایش نامه بفرستد.
 */

export const dynamic = "force-dynamic";

const MIN_TOKEN_LENGTH = 32;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

export async function GET(request: Request) {
  const secret = process.env.PSYG_SUBSCRIBERS_TOKEN;

  if (!secret || secret.length < MIN_TOKEN_LENGTH) {
    return NextResponse.json(
      { ok: false, message: "اندپوینت فعال نیست" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const match = /^Bearer\s+(.+)$/i.exec(
    (request.headers.get("authorization") ?? "").trim(),
  );
  if (!match) {
    return NextResponse.json(
      { ok: false, message: "توکن لازم است" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!timingSafeEqual(sha256(match[1]), sha256(secret))) {
    return NextResponse.json(
      { ok: false, message: "توکن نامعتبر است" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const store = await readSubscribers();
  const active = store.subscribers.filter((s) => s.active);

  return NextResponse.json(
    {
      ok: true,
      count: active.length,
      subscribers: active.map((s) => ({ email: s.email, token: s.token })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
