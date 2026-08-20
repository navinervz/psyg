import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  activeStores,
  alerts,
  articles,
  categories,
  getCategory,
  getProduct,
  products,
  productsByCategory,
  relatedProducts,
  searchProducts,
  stores,
  suggestions,
  topDeals,
} from "@/lib/data";
import { priceDelta } from "@/lib/format";

describe("یکپارچگی کاتالوگ", () => {
  test("محصول دارد", () => {
    assert.ok(products.length > 20, "کاتالوگ باید حداقل ۲۰ محصول داشته باشد");
  });

  test("همه‌ی slugها یکتا هستند", () => {
    const slugs = products.map((p) => p.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  test("همه‌ی idها یکتا هستند", () => {
    const ids = products.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  /*
    قبلاً این تست الزام می‌کرد که فقط دیجی‌کالا فعال باشد.

    بعد از ثبت رسانه معلوم شد افیلیو چندفروشگاهی است و کالاهایی که سایت
    ما لازم دارد — مثل گوشی‌های پرچم‌دار — در دیجی‌کالا نیستند ولی در
    اسنپ‌شاپ هستند. پس محدود کردن به یک فروشگاه دیگر درست نیست.

    چیزی که همچنان باید تضمین شود این است که هر محصول به فروشگاهی اشاره
    کند که واقعاً در لیست فروشگاه‌ها هست و فعال است — وگرنه لوگو و نام
    فروشگاه روی کارت خالی می‌ماند.
  */
  test("فروشگاه هر محصول فعال است", () => {
    const activeIds = new Set(activeStores.map((s) => s.id));

    assert.ok(activeIds.has("digikala"), "دیجی‌کالا باید فعال باشد");

    for (const product of products) {
      assert.ok(
        activeIds.has(product.store),
        `${product.slug} به فروشگاه غیرفعال «${product.store}» اشاره می‌کند`,
      );
    }
  });

  test("هر محصول دسته‌بندی معتبر دارد", () => {
    const ids = new Set(categories.map((c) => c.id));
    for (const product of products) {
      assert.ok(ids.has(product.category), `دسته‌ی نامعتبر: ${product.slug}`);
    }
  });

  test("فروشگاه هر محصول در لیست فروشگاه‌ها هست", () => {
    const ids = new Set(stores.map((s) => s.id));
    for (const product of products) {
      assert.ok(ids.has(product.store));
    }
  });

  test("قیمت‌ها مثبت‌اند", () => {
    for (const product of products) {
      assert.ok(product.currentPrice > 0, `${product.slug} قیمت نامعتبر`);
      assert.ok(product.previousPrice > 0, `${product.slug} قیمت قبلی نامعتبر`);
    }
  });

  test("لینک مبدأ همه‌ی محصولات به دیجی‌کالا اشاره می‌کند", () => {
    for (const product of products) {
      assert.ok(
        product.sourceUrl.startsWith("https://www.digikala.com/product/"),
        `${product.slug} لینک نامعتبر: ${product.sourceUrl}`,
      );
    }
  });
});

describe("تاریخچه قیمت", () => {
  test("هر محصول ۳۰ نقطه دارد", () => {
    for (const product of products) {
      assert.equal(product.history.length, 30, `${product.slug}`);
    }
  });

  test("آخرین نقطه دقیقاً برابر قیمت فعلی است", () => {
    for (const product of products) {
      const last = product.history[product.history.length - 1];
      assert.equal(last.price, product.currentPrice, `${product.slug}`);
    }
  });

  test("تاریخ‌ها صعودی و بدون تکرارند", () => {
    for (const product of products) {
      for (let i = 1; i < product.history.length; i++) {
        assert.ok(
          product.history[i].t > product.history[i - 1].t,
          `${product.slug} ترتیب تاریخ اشتباه`,
        );
      }
    }
  });

  test("همه قیمت‌های تاریخچه مثبت‌اند", () => {
    for (const product of products) {
      for (const point of product.history) {
        assert.ok(point.price > 0, `${product.slug} @ ${point.t}`);
      }
    }
  });
});

describe("سلکتورها", () => {
  test("getProduct با slug و id هر دو کار می‌کند", () => {
    const first = products[0];
    assert.equal(getProduct(first.slug)?.id, first.id);
    assert.equal(getProduct(first.id)?.slug, first.slug);
    assert.equal(getProduct("چیزی-که-وجود-ندارد"), undefined);
  });

  test("productsByCategory فقط همان دسته را برمی‌گرداند", () => {
    for (const category of categories) {
      const items = productsByCategory(category.id);
      assert.ok(items.length > 0, `دسته‌ی ${category.id} خالی است`);
      for (const item of items) assert.equal(item.category, category.id);
    }
  });

  test("topDeals بر اساس بیشترین کاهش مرتب است", () => {
    const deals = topDeals(6);
    assert.equal(deals.length, 6);

    for (let i = 1; i < deals.length; i++) {
      const prev = priceDelta(deals[i - 1].previousPrice, deals[i - 1].currentPrice);
      const curr = priceDelta(deals[i].previousPrice, deals[i].currentPrice);
      assert.ok(prev <= curr, "ترتیب کاهش قیمت درست نیست");
    }
  });

  test("topDeals اولش واقعاً کاهش قیمت دارد", () => {
    const first = topDeals(1)[0];
    assert.ok(first.currentPrice < first.previousPrice);
  });

  test("relatedProducts خودِ محصول را برنمی‌گرداند", () => {
    for (const product of products.slice(0, 8)) {
      const related = relatedProducts(product, 6);
      assert.equal(related.length, 6);
      assert.ok(!related.some((p) => p.id === product.id));
    }
  });

  test("searchProducts روی عنوان و برند کار می‌کند", () => {
    assert.ok(searchProducts("iPhone").length > 0);
    assert.ok(searchProducts("samsung").length > 0);
    assert.equal(searchProducts("").length, 0);
    assert.equal(searchProducts("   ").length, 0);
  });

  test("getCategory ورودی نامعتبر را undefined می‌دهد", () => {
    assert.equal(getCategory("nope"), undefined);
    assert.equal(getCategory("laptop")?.id, "laptop");
  });
});

describe("داده‌های وابسته", () => {
  test("هر هشدار به محصول موجود اشاره می‌کند", () => {
    for (const alert of alerts) {
      assert.ok(
        getProduct(alert.productSlug),
        `هشدار ${alert.id} به محصول ناموجود اشاره دارد: ${alert.productSlug}`,
      );
    }
  });

  test("لینک پیشنهادها داخلی و معتبر است", () => {
    for (const suggestion of suggestions) {
      assert.ok(suggestion.href.startsWith("/"), suggestion.href);

      if (suggestion.href.startsWith("/product/")) {
        const slug = suggestion.href.replace("/product/", "");
        assert.ok(getProduct(slug), `محصول ناموجود: ${slug}`);
      }
      if (suggestion.href.startsWith("/category/")) {
        const id = suggestion.href.replace("/category/", "");
        assert.ok(getCategory(id), `دسته‌ی ناموجود: ${id}`);
      }
    }
  });

  test("slug مقاله‌ها یکتاست", () => {
    const slugs = articles.map((a) => a.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  });
});
