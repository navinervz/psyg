import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  چیدمان موبایل در بررسی کد سالم به‌نظر می‌رسید: منو نقطه‌ی شکست درست
  داشت، هدف لمسی ۴۴ پیکسل بود، پنل دستیار روی موبایل تمام‌صفحه می‌شد.
  همه درست بودند.

  ولی اسکرین‌شات گوشی واقعی دو چیز نشان داد که هیچ‌کدام از کد پیدا
  نمی‌شدند:

    ۱. پس‌زمینه‌ی ۹۵ درصدی منو، عکس‌های سفید محصولات را از پشت نشان
       می‌داد. روی هیروی تیره بی‌عیب بود؛ وسط فهرست محصولات، کلمه‌ی
       «فرصت‌ها» روی عکس یک گوشی می‌افتاد.

    ۲. دکمه‌ی شناور دستیار با z-index کمتر، روی منوی باز دیده می‌شد.

  درس مشترکشان: «کلاس‌های ریسپانسیو درست‌اند» با «روی گوشی درست دیده
  می‌شود» یکی نیست.
*/

/*
  کامنت‌ها را کنار می‌گذارد.

  نسخه‌ی اول این تست کل فایل را می‌گشت و به کامنتی گیر کرد که توضیح
  می‌داد چرا `backdrop-blur` حذف شده — یعنی تست، توضیحِ اصلاح را با
  خودِ مشکل اشتباه گرفت.

  کامنت‌های این پروژه عمداً مفصل‌اند و اسم چیزهایی را می‌برند که نباید
  در کد باشند. هر تستی که سورس را می‌خواند باید اول آن‌ها را حذف کند.
*/
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

describe("منوی موبایل محتوای پشتش را نشان نمی‌دهد", () => {
  const src = withoutComments(read("src/components/layout/MobileNav.tsx"));

  test("پس‌زمینه کاملاً مات است", () => {
    /*
      هر درجه‌ای از شفافیت روی این لایه یعنی عکس‌های سفید محصولات از
      پشتش خوانده می‌شوند.
    */
    assert.ok(
      !/bg-night\/\d+/.test(src),
      "پس‌زمینه‌ی منو نباید شفافیت داشته باشد",
    );
    assert.ok(
      /className="fixed inset-0 z-\[\d+\] flex flex-col bg-night /.test(src),
      "منو باید bg-night مات داشته باشد",
    );
  });

  test("backdrop-blur ندارد", () => {
    // پشت یک لایه‌ی مات چیزی برای محو کردن نیست، و همین بود که
    // ترتیب چینش را روی سافاری به‌هم می‌ریخت.
    assert.ok(
      !src.includes("backdrop-blur"),
      "backdrop-blur روی لایه‌ی مات هم بی‌فایده است هم مضر",
    );
  });
});

describe("دکمه‌ی دستیار روی منوی باز نمی‌افتد", () => {
  test("منو هنگام باز شدن به بقیه‌ی سایت خبر می‌دهد", () => {
    const src = read("src/components/layout/MobileNav.tsx");
    assert.ok(
      src.includes('classList.toggle("menu-open"'),
      "MobileNav باید کلاس menu-open را روی html بگذارد",
    );
    assert.ok(
      src.includes('classList.remove("menu-open")'),
      "کلاس باید هنگام بسته شدن برداشته شود، وگرنه دکمه برای همیشه پنهان می‌ماند",
    );
  });

  test("قاعده‌ی پنهان کردن در CSS هست", () => {
    const css = read("src/styles/globals.css");
    assert.ok(
      /html\.menu-open\s+\.assistant-fab\s*\{[^}]*display:\s*none/.test(css),
      "بدون این قاعده، کلاس menu-open هیچ اثری ندارد",
    );
  });

  test("قفل اسکرول هم برداشته می‌شود", () => {
    const src = read("src/components/layout/MobileNav.tsx");
    // یک منوی بسته که اسکرول را قفل نگه دارد، صفحه را کاملاً از کار
    // می‌اندازد — بدترین حالت ممکن روی موبایل.
    assert.ok(
      src.includes('document.body.style.overflow = ""'),
      "قفل اسکرول باید در پاک‌سازی برداشته شود",
    );
  });
});

describe("پنل دستیار روی موبایل سرریز نمی‌کند", () => {
  const src = read("src/components/chat/Assistant.tsx");

  test("روی موبایل تمام‌صفحه است، نه عرض ثابت", () => {
    /*
      عرض ۴۰۰ پیکسل روی گوشی ۳۶۰ پیکسلی یعنی اسکرول افقی. باید فقط از
      نقطه‌ی شکست به بالا اعمال شود.
    */
    assert.ok(
      src.includes("sm:w-[400px]"),
      "عرض ثابت باید پشت نقطه‌ی شکست باشد",
    );
    assert.ok(
      !/(?<!sm:)\bw-\[400px\]/.test(src),
      "عرض ثابت نباید بدون نقطه‌ی شکست اعمال شود",
    );
    assert.ok(src.includes("inset-0"), "روی موبایل باید تمام‌صفحه باشد");
  });
});

describe("خودِ تست سالم است", () => {
  test("الگوی شفافیت را واقعاً تشخیص می‌دهد", () => {
    assert.ok(/bg-night\/\d+/.test("bg-night/95 backdrop-blur-xl"));
    assert.ok(!/bg-night\/\d+/.test("bg-night lg:hidden"));
  });

  test("حذف کامنت واقعاً کار می‌کند", () => {
    assert.equal(
      withoutComments('/* backdrop-blur حذف شد */ const a = "x";').trim(),
      'const a = "x";',
    );
    assert.ok(!withoutComments("// backdrop-blur\ncode()").includes("backdrop"));
    // ولی کد واقعی را دست نزند
    assert.ok(withoutComments('className="backdrop-blur-xl"').includes("backdrop"));
  });
});
