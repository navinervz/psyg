import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/schemas";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * فرم تماس — پیام کاربر را به ایمیل ما می‌فرستد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا مستقیم به Resend و نه از راه n8n
 * ─────────────────────────────────────────────────────────────────────
 * وسوسه این بود که مثل خبرنامه به وبهوک n8n فوروارد شود. ولی خبرنامه
 * هفته‌ای یک بار و به‌صورت دسته‌ای می‌رود؛ اینجا یک نفر همین الان دکمه
 * را زده و منتظر جواب است.
 *
 * فوروارد کردن یعنی یک قطعه‌ی دیگر در مسیر که می‌تواند خاموش باشد و ما
 * هرگز نفهمیم — و کاربر «فرستاده شد» ببیند در حالی که پیامش هیچ‌جا
 * نرفته. همان الگویی که در `/api/subscribe` یک بار اتفاق افتاد و
 * ایمیل کاربران را از دست دادیم.
 *
 * ─────────────────────────────────────────────────────────────────────
 * اگر کلید نباشد چه می‌شود
 * ─────────────────────────────────────────────────────────────────────
 * ۵۰۳ برمی‌گردد و کاربر نشانی ایمیل مستقیم را می‌بیند. عمداً پیام
 * موفقیت نشان نمی‌دهیم: پیامی که فرستاده نشده، نباید «فرستاده شد»
 * بگیرد.
 */

export const dynamic = "force-dynamic";

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** متن ساده، بدون HTML — چون محتوایش را کاربر نوشته */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: parsed.error.issues[0]?.message ?? "ورودی نامعتبر" },
      { status: 422 },
    );
  }

  const { email, subject, message, website } = parsed.data;

  /*
    تله‌ی ربات پر شده.

    عمداً «موفق» برمی‌گردد. اگر خطا بدهیم، نویسنده‌ی ربات می‌فهمد فیلدی
    را نباید پر کند و دفعه‌ی بعد ردش می‌کند. با پاسخ موفق، ربات فکر
    می‌کند کارش گرفته و سراغ ما برنمی‌گردد.
  */
  if (website) {
    return NextResponse.json({ ok: true, message: "پیامت رسید. ممنون!" });
  }

  const apiKey = process.env.RESEND_API_KEY;

  /*
    ─────────────────────────────────────────────────────────────────────
    فرستنده پیش‌فرض دارد، پس فقط یک متغیر لازم است
    ─────────────────────────────────────────────────────────────────────
    ورک‌فلوی خبرنامه هر دوشنبه از `سای‌جی <info@psygstore.shop>` ایمیل
    می‌فرستد و کار می‌کند — یعنی این دامنه از قبل در Resend تأیید شده.

    پس اجباری کردن `CONTACT_FROM_EMAIL` فقط یک متغیر دیگر برای فراموش
    کردن می‌ساخت. پیش‌فرض همان نشانی‌ای است که ثابت شده کار می‌کند، و
    متغیر برای وقتی می‌ماند که روزی نشانی عوض شود.
  */
  const from = process.env.CONTACT_FROM_EMAIL || `سای‌جی <${CONTACT_EMAIL}>`;

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        message: `ارسال پیام موقتاً ممکن نیست. مستقیم به ${CONTACT_EMAIL} ایمیل بزن.`,
      },
      { status: 503 },
    );
  }

  const title = subject?.trim() || "پیام تازه از فرم تماس";

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [CONTACT_EMAIL],
        /*
          `reply_to` همان ایمیل کاربر است.

          یعنی برای جواب دادن کافی است در صندوق ورودی Reply بزنی — لازم
          نیست نشانی را از متن پیام کپی کنی. این کوچک به‌نظر می‌رسد ولی
          تفاوت بین جواب دادن و جواب ندادن است.
        */
        reply_to: email,
        subject: `[سای‌جی] ${title}`,
        /*
          ─────────────────────────────────────────────────────────────
          چرا dir="rtl" روی ظرف بیرونی
          ─────────────────────────────────────────────────────────────
          بدون آن، متن فارسی در جهت پیش‌فرض چپ‌به‌راست چیده می‌شود و
          واژه‌های کوتاه وارونه دیده می‌شوند — در اولین ایمیل واقعی،
          «از:» به‌صورت «زا:» رسید.

          الگوریتم دوجهته‌ی مرورگر جهت هر واژه را از حروفش می‌فهمد، ولی
          *ترتیب* واژه‌ها و جای علامت‌ها را از جهت پاراگراف می‌گیرد. پس
          حروف درست بودند و ترتیبشان غلط.

          نشانی ایمیل داخل `<span dir="ltr">` می‌نشیند چون لاتین است و
          در پاراگراف راست‌به‌راست، نقطه و @ آخرش جابه‌جا می‌شوند.
        */
        html: [
          '<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif;line-height:1.9;color:#111">',
          `<p style="margin:0 0 6px"><b>از:</b> <span dir="ltr">${escapeHtml(email)}</span></p>`,
          subject
            ? `<p style="margin:0 0 6px"><b>موضوع:</b> ${escapeHtml(subject)}</p>`
            : "",
          '<hr style="border:none;border-top:1px solid #ddd;margin:14px 0">',
          `<p style="margin:0;white-space:pre-wrap">${escapeHtml(message)}</p>`,
          "</div>",
        ].join(""),
      }),
    });

    if (!response.ok) {
      /*
        متن خطای Resend در لاگ سرور می‌ماند، نه در پاسخ.

        پاسخ خطا ممکن است چیزی درباره‌ی حساب یا دامنه‌ی ما بگوید که
        نباید به کاربر برسد.
      */
      console.error("contact: resend failed", response.status, await response.text());
      return NextResponse.json(
        {
          ok: false,
          message: `ارسال نشد. مستقیم به ${CONTACT_EMAIL} ایمیل بزن.`,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("contact: network error", error);
    return NextResponse.json(
      {
        ok: false,
        message: `ارسال نشد. مستقیم به ${CONTACT_EMAIL} ایمیل بزن.`,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "پیامت رسید. معمولاً ظرف یک روز کاری جواب می‌دهیم.",
  });
}
