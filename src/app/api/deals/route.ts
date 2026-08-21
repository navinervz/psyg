import { products } from "@/lib/data";
import { priceStanding } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/**
 * فهرست افت‌های قیمت — به‌صورت JSON.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این اندپوینت ساخته شد
 * ─────────────────────────────────────────────────────────────────────
 * ورک‌فلوی خبرنامه، افت‌ها را با یک رجکس از داخل `llms.txt` بیرون
 * می‌کشید:
 *
 *   /^- \[(.+?)\]\((https:\/\/[^)]+)\) — ([\d,]+) تومان، (\d+)٪ کمتر$/gm
 *
 * یعنی خبرنامه به **متنِ خواندنی برای انسان** وابسته بود. تغییر عبارت
 * «٪ کمتر» به «٪ زیر سقف ثبت‌شده» باعث شد رجکس هیچ چیزی پیدا نکند، و
 * چون نتیجه‌ی صفر با «افتی وجود نداشت» یکی است، خبرنامه بی‌صدا خالی
 * می‌ماند و در لاگ می‌نوشت `NO_PRICE_DROPS` — خطایی که شبیه مشکل داده
 * به نظر می‌رسد، نه ناسازگاری قالب.
 *
 * هیچ‌کس هم متوجه نمی‌شد، چون خبرنامه هفته‌ای یک بار اجرا می‌شود و
 * «ایمیلی نیامد» حالت عادی هفته‌های بدون تخفیف هم هست.
 *
 * قالب JSON این کلاس از خطا را می‌بندد: کلیدها بخشی از قرارداد
 * هستند، تست دارند، و اگر عوض شوند تست قرمز می‌شود — نه اینکه
 * مصرف‌کننده‌ای در جای دیگر بی‌صدا خالی برگردد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا عمومی است و توکن نمی‌خواهد
 * ─────────────────────────────────────────────────────────────────────
 * دقیقاً همان داده‌ای است که در `/deals` و `llms.txt` بدون احراز هویت
 * دیده می‌شود. گذاشتن توکن روی آن امنیتی اضافه نمی‌کرد، فقط یک راز
 * دیگر برای نگهداری می‌ساخت. سقف نرخ پیش‌فرض میدل‌ور رویش اعمال است.
 */

export const dynamic = "force-dynamic";

/** بیشتر از این، هم پاسخ سنگین می‌شود هم برای خبرنامه بی‌فایده است */
const MAX_DEALS = 40;

export function GET() {
  const deals = products
    .map((product) => ({
      product,
      standing: priceStanding(product.history, product.currentPrice),
    }))
    .filter((entry) => entry.standing.known)
    .sort((a, b) => b.standing.belowHigh - a.standing.belowHigh)
    .slice(0, MAX_DEALS)
    .map(({ product, standing }) => ({
      slug: product.slug,
      title: product.title,
      url: `${SITE_URL}/product/${product.slug}`,
      store: product.store,
      category: product.category,
      image: product.image,
      currentPrice: product.currentPrice,
      /** بالاترین قیمتی که خودمان ثبت کرده‌ایم — مبنای درصد */
      previousHigh: standing.high,
      /** درصد پایین‌تر از آن سقف، گرد‌شده */
      percentBelowHigh: Math.round(standing.belowHigh),
      /** چند روز پیش قیمت روی آن سقف بود */
      highDaysAgo: standing.daysAgo,
    }));

  return Response.json(
    {
      ok: true,
      generatedAt: new Date().toISOString(),
      totalProducts: products.length,
      count: deals.length,
      deals,
    },
    {
      headers: {
        // داده هر چند ساعت با سینک عوض می‌شود؛ کش کوتاه کافی است
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
