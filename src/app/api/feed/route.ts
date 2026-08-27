import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { priceStanding } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/**
 * فید عمومی کاتالوگ — برای مصرف‌کننده‌های بیرونی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این اندپوینت لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * ربات تلگرام باید بتواند دربارهٔ محصولات پست بسازد: عکس، عنوان، قیمت و
 * لینک. هیچ‌کدام از اندپوینت‌های موجود این را نمی‌دادند.
 *
 *   `/api/deals`   فقط محصولاتی که افت قیمت ثبت‌شده دارند
 *   `/llms.txt`    متن خواندنی، بدون عکس
 *   `/api/mcp`     توکن می‌خواهد و شکلش برای ابزار مدل است
 *
 * وسوسه این بود که `/api/deals` را گسترش دهیم. ولی آن اندپوینت یک
 * قرارداد دارد که خبرنامه به آن تکیه می‌کند و تست هم دارد — عوض کردنش
 * یعنی یک مصرف‌کننده را برای راحتی مصرف‌کننده‌ی دیگری به خطر انداختن.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا بدون توکن
 * ─────────────────────────────────────────────────────────────────────
 * همه‌ی این داده‌ها از قبل روی صفحه‌های عمومی سایت هست. توکن گذاشتن
 * رویشان امنیتی اضافه نمی‌کرد، فقط یک راز دیگر برای نگه‌داری می‌ساخت.
 *
 * فقط `GET` — از اینجا نمی‌شود چیزی نوشت.
 */

export const dynamic = "force-dynamic";

/** بیشتر از این، پاسخ بی‌دلیل سنگین می‌شود */
const MAX_ITEMS = 200;

export async function GET() {
  const items = products.slice(0, MAX_ITEMS).map((product) => {
    const standing = priceStanding(product.history, product.currentPrice);

    return {
      slug: product.slug,
      title: product.title,
      /* آدرس کامل، چون مصرف‌کننده بیرون از سایت است */
      url: `${SITE_URL}/product/${product.slug}`,
      image: product.image,
      store: product.store,
      category: product.category,
      brand: product.brand,
      currentPrice: product.currentPrice,

      /*
        همان معیاری که خود سایت نشان می‌دهد، نه یک محاسبه‌ی موازی.

        اگر ربات درصد را خودش حساب می‌کرد، دیر یا زود عددی در تلگرام
        می‌رفت که با صفحه‌ی محصول نمی‌خواند — و کاربری که کلیک کند
        همان لحظه می‌فهمد.
      */
      hasDrop: standing.known,
      previousHigh: standing.known ? standing.high : null,
      percentBelowHigh: standing.known ? Math.round(standing.belowHigh) : 0,
      highDaysAgo: standing.daysAgo,

      /* چند نقطه تاریخچه دارد — ربات با این می‌فهمد ادعای روند مجاز است یا نه */
      historyPoints: product.history.length,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      count: items.length,
      updatedAt: new Date().toISOString(),
      items,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
