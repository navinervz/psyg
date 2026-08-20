import type { PricePoint, Product } from "@/lib/types";

export type BuyVerdict = {
  /** خلاصه‌ی یک‌خطی برای نمایش */
  headline: string;
  detail: string;
  tone: "good" | "neutral" | "bad";
  lowest: number;
  highest: number;
  average: number;
  /** موقعیت قیمت فعلی در بازه‌ی تاریخی: ۰ = کف، ۱۰۰ = سقف */
  position: number;
};

/**
 * تحلیل «الان بخرم یا صبر کنم؟».
 *
 * منطق عمداً ساده و قابل توضیح است — هیچ ادعای پیش‌بینی آینده نمی‌کند،
 * فقط قیمت فعلی را نسبت به تاریخچه‌ی خودش موقعیت‌یابی می‌کند.
 * در فاز ۲ می‌توان خروجی مدل n8n را جایگزین این تابع کرد.
 */
export function analyzePrice(product: Product): BuyVerdict {
  const prices = product.history.map((p: PricePoint) => p.price);
  const lowest = Math.min(...prices);
  const highest = Math.max(...prices);
  const average = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const range = highest - lowest || 1;
  const position = Math.round(((product.currentPrice - lowest) / range) * 100);

  if (position <= 15) {
    return {
      headline: "الان وقت خوبیه",
      detail:
        "قیمت فعلی نزدیک کف بازه‌ی اخیره. اگر لازمش داری، بیشتر از این احتمالاً پایین‌تر نمیاد.",
      tone: "good",
      lowest,
      highest,
      average,
      position,
    };
  }

  if (position >= 75) {
    return {
      headline: "بهتره صبر کنی",
      detail:
        "قیمت نزدیک سقف بازه‌ی اخیره. اگر عجله نداری، هشدار قیمت بذار تا افت بعدی رو بهت خبر بدیم.",
      tone: "bad",
      lowest,
      highest,
      average,
      position,
    };
  }

  return {
    headline: "قیمت متوسطه",
    detail:
      "نه کف بازه‌ست نه سقفش. اگر عجله داری بخر، وگرنه هشدار قیمت بذار.",
    tone: "neutral",
    lowest,
    highest,
    average,
    position,
  };
}
