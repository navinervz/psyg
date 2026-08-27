import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { mergeCatalog, type Catalog } from "@/lib/catalog-store";
import { productKey } from "@/lib/product-key";
import type { CategoryId, Product, StoreId } from "@/lib/types";

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  یک شب فید افیلیو چرخید. به‌جای حدود ۴۰ محصول دیجی‌کالا و ۴۰ اسنپ‌شاپ،
  ۲۰ و ۶۰ آمد.

  `mergeHistory` قبلی `incoming.map(...)` بود — یعنی خروجی دقیقاً همان
  چیزی می‌شد که این بار آمده. هر محصولی که در دسته‌ی جدید نبود، با
  تاریخچه‌اش پاک شد.

  صبح، `/api/deals` از هشت محصول به صفر رسیده بود و همه‌ی کارت‌ها
  «تازه» بودند. هیچ خطایی هیچ‌جا ثبت نشد. `/api/health` هم می‌گفت
  `problems: []` چون ۸۰ محصول سرجایشان بودند — فقط بی‌حافظه.

  همان الگوی همیشگی: کار می‌کرد، خطا نمی‌داد، و چیزی که باید نگه می‌داشت
  را نگه نمی‌داشت.
*/

const DAY = 86_400_000;

function isoDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY).toISOString().slice(0, 10);
}

function product(over: Partial<Product> & { id: string }): Product {
  return {
    slug: `p-${over.id}`,
    title: "گوشی موبایل شیائومی مدل Redmi Note 15 Pro ظرفیت ۲۵۶ گیگابایت رم ۸ گیگابایت",
    image: "https://example.test/a.jpg",
    store: "digikala" as StoreId,
    category: "mobile" as CategoryId,
    brand: "Redmi",
    sourceUrl: "https://example.test/p",
    currentPrice: 10_000_000,
    previousPrice: 10_000_000,
    history: [],
    ...over,
  };
}

const NOW = new Date();

describe("تاریخچه وقتی محصول از فید بیرون می‌رود گم نمی‌شود", () => {
  const existing: Catalog = {
    updatedAt: NOW.toISOString(),
    products: [
      product({
        id: "uid-a",
        history: [
          { t: isoDay(-3), price: 12_000_000 },
          { t: isoDay(-2), price: 11_000_000 },
          { t: isoDay(-1), price: 10_500_000 },
        ],
      }),
    ],
  };

  test("محصول غایب به آرشیو می‌رود، نه به سطل زباله", () => {
    const other = product({
      id: "uid-b",
      title: "لپ تاپ ایسوس مدل Vivobook X515 ظرفیت ۵۱۲ گیگابایت رم ۱۶ گیگابایت",
      category: "laptop",
    });

    const result = mergeCatalog([other], existing, NOW);

    assert.equal(result.products.length, 1, "فقط محصول ورودی باید زنده باشد");
    assert.equal(result.archive.length, 1, "تاریخچه‌ی محصول غایب آرشیو نشد");
    assert.equal(result.archive[0].points.length, 3);
  });

  test("وقتی برگردد، تاریخچه‌اش را پس می‌گیرد", () => {
    // دور اول: غایب می‌شود
    const gone = mergeCatalog(
      [product({ id: "uid-b", title: "تبلت سامسونگ مدل Galaxy Tab A9", category: "tablet" })],
      existing,
      NOW,
    );

    // دور دوم: برمی‌گردد
    const back = mergeCatalog(
      [product({ id: "uid-a", currentPrice: 9_800_000 })],
      { updatedAt: "", products: gone.products, archive: gone.archive },
      NOW,
    );

    const revived = back.products.find((p) => p.id === "uid-a");
    assert.ok(revived, "محصول برنگشت");
    assert.equal(
      revived!.history.length,
      4,
      "سه نقطه‌ی قبلی به‌علاوه‌ی امروز انتظار می‌رفت",
    );
    assert.equal(
      revived!.previousPrice,
      10_500_000,
      "مبنای مقایسه باید آخرین قیمت ثبت‌شده باشد، نه قیمت امروز",
    );
  });

  test("آرشیوِ خیلی قدیمی دور ریخته می‌شود", () => {
    /*
      بدون سقف زمانی، فایل کاتالوگ برای همیشه رشد می‌کرد و پر از
      محصولاتی می‌شد که سال‌هاست از بازار رفته‌اند.
    */
    const stale: Catalog = {
      updatedAt: "",
      products: [],
      archive: [
        {
          id: "uid-old",
          key: null,
          store: "digikala",
          title: "قدیمی",
          points: [{ t: isoDay(-200), price: 1 }],
          lastSeen: isoDay(-200),
        },
      ],
    };

    const result = mergeCatalog([product({ id: "uid-new" })], stale, NOW);
    assert.equal(result.archive.length, 0, "آرشیو کهنه باید هرس شود");
  });
});

describe("همان محصول از فروشگاه دیگر، تاریخچه را ادامه می‌دهد", () => {
  /*
    این همان چیزی است که آن شب واقعاً اتفاق افتاد: گوشی از فید دیجی‌کالا
    رفت و با uid دیگری از اسنپ‌شاپ برگشت. برای کد قبلی محصول جدیدی بود.
  */
  const digikala = product({
    id: "uid-dk",
    store: "digikala",
    history: [
      { t: isoDay(-2), price: 12_000_000 },
      { t: isoDay(-1), price: 11_000_000 },
    ],
  });

  const snapp = product({
    id: "uid-sn",
    store: "snappshop",
    // عنوان اسنپ‌شاپ کلمه‌بندی متفاوتی دارد ولی همان گوشی است
    title: "گوشی Redmi Note 15 Pro 256GB 8GB",
    currentPrice: 10_800_000,
  });

  test("کلید عنوانی هر دو را یکی می‌بیند", () => {
    assert.equal(
      productKey(digikala.title, "mobile"),
      productKey(snapp.title, "mobile"),
    );
  });

  test("تاریخچه منتقل می‌شود", () => {
    const result = mergeCatalog(
      [snapp],
      { updatedAt: "", products: [digikala] },
      NOW,
    );

    assert.equal(result.products[0].history.length, 3);
    assert.equal(result.products[0].previousPrice, 11_000_000);
  });

  test("محصول می‌داند تاریخچه‌اش از کجا آمده", () => {
    /*
      نگه داشتن تاریخچه بدون گفتنش، ادعای ضمنی می‌سازد که همه‌ی نقطه‌ها
      از فروشگاه فعلی‌اند. `historyFrom` همان ادعا را پس می‌گیرد.
    */
    const result = mergeCatalog(
      [snapp],
      { updatedAt: "", products: [digikala] },
      NOW,
    );

    assert.equal(result.products[0].historyFrom, "digikala");
  });

  test("وقتی فروشگاه عوض نشده، چیزی ادعا نمی‌شود", () => {
    const result = mergeCatalog(
      [product({ id: "uid-dk", store: "digikala", history: [] })],
      { updatedAt: "", products: [digikala] },
      NOW,
    );

    assert.equal(
      result.products[0].historyFrom,
      undefined,
      "روی حالت عادی نباید هیچ یادداشتی روی صفحه بیاید",
    );
  });

  test("یک تاریخچه دو بار ادعا نمی‌شود", () => {
    /*
      اگر همان گوشی هم‌زمان در هر دو فروشگاه باشد، هر دو کارت به یک
      کلید می‌رسند. بدون قفلِ ادعا، یک تاریخچه‌ی واحد دو جا نشان داده
      می‌شد — انگار دو رصد مستقل بوده.
    */
    const result = mergeCatalog(
      [snapp, product({ id: "uid-tl", store: "technolife" })],
      { updatedAt: "", products: [digikala] },
      NOW,
    );

    const withHistory = result.products.filter((p) => p.history.length > 1);
    assert.equal(withHistory.length, 1, "فقط یکی باید تاریخچه را برداشته باشد");
  });
});

describe("کلید محصول محافظه‌کار است", () => {
  /*
    اشتباه اینجا از گم شدن تاریخچه بدتر است: دو محصول متفاوت که یک کلید
    بگیرند، نمودار قیمتی می‌سازند که هرگز وجود نداشته.
  */
  test("مدل‌های نزدیک قاطی نمی‌شوند", () => {
    const pairs: [string, string][] = [
      ["گوشی Redmi Note 15 256GB 8GB", "گوشی Redmi Note 15 Pro 256GB 8GB"],
      ["گوشی Redmi Note 15 Pro 256GB 8GB", "گوشی Redmi Note 15 Pro 128GB 8GB"],
      ["گوشی Redmi Note 15 Pro 256GB 8GB", "گوشی Redmi Note 15 Pro 256GB 12GB"],
      ["گوشی Galaxy A27 128GB 6GB", "گوشی Galaxy A25 128GB 6GB"],
    ];

    for (const [a, b] of pairs) {
      assert.notEqual(
        productKey(a, "mobile"),
        productKey(b, "mobile"),
        `«${a}» و «${b}» یک کلید گرفتند — تاریخچه‌شان قاطی می‌شود`,
      );
    }
  });

  test("دسته‌ی متفاوت یعنی محصول متفاوت", () => {
    assert.notEqual(
      productKey("Galaxy Tab A9 64GB 4GB", "tablet"),
      productKey("Galaxy Tab A9 64GB 4GB", "mobile"),
    );
  });

  test("ارقام فارسی و لاتین یکی حساب می‌شوند", () => {
    assert.equal(
      productKey("گوشی Redmi Note 15 ظرفیت ۲۵۶ گیگابایت رم ۸ گیگابایت", "mobile"),
      productKey("گوشی Redmi Note 15 256GB 8GB", "mobile"),
    );
  });

  test("ترتیب ظرفیت و رم در نگارش لاتین مهم نیست", () => {
    /*
      یک فروشگاه «128GB / 4GB» می‌نویسد و دیگری «4GB RAM 128GB». بزرگ‌تر
      همیشه حافظه‌ی داخلی است.
    */
    assert.equal(
      productKey("گوشی Galaxy A27 128GB 4GB", "mobile"),
      productKey("گوشی Galaxy A27 4GB 128GB", "mobile"),
    );
  });

  test("عنوان بدون سیگنال، کلید نمی‌گیرد", () => {
    /*
      `null` یعنی «نمی‌دانم» و باعث می‌شود محصول فقط با id خودش تطبیق
      داده شود. از دست دادن تاریخچه‌ی یک محصول قابل جبران است؛ نمودار
      جعلی نه.
    */
    assert.equal(productKey("هدفون بی‌سیم", "headphone"), null);
    assert.equal(productKey("شارژر", "accessory"), null);
  });

  test("محصول بی‌کلید سراغ تاریخچه‌ی محصول بی‌کلید دیگر نمی‌رود", () => {
    const a = product({
      id: "uid-1",
      title: "هدفون بی‌سیم",
      category: "headphone",
      history: [{ t: isoDay(-1), price: 500_000 }],
    });
    const b = product({
      id: "uid-2",
      title: "هندزفری سیمی",
      category: "headphone",
    });

    const result = mergeCatalog([b], { updatedAt: "", products: [a] }, NOW);
    assert.equal(
      result.products[0].history.length,
      1,
      "دو محصول بی‌کلید نباید به هم وصل شوند",
    );
  });
});
