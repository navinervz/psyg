const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** تبدیل ارقام لاتین به فارسی */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/** ۹۱۹۰۰۰۰ → «۹,۱۹۰,۰۰۰» */
export function formatPrice(value: number): string {
  return toFaDigits(value.toLocaleString("en-US"));
}

/** درصد با علامت فارسی: ۲۶ → «۲۶٪» */
export function formatPercent(value: number): string {
  return `${toFaDigits(Math.abs(Math.round(value)))}٪`;
}

/** درصد تغییر بین دو قیمت (منفی = ارزان‌تر شده) */
export function priceDelta(previous: number, current: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

/** «۰۱» … «۰۶» برای رنک کارت‌ها */
export function formatRank(index: number): string {
  return toFaDigits(String(index + 1).padStart(2, "0"));
}

/**
 * روند قیمت — سه حالته، نه دوحالته.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا سه حالت لازم است
 * ─────────────────────────────────────────────────────────────────────
 * محصولی که تازه وارد کاتالوگ شده فقط یک نقطه‌ی قیمت دارد، پس تغییرش
 * دقیقاً صفر است. با منطق دوحالتی (`delta < 0`) این محصول در دسته‌ی
 * «افزایش قیمت» می‌افتاد و قرمز رنگ می‌شد.
 *
 * نتیجه‌اش در صفحه‌ی فرصت‌ها دیده می‌شد: پنج کارت از شش تا قیمت قرمز و
 * حاشیه‌ی قرمز داشتند، در حالی که قیمت هیچ‌کدام بالا نرفته بود. هم غلط
 * بود هم چشم را می‌ترساند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا اینجا و نه در هر کامپوننت
 * ─────────────────────────────────────────────────────────────────────
 * این منطق قبلاً فقط در `ChangeBadge` درست شده بود و بقیه‌ی جاها —
 * رنگ قیمت، حاشیه‌ی کارت، نمودار — همچنان دوحالتی مانده بودند. یعنی
 * بج می‌گفت «تازه» ولی قیمت کنارش قرمز بود.
 *
 * با یک تابع مشترک، دیگر نمی‌شود یکی را درست کرد و بقیه را جا انداخت.
 */
export type PriceTrend = "drop" | "rise" | "unknown";

/**
 * کمتر از این درصد، «تغییر» حساب نمی‌شود.
 *
 * گرد کردن باعث می‌شد تغییر ۰.۴ درصدی «۰٪» نمایش داده شود ولی رنگ و
 * فلشِ افزایش بگیرد — عددی که می‌گفت تغییری نکرده، کنار رنگی که
 * می‌گفت گران شده.
 */
export const MIN_MEANINGFUL_DELTA = 0.5;

export function priceTrend(delta: number): PriceTrend {
  if (Math.abs(delta) < MIN_MEANINGFUL_DELTA) return "unknown";
  return delta < 0 ? "drop" : "rise";
}

/** زمان نسبی فارسی از یک ISO string */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "همین الان";
  if (minutes < 60) return `${toFaDigits(minutes)} دقیقه پیش`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${toFaDigits(hours)} ساعت پیش`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${toFaDigits(days)} روز پیش`;

  return `${toFaDigits(Math.floor(days / 30))} ماه پیش`;
}
