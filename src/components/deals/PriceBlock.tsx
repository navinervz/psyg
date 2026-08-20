"use client";

import { useCountUp } from "@/animations/useCountUp";
import { formatPrice, type PriceTrend } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * قیمت قبلی (خط‌خورده) + قیمت فعلی که از قیمت قبلی به فعلی می‌شمارد.
 */
export function PriceBlock({
  previousPrice,
  currentPrice,
  trend,
}: {
  previousPrice: number;
  currentPrice: number;
  /*
    سه‌حالته. قبلاً `isDrop: boolean` بود و هر چیزی که افت نکرده بود
    قرمز می‌شد — از جمله محصولات تازه‌ای که اصلاً تاریخچه‌ای ندارند.
  */
  trend: PriceTrend;
}) {
  const counterRef = useCountUp<HTMLSpanElement>({
    from: previousPrice,
    to: currentPrice,
    duration: 1.5,
  });

  /*
    قیمت خط‌خورده فقط وقتی معنا دارد که واقعاً از قیمت فعلی بیشتر باشد.

    قبلاً همیشه نمایش داده می‌شد، و چون محصول تازه‌وارد `previousPrice`
    برابر `currentPrice` دارد، بالای هر قیمت همان عدد خط‌خورده می‌نشست.
    یعنی سایت وانمود می‌کرد تخفیفی هست که وجود نداشت — دقیقاً همان کاری
    که فروشگاه‌های بی‌اعتبار می‌کنند.
  */
  const showPrevious = previousPrice > currentPrice;

  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      {showPrevious && (
        <span className="deal-card__price-prev text-xs text-low line-through nums-fa">
          {formatPrice(previousPrice)}
        </span>
      )}
      <span
        className={cn(
          "deal-card__price-now text-lg font-extrabold whitespace-nowrap nums-fa",
          trend === "drop" && "text-accent",
          trend === "rise" && "text-danger",
          // وقتی نمی‌دانیم قیمت بالا رفته یا پایین، رنگ ادعایی نمی‌کند
          trend === "unknown" && "text-hi",
        )}
      >
        <span ref={counterRef}>{formatPrice(currentPrice)}</span>
      </span>
    </div>
  );
}
