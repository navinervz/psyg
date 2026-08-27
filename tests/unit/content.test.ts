import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeArticle } from "@/lib/article-store";

/**
 * محافظ تولید خودکار محتوا.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این سخت‌گیرانه‌ترین اعتبارسنجی پروژه است
 * ─────────────────────────────────────────────────────────────────────
 * `/api/ingest` هیچ بدنه‌ای نمی‌پذیرد — خودش می‌رود از افیلیو می‌خواند.
 * پس توکن لو رفته آنجا فقط یعنی به‌روزرسانی زودهنگام.
 *
 * اینجا نمی‌شود همان کار را کرد: متن را مدل زبانی می‌نویسد و باید از
 * بیرون بیاید. یعنی توکن لو رفته یعنی کسی می‌تواند روی سایت ما مطلب
 * منتشر کند. این تست‌ها آن سطح دسترسی را تا حد ممکن تنگ نگه می‌دارند.
 */

const ROOT = process.cwd();
const ROUTE = readFileSync(
  join(ROOT, "src", "app", "api", "content", "route.ts"),
  "utf8",
);
const MAG_PAGE = readFileSync(
  join(ROOT, "src", "app", "mag", "[slug]", "page.tsx"),
  "utf8",
);
const CTA = readFileSync(
  join(ROOT, "src", "components", "mag", "ArticleCta.tsx"),
  "utf8",
);

const SLUGS = new Set(["p-abc123", "p-def456"]);

/**
 * بدنه‌ای که از سد ۳۰۰ کلمه رد شود.
 *
 * عمداً چند پاراگراف کوتاه است و نه یک پاراگراف غول.
 * نسخه‌ی اول یک بلوک ۳۲۰ کلمه‌ای بود که ۱۶۰۰ کاراکتر می‌شد — بالاتر از
 * سقف ۱۲۰۰ کاراکتریِ هر بلوک. یعنی خودِ بلوک دور ریخته می‌شد و بعد
 * مقاله به‌خاطر کوتاهی رد. تست شکست می‌خورد بدون اینکه کد ایرادی داشته
 * باشد.
 */
function longBody() {
  const paragraph = Array(40).fill("کلمه").join(" ");
  return [
    { type: "h2", text: "بخش اول" },
    ...Array(8).fill(null).map(() => ({ type: "p", text: paragraph })),
  ];
}

function validArticle(extra: Record<string, unknown> = {}) {
  return {
    slug: "rahnamaye-kharid",
    title: "راهنمای خرید گوشی میان‌رده",
    excerpt: "چطور بین گوشی‌های میان‌رده انتخاب کنیم و کِی بهتر است صبر کنیم.",
    tag: "راهنمای خرید",
    productSlugs: ["p-abc123"],
    body: longBody(),
    ...extra,
  };
}

describe("مقاله‌ی تولیدشده — پذیرش", () => {
  test("مقاله‌ی سالم پذیرفته می‌شود", () => {
    const result = sanitizeArticle(validArticle(), SLUGS);
    assert.ok("article" in result, "error" in result ? result.error : "");
    assert.equal(result.article.slug, "rahnamaye-kharid");
    assert.deepEqual(result.article.productSlugs, ["p-abc123"]);
  });

  test("زمان مطالعه از ورودی پذیرفته نمی‌شود", () => {
    /*
      اگر از ورودی می‌آمد، مدل می‌توانست «۲ دقیقه» بنویسد روی مقاله‌ای که
      ده دقیقه است. `data.ts` خودش از روی متن حسابش می‌کند.
    */
    const result = sanitizeArticle(validArticle({ readMinutes: 99 }), SLUGS);
    assert.ok("article" in result);
    assert.equal(result.article.readMinutes, 0);
  });

  test("تاریخ از سرور می‌آید نه از مدل", () => {
    const result = sanitizeArticle(validArticle({ date: "1999-01-01" }), SLUGS);
    assert.ok("article" in result);
    assert.notEqual(result.article.date, "1999-01-01");
  });
});

describe("مقاله‌ی تولیدشده — رد کردن", () => {
  test("متن حاوی تگ رد می‌شود", () => {
    /*
      بدنه فعلاً به‌صورت متن ساده رندر می‌شود، پس تگ اینجا کاری نمی‌کند.
      ولی اگر روزی کسی رندر را به dangerouslySetInnerHTML تغییر داد، این
      تنها چیزی است که بین ما و تزریق اسکریپت می‌ماند.
    */
    const result = sanitizeArticle(
      validArticle({
        body: [
          ...longBody().slice(0, 3),
          { type: "p", text: "<script>alert(1)</script>" },
        ],
      }),
      SLUGS,
    );
    assert.ok("error" in result, "متن حاوی تگ نباید پذیرفته شود");
  });

  test("جدول پذیرفته نمی‌شود", () => {
    /*
      مدل‌های زبانی جدول قیمت می‌سازند و عددها را از خودشان درمی‌آورند.
      روی سایتی که کل ادعایش دقت قیمت است، جدول با قیمت اشتباه از نبودِ
      جدول بدتر است.
    */
    const result = sanitizeArticle(
      validArticle({
        body: [
          ...longBody(),
          { type: "table", head: ["محصول", "قیمت"], rows: [["گوشی", "۱۰ میلیون"]] },
        ],
      }),
      SLUGS,
    );
    assert.ok("article" in result);
    assert.ok(
      result.article.body.every((b) => b.type !== "table"),
      "جدول باید دور ریخته شود",
    );
  });

  test("مقاله‌ی کوتاه رد می‌شود", () => {
    const result = sanitizeArticle(
      validArticle({ body: [{ type: "p", text: "خیلی کوتاه است" }] }),
      SLUGS,
    );
    assert.ok("error" in result);
  });

  test("مقاله‌ای که به محصول واقعی ارجاع نمی‌دهد رد می‌شود", () => {
    /*
      کل هدف تولید خودکار، نوشتن از محصولات موجود سایت است. مقاله‌ی بی‌ربط
      یعنی مدل موضوع را از خودش ساخته — همان محتوای کم‌ارزشی که سئو را
      خراب می‌کند نه بهتر.
    */
    const result = sanitizeArticle(validArticle({ productSlugs: [] }), SLUGS);
    assert.ok("error" in result);
  });

  test("محصول ناموجود از فهرست حذف می‌شود", () => {
    const result = sanitizeArticle(
      validArticle({ productSlugs: ["p-abc123", "p-جعلی", "p-999"] }),
      SLUGS,
    );
    assert.ok("article" in result);
    assert.deepEqual(result.article.productSlugs, ["p-abc123"]);
  });

  test("slug فارسی یا نامعتبر جایگزین می‌شود", () => {
    const result = sanitizeArticle(validArticle({ slug: "راهنمای-خرید" }), SLUGS);
    assert.ok("article" in result);
    assert.match(result.article.slug, /^[a-z0-9-]+$/);
  });

  test("بدنه‌ی غیرشیء باعث استثنا نمی‌شود", () => {
    for (const bad of [null, undefined, "متن", 42, []]) {
      const result = sanitizeArticle(bad, SLUGS);
      assert.ok("error" in result, `${JSON.stringify(bad)} باید رد شود`);
    }
  });
});

describe("امنیت اندپوینت محتوا", () => {
  test("توکنش جدا از توکن ingest است", () => {
    /*
      اگر یکی بودند، لو رفتن توکن سینک — که در چند ورک‌فلو و کردنشیال
      پخش است — یعنی اجازه‌ی انتشار مطلب روی سایت.
    */
    assert.match(ROUTE, /PSYG_CONTENT_TOKEN/);
    assert.doesNotMatch(ROUTE, /PSYG_INGEST_TOKEN/);
  });

  test("بدون توکن، اندپوینت غیرفعال است", () => {
    assert.match(ROUTE, /MIN_TOKEN_LENGTH/);
    assert.match(ROUTE, /status: 503/);
  });

  test("مقایسه‌ی توکن مقاوم در برابر حمله‌ی زمانی است", () => {
    assert.match(ROUTE, /timingSafeEqual/);
  });

  test("هر متدی که اضافه شود احراز هویت می‌خواهد", () => {
    /*
      ─────────────────────────────────────────────────────────────────
      چرا شمردن کافی نبود
      ─────────────────────────────────────────────────────────────────
      نسخه‌ی قبلی تعداد متدها را با تعداد نگهبان‌ها مقایسه می‌کرد و اسم
      خودش «هر دو متد» بود — یعنی عدد ۲ را فرض کرده بود.

      وقتی `DELETE` اضافه شد، تست قرمز شد نه چون متدی بی‌نگهبان مانده
      بلکه چون سه شد. تستی که به *تعداد* حساس است، هر بار که چیزی
      اضافه شود سر و صدا می‌کند حتی اگر قاعده رعایت شده باشد.

      حالا هر متد جداگانه سنجیده می‌شود. اضافه کردن متد پنجم بی‌صدا
      رد نمی‌شود، ولی اضافه کردن متدِ درست هم قرمز نمی‌کند.
    */
    const methods = [
      ...ROUTE.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/g),
    ].map((m) => m[1]);

    assert.ok(methods.length > 0, "هیچ متدی در روت پیدا نشد");

    for (const method of methods) {
      /*
        بدنه‌ی هر متد تا شروع متد بعدی (یا انتهای فایل) برداشته می‌شود
        و همان‌جا باید نگهبان باشد — نه جای دیگری در فایل.
      */
      const start = ROUTE.indexOf(`export async function ${method}`);
      const rest = ROUTE.slice(start + 1);
      const nextIndex = rest.search(/export async function (GET|POST|PUT|PATCH|DELETE)\s*\(/);
      const body = nextIndex === -1 ? rest : rest.slice(0, nextIndex);

      assert.match(
        body,
        /authorize\(request\.headers\.get\("authorization"\)\)/,
        `متد ${method} بدون احراز هویت است`,
      );
    }
  });
});

describe("مقاله‌ی تولیدشده روی سایت دیده می‌شود", () => {
  test("صفحه‌ی مقاله در زمان درخواست رندر می‌شود", () => {
    /*
      قبلاً `dynamicParams = false` بود. وقتی مقاله‌ها فقط از JSON داخل
      بیلد می‌آمدند درست بود، ولی حالا ورک‌فلو مقاله‌ی تازه می‌نویسد و با
      آن تنظیم هر مقاله‌ی تولیدشده تا بیلد بعدی ۴۰۴ می‌گرفت — بی‌صدا، بدون
      اینکه خطایی جایی ثبت شود.
    */
    assert.match(MAG_PAGE, /export const dynamic = "force-dynamic"/);

    // کامنت‌ها کنار گذاشته می‌شوند — توضیحِ اینکه چرا این تنظیم برداشته
    // شد، خودش شامل عبارت است و نباید تست را قرمز کند
    const code = MAG_PAGE.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(
      code,
      /dynamicParams = false/,
      "با این تنظیم، مقاله‌ی تولیدشده هرگز دیده نمی‌شود",
    );
  });

  test("قیمت در بلوک CTA از کاتالوگ زنده می‌آید", () => {
    /*
      مقاله یک بار نوشته می‌شود و ماه‌ها می‌ماند. اگر قیمت داخل متنش بود،
      هفته‌ی بعد با صفحه‌ی محصول نمی‌خواند.
    */
    assert.match(MAG_PAGE, /products\.find\(\(p\) => p\.slug === slug\)/);
    assert.match(CTA, /formatPrice\(product\.currentPrice\)/);
  });

  test("محصول حذف‌شده لینک مرده باقی نمی‌گذارد", () => {
    assert.match(MAG_PAGE, /\.filter\(\(p\): p is NonNullable<typeof p> => p !== undefined\)/);
  });

  test("لینک خرید در مقاله هم nofollow sponsored دارد", () => {
    // از BuyButton استفاده می‌کند تا قاعده در یک نقطه بماند
    assert.match(CTA, /BuyButton/);
  });
});
