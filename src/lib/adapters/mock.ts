import type { StoreAdapter } from "@/lib/adapters/types";
import type { PricePoint } from "@/lib/types";
import { products } from "@/lib/data";

/**
 * آداپتور فاز ۱.
 * همان شکل داده‌ی نهایی را از JSON محلی می‌خواند تا وقتی
 * آداپتور واقعی جایگزین شد، UI دست‌نخورده بماند.
 */
export const mockAdapter: StoreAdapter = {
  id: "digikala",
  displayName: "دیجی‌کالا",
  logo: "/stores/digikala.svg",

  async fetchProduct(sku) {
    return products.find((p) => p.id === sku || p.slug === sku) ?? null;
  },

  async fetchPriceHistory(sku, days) {
    const product = await this.fetchProduct(sku);
    if (!product) return [];
    return product.history.slice(-days) as PricePoint[];
  },

  async fetchTopDeals(limit) {
    const all = [...products];
    // بیشترین کاهش قیمت اول
    all.sort((a, b) => {
      const da = (a.currentPrice - a.previousPrice) / a.previousPrice;
      const db = (b.currentPrice - b.previousPrice) / b.previousPrice;
      return da - db;
    });
    return all.slice(0, limit);
  },

  /**
   * ⚠️ این فقط فالبک است، نه راه اصلی.
   *
   * بعد از ثبت رسانه در افیلیو معلوم شد لینک افیلیت قابل ساختن نیست:
   * دو لینک واقعی را مقایسه کردیم و `utm_source=51100`،
   * `utm_medium=Affilio` و `utm_id=113363` در هر دو یکسان بودند، ولی
   * `affid` برای هر لینک یک UUID متفاوت بود که سیستم افیلیو تولید
   * می‌کند. یعنی هیچ فرمولی وجود ندارد.
   *
   * راه درست: لینک را در پنل بساز و در `affiliateUrl` محصول بگذار.
   * مسیر `/go/[id]` اول سراغ همان می‌رود و فقط اگر نبود اینجا می‌آید.
   */
  toAffiliateUrl(productUrl) {
    return productUrl;
  },
};
