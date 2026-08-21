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

/**
 * جایگاه قیمت امروز نسبت به سقف بازه‌ی ثبت‌شده.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این معیار، و نه تغییر روزانه
 * ─────────────────────────────────────────────────────────────────────
 * تا امروز عددِ روی کارت‌ها `priceDelta(previousPrice, currentPrice)`
 * بود، یعنی «چقدر نسبت به آخرین باری که دیدیم فرق کرده». قیمت‌ها
 * روزبه‌روز تقریباً ثابت‌اند، پس آن عدد تقریباً همیشه صفر می‌شد.
 *
 * نتیجه‌اش روی سایت زنده دیده شد: هر ۸۰ محصول برچسب «تازه» داشتند،
 * صفحه‌ی «بهترین فرصت‌ها» هیچ فرصتی نشان نمی‌داد، مرتب‌سازی «بیشترین
 * کاهش» روی ستونی کار می‌کرد که برای همه صفر بود، و `llms.txt` به
 * مدل‌های هوش مصنوعی می‌گفت «هیچ محصولی افت قیمت ثبت‌شده ندارد».
 *
 * و همان لحظه صفحه‌ی همان محصول می‌گفت «الان وقت خوبیه، نزدیک کف
 * بازه‌ای» — چون تحلیل صفحه‌ی محصول کل تاریخچه را می‌دید. یعنی عدد
 * درست محاسبه می‌شد ولی هیچ‌جا که به چشم بیاید نمایش داده نمی‌شد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا سقفِ خودمان، نه «قیمت قبل از تخفیفِ» فروشگاه
 * ─────────────────────────────────────────────────────────────────────
 * فروشگاه عددی به‌عنوان قیمت مصرف‌کننده اعلام می‌کند که گاهی ساختگی
 * است — در داده‌ی واقعی افیلیو تخفیف‌های ۹۴٪ و ۹۷٪ دیده شد. تکیه بر
 * آن یعنی بازنشر ادعای فروشنده.
 *
 * سقفی که اینجا استفاده می‌شود قیمتی است که **خودمان** ثبت کرده‌ایم؛
 * پس هر درصدی که نشان می‌دهیم پشتوانه‌ی اندازه‌گیری دارد.
 */
export type PriceStanding = {
  /** آیا داده‌ی کافی برای هر ادعایی داریم */
  known: boolean;
  /** درصد پایین‌تر از سقف — همیشه صفر یا مثبت */
  belowHigh: number;
  /** بالاترین قیمت ثبت‌شده */
  high: number;
  /** تاریخ ISO آخرین باری که قیمت روی آن سقف بود */
  highAt: string | null;
  /** چند روز از آن روز گذشته */
  daysAgo: number | null;
};

export function priceStanding(
  history: { t: string; price: number }[],
  currentPrice: number,
  now: Date = new Date(),
): PriceStanding {
  const unknown: PriceStanding = {
    known: false,
    belowHigh: 0,
    high: currentPrice,
    highAt: null,
    daysAgo: null,
  };

  // یک نقطه یعنی فقط می‌دانیم قیمت امروز چند است. مقایسه‌ای در کار
  // نیست و هر عددی که بسازیم از هوا آمده.
  if (!Array.isArray(history) || history.length < 2) return unknown;

  let high = -Infinity;
  let highAt: string | null = null;

  for (const point of history) {
    if (!point || typeof point.price !== "number" || point.price <= 0) continue;
    /*
      `>=` عمدی است، نه `>`.

      وقتی قیمت چند روز روی سقف مانده، تاریخِ آخرین بار درست‌تر از
      اولین بار است: «۲ روز پیش این‌قدر بود» به کاربر کمک می‌کند،
      «۲۹ روز پیش این‌قدر بود» او را گمراه می‌کند.
    */
    if (point.price >= high) {
      high = point.price;
      highAt = point.t;
    }
  }

  if (high <= 0 || !highAt) return unknown;

  const belowHigh = ((high - currentPrice) / high) * 100;

  // قیمت امروز بالاتر از سقف یعنی خودِ امروز سقف است — افت نداریم.
  if (belowHigh < MIN_MEANINGFUL_DELTA) {
    return { ...unknown, high, highAt, daysAgo: null };
  }

  const daysAgo = Math.max(
    0,
    Math.floor(
      (now.getTime() - new Date(`${highAt}T00:00:00Z`).getTime()) / 86400000,
    ),
  );

  return { known: true, belowHigh, high, highAt, daysAgo };
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
