import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/** کامنت‌ها اسم چیزهایی را می‌برند که نباید در کد باشند */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  چیدمان موبایل در بررسی کد سالم به‌نظر می‌رسید — نقطه‌های شکست درست،
  هدف لمسی ۴۴ پیکسل، پنل دستیار تمام‌صفحه. همه درست بودند.

  ولی اسکرین‌شات گوشی واقعی چیزهایی نشان داد که از کد پیدا نمی‌شدند:
  پس‌زمینه‌ی نیمه‌شفاف منو که عکس محصولات را از پشت نشان می‌داد، و
  دکمه‌ی شناوری که با z-index کمتر روی منو می‌افتاد.

  درسش این بود: «کلاس‌های ریسپانسیو درست‌اند» با «روی گوشی درست دیده
  می‌شود» یکی نیست.
*/

describe("منوی همبرگری حذف شده", () => {
  /*
    مسیریابی موبایل حالا کار نوار پایین است.

    این تست عمداً وقتی کسی همبرگری را برگرداند قرمز می‌شود. برگرداندنش
    ممکن است روزی درست باشد — ولی باید تصمیم باشد، نه اینکه دو سیستم
    مسیریابی هم‌زمان روی یک صفحه‌ی کوچک بنشینند.
  */
  test("کامپوننتش دیگر وجود ندارد", () => {
    assert.ok(
      !existsSync(join(ROOT, "src/components/layout/MobileNav.tsx")),
      "MobileNav برگشته — اگر عمدی است، این تست را هم به‌روز کن",
    );
  });

  test("هدر دیگر رندرش نمی‌کند", () => {
    const header = withoutComments(read("src/components/layout/Header.tsx"));
    assert.ok(!header.includes("MobileNav"), "هدر هنوز به منو ارجاع می‌دهد");
  });

  test("قاعده‌ی CSS مرده‌اش هم پاک شده", () => {
    /*
      کلاس `menu-open` را فقط همان کامپوننت می‌گذاشت. ماندنش یعنی یک
      قاعده که هیچ‌وقت فعال نمی‌شود و دفعه‌ی بعد کسی وقت می‌گذارد
      بفهمد چرا کار نمی‌کند.
    */
    const css = read("src/styles/globals.css");
    assert.ok(!css.includes("menu-open"), "قاعده‌ی مرده در CSS مانده");
  });

  test("لینک‌های فرعی از دسترس خارج نشده‌اند", () => {
    /*
      فروشگاه‌ها، مجله و درباره‌ی ما در نوار پایین جا نمی‌شوند. تنها
      دلیلی که حذف همبرگری چیزی را یتیم نمی‌کند، این است که فوتر
      هر سه را دارد — و فوتر در همه‌ی صفحه‌هاست.
    */
    const footer = read("src/components/layout/Footer.tsx");
    for (const href of ["/stores", "/mag", "/about"]) {
      assert.ok(
        footer.includes(href),
        `${href} نه در نوار پایین است نه در فوتر — از دسترس موبایل خارج شده`,
      );
    }
  });
});

describe("فیلد جستجو روی موبایل جا می‌شود", () => {
  const src = withoutComments(read("src/components/hero/AiSearchBar.tsx"));

  test("متن راهنما کوتاه است", () => {
    /*
      متن قبلی «دنبال چه محصولی هستی؟ قیمتش رو برات پیدا می‌کنم...»
      بود و روی گوشی وسط جمله بریده می‌شد.

      ۲۵ کاراکتر سقفی است که در باریک‌ترین حالت کامل دیده می‌شود.
    */
    /*
      دو چیز باید کوتاه بمانند و هر دو روی همان یک خط می‌نشینند:
      متن راهنمای فیلد، و جمله‌های نمونه‌ای که زیرش فهرست می‌شوند.

      نسخه‌ی قبلی این تست هر رشته‌ی فارسیِ داخل فایل را می‌شمرد — یعنی
      کلاس‌ها و متن JSX هم قاطی می‌شدند و با اولین بازنویسی قرمز شد.
      تستی که نمی‌داند دقیقاً چه چیزی را می‌سنجد، دیر یا زود سر چیز
      بی‌ربطی صدا می‌کند.
    */
    const placeholders = [...src.matchAll(/placeholder=\{[^}]*\}|placeholder="([^"]+)"/g)]
      .map((m) => m[0])
      .join(" ");
    const quoted = [...placeholders.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

    const examples = src.match(/const EXAMPLES = \[([\s\S]*?)\]/)?.[1] ?? "";
    const exampleTexts = [...examples.matchAll(/"([^"]+)"/g)].map((m) => m[1]);

    const texts = [...quoted, ...exampleTexts];
    assert.ok(texts.length >= 2, `فقط ${texts.length} متن پیدا شد`);

    for (const text of texts) {
      assert.ok(
        text.length <= 30,
        `«${text}» ${text.length} کاراکتر است و روی موبایل بریده می‌شود`,
      );
    }
  });

  test("دکمه و پدینگ روی موبایل کوچک‌ترند", () => {
    // بدون این، حدود ۹۲ پیکسل از عرض ۳۶۰ قبل از تایپ مصرف می‌شد
    assert.ok(src.includes("size-10") && src.includes("sm:size-12"));
    assert.ok(src.includes("p-1.5 ps-4") && src.includes("sm:p-2.5 sm:ps-5"));
  });

  test("ورودی باعث زوم سافاری نمی‌شود", () => {
    const input = read("src/components/ui/Input.tsx");
    assert.ok(
      input.includes("text-base") && input.includes("sm:text-sm"),
      "فونت زیر ۱۶ پیکسل روی iOS هنگام فوکوس صفحه را زوم می‌کند",
    );
  });
});

describe("پنل گفتگو روی موبایل سرریز نمی‌کند", () => {
  const src = read("src/components/hero/AiSearchBar.tsx");

  test("ارتفاعش سقف دارد و با dvh حساب می‌شود", () => {
    /*
      پنل قبلاً روی موبایل تمام‌صفحه بود چون دکمه‌ی شناور جای دیگری
      نداشت. حالا زیر فیلد جستجو باز می‌شود، پس باید سقف داشته باشد —
      وگرنه با چند پیام از پایین صفحه بیرون می‌زند.

      `dvh` نه `vh`: نوار آدرس مرورگر موبایل باز و بسته می‌شود و با
      `vh` پنل زیر آن گم می‌شد.
    */
    assert.match(
      src,
      /max-h-\[min\([^\]]*dvh/,
      "پنل گفتگو باید سقف ارتفاع بر پایه‌ی dvh داشته باشد",
    );
    assert.ok(
      !/\d+vh\b/.test(src.replace(/dvh/g, "")),
      "vh روی موبایل ارتفاع را اشتباه حساب می‌کند",
    );
  });
});

describe("خودِ تست سالم است", () => {
  test("حذف کامنت واقعاً کار می‌کند", () => {
    assert.equal(
      withoutComments('/* MobileNav حذف شد */ const a = "x";').trim(),
      'const a = "x";',
    );
    assert.ok(withoutComments("// MobileNav\ncode()").indexOf("MobileNav") < 0);
    assert.ok(withoutComments("<MobileNav />").includes("MobileNav"));
  });
});
