import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { MIN_MEANINGFUL_DELTA, priceStanding } from "@/lib/format";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  همه‌ی ۲۴۵ تست قبلی سبز بودند در حالی که صفحه‌ی «بهترین فرصت‌ها» هیچ
  فرصتی نشان نمی‌داد و هر ۸۰ محصول برچسب «تازه» داشتند.

  علتش این بود که تست‌ها فقط سازگاری درونی را می‌سنجیدند — اینکه هشدار
  با محصول بخواند، رنگ با عدد بخواند. هیچ‌کدام نمی‌پرسید «عددی که نشان
  می‌دهیم اصلاً همانی است که کاربر دنبالش است؟»

  این فایل همان سؤال را می‌پرسد.
*/

describe("جایگاه قیمت نسبت به سقف اخیر", () => {
  test("یک نقطه یعنی هیچ ادعایی نمی‌کنیم", () => {
    const s = priceStanding([{ t: "2026-08-21", price: 100 }], 100);
    assert.equal(s.known, false);
    assert.equal(s.belowHigh, 0);
    assert.equal(s.daysAgo, null);
  });

  test("تاریخچه‌ی خالی هم نمی‌شکند", () => {
    assert.equal(priceStanding([], 100).known, false);
  });

  test("افت واقعی از سقف تشخیص داده می‌شود", () => {
    const s = priceStanding(
      [
        { t: "2026-08-16", price: 29_890_000 },
        { t: "2026-08-18", price: 27_850_000 },
        { t: "2026-08-21", price: 26_500_000 },
      ],
      26_500_000,
      new Date("2026-08-21T12:00:00Z"),
    );

    assert.equal(s.known, true);
    assert.equal(s.high, 29_890_000);
    assert.equal(s.highAt, "2026-08-16");
    assert.ok(Math.abs(s.belowHigh - 11.34) < 0.05, `belowHigh=${s.belowHigh}`);
    assert.equal(s.daysAgo, 5);
  });

  test("قیمت ثابت یعنی افتی در کار نیست", () => {
    const s = priceStanding(
      [
        { t: "2026-08-19", price: 100 },
        { t: "2026-08-20", price: 100 },
        { t: "2026-08-21", price: 100 },
      ],
      100,
    );
    assert.equal(s.known, false);
  });

  test("قیمتی که فقط بالا رفته، افت گزارش نمی‌شود", () => {
    const s = priceStanding(
      [
        { t: "2026-08-19", price: 100 },
        { t: "2026-08-21", price: 120 },
      ],
      120,
    );
    assert.equal(s.known, false);
    assert.equal(s.belowHigh, 0);
  });

  test("افت ناچیز ادعا نمی‌شود", () => {
    const s = priceStanding(
      [
        { t: "2026-08-20", price: 1000 },
        { t: "2026-08-21", price: 998 },
      ],
      998,
    );
    // ۰.۲٪ — کمتر از آستانه
    assert.ok(0.2 < MIN_MEANINGFUL_DELTA);
    assert.equal(s.known, false);
  });

  test("وقتی قیمت چند روز روی سقف مانده، تاریخِ آخرین بار گزارش می‌شود", () => {
    const s = priceStanding(
      [
        { t: "2026-08-01", price: 200 },
        { t: "2026-08-19", price: 200 },
        { t: "2026-08-21", price: 150 },
      ],
      150,
      new Date("2026-08-21T12:00:00Z"),
    );

    // ۲ روز پیش، نه ۲۰ روز پیش
    assert.equal(s.highAt, "2026-08-19");
    assert.equal(s.daysAgo, 2);
  });

  test("نقطه‌ی خراب باعث استثنا نمی‌شود", () => {
    const s = priceStanding(
      [
        { t: "2026-08-19", price: 0 },
        { t: "2026-08-20", price: 200 },
        { t: "2026-08-21", price: 150 },
      ],
      150,
    );
    assert.equal(s.high, 200);
  });

  test("درصد هیچ‌وقت منفی نیست", () => {
    for (let i = 0; i < 200; i++) {
      const a = Math.floor(Math.random() * 1e6) + 1;
      const b = Math.floor(Math.random() * 1e6) + 1;
      const s = priceStanding(
        [
          { t: "2026-08-20", price: a },
          { t: "2026-08-21", price: b },
        ],
        b,
      );
      assert.ok(s.belowHigh >= 0, `belowHigh=${s.belowHigh} a=${a} b=${b}`);
    }
  });
});

describe("عددی که نشان می‌دهیم، همانی است که سنجیده‌ایم", () => {
  /*
    این تست دقیقاً همان رگرسیونی را می‌گیرد که روی سایت زنده اتفاق
    افتاد: کارت‌ها روی تغییر روزانه بودند، آن عدد برای همه صفر بود، و
    صفحه‌ی فرصت‌ها خالی از فرصت شد.
  */
  test("کارت فرصت روی «زیر سقف» تکیه می‌کند نه تغییر روزانه", () => {
    const src = read("src/components/deals/DealCard.tsx");
    assert.ok(
      src.includes("priceStanding("),
      "DealCard باید از priceStanding استفاده کند",
    );
    assert.ok(
      src.includes("<StandingBadge"),
      "بج کارت باید StandingBadge باشد",
    );
  });

  test("مرتب‌سازی «بیشترین کاهش» روی ستون صفر کار نمی‌کند", () => {
    const src = read("src/components/deals/DealGrid.tsx");
    assert.ok(
      src.includes("priceStanding("),
      "مرتب‌سازی کاهش باید بر اساس فاصله تا سقف باشد",
    );
  });

  test("خروجی مخصوص مدل‌های هوش مصنوعی هم همان معیار را دارد", () => {
    const src = read("src/app/llms.txt/route.ts");
    assert.ok(
      src.includes("priceStanding("),
      "llms.txt نباید افت‌ها را از تغییر روزانه بگیرد",
    );
  });
});

describe("هیچ ادعای زمانی دستی در صفحه‌ی محصول نیست", () => {
  /*
    قبلاً این خط وجود داشت:
      قیمت خط‌خورده مربوط به {toFaDigits(7)} روز پیش است.

    عدد ۷ از هوا آمده بود و جمله شرط هم نداشت، پس روی محصولی که اصلاً
    قیمت خط‌خورده نداشت هم چاپ می‌شد.
  */
  const src = read("src/app/product/[slug]/page.tsx");

  test("عدد روز، هاردکد نشده", () => {
    assert.ok(
      !/toFaDigits\(\s*\d+\s*\)/.test(src),
      "تعداد روز باید از تاریخچه محاسبه شود، نه دستی",
    );
  });

  test("جمله‌ی قیمت خط‌خورده شرط دارد", () => {
    const idx = src.indexOf("بالاترین قیمت ثبت‌شده،");
    assert.ok(idx > 0, "جمله باید وجود داشته باشد");

    const before = src.slice(Math.max(0, idx - 400), idx);
    assert.ok(
      before.includes("standing.known"),
      "جمله نباید بدون شرط چاپ شود",
    );
  });

  test("قیمت خط‌خورده از سقف ثبت‌شده می‌آید نه قیمت دیروز", () => {
    assert.ok(
      src.includes("formatPrice(standing.high)"),
      "خط‌خورده باید سقف تاریخچه باشد",
    );
    assert.ok(
      !src.includes("formatPrice(product.previousPrice)"),
      "قیمت دیروز نباید به‌عنوان قیمت قبل از تخفیف نمایش داده شود",
    );
  });
});

describe("خودِ تست سالم است", () => {
  test("الگوی هاردکد را واقعاً تشخیص می‌دهد", () => {
    assert.ok(/toFaDigits\(\s*\d+\s*\)/.test("toFaDigits(7)"));
    assert.ok(!/toFaDigits\(\s*\d+\s*\)/.test("toFaDigits(standing.daysAgo)"));
  });
});
