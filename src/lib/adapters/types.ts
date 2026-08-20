import type { Product, PricePoint, StoreId } from "@/lib/types";

/**
 * قرارداد واحد همه‌ی فروشگاه‌ها.
 *
 * فاز ۱: فقط MockAdapter پیاده‌سازی می‌شود.
 * فاز ۲: ورک‌فلوهای n8n دیتا را جمع می‌کنند و آداپتور واقعی
 *        همین اینترفیس را پیاده می‌کند — هیچ کامپوننتی تغییر نمی‌کند.
 *
 * توجه: برنامه‌ی همکاری در فروش دیجی‌کالا لینک‌محور است و فید عمومی
 * محصول ندارد؛ به همین دلیل تولید لینک افیلیت (toAffiliateUrl) از
 * دریافت دیتای قیمت (fetchProduct / fetchPriceHistory) جدا نگه داشته شده.
 */
export interface StoreAdapter {
  readonly id: StoreId;
  readonly displayName: string;
  readonly logo: string;

  fetchProduct(sku: string): Promise<Product | null>;
  fetchPriceHistory(sku: string, days: number): Promise<PricePoint[]>;
  fetchTopDeals(limit: number): Promise<Product[]>;

  /** URL محصول را به لینک ترک‌دار افیلیت تبدیل می‌کند */
  toAffiliateUrl(productUrl: string): string;
}
