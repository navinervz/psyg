import test, { describe } from "node:test";
import assert from "node:assert/strict";

import { analyzePrice } from "@/lib/analysis";
import { products } from "@/lib/data";
import type { Product } from "@/lib/types";

function makeProduct(prices: number[]): Product {
  return {
    id: "test",
    slug: "test",
    title: "تست",
    image: "/x.png",
    store: "digikala",
    category: "laptop",
    brand: "test",
    sourceUrl: "https://www.digikala.com/product/dkp-1/",
    currentPrice: prices[prices.length - 1],
    previousPrice: prices[0],
    history: prices.map((price, i) => ({
      t: `2026-07-${String(i + 1).padStart(2, "0")}`,
      price,
    })),
  };
}

describe("analyzePrice", () => {
  test("قیمت روی کف بازه → توصیه به خرید", () => {
    const verdict = analyzePrice(makeProduct([100, 90, 80, 70, 50]));
    assert.equal(verdict.tone, "good");
    assert.equal(verdict.position, 0);
    assert.equal(verdict.lowest, 50);
    assert.equal(verdict.highest, 100);
  });

  test("قیمت روی سقف بازه → توصیه به صبر", () => {
    const verdict = analyzePrice(makeProduct([50, 60, 70, 90, 100]));
    assert.equal(verdict.tone, "bad");
    assert.equal(verdict.position, 100);
  });

  test("قیمت وسط بازه → خنثی", () => {
    const verdict = analyzePrice(makeProduct([100, 20, 60]));
    assert.equal(verdict.tone, "neutral");
    assert.equal(verdict.position, 50);
  });

  test("قیمت ثابت باعث تقسیم بر صفر نمی‌شود", () => {
    const verdict = analyzePrice(makeProduct([100, 100, 100]));
    assert.ok(Number.isFinite(verdict.position));
    assert.equal(verdict.average, 100);
  });

  test("position همیشه بین ۰ و ۱۰۰ است", () => {
    for (const product of products) {
      const verdict = analyzePrice(product);
      assert.ok(
        verdict.position >= 0 && verdict.position <= 100,
        `${product.slug}: ${verdict.position}`,
      );
      assert.ok(verdict.lowest <= verdict.average);
      assert.ok(verdict.average <= verdict.highest);
      assert.ok(verdict.headline.length > 0);
      assert.ok(verdict.detail.length > 0);
    }
  });
});
