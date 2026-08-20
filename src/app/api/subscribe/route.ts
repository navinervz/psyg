import { NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/schemas";
import { addSubscriber } from "@/lib/subscriber-store";

export const dynamic = "force-dynamic";

/**
 * ثبت ایمیل ویجت «خبرم کن».
 *
 * فاز ۱: فقط اعتبارسنجی و لاگ.
 * فاز ۲: اگر N8N_SUBSCRIBE_WEBHOOK_URL ست شده باشد، به وبهوک n8n فوروارد می‌شود.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "درخواست نامعتبر است" },
      { status: 400 },
    );
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" },
      { status: 422 },
    );
  }

  const { email } = parsed.data;

  /*
    ⚠️ اینجا قبلاً ایمیل فقط در لاگ سرور نوشته می‌شد.

    یعنی کاربر پیام «ثبت شد!» می‌دید ولی نشانی‌اش هیچ‌جا ذخیره نمی‌شد و
    با ری‌استارت بعدی کانتینر از بین می‌رفت. هر کسی که تا امروز این فرم
    را پر کرده، از دست رفته.

    این بدترین نوع باگ است: کاربر فکر می‌کند کاری انجام شده، سایت هم
    تأیید می‌کند، و هیچ خطایی جایی ثبت نمی‌شود.
  */
  try {
    await addSubscriber(email);
  } catch {
    /*
      اگر نوشتن شکست بخورد، به کاربر «ثبت شد» نمی‌گوییم.

      وسوسه‌ی نشان دادن پیام موفقیت و لاگ کردن خطا زیاد است — تجربه‌ی
      کاربر روان‌تر به‌نظر می‌رسد. ولی همان کاری است که این باگ را
      ساخت.
    */
    return NextResponse.json(
      { ok: false, message: "ثبت موقتاً ممکن نیست، کمی بعد دوباره تلاش کن" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, message: "ثبت شد! فرصت‌های داغ رو برات می‌فرستیم" });
}
