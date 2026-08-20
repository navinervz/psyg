import test, { describe } from "node:test";
import assert from "node:assert/strict";

import { articles } from "@/lib/data";
import type { ArticleBlock } from "@/lib/types";

/**
 * مجله مهم‌ترین بخش برای تایید رسانه در برنامه‌های همکاری در فروش است.
 * رسانه‌ای که مقاله‌هایش عنوان بدون متن دارند رد می‌شود، پس این تست‌ها
 * جلوی برگشتن به آن حالت را می‌گیرند.
 */

function wordCount(blocks: ArticleBlock[]): number {
  let text = "";

  for (const block of blocks) {
    if (block.type === "p" || block.type === "h2" || block.type === "quote") {
      text += " " + block.text;
    } else if (block.type === "list") {
      text += " " + block.items.join(" ");
    } else if (block.type === "table") {
      text += " " + block.head.join(" ") + " " + block.rows.flat().join(" ");
    }
  }

  return text.trim().split(/\s+/).filter(Boolean).length;
}

describe("ساختار مقاله‌ها", () => {
  test("حداقل چهار مقاله وجود دارد", () => {
    assert.ok(
      articles.length >= 4,
      "برای تایید رسانه حداقل چند مطلب واقعی لازم است",
    );
  });

  test("همه‌ی فیلدهای لازم پر شده‌اند", () => {
    for (const article of articles) {
      assert.ok(article.slug.length > 0, "slug خالی");
      assert.ok(article.title.length > 10, `عنوان خیلی کوتاه: ${article.slug}`);
      assert.ok(
        article.excerpt.length > 40,
        `خلاصه خیلی کوتاه: ${article.slug}`,
      );
      assert.ok(article.tag.length > 0, `تگ خالی: ${article.slug}`);
      assert.ok(article.readMinutes > 0, `زمان مطالعه نامعتبر: ${article.slug}`);
      assert.ok(!Number.isNaN(Date.parse(article.date)), article.date);
    }
  });

  test("slugها یکتا و برای URL امن‌اند", () => {
    const slugs = articles.map((a) => a.slug);
    assert.equal(new Set(slugs).size, slugs.length, "slug تکراری");

    for (const slug of slugs) {
      assert.match(slug, /^[a-z0-9-]+$/, `slug نامناسب برای URL: ${slug}`);
    }
  });
});

describe("محتوای مقاله‌ها واقعی است", () => {
  test("هیچ مقاله‌ای بدنه‌ی خالی ندارد", () => {
    for (const article of articles) {
      assert.ok(
        Array.isArray(article.body) && article.body.length > 0,
        `مقاله بدون متن: ${article.slug}`,
      );
    }
  });

  test("هر مقاله حداقل ۳۰۰ کلمه دارد", () => {
    for (const article of articles) {
      const words = wordCount(article.body);
      assert.ok(
        words >= 300,
        `${article.slug} فقط ${words} کلمه دارد — برای تایید رسانه کافی نیست`,
      );
    }
  });

  test("هر مقاله ساختار دارد، نه یک تکه متن", () => {
    for (const article of articles) {
      const headings = article.body.filter((b) => b.type === "h2");
      assert.ok(
        headings.length >= 2,
        `${article.slug} تیتر میانی ندارد`,
      );

      const paragraphs = article.body.filter((b) => b.type === "p");
      assert.ok(paragraphs.length >= 3, `${article.slug} پاراگراف کم دارد`);
    }
  });

  test("هیچ متن جای‌نگهدار یا ناتمامی باقی نمانده", () => {
    const forbidden = [
      "lorem",
      "ipsum",
      "TODO",
      "هنوز نوشته نشده",
      "به‌زودی",
      "قرار است نوشته",
    ];

    for (const article of articles) {
      const all = JSON.stringify(article).toLowerCase();
      for (const phrase of forbidden) {
        assert.ok(
          !all.includes(phrase.toLowerCase()),
          `${article.slug} حاوی متن جای‌نگهدار است: «${phrase}»`,
        );
      }
    }
  });

  test("بلوک‌ها معتبر و ناخالی‌اند", () => {
    for (const article of articles) {
      for (const block of article.body) {
        switch (block.type) {
          case "p":
          case "h2":
          case "quote":
            assert.ok(block.text.trim().length > 0, `${article.slug} بلوک خالی`);
            break;
          case "list":
            assert.ok(block.items.length > 1, `${article.slug} لیست تک‌آیتمی`);
            for (const item of block.items) {
              assert.ok(item.trim().length > 0);
            }
            break;
          case "table":
            assert.ok(block.head.length > 0, `${article.slug} جدول بدون سرستون`);
            assert.ok(block.rows.length > 0, `${article.slug} جدول بدون ردیف`);
            for (const row of block.rows) {
              assert.equal(
                row.length,
                block.head.length,
                `${article.slug}: تعداد ستون ردیف با سرستون نمی‌خواند`,
              );
            }
            break;
        }
      }
    }
  });

  test("زمان مطالعه از خود متن حساب شده، نه دستی", () => {
    for (const article of articles) {
      const words = wordCount(article.body);
      const expected = Math.max(1, Math.round(words / 180));

      assert.equal(
        article.readMinutes,
        expected,
        `${article.slug}: ${words} کلمه باید ${expected} دقیقه باشد`,
      );
    }
  });

  test("readMinutes در JSON ذخیره نشده تا نتواند دروغ شود", async () => {
    const raw = await import("@/data/articles.json");
    const items = (raw.default ?? raw) as Record<string, unknown>[];

    for (const item of items) {
      assert.ok(
        !("readMinutes" in item),
        `${item.slug}: readMinutes باید محاسبه شود نه ذخیره`,
      );
    }
  });
});
