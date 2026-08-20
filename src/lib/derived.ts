import { analyzePrice } from "@/lib/analysis";
import { priceDelta, toFaDigits } from "@/lib/format";
import type {
  ArticleBlock,
  Category,
  PriceAlert,
  Product,
  Suggestion,
} from "@/lib/types";

/**
 * داده‌های مشتق‌شده.
 *
 * قبلاً هشدارها و پیشنهادها در JSON هاردکد بودند و درصدهایشان با داده‌ی
 * واقعی محصول نمی‌خواند — کاربر روی «۱۸٪ کمتر» کلیک می‌کرد و در صفحه‌ی
 * محصول عدد دیگری می‌دید. برای سایتی که کل ارزشش دقت قیمت است، این یعنی
 * بی‌اعتباری.
 *
 * حالا همه‌چیز از `products` محاسبه می‌شود، پس امکان drift صفر است.
 */

/** سرعت مطالعه‌ی متن فارسی — عدد محافظه‌کارانه‌ی رایج */
const WORDS_PER_MINUTE = 180;

/** استخراج متن خام از بلوک‌های مقاله */
export function articleText(blocks: ArticleBlock[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "p":
      case "h2":
      case "quote":
        parts.push(block.text);
        break;
      case "list":
        parts.push(...block.items);
        break;
      case "table":
        parts.push(...block.head, ...block.rows.flat());
        break;
    }
  }

  return parts.join(" ");
}

/**
 * زمان مطالعه از روی خود متن حساب می‌شود، نه از عددی که دستی نوشته شده.
 * قبلاً مقاله‌ی ۳۲۰ کلمه‌ای ادعای «۸ دقیقه مطالعه» داشت — همان نوع
 * عدد بی‌پشتوانه‌ای که اعتماد خواننده را می‌گیرد.
 */
export function estimateReadMinutes(blocks: ArticleBlock[]): number {
  const words = articleText(blocks).trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** آخرین تاریخی که در داده وجود دارد — مبنای زمان‌های نسبی */
function latestDataDate(products: Product[]): Date {
  const last = products[0]?.history.at(-1)?.t;
  return last ? new Date(`${last}T12:00:00.000Z`) : new Date();
}

/**
 * هشدارهای اخیر = محصولاتی که بیشترین افت هفتگی را داشته‌اند.
 * درصد هر هشدار دقیقاً همان چیزی است که در صفحه‌ی محصول دیده می‌شود.
 */
export function buildAlerts(products: Product[], limit = 3): PriceAlert[] {
  const reference = latestDataDate(products);

  return [...products]
    .filter((p) => p.currentPrice < p.previousPrice)
    .sort(
      (a, b) =>
        priceDelta(a.previousPrice, a.currentPrice) -
        priceDelta(b.previousPrice, b.currentPrice),
    )
    .slice(0, limit)
    .map((product, index) => {
      // هرچه افت بیشتر، هشدار تازه‌تر — فاصله‌ها ثابت‌اند تا SSG پایدار بماند
      const at = new Date(reference);
      at.setUTCHours(at.getUTCHours() - (index + 1) * 3);

      return {
        id: `alert-${product.id}`,
        productSlug: product.slug,
        productTitle: product.title,
        productImage: product.image,
        store: product.store,
        delta: priceDelta(product.previousPrice, product.currentPrice),
        at: at.toISOString(),
      };
    });
}

/**
 * پیشنهادهای صفحه‌ی اصلی.
 * هر جمله یک واقعیت قابل‌راستی‌آزمایی از داده است، نه متن تبلیغاتی.
 */
export function buildSuggestions(
  products: Product[],
  categories: Category[],
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // ۱. دسته‌ای که بیشترین تعداد محصول ارزان‌شده را دارد
  const byCategory = categories
    .map((category) => {
      const drops = products.filter(
        (p) => p.category === category.id && p.currentPrice < p.previousPrice,
      );
      const avgDelta =
        drops.length === 0
          ? 0
          : drops.reduce(
              (sum, p) => sum + priceDelta(p.previousPrice, p.currentPrice),
              0,
            ) / drops.length;

      return { category, count: drops.length, avgDelta };
    })
    .sort((a, b) => b.count - a.count);

  const top = byCategory[0];
  if (top && top.count > 0) {
    suggestions.push({
      id: "sug-category",
      text: `${toFaDigits(top.count)} مدل ${top.category.label} این هفته ارزان‌تر شدن`,
      delta: top.avgDelta,
      href: `/category/${top.category.id}`,
    });
  }

  // هر محصول فقط یک بار پیشنهاد شود
  const used = new Set<string>();

  // ۲. محصولی که به کف بازه‌ی ۳۰ روزه‌اش نزدیک‌ترین است
  const nearLow = [...products]
    .map((product) => ({ product, verdict: analyzePrice(product) }))
    .sort((a, b) => a.verdict.position - b.verdict.position)[0];

  if (nearLow) {
    used.add(nearLow.product.id);
    suggestions.push({
      id: "sug-lowest",
      text: `${nearLow.product.title} نزدیک کف قیمت ۳۰ روزه‌شه`,
      delta: priceDelta(nearLow.verdict.highest, nearLow.product.currentPrice),
      href: `/product/${nearLow.product.slug}`,
    });
  }

  // ۳. بزرگ‌ترین افت هفتگی، به‌جز محصولی که بالاتر معرفی شد
  const biggestDrop = [...products]
    .filter((p) => !used.has(p.id) && p.currentPrice < p.previousPrice)
    .sort(
      (a, b) =>
        priceDelta(a.previousPrice, a.currentPrice) -
        priceDelta(b.previousPrice, b.currentPrice),
    )[0];

  if (biggestDrop) {
    suggestions.push({
      id: "sug-drop",
      text: `بیشترین افت این هفته: ${biggestDrop.title}`,
      delta: priceDelta(biggestDrop.previousPrice, biggestDrop.currentPrice),
      href: `/product/${biggestDrop.slug}`,
    });
  }

  return suggestions;
}
