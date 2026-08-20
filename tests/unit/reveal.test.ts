import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * محافظ معماری انیمیشن ورود.
 *
 * پس‌زمینه‌ی این تست یک باگ واقعی است که کاربر گزارش کرد: کلیک روی فیلتر
 * دسته‌بندی در `/deals` صفحه را کاملاً خالی می‌کرد، و صفحه‌های علاقه‌مندی
 * و پیگیری همیشه خالی به نظر می‌رسیدند.
 *
 * علت هر دو یکی بود: کلاس `.will-reveal` در CSS بی‌قیدوشرط
 * `opacity: 0` می‌گذاشت. یعنی «دیده شدن محصولات» — کاری که کل سایت برای
 * آن وجود دارد — به بی‌نقص اجرا شدن جاوااسکریپت گره خورده بود. هر جا
 * انیمیشن شلیک نمی‌کرد، محتوا برای همیشه نامرئی می‌ماند.
 *
 * این تست‌ها مطمئن می‌شوند آن پیش‌فرض خطرناک برنگردد.
 */

const ROOT = process.cwd();
const CSS = readFileSync(join(ROOT, "src", "styles", "globals.css"), "utf8");
const LAYOUT = readFileSync(join(ROOT, "src", "app", "layout.tsx"), "utf8");

/** خطوطی که روی `.will-reveal` شفافیت صفر می‌گذارند */
function opacityZeroRules(css: string): string[] {
  const rules: string[] = [];
  // هر بلوکی که هم will-reveal دارد هم opacity صفر
  for (const match of css.matchAll(/([^{}]*\.will-reveal[^{}]*)\{([^}]*)\}/g)) {
    const selector = match[1].replace(/\s+/g, " ").trim();
    const body = match[2];
    if (/opacity:\s*0\b/.test(body)) rules.push(selector);
  }
  return rules;
}

describe("خودِ تست سالم است", () => {
  test("تشخیص‌دهنده، قاعده‌ی خطرناک را واقعاً پیدا می‌کند", () => {
    const bad = ".will-reveal { opacity: 0; }";
    assert.deepEqual(opacityZeroRules(bad), [".will-reveal"]);
  });

  test("تشخیص‌دهنده، قاعده‌ی امن را اشتباه علامت نمی‌زند", () => {
    const safe = "html.reveal-armed .will-reveal { opacity: 0; }";
    assert.deepEqual(opacityZeroRules(safe), ["html.reveal-armed .will-reveal"]);
  });
});

describe("محتوا هرگز بی‌قیدوشرط نامرئی نمی‌شود", () => {
  test("هر قاعده‌ی opacity صفر پشت کلاس reveal-armed است", () => {
    const unguarded = opacityZeroRules(CSS).filter(
      (selector) => !selector.includes("reveal-armed"),
    );

    assert.deepEqual(
      unguarded,
      [],
      "این سلکتورها محتوا را بدون هیچ شرطی پنهان می‌کنند.\n" +
        "  اگر جاوااسکریپت اجرا نشود یا انیمیشن شلیک نکند، کاربر صفحه‌ی\n" +
        "  خالی می‌بیند. قاعده باید با `html.reveal-armed` شروع شود.",
    );
  });

  test("کلاس reveal-armed روی سرور رندر می‌شود نه با جاوااسکریپت", () => {
    assert.match(
      LAYOUT,
      /<html[^>]*className="reveal-armed"/,
      "اگر این کلاس را اسکریپت سمت مرورگر اضافه کند، HTML سرور با کلاینت\n" +
        "  فرق می‌کند و React خطای hydration mismatch می‌دهد.",
    );
  });

  test("حالت بدون جاوااسکریپت پوشش داده شده", () => {
    assert.match(LAYOUT, /<noscript>/);
    assert.match(
      LAYOUT,
      /reveal-armed \.will-reveal\{opacity:1/,
      "بدون جاوااسکریپت انیمیشنی در کار نیست، پس محتوا باید دیده شود",
    );
  });

  test("تور نجات زمان‌دار وجود دارد", () => {
    assert.match(
      LAYOUT,
      /classList\.remove\('reveal-armed'\)/,
      "اگر انیمیشن به هر دلیلی شلیک نکرد، محتوا نباید برای همیشه پنهان بماند",
    );
    assert.match(LAYOUT, /setTimeout/);
  });
});

describe("هر گرید متغیر، انیمیشنش را از نو اجرا می‌کند", () => {
  /**
   * اگر کانتینری با `key` بازسازی شود ولی هوک انیمیشن وابستگی نداشته
   * باشد، React المان تازه را می‌گذارد و هوک دیگر اجرا نمی‌شود — دقیقاً
   * باگ فیلتر دسته‌بندی.
   */
  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else out.push(full);
    }
    return out;
  }

  test("هر فایلی که هم key پویا دارد هم useRevealOnScroll، deps می‌دهد", () => {
    const offenders: string[] = [];
    const componentsDir = join(ROOT, "src", "components");

    for (const file of walk(componentsDir)) {
      if (!file.endsWith(".tsx")) continue;
      const source = readFileSync(file, "utf8");

      if (!source.includes("useRevealOnScroll")) continue;

      /*
        فقط `key` روی همان عنصری مهم است که `ref={scope}` دارد. `key` داخل
        حلقه‌ی map کاملاً عادی است و ربطی به این باگ ندارد، پس عمداً فقط
        دویست کاراکتر بلافاصله قبل از ref را نگاه می‌کنیم.
      */
      const beforeRef = source.split("ref={scope}")[0]?.slice(-200) ?? "";
      const containerHasKey = /key=\{/.test(beforeRef);
      const passesDeps = /deps:\s*\[/.test(source);

      if (containerHasKey && !passesDeps) offenders.push(relative(ROOT, file));
    }

    assert.deepEqual(
      offenders,
      [],
      "این کامپوننت‌ها کانتینر انیمیشن را با key بازسازی می‌کنند ولی\n" +
        "  `deps` به useRevealOnScroll نمی‌دهند. نتیجه: محتوای تازه\n" +
        "  نامرئی می‌ماند.",
    );
  });

  test("گرید فرصت‌ها فیلترهایش را به‌عنوان وابستگی می‌دهد", () => {
    const dealGrid = readFileSync(
      join(ROOT, "src", "components", "deals", "DealGrid.tsx"),
      "utf8",
    );
    assert.match(
      dealGrid,
      /deps:\s*\[category,\s*sort\]/,
      "بدون این، کلیک روی فیلتر دسته‌بندی صفحه را خالی می‌کند",
    );
  });

  test("گرید محصولات ذخیره‌شده هم هوک انیمیشن دارد", () => {
    const saved = readFileSync(
      join(ROOT, "src", "components", "account", "SavedProductsGrid.tsx"),
      "utf8",
    );
    assert.match(
      saved,
      /useRevealOnScroll/,
      "کارت‌ها کلاس will-reveal دارند؛ بدون هوک، صفحه‌های علاقه‌مندی و\n" +
        "  پیگیری خالی به نظر می‌رسند",
    );
    assert.match(saved, /ref=\{scope\}/, "hook باید واقعاً به گرید وصل شود");
  });
});

describe("مرز سلامت فایل‌ها", () => {
  test("مسیرهای بررسی‌شده واقعاً وجود دارند", () => {
    // کنترل منفی: اگر فایل‌ها جابه‌جا شوند این تست باید بشکند نه اینکه سبز بماند
    assert.ok(CSS.length > 1000, "globals.css خالی یا جابه‌جا شده");
    assert.ok(LAYOUT.includes("<html"), "layout.tsx ساختار مورد انتظار را ندارد");
    assert.ok(
      CSS.includes(".will-reveal"),
      "کلاس will-reveal دیگر در CSS نیست — این تست‌ها بی‌معنا شده‌اند",
    );
  });
});
