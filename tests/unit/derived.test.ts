import test, { describe } from "node:test";
import assert from "node:assert/strict";

import {
  alerts,
  categories,
  getCategory,
  getProduct,
  products,
  suggestions,
} from "@/lib/data";
import { buildAlerts, buildSuggestions } from "@/lib/derived";
import { calculateLevel, XP_PER_FAVORITE, XP_PER_TRACKED } from "@/lib/level";
import { priceDelta } from "@/lib/format";

/**
 * این فایل برای جلوگیری از بازگشت یک باگ واقعی نوشته شده:
 * قبلاً هشدارها درصدهای هاردکد داشتند که با داده‌ی محصول نمی‌خواند —
 * کاربر روی «۱۸٪ کمتر» کلیک می‌کرد و در صفحه‌ی محصول «۴٪» می‌دید.
 */

describe("هشدارها با داده‌ی محصول منطبق‌اند", () => {
  test("درصد هر هشدار دقیقاً از خود محصول محاسبه شده", () => {
    assert.ok(alerts.length > 0, "هیچ هشداری تولید نشد");

    for (const alert of alerts) {
      const product = getProduct(alert.productSlug);
      assert.ok(product, `محصول ناموجود: ${alert.productSlug}`);

      const expected = priceDelta(product.previousPrice, product.currentPrice);
      assert.equal(
        alert.delta,
        expected,
        `${alert.productSlug}: هشدار ${alert.delta} ولی واقعیت ${expected}`,
      );
    }
  });

  test("عنوان و تصویر هشدار هم از خود محصول می‌آید", () => {
    for (const alert of alerts) {
      const product = getProduct(alert.productSlug);
      assert.ok(product, `محصول ناموجود: ${alert.productSlug}`);

      assert.equal(alert.productTitle, product.title);
      assert.equal(alert.productImage, product.image);
      assert.equal(alert.store, product.store);
    }
  });

  test("فقط محصولاتی که واقعاً ارزان شده‌اند هشدار می‌گیرند", () => {
    for (const alert of alerts) {
      assert.ok(alert.delta < 0, `${alert.productSlug} کاهش قیمت نداشته`);
    }
  });

  test("مرتب‌شده از بیشترین افت", () => {
    for (let i = 1; i < alerts.length; i++) {
      assert.ok(alerts[i - 1].delta <= alerts[i].delta);
    }
  });

  test("زمان‌ها معتبر و بدون تکرارند", () => {
    const seen = new Set<string>();
    for (const alert of alerts) {
      assert.ok(!Number.isNaN(Date.parse(alert.at)), alert.at);
      assert.ok(!seen.has(alert.at), "دو هشدار زمان یکسان دارند");
      seen.add(alert.at);
    }
  });

  test("خروجی قطعی است — دو بار ساختن نتیجه‌ی یکسان می‌دهد", () => {
    assert.deepEqual(buildAlerts(products, 3), buildAlerts(products, 3));
  });

  test("با لیست خالی نمی‌شکند", () => {
    assert.deepEqual(buildAlerts([], 3), []);
  });
});

describe("پیشنهادها", () => {
  test("همه به مقصد داخلی معتبر اشاره می‌کنند", () => {
    assert.ok(suggestions.length > 0);

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

  test("هیچ محصولی دو بار پیشنهاد نمی‌شود", () => {
    const productHrefs = suggestions
      .map((s) => s.href)
      .filter((href) => href.startsWith("/product/"));

    assert.equal(new Set(productHrefs).size, productHrefs.length);
  });

  test("اعدادی که خودمان تولید می‌کنیم فارسی‌اند", () => {
    // نام محصول ممکن است رقم لاتین داشته باشد («AirPods Pro 2») و درست هم
    // همین است؛ فقط اعدادی که ما به متن اضافه می‌کنیم باید فارسی باشند.
    for (const suggestion of suggestions) {
      let rest = suggestion.text;
      for (const product of products) rest = rest.replaceAll(product.title, "");

      assert.ok(
        !/[0-9]/.test(rest),
        `رقم لاتین تولیدشده در متن: «${suggestion.text}»`,
      );
    }
  });

  test("خروجی قطعی است", () => {
    assert.deepEqual(
      buildSuggestions(products, categories),
      buildSuggestions(products, categories),
    );
  });

  test("با لیست خالی نمی‌شکند", () => {
    assert.deepEqual(buildSuggestions([], categories), []);
  });
});

describe("سطح کاربر از فعالیت واقعی می‌آید", () => {
  test("کاربر بدون فعالیت، صفر امتیاز و پایین‌ترین سطح دارد", () => {
    const level = calculateLevel(0, 0);
    assert.equal(level.xp, 0);
    assert.equal(level.title, "تازه‌وارد");
    assert.equal(level.isMaxLevel, false);
  });

  test("امتیاز از تعداد علاقه‌مندی و پیگیری حساب می‌شود", () => {
    assert.equal(calculateLevel(2, 0).xp, 2 * XP_PER_FAVORITE);
    assert.equal(calculateLevel(0, 3).xp, 3 * XP_PER_TRACKED);
    assert.equal(
      calculateLevel(2, 3).xp,
      2 * XP_PER_FAVORITE + 3 * XP_PER_TRACKED,
    );
  });

  test("سطح با افزایش امتیاز بالا می‌رود و هرگز پایین نمی‌آید", () => {
    let previousXp = -1;
    let seenTitles: string[] = [];

    for (let n = 0; n <= 60; n++) {
      const level = calculateLevel(n, n);
      assert.ok(level.xp > previousXp, "امتیاز باید صعودی باشد");
      previousXp = level.xp;

      if (seenTitles.at(-1) !== level.title) seenTitles.push(level.title);
    }

    assert.ok(seenTitles.length > 1, "هیچ‌وقت سطح عوض نشد");
    assert.equal(new Set(seenTitles).size, seenTitles.length, "سطح تکرار شد");
  });

  test("در بالاترین سطح، هدف بعدی نمایش داده نمی‌شود", () => {
    const level = calculateLevel(100, 100);
    assert.equal(level.isMaxLevel, true);
    assert.equal(level.title, "تریدر حرفه‌ای");
  });

  test("nextLevelXp همیشه از xp فعلی بزرگ‌تر است مگر در سقف", () => {
    for (let n = 0; n <= 40; n++) {
      const level = calculateLevel(n, 0);
      if (!level.isMaxLevel) {
        assert.ok(
          level.nextLevelXp > level.xp,
          `n=${n}: هدف ${level.nextLevelXp} ≤ امتیاز ${level.xp}`,
        );
      }
    }
  });
});
