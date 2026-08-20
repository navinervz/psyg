import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * محافظ کیفیت طراحی.
 *
 * این تست‌ها از بازبینی سایت با راهنمای UI/UX Pro Max بیرون آمدند. هر
 * کدام یک ایراد واقعیِ پیداشده را قفل می‌کند، نه یک سلیقه.
 */

const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, "src", "styles", "globals.css"), "utf8");

/* ──────────────────  محاسبه‌ی کنتراست (WCAG 2.1)  ────────────────── */

function channels(hex: string): number[] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** مقدار یک توکن رنگ را از بلوک @theme می‌خواند */
function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS);
  assert.ok(match, `توکن --color-${name} پیدا نشد`);
  return match[1];
}

describe("کنتراست متن استاندارد را رعایت می‌کند", () => {
  /*
    `low` قبلاً #6b7268 بود و روی هر سه سطح زیر ۴.۵ می‌افتاد — در حالی
    که همان رنگی است که برای متن‌های ۱۰ و ۱۱ پیکسلی به‌کار می‌رود.

    این تست عمداً خودِ رنگ‌ها را حساب می‌کند نه اینکه مقدار ثابتی را
    بسنجد؛ اگر روزی کسی پالت را عوض کرد، همین‌جا خطا می‌گیرد.
  */
  const surfaces = ["night", "surface", "elevated"] as const;
  const texts = ["hi", "mid", "low"] as const;

  for (const surface of surfaces) {
    for (const text of texts) {
      test(`${text} روی ${surface}`, () => {
        const ratio = contrast(token(text), token(surface));
        assert.ok(
          ratio >= 4.5,
          `کنتراست ${ratio.toFixed(2)} است، حداقل ۴.۵ لازم است`,
        );
      });
    }
  }

  test("اکسنت روی سطوح تیره خوانا است", () => {
    for (const surface of surfaces) {
      const ratio = contrast(token("accent"), token(surface));
      assert.ok(ratio >= 4.5, `اکسنت روی ${surface}: ${ratio.toFixed(2)}`);
    }
  });

  test("متن تیره روی دکمه‌ی اکسنت خوانا است", () => {
    // دکمه‌های خرید متن `night` روی پس‌زمینه‌ی `accent` دارند
    const ratio = contrast(token("night"), token("accent"));
    assert.ok(ratio >= 4.5, `${ratio.toFixed(2)}`);
  });

  test("سلسله‌مراتب متن حفظ شده", () => {
    /*
      روشن کردن `low` برای کنتراست نباید آن‌قدر پیش برود که با `mid`
      یکی شود — وگرنه تمایز بین متن اصلی و توضیحی از بین می‌رود.
    */
    const low = contrast(token("low"), token("surface"));
    const mid = contrast(token("mid"), token("surface"));
    const hi = contrast(token("hi"), token("surface"));
    assert.ok(low < mid && mid < hi, "ترتیب کنتراست باید low < mid < hi باشد");
    assert.ok(mid - low > 1.5, "فاصله‌ی low و mid برای تمایز کافی نیست");
  });
});

describe("رنگ فقط وقتی ادعا می‌کند که بداند", () => {
  /*
    باگی که این بخش از آن متولد شد:

    در صفحه‌ی فرصت‌ها پنج کارت از شش تا قیمت قرمز و حاشیه‌ی قرمز
    داشتند، در حالی که قیمت هیچ‌کدام بالا نرفته بود. این محصولات تازه
    اضافه شده بودند و فقط یک نقطه‌ی قیمت داشتند.

    علتش منطق دوحالتی `isDrop = delta < 0` بود: هرچه افت نکرده،
    «گران شده» فرض می‌شد. `ChangeBadge` قبلاً درست شده بود و «تازه»
    نشان می‌داد — ولی رنگ قیمت، حاشیه‌ی کارت و نمودار همچنان دوحالتی
    مانده بودند. یعنی بج یک چیز می‌گفت و رنگ کنارش چیز دیگری.
  */
  test("منطق روند در یک نقطه متمرکز است", () => {
    const format = readFileSync(join(ROOT, "src", "lib", "format.ts"), "utf8");
    assert.match(format, /export function priceTrend/);
    assert.match(format, /export const MIN_MEANINGFUL_DELTA/);
  });

  test("هیچ کامپوننتی منطق دوحالتی خودش را ندارد", () => {
    /*
      اگر جایی دوباره `delta < 0` بنویسد، همان واگرایی برمی‌گردد: یک
      جا درست می‌شود و بقیه جا می‌مانند.
    */
    const files = [
      "src/components/deals/DealCard.tsx",
      "src/components/deals/PriceBlock.tsx",
      "src/components/deals/PriceSparkline.tsx",
      "src/components/product/PriceHistoryChart.tsx",
      "src/components/ui/Badge.tsx",
      "src/components/hero/AiSearchBar.tsx",
      "src/app/product/[slug]/page.tsx",
    ];

    const guilty: string[] = [];

    for (const file of files) {
      const code = readFileSync(join(ROOT, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");

      if (/delta\s*<\s*0|delta\s*>\s*0/.test(code)) guilty.push(file);
    }

    assert.deepEqual(
      guilty,
      [],
      "این فایل‌ها به‌جای priceTrend مقایسه‌ی خام دارند:\n  " + guilty.join("\n  "),
    );
  });

  test("سه حالت واقعاً سه رفتار متفاوت دارند", () => {
    const card = readFileSync(
      join(ROOT, "src", "components", "deals", "DealCard.tsx"),
      "utf8",
    );

    for (const state of ["drop", "rise", "unknown"]) {
      assert.match(
        card,
        new RegExp(`trend === "${state}"`),
        `حالت ${state} در کارت پوشش داده نشده`,
      );
    }
  });

  test("محصول بدون تاریخچه رنگ هشدار نمی‌گیرد", () => {
    const block = readFileSync(
      join(ROOT, "src", "components", "deals", "PriceBlock.tsx"),
      "utf8",
    );
    // در حالت نامعلوم باید رنگ خنثای متن اصلی باشد، نه قرمز
    assert.match(block, /trend === "unknown" && "text-hi"/);
  });
});

describe("پیمایش با صفحه‌کلید دیده می‌شود", () => {
  test("حلقه‌ی فوکوس تعریف شده", () => {
    /*
      تا پیش از این، سایت هیچ حلقه‌ی فوکوسی نداشت. کسی که با Tab
      پیمایش می‌کرد هیچ نشانه‌ای نداشت که کجاست.
    */
    assert.match(CSS, /:focus-visible\s*\{[^}]*outline:/);
  });

  test("از focus-visible استفاده می‌کند نه focus ساده", () => {
    /*
      با `:focus` ساده، هر کلیک ماوس هم حلقه می‌سازد — که زشت است و
      دقیقاً همان چیزی است که توسعه‌دهنده‌ها را وادار به نوشتن
      `outline: none` و نابود کردن دسترس‌پذیری می‌کند.
    */
    assert.doesNotMatch(
      CSS,
      /(?<!-)\bbutton:focus\s*\{/,
      "به‌جای focus از focus-visible استفاده شود",
    );
  });

  test("هیچ‌جا حلقه‌ی فوکوس بدون جایگزین حذف نشده", () => {
    const bad = /outline:\s*(none|0)\s*;/g;
    const matches = [...CSS.matchAll(bad)];

    for (const m of matches) {
      // اگر outline حذف شده، باید در همان بلوک جایگزینی باشد
      const around = CSS.slice(Math.max(0, m.index! - 300), m.index! + 300);
      assert.match(
        around,
        /box-shadow|border-color|outline:\s*\d/,
        "حذف outline بدون جایگزین، پیمایش با صفحه‌کلید را کور می‌کند",
      );
    }
  });
});

describe("عناصر کلیک‌شدنی نشانگر درست دارند", () => {
  test("دکمه‌ها نشانگر دست می‌گیرند", () => {
    /*
      Tailwind در preflight به `button` مقدار `cursor: default` می‌دهد.
      بدون این قاعده، روی هر دکمه‌ی سایت فلش دیده می‌شد نه دست.
    */
    assert.match(CSS, /button:not\(:disabled\)[\s\S]{0,120}cursor:\s*pointer/);
  });

  test("دکمه‌ی غیرفعال نشانگر متفاوت دارد", () => {
    assert.match(CSS, /button:disabled\s*\{[^}]*cursor:\s*not-allowed/);
  });
});

describe("حرکت با تنظیمات کاربر سازگار است", () => {
  test("prefers-reduced-motion رعایت شده", () => {
    assert.match(CSS, /@media \(prefers-reduced-motion: reduce\)/);
  });

  test("در حالت کم‌حرکت، محتوا همچنان دیده می‌شود", () => {
    /*
      خاموش کردن انیمیشن نباید محتوایی را که پشت انیمیشن پنهان است
      برای همیشه نامرئی نگه دارد — همان باگی که قبلاً با `will-reveal`
      داشتیم.
    */
    const block = /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/.exec(CSS);
    assert.ok(block, "بلوک reduced-motion پیدا نشد");
    assert.match(block[0], /opacity:\s*1\s*!important/);
  });
});

describe("هاور کارت حالت گیر باقی نمی‌گذارد", () => {
  test("هر ویژگی متحرکِ هاور، بازگشت دارد", () => {
    /*
      اگر ماوس سریع از کارت بیرون برود و توییِن معکوس نباشد، کارت بالا
      و کج گیر می‌کند — و چون همه‌ی کارت‌های شبکه همین رفتار را دارند،
      کل صفحه به‌هم‌ریخته به‌نظر می‌رسد.
    */
    const card = readFileSync(
      join(ROOT, "src", "components", "deals", "DealCard.tsx"),
      "utf8",
    );

    assert.match(card, /pointerleave/, "رویداد خروج باید ثبت شود");

    const onLeave = /const onLeave = \(\) => \{([\s\S]*?)\};/.exec(card);
    assert.ok(onLeave, "تابع بازگشت پیدا نشد");

    for (const fn of ["rotX", "rotY", "lift"]) {
      assert.match(
        onLeave[1],
        new RegExp(`${fn}\\(0\\)`),
        `${fn} در بازگشت صفر نمی‌شود`,
      );
    }
  });

  test("هاور روی دستگاه لمسی اجرا نمی‌شود", () => {
    const card = readFileSync(
      join(ROOT, "src", "components", "deals", "DealCard.tsx"),
      "utf8",
    );
    assert.match(card, /pointer: coarse/);
  });
});
