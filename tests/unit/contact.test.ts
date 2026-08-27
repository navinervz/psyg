import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { contactSchema } from "@/lib/schemas";

const route = readFileSync("src/app/api/contact/route.ts", "utf8");
const form = readFileSync("src/components/contact/ContactForm.tsx", "utf8");

test("ورودی نامعتبر رد می‌شود", () => {
  assert.equal(contactSchema.safeParse({}).success, false, "بدنه‌ی خالی");
  assert.equal(
    contactSchema.safeParse({ email: "nope", message: "یک پیام کافی" }).success,
    false,
    "ایمیل بی‌قالب",
  );
  assert.equal(
    contactSchema.safeParse({ email: "a@b.com", message: "سلام" }).success,
    false,
    "پیام کوتاه‌تر از ده کاراکتر",
  );
  assert.equal(
    contactSchema.safeParse({ email: "a@b.com", message: "x".repeat(2001) }).success,
    false,
    "پیام بلندتر از سقف",
  );
});

test("ورودی درست پذیرفته می‌شود و موضوع اختیاری است", () => {
  const ok = contactSchema.safeParse({
    email: "user@example.com",
    message: "قیمت این محصول با دیجی‌کالا نمی‌خواند.",
  });
  assert.equal(ok.success, true, "پیام بدون موضوع باید بگذرد");

  const withSubject = contactSchema.safeParse({
    email: "user@example.com",
    subject: "گزارش قیمت",
    message: "قیمت این محصول با دیجی‌کالا نمی‌خواند.",
  });
  assert.equal(withSubject.success, true);
});

test("تله‌ی ربات پر شده باشد، اسکیما ردش می‌کند", () => {
  const bot = contactSchema.safeParse({
    email: "bot@example.com",
    message: "یک پیام به‌اندازه‌ی کافی بلند",
    website: "http://spam.example",
  });
  assert.equal(bot.success, false, "فیلد تله باید خالی بماند");
});

test("پاسخ به ربات موفق است، نه خطا", () => {
  /*
    اگر خطا بدهیم، نویسنده‌ی ربات می‌فهمد کدام فیلد را نباید پر کند و
    دفعه‌ی بعد ردش می‌کند. پاسخ موفق یعنی ربات فکر کند کارش گرفته.
  */
  const guard = route.slice(route.indexOf("if (website)"));
  assert.match(guard.slice(0, 200), /ok:\s*true/, "پاسخ تله نباید خطا باشد");
});

test("پیامی که فرستاده نشده، «فرستاده شد» نمی‌گیرد", () => {
  /*
    همان باگی که یک بار در `/api/subscribe` اتفاق افتاد: کاربر تأیید
    می‌دید و داده هیچ‌جا نمی‌رفت. اینجا هر مسیر شکست باید وضعیت خطا
    برگرداند.
  */
  for (const status of ["503", "502"]) {
    assert.ok(
      route.includes(`status: ${status}`),
      `مسیر شکست با کد ${status} پوشش داده نشده`,
    );
  }

  const success = route.lastIndexOf("ok: true");
  const lastFailure = route.lastIndexOf("status: 502");
  assert.ok(success > lastFailure, "پاسخ موفق باید بعد از همه‌ی مسیرهای شکست باشد");
});

test("جواب دادن به کاربر یک کلیک است", () => {
  /*
    `reply_to` یعنی در صندوق ورودی فقط Reply بزنی. بدون آن باید نشانی
    را از متن پیام کپی کنی — و همان تفاوت بین جواب دادن و جواب ندادن
    است.
  */
  assert.match(route, /reply_to:\s*email/, "reply_to تنظیم نشده");
});

test("ایمیل راست‌به‌چپ چیده می‌شود", () => {
  /*
    ─────────────────────────────────────────────────────────────────
    باگی که این تست جلویش را می‌گیرد
    ─────────────────────────────────────────────────────────────────
    اولین ایمیل واقعی با «زا:» رسید به‌جای «از:». بدون `dir="rtl"` روی
    ظرف، جهت پاراگراف چپ‌به‌راست می‌ماند و ترتیب واژه‌ها و علامت‌ها
    وارونه می‌شود.

    نشانی ایمیل جدا `ltr` می‌گیرد چون لاتین است و در پاراگراف فارسی،
    نقطه و @ آخرش جابه‌جا می‌شوند.
  */
  assert.match(route, /<div dir="rtl"/, "ظرف ایمیل جهت راست‌به‌چپ ندارد");
  assert.match(route, /<span dir="ltr">\$\{escapeHtml\(email\)\}/, "نشانی لاتین جهت ندارد");
});

test("متن کاربر قبل از رفتن به ایمیل امن می‌شود", () => {
  /*
    محتوای پیام را کاربر می‌نویسد و در بدنه‌ی HTML ایمیل می‌نشیند.
    بدون فرار دادن، هر تگی که بنویسد در صندوق ورودی ما اجرا می‌شود.
  */
  assert.match(route, /function escapeHtml/, "تابع فرار دادن وجود ندارد");
  assert.match(route, /escapeHtml\(message\)/, "متن پیام فرار داده نشده");
  assert.match(route, /escapeHtml\(email\)/, "ایمیل فرار داده نشده");
});

test("فرم تا وقتی ورودی کامل نشده نمی‌فرستد", () => {
  assert.match(form, /canSend/, "شرط ارسال تعریف نشده");
  assert.match(form, /disabled=\{sending \|\| !canSend\}/, "دکمه محافظت نشده");
  assert.match(form, /if \(sending \|\| !canSend\) return/, "ارسال دوباره جلوگیری نشده");
});

test("نتیجه برای صفحه‌خوان اعلام می‌شود", () => {
  assert.match(form, /aria-live="polite"/, "بدون aria-live کاربر صفحه‌خوان سکوت می‌شنود");
});

test("فرم در صفحه‌ی تماس نشسته و نشانی مستقیم هم مانده", () => {
  const page = readFileSync("src/app/contact/page.tsx", "utf8");
  assert.match(page, /<ContactForm \/>/, "فرم به صفحه اضافه نشده");
  assert.match(page, /CONTACT_EMAIL/, "نشانی مستقیم باید بماند — راه دوم لازم است");
});

test("اندپوینت سقف نرخ دارد", () => {
  const mw = readFileSync("src/middleware.ts", "utf8");
  assert.match(mw, /prefix: "\/api\/contact"/, "بدون سقف، هر ربات می‌تواند ایمیل بفرستد");
});

test("متغیرها واقعاً به کانتینر می‌رسند", () => {
  /*
    ─────────────────────────────────────────────────────────────────
    چرا این تست از خود کد مهم‌تر است
    ─────────────────────────────────────────────────────────────────
    گذاشتن متغیر در `.env` سرور کافی نیست. اگر در `docker-compose.yml`
    زیر `environment` اعلام نشود، به داخل کانتینر نمی‌رسد و
    `process.env.RESEND_API_KEY` خالی می‌ماند.

    نتیجه‌اش دقیقاً همان چیزی است که سخت‌ترین باگ‌ها را می‌سازد: کاربر
    مطمئن است تنظیمش کرده، هیچ خطایی هم جایی نیست، و فرم بی‌دلیل کار
    نمی‌کند.
  */
  const compose = readFileSync("docker-compose.yml", "utf8");
  assert.match(compose, /RESEND_API_KEY:\s*\$\{RESEND_API_KEY/, "کلید به کانتینر نمی‌رسد");
  assert.match(
    compose,
    /CONTACT_FROM_EMAIL:\s*\$\{CONTACT_FROM_EMAIL/,
    "فرستنده به کانتینر نمی‌رسد",
  );

  const example = readFileSync(".env.example", "utf8");
  assert.match(example, /^RESEND_API_KEY=/m, "در نمونه‌ی env مستند نشده");
});

test("بدون فرستنده هم کار می‌کند — فقط کلید اجباری است", () => {
  /*
    هر متغیر اجباری، یک چیز دیگر برای فراموش کردن است. فرستنده پیش‌فرض
    همان نشانی‌ای است که خبرنامه با آن کار می‌کند، پس ثابت شده معتبر
    است.
  */
  assert.match(
    route,
    /CONTACT_FROM_EMAIL \|\| `/,
    "فرستنده پیش‌فرض ندارد",
  );
  assert.match(route, /if \(!apiKey\) \{/, "فقط نبودِ کلید باید مانع شود");
});
