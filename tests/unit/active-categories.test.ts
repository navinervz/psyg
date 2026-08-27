import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { activeCategoryIds, products } from "@/lib/data";
import { categories } from "@/lib/reference";

/**
 * دسته‌های خالی نباید در رابط کاربری لینک بگیرند.
 *
 * این تست دو چیز جدا را می‌سنجد: خود تابع، و اینکه واقعاً به کامپوننت‌ها
 * وصل شده باشد. دومی مهم‌تر است — تابعی که درست کار می‌کند ولی جایی صدا
 * زده نمی‌شود، همان مشکل را حل‌نشده باقی می‌گذارد و کسی هم متوجه نمی‌شود.
 */

test("فقط دسته‌هایی برمی‌گردند که محصول دارند", () => {
  const active = activeCategoryIds();
  const withProducts = new Set(products.map((p) => p.category));

  for (const id of active) {
    assert.ok(withProducts.has(id), `${id} محصولی ندارد ولی فعال شمرده شد`);
  }

  for (const category of categories) {
    const has = withProducts.has(category.id as never);
    assert.equal(
      active.includes(category.id as never),
      has,
      `وضعیت ${category.id} با کاتالوگ نمی‌خواند`,
    );
  }
});

test("ترتیب همان ترتیب فهرست مرجع می‌ماند", () => {
  /*
    چیپ‌ها `slice(0, 5)` می‌شوند. اگر ترتیب به‌هم بریزد، هر بار پنج
    دسته‌ی متفاوتی روی صفحه‌ی اصلی می‌آید و کاربر فکر می‌کند سایت
    ناپایدار است.
  */
  const active = activeCategoryIds();
  const order = categories.map((c) => c.id).filter((id) => active.includes(id as never));
  assert.deepEqual(active, order);
});

test("صفحه‌ی اصلی و صفحه‌ی دسته واقعاً از آن استفاده می‌کنند", () => {
  const home = readFileSync("src/app/page.tsx", "utf8");
  assert.match(home, /activeCategoryIds\(\)/, "صفحه‌ی اصلی صدایش نمی‌زند");
  assert.match(home, /categoryIds=\{liveCategories\}/, "به هیرو پاس داده نشده");
  assert.match(home, /ids=\{liveCategories\}/, "به نوار موبایل پاس داده نشده");

  const cat = readFileSync("src/app/category/[id]/page.tsx", "utf8");
  assert.match(cat, /activeCategoryIds\(\)/, "صفحه‌ی دسته صدایش نمی‌زند");
  assert.match(cat, /live\.includes\(c\.id\)/, "فهرست دسته‌های دیگر فیلتر نشده");
});

test("مسیر دسته‌ها حذف نشده — فقط نمایش فیلتر شده", () => {
  /*
    اگر روزی کسی `generateStaticParams` را هم فیلتر کند، این تست قرمز
    می‌شود. حذف مسیر یعنی هر لینک بیرونی به آن دسته ۴۰۴ می‌گیرد، از جمله
    چیزی که گوگل قبلاً ایندکس کرده.
  */
  const cat = readFileSync("src/app/category/[id]/page.tsx", "utf8");
  assert.match(
    cat,
    /return categories\.map\(\(category\) => \(\{ id: category\.id \}\)\)/,
    "generateStaticParams نباید فیلتر شود",
  );
});
