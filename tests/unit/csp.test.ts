import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const src = readFileSync(join(ROOT, "next.config.ts"), "utf8");

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  CSP دو جور می‌تواند بی‌فایده شود، و هر دو بی‌صدا اتفاق می‌افتند:

    ۱. کسی برای رفع یک تخلف، دستوری را شل کند و یادش برود سفتش کند.
    ۲. کسی حالت گزارش را اجباری کند بدون اینکه کنسول را چک کرده باشد،
       و صفحه برای کاربر سفید شود.

  این تست‌ها نمی‌گذارند اولی بی‌سروصدا بگذرد، و دومی را عمدی می‌کنند
  نه تصادفی.
*/

describe("سیاست امنیت محتوا", () => {
  test("پایه بسته است", () => {
    assert.ok(
      src.includes(`"default-src 'self'"`),
      "بدون default-src، هر چیزی که دستور اختصاصی ندارد آزاد است",
    );
  });

  test("دستورهایی که ارزش واقعی دارند حاضرند", () => {
    /*
      این چهارتا برخلاف script-src به `unsafe-inline` آلوده نیستند و
      همین حالا حمله‌های واقعی را می‌بندند.
    */
    for (const directive of [
      "base-uri 'self'", // تزریق <base> همه‌ی لینک‌های نسبی را می‌دزدد
      "form-action 'self'", // ربودن مقصد ارسال فرم
      "object-src 'none'", // جاسازی افزونه
      "frame-ancestors 'self'", // کلیک‌جکینگ
    ]) {
      assert.ok(src.includes(directive), `«${directive}» از سیاست حذف شده`);
    }
  });

  test("http ساده مجاز نیست", () => {
    assert.ok(
      src.includes("upgrade-insecure-requests"),
      "درخواست‌های http باید به https ارتقا پیدا کنند",
    );
    assert.ok(
      !/["']img-src[^"']*http:\/\//.test(src),
      "img-src نباید مبدأ http بی‌رمز بپذیرد",
    );
  });

  test("هیچ دستوری به wildcard کامل باز نشده", () => {
    // `*` تنها یعنی دستور عملاً وجود ندارد.
    assert.ok(
      !/["'][a-z-]+-src \*["']/.test(src),
      "یک دستور با * کامل باز شده — همان بهتر که اصلاً نباشد",
    );
  });

  test("style-src به unsafe-eval باز نشده", () => {
    /*
      `unsafe-inline` برای سبک‌ها لازم است چون GSAP مستقیم روی المان
      می‌نویسد. ولی `unsafe-eval` هیچ‌وقت لازم نبوده و اگر روزی اضافه
      شود، احتمالاً برای دور زدن یک خطاست نه رفع آن.
    */
    assert.ok(
      !src.includes("unsafe-eval"),
      "unsafe-eval هیچ‌جای این سایت لازم نیست",
    );
  });
});

describe("اجباری کردن CSP باید تصمیم باشد نه اتفاق", () => {
  test("فعلاً فقط گزارش می‌دهد", () => {
    /*
      این تست عمداً وقتی حالت اجباری شود قرمز می‌شود.

      قرمز شدنش یعنی «مطمئنی؟» — نه اینکه کار اشتباه است. وقتی کنسول
      روی صفحه‌ی اصلی، فرصت‌ها و صفحه‌ی محصول تمیز بود، این تست را
      به‌روز کن و همان موقع کلید را عوض کن.
    */
    assert.ok(
      src.includes(`key: "Content-Security-Policy-Report-Only"`),
      "اگر CSP اجباری شده، این تست را آگاهانه به‌روز کن",
    );
    assert.ok(
      !src.includes(`key: "Content-Security-Policy"`),
      "هر دو هدر با هم یعنی رفتار غیرقابل‌پیش‌بینی",
    );
  });
});

describe("بقیه‌ی هدرهای امنیتی سرجایشان‌اند", () => {
  test("هیچ‌کدام با اضافه شدن CSP حذف نشده‌اند", () => {
    for (const header of [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Strict-Transport-Security",
    ]) {
      assert.ok(src.includes(header), `هدر ${header} حذف شده`);
    }
  });
});
