import { cn } from "@/lib/cn";
import {
  formatPercent,
  formatPrice,
  priceTrend,
  type PriceStanding,
} from "@/lib/format";
import { ArrowDown, ArrowUp, Clock } from "lucide-react";

/*
  آستانه و منطق سه‌حالته حالا در `@/lib/format` است.

  قبلاً همین‌جا تعریف شده بود و بقیه‌ی کامپوننت‌ها منطق دوحالتی خودشان
  را داشتند — برای همین بج «تازه» نشان می‌داد ولی قیمت کنارش قرمز بود.
*/

/**
 * بج تغییر قیمت — سبز برای کاهش، قرمز برای افزایش، خنثی وقتی هنوز
 * داده‌ای نداریم.
 *
 * حالت سوم عمدی و مهم است. محصولی که تازه وارد کاتالوگ شده فقط یک نقطه‌ی
 * قیمت دارد، پس تغییرش صفر است. قبلاً همین حالت با فلش قرمزِ رو به بالا
 * نشان داده می‌شد — یعنی سایت ادعا می‌کرد قیمت گران شده، در حالی که
 * واقعیت این بود که هنوز نمی‌دانیم.
 *
 * برای سایتی که کل ارزشش دقت قیمت است، ادعای بی‌پشتوانه بدترین چیز است.
 */
export function ChangeBadge({
  delta,
  className,
  showLabel = false,
}: {
  delta: number;
  className?: string;
  showLabel?: boolean;
}) {
  const trend = priceTrend(delta);

  if (trend === "unknown") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-elevated px-2 py-1 text-xs font-medium text-low",
          className,
        )}
        title="رصد قیمت این محصول تازه شروع شده؛ برای مقایسه هنوز داده‌ی کافی نداریم"
      >
        <Clock className="size-3" strokeWidth={2.2} />
        {showLabel ? "در حال رصد" : "تازه"}
      </span>
    );
  }

  const isDrop = trend === "drop";
  const Icon = isDrop ? ArrowDown : ArrowUp;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold nums-fa",
        isDrop
          ? "bg-accent/12 text-accent shadow-[0_0_16px_rgba(163,230,53,0.22)]"
          : "bg-danger/12 text-danger shadow-[0_0_16px_rgba(255,77,77,0.2)]",
        className,
      )}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {formatPercent(delta)}
      {showLabel && <span className="font-medium">{isDrop ? "کمتر" : "بیشتر"}</span>}
    </span>
  );
}

/**
 * بج «چقدر زیر سقف اخیر» — معیار اصلی کارت‌ها.
 *
 * `ChangeBadge` تغییر نسبت به دیروز را نشان می‌دهد که تقریباً همیشه
 * صفر است. این یکی فاصله‌ی قیمت امروز تا بالاترین قیمتی است که خودمان
 * ثبت کرده‌ایم — عددی که کاربر واقعاً دنبالش است.
 *
 * حالت «نمی‌دانیم» اینجا هم عمدی و مهم است: محصولی که فقط یک نقطه‌ی
 * قیمت دارد هیچ ادعایی نمی‌گیرد. منطقش در `priceStanding` است تا
 * دوباره هر کامپوننت نسخه‌ی خودش را نسازد.
 */
export function StandingBadge({
  standing,
  className,
  showLabel = false,
}: {
  standing: PriceStanding;
  className?: string;
  showLabel?: boolean;
}) {
  if (!standing.known) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-lg bg-elevated px-2 py-1 text-xs font-medium text-low",
          className,
        )}
        title="رصد قیمت این محصول تازه شروع شده؛ برای مقایسه هنوز داده‌ی کافی نداریم"
      >
        <Clock className="size-3" strokeWidth={2.2} />
        {showLabel ? "در حال رصد" : "تازه"}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg bg-accent/12 px-2 py-1 text-xs font-bold text-accent shadow-[0_0_16px_rgba(163,230,53,0.22)] nums-fa",
        className,
      )}
      title={`بالاترین قیمتی که ثبت کرده‌ایم ${formatPrice(standing.high)} تومان بود`}
    >
      <ArrowDown className="size-3" strokeWidth={2.5} />
      {formatPercent(standing.belowHigh)}
      {showLabel && (
        <span className="font-medium">زیر سقف اخیر</span>
      )}
    </span>
  );
}

/** بج رنک کارت‌های فرصت — ۰۱ تا ۰۶ */
export function RankBadge({
  rank,
  className,
}: {
  rank: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-sm font-extrabold tracking-wider text-low nums-fa",
        className,
      )}
    >
      {rank}
    </span>
  );
}
