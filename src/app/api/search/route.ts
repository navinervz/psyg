import { NextResponse } from "next/server";
import { searchProducts } from "@/lib/data";
import { priceDelta } from "@/lib/format";

/**
 * پیشنهاد لحظه‌ای برای سرچ‌بار.
 *
 * چرا اندپوینت سرور و نه فیلتر در مرورگر:
 * جستجو روی کاتالوگ کار می‌کند و کاتالوگ در `@/lib/data` حدود ۹۷ کیلوبایت
 * JSON است. اگر سرچ‌بار — که یک کامپوننت `"use client"` است — مستقیم از
 * آن می‌خواند، کل کاتالوگ روی **هر صفحه** وارد باندل مرورگر می‌شد. همان
 * اشتباهی که قبلاً برای `HeaderActions` افتاده بود.
 *
 * پس فیلتر روی سرور انجام می‌شود و فقط چند نتیجه‌ی سبک برمی‌گردد.
 */

export const dynamic = "force-dynamic";

/** بیشتر از این تعداد در دراپ‌داون جا نمی‌شود و کمکی هم نمی‌کند */
const MAX_RESULTS = 6;

/** جلوگیری از کوئری‌های بی‌معنای طولانی */
const MAX_QUERY_LENGTH = 80;

export async function GET(request: Request) {
  const query = (new URL(request.url).searchParams.get("q") ?? "")
    .trim()
    .slice(0, MAX_QUERY_LENGTH);

  // کمتر از دو کاراکتر نتیجه‌ی معناداری نمی‌دهد
  if (query.length < 2) {
    return NextResponse.json(
      { query, results: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const results = searchProducts(query)
    .slice(0, MAX_RESULTS)
    .map((product) => ({
      slug: product.slug,
      title: product.title,
      store: product.store,
      category: product.category,
      /*
        تصویر هم می‌آید.

        نتیجه‌های فقط‌متنی خواندن را کند می‌کنند: کاربر باید عنوان بلند
        فارسی را بخواند تا بفهمد کدام است. تصویر همان کار را در یک نگاه
        می‌کند.

        `category` از قبل بود و حالا کارِ دومی هم می‌کند — اگر تصویر
        بارگذاری نشد، آیکون دسته جایش می‌نشیند. همان الگویی که در کارت
        گفتگو هم لازم شد.
      */
      image: product.image,
      currentPrice: product.currentPrice,
      delta: Math.round(priceDelta(product.previousPrice, product.currentPrice)),
    }));

  return NextResponse.json(
    { query, results },
    {
      headers: {
        // نتیجه به داده‌ی لحظه‌ای قیمت وابسته است، پس کش نمی‌شود
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
