import { readFileSync } from "node:fs";
import { join } from "node:path";

import productsJson from "@/data/products.json";
import articlesJson from "@/data/articles.json";

import type {
  Article,
  CategoryId,
  PriceAlert,
  Product,
  StoreId,
  Suggestion,
} from "@/lib/types";
import { priceDelta } from "@/lib/format";
import { categories } from "@/lib/reference";
import {
  buildAlerts,
  buildSuggestions,
  estimateReadMinutes,
} from "@/lib/derived";
import { applyOverrides, type AdminOverrides } from "@/lib/admin-store";

/**
 * کاتالوگ سنگین: محصولات، مقاله‌ها و هرچه از آن‌ها مشتق می‌شود.
 *
 * ⚠️ این فایل را از کامپوننت `"use client"` ایمپورت نکنید.
 * حدود ۹۷ کیلوبایت JSON اینجاست و چون `alerts` در سطح ماژول محاسبه
 * می‌شود، tree-shaking نمی‌تواند چیزی را حذف کند — یعنی کل کاتالوگ
 * وارد باندل مرورگر می‌شود.
 *
 * کامپوننت‌های کلاینتی باید از `@/lib/reference` بخوانند (داده‌ی سبک)
 * و داده‌ی سنگین را به‌صورت prop از کامپوننت سروری بگیرند.
 *
 * تست `routes.test.ts` این قاعده را به‌صورت خودکار بررسی می‌کند.
 */
const SEED_PRODUCTS = productsJson as unknown as Product[];

/* ──────────────────  کاتالوگ زنده  ────────────────── */

/**
 * محصولات از فایلی می‌آیند که ورک‌فلوی n8n می‌نویسد، نه از JSON داخل بیلد.
 *
 * چرا این شکلی و نه یک تابع async:
 * بیست‌ویک فایل از این ماژول می‌خوانند و همه‌شان API همگام انتظار دارند
 * (`products.length`، `products.map` و…). تبدیل همه به async یعنی دست
 * زدن به تمام صفحه‌ها و کامپوننت‌ها یکجا. به‌جایش منبع داده عوض شد و
 * شکل API دست‌نخورده ماند — هیچ فایل دیگری تغییر نکرد.
 *
 * خواندن همگام از فایل در مسیر درخواست معمولاً ایده‌ی بدی است، ولی اینجا
 * دو چیز آن را بی‌خطر می‌کند: حجم داده کوچک است (چند صد کیلوبایت) و
 * نتیجه یک دقیقه کش می‌شود. یعنی حداکثر یک خواندن در دقیقه به‌ازای هر
 * پروسه.
 *
 * اگر روزی حجم داده زیاد شد، همین‌جا باید به دیتابیس و API async تبدیل
 * شود — و آن موقع آن بازنویسی بیست‌ویک فایلی ارزشش را دارد.
 */
const CATALOG_TTL_MS = 60_000;

let cached: { at: number; value: Product[] } | null = null;

/**
 * از کجا آمد: کاتالوگ زنده، داده‌ی نمونه، یا هیچ.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این متغیر لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * یک کاربر روی `psygstore.shop/product/sony-wh-1000xm5` به ۴۰۴ خورد.
 * آن slug هیچ‌وقت در کاتالوگ زنده نبوده — یکی از محصولات *نمونه* است.
 *
 * یعنی سایت لحظه‌ای داده‌ی نمونه سرو کرده: ۵۱ محصول جعلی با قیمت جعلی،
 * تاریخچه‌ی جعلی و لینک خریدی که به جایی نمی‌رود. برای کاربر هیچ فرقی
 * با محصول واقعی نداشتند.
 *
 * دقیقاً همان الگویی که این پروژه بارها به آن خورده: کار می‌کرد، خطا
 * نمی‌داد، و چیز اشتباهی نشان می‌داد. حالا لااقل قابل دیدن است.
 */
export type CatalogSource = "live" | "seed" | "empty";

let lastSource: CatalogSource = "seed";

export function catalogSource(): CatalogSource {
  // مطمئن می‌شویم لااقل یک بار خوانده شده
  loadProducts();
  return lastSource;
}

/**
 * روی پروداکشن، داده‌ی نمونه ممنوع است.
 *
 * در توسعه و تست، نبود `/data/catalog.json` حالت طبیعی است و داده‌ی
 * نمونه همان چیزی است که کار را ممکن می‌کند. روی سرور اما نبودش یعنی
 * چیزی خراب شده — و صفحه‌ی خالی با پیام درست، از ۵۱ محصول جعلی بهتر
 * است.
 *
 * پرچم صریح است و نه `NODE_ENV`، چون تست‌های e2e هم با
 * `NODE_ENV=production` اجرا می‌شوند و آنجا داده‌ی نمونه لازم است.
 */
const REQUIRE_LIVE_CATALOG = process.env.PSYG_REQUIRE_CATALOG === "1";

function loadProducts(): Product[] {
  const now = Date.now();
  if (cached && now - cached.at < CATALOG_TTL_MS) return cached.value;

  let value: Product[] | null = null;

  try {
    const file = join(process.env.PSYG_DATA_DIR ?? "/data", "catalog.json");
    const parsed = JSON.parse(readFileSync(file, "utf8")) as {
      products?: Product[];
    };

    // کاتالوگ خالی یا خراب نباید سایت را خالی کند
    if (Array.isArray(parsed?.products) && parsed.products.length > 0) {
      value = parsed.products;
    }
  } catch {
    /*
      نبود فایل خطا نیست — حالت طبیعیِ قبل از اولین اجرای n8n و همچنین
      محیط توسعه و تست است.
    */
  }

  if (value) {
    lastSource = "live";
  } else if (REQUIRE_LIVE_CATALOG) {
    /*
      روی سرور، خالی بهتر از جعلی است.

      صفحه‌های محصول حالت «چیزی پیدا نشد» دارند و `/api/health` هم
      مشکل را گزارش می‌کند — یعنی کسی می‌فهمد. با داده‌ی نمونه هیچ‌کس
      نمی‌فهمید.
    */
    lastSource = "empty";
    value = [];
  } else {
    lastSource = "seed";
    value = SEED_PRODUCTS;
  }

  /*
    لایه‌ی ادمین روی کاتالوگ سوار می‌شود.

    عمداً در فایل جداست: ورک‌فلوی همگام‌سازی هر بار کل `catalog.json` را
    بازنویسی می‌کند، پس اگر حذف‌ها و افزوده‌های دستی آنجا بودند، اولین
    اجرای بعدی پاکشان می‌کرد.

    اگر خواندنش شکست بخورد، کاتالوگ خام برمی‌گردد — یعنی بدترین حالت این
    است که محصول پنهان‌شده دوباره پیدا شود، نه اینکه سایت خالی شود.
  */
  try {
    const file = join(process.env.PSYG_DATA_DIR ?? "/data", "admin.json");
    const overrides = JSON.parse(readFileSync(file, "utf8")) as AdminOverrides;
    value = applyOverrides(value, {
      hidden: Array.isArray(overrides?.hidden) ? overrides.hidden : [],
      manual: Array.isArray(overrides?.manual) ? overrides.manual : [],
      updatedAt: "",
    });
  } catch {
    // هنوز ادمین چیزی تغییر نداده — حالت طبیعی
  }

  cached = { at: now, value };
  return value;
}

/**
 * پراکسی تا `products` همان آرایه‌ی همیشگی به‌نظر برسد ولی مقدارش هر بار
 * از کاتالوگ زنده بیاید. تنها جایی از پروژه که چنین ترفندی به‌کار رفته و
 * عمداً در همین یک فایل محصور شده است.
 */
export const products = new Proxy([] as Product[], {
  get(_target, prop, receiver) {
    return Reflect.get(loadProducts(), prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(loadProducts(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(loadProducts());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(loadProducts(), prop);
  },
}) as Product[];

/**
 * زمان مطالعه در JSON ذخیره نمی‌شود — از روی خود متن حساب می‌شود تا
 * نتواند با محتوا ناهماهنگ شود.
 */
function loadArticles(): Article[] {
  const seed = articlesJson as unknown as Omit<Article, "readMinutes">[];
  let all = [...seed];

  /*
    مقاله‌های تولیدشده به مقاله‌های دستی اضافه می‌شوند، جایگزینشان نمی‌شوند.

    مقاله‌های دستی پایه‌ی مجله‌اند و اگر ورک‌فلوی محتوا خراب شود یا هرگز
    اجرا نشود، صفحه‌ی مجله نباید خالی شود.
  */
  try {
    const file = join(process.env.PSYG_DATA_DIR ?? "/data", "articles.json");
    const parsed = JSON.parse(readFileSync(file, "utf8")) as {
      articles?: Omit<Article, "readMinutes">[];
    };

    if (Array.isArray(parsed?.articles)) {
      const seedSlugs = new Set(seed.map((a) => a.slug));
      // مقاله‌ی دستی با همان slug همیشه برنده است
      all = [...seed, ...parsed.articles.filter((a) => !seedSlugs.has(a.slug))];
    }
  } catch {
    // هنوز محتوایی تولید نشده — حالت طبیعی
  }

  return all
    .map((article) => ({
      ...article,
      // زمان مطالعه از روی خود متن، تا نتواند با محتوا ناهماهنگ شود
      readMinutes: estimateReadMinutes(article.body),
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

let cachedArticles: { at: number; value: Article[] } | null = null;

/** همان الگوی `products` — پراکسی روی داده‌ی زنده با کش یک‌دقیقه‌ای */
export const articles = new Proxy([] as Article[], {
  get(_target, prop, receiver) {
    const now = Date.now();
    if (!cachedArticles || now - cachedArticles.at >= CATALOG_TTL_MS) {
      cachedArticles = { at: now, value: loadArticles() };
    }
    return Reflect.get(cachedArticles.value, prop, receiver);
  },
  has(_target, prop) {
    return Reflect.has(loadArticles(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(loadArticles());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(loadArticles(), prop);
  },
}) as Article[];

/**
 * هشدارها و پیشنهادها ذخیره نمی‌شوند — از روی همان `products` محاسبه
 * می‌شوند. پس درصدی که در سایدبار می‌بینی دقیقاً همان است که در صفحه‌ی
 * محصول می‌بینی، و امکان ناسازگاری وجود ندارد.
 */
/*
  این‌ها هم باید با کاتالوگ زنده به‌روز شوند، وگرنه هشدارهای سایدبار
  همیشه همان محصولات روز اول را نشان می‌دادند.
*/
export const alerts = new Proxy([] as PriceAlert[], {
  get: (_t, p, r) => Reflect.get(buildAlerts(loadProducts(), 3), p, r),
  ownKeys: () => Reflect.ownKeys(buildAlerts(loadProducts(), 3)),
  getOwnPropertyDescriptor: (_t, p) =>
    Reflect.getOwnPropertyDescriptor(buildAlerts(loadProducts(), 3), p),
}) as PriceAlert[];

export const suggestions = new Proxy([] as Suggestion[], {
  get: (_t, p, r) =>
    Reflect.get(buildSuggestions(loadProducts(), categories), p, r),
  ownKeys: () => Reflect.ownKeys(buildSuggestions(loadProducts(), categories)),
  getOwnPropertyDescriptor: (_t, p) =>
    Reflect.getOwnPropertyDescriptor(
      buildSuggestions(loadProducts(), categories),
      p,
    ),
}) as Suggestion[];

/* ────────────────────────────  سلکتورها  ──────────────────────────── */

export function getProduct(slugOrId: string): Product | undefined {
  return products.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

export function productsByCategory(id: CategoryId): Product[] {
  return products.filter((p) => p.category === id);
}

/**
 * دسته‌هایی که دست‌کم یک محصول دارند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * `categories` فهرست ثابتی است از هفت دسته‌ای که سایت *می‌تواند* داشته
 * باشد. ولی محتوای واقعی از ویجت‌های افیلیو می‌آید و همیشه هر هفت‌تا پر
 * نیستند: «ساعت هوشمند» صفر محصول داشت و «کنسول بازی» بعد از تفکیک
 * لوازم جانبی خالی شد.
 *
 * نتیجه‌اش چیپ‌ها و کارت‌هایی بود که کاربر را به صفحه‌ی خالی می‌بردند.
 * چیپی که به بن‌بست می‌رسد بدتر از نبودنش است: کاربر یک بار کلیک می‌کند
 * و بعد به بقیه‌ی چیپ‌ها هم اعتماد نمی‌کند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا مسیرها حذف نمی‌شوند
 * ─────────────────────────────────────────────────────────────────────
 * فقط *نمایش* فیلتر می‌شود، نه روتینگ. `/category/console` همچنان وجود
 * دارد و حالت خالی نشان می‌دهد — چون ممکن است گوگل قبلاً ایندکسش کرده
 * باشد یا کسی لینکش را داشته باشد. ۴۰۴ کردن یک صفحه‌ی موجود، لینک‌های
 * بیرونی را می‌شکند.
 *
 * و چون از خود کاتالوگ حساب می‌شود، وقتی ویجت آن دسته پر شد چیپ خودبه‌خود
 * برمی‌گردد. هیچ فهرست دستی‌ای نیست که کسی یادش برود به‌روزش کند.
 */
export function activeCategoryIds(): CategoryId[] {
  const seen = new Set(products.map((p) => p.category));
  return categories.map((c) => c.id as CategoryId).filter((id) => seen.has(id));
}

export function productsByStore(id: StoreId): Product[] {
  return products.filter((p) => p.store === id);
}

/** بیشترین کاهش قیمت اول */
export function topDeals(limit = 6): Product[] {
  return [...products]
    .sort(
      (a, b) =>
        priceDelta(a.previousPrice, a.currentPrice) -
        priceDelta(b.previousPrice, b.currentPrice),
    )
    .slice(0, limit);
}

/** محصولات مشابه: هم‌دسته، به‌جز خودش */
/**
 * تازه‌ترین محصولاتی که به سایت اضافه شده‌اند.
 *
 * تاریخ افزودن فیلد جداگانه‌ای ندارد و لازم هم نیست: اولین نقطه‌ی
 * تاریخچه‌ی قیمت دقیقاً همان روزی است که محصول برای اولین بار در
 * همگام‌سازی دیده شده. یعنی داده‌ای که می‌خواهیم از قبل هست.
 *
 * محصولاتی که در یک اجرا اضافه شده‌اند تاریخ یکسان دارند؛ ترتیب بینشان
 * همان ترتیب کاتالوگ می‌ماند که خودش از ترتیب دسته‌بندی‌های افیلیو
 * می‌آید — کافی است و ثبات دارد.
 */
export function newestProducts(limit = 3): Product[] {
  return [...products]
    .sort((a, b) => {
      const first = (p: Product) => p.history[0]?.t ?? "";
      return first(b).localeCompare(first(a));
    })
    .slice(0, limit);
}

export function relatedProducts(product: Product, limit = 6): Product[] {
  const sameCategory = products.filter(
    (p) => p.category === product.category && p.id !== product.id,
  );
  if (sameCategory.length >= limit) return sameCategory.slice(0, limit);

  const fill = products.filter(
    (p) => p.category !== product.category && p.id !== product.id,
  );
  return [...sameCategory, ...fill].slice(0, limit);
}

/** جستجوی ساده روی عنوان و برند */
export function searchProducts(query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const categoryMatch = categories.find(
    (c) => c.label.includes(q) || c.chipLabel.includes(q),
  );

  return products.filter((p) => {
    if (p.title.toLowerCase().includes(q)) return true;
    if (p.brand.toLowerCase().includes(q)) return true;
    if (categoryMatch && p.category === categoryMatch.id) return true;
    return false;
  });
}

/* داده‌ی مرجع سبک برای راحتی کامپوننت‌های سروری دوباره صادر می‌شود */
export {
  categories,
  stores,
  features,
  activeStores,
  getCategory,
  getStore,
} from "@/lib/reference";
