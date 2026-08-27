/** شناسه‌ی فروشگاه‌های همکار */
export type StoreId =
  | "digikala"
  // اسنپ‌شاپ هم عضو شبکه‌ی افیلیو است و کالاهایی دارد که دیجی‌کالا ندارد
  // (مثلاً گوشی‌های پرچم‌دار). لینک افیلیتش از همان مسیر aflo.ir می‌آید.
  | "snappshop"
  | "technolife"
  | "apexvision"
  | "bamilo"
  | "okala"
  | "zanbil";

export type Store = {
  id: StoreId;
  displayName: string;
  /** مسیر لوگو در public/ */
  logo: string;
  url: string;
  /** فعلاً فقط دیجی‌کالا فعال است؛ بقیه در نوبت اتصال‌اند */
  active: boolean;
};

/** دسته‌بندی محصولات */
export type CategoryId =
  | "mobile"
  | "laptop"
  | "headphone"
  | "wearable"
  | "console"
  | "tablet"
  | "accessory";

export type PricePoint = {
  /** ISO date */
  t: string;
  price: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  image: string;
  store: StoreId;
  category: CategoryId;
  brand: string;
  /** لینک محصول در فروشگاه مبدأ — برای نمایش و فالبک */
  sourceUrl: string;
  /**
   * لینک افیلیت آماده (مثلاً `https://aflo.ir/AwVl6HYR`).
   *
   * چرا ذخیره می‌شود و ساخته نمی‌شود:
   * اول فکر می‌کردیم می‌شود لینک افیلیت را از روی آدرس محصول ساخت. دو
   * لینک واقعی از پنل افیلیو را مقایسه کردیم و معلوم شد `utm_source`،
   * `utm_medium` و `utm_id` ثابت‌اند ولی `affid` برای **هر لینک** یک
   * UUID یکتاست که سیستم افیلیو موقع ساخت تولید می‌کند.
   *
   * یعنی لینک دست‌ساز قابل اتکا نیست. اگر آن مسیر را می‌رفتیم، ۳۱ لینک
   * داشتیم که هیچ‌کدام کمیسیون نمی‌آوردند و هفته‌ها بعد می‌فهمیدیم.
   *
   * تا وقتی پر نشده، دکمه‌ی خرید به `sourceUrl` می‌رود — یعنی کاربر به
   * محصول می‌رسد ولی کمیسیونی ثبت نمی‌شود.
   */
  affiliateUrl?: string;
  currentPrice: number;
  previousPrice: number;
  /** تاریخچه‌ی قیمت برای اسپارک‌لاین */
  history: PricePoint[];
  /**
   * فروشگاهی که نقطه‌های قبلیِ تاریخچه در آن ثبت شده، وقتی با فروشگاه
   * فعلی فرق دارد.
   *
   * فید افیلیو می‌چرخد: همان گوشی که هفته‌ی پیش از دیجی‌کالا رصد می‌شد،
   * این هفته از اسنپ‌شاپ می‌آید. تاریخچه‌اش حفظ می‌شود (وگرنه نمودار هر
   * بار از صفر شروع می‌شد) ولی نمی‌شود وانمود کرد همه‌ی آن قیمت‌ها از
   * فروشگاه فعلی‌اند.
   *
   * وقتی پر است، صفحه‌ی محصول این را صریح می‌گوید.
   */
  historyFrom?: StoreId;
};

export type Suggestion = {
  id: string;
  text: string;
  /** درصد تغییر؛ منفی یعنی ارزان‌تر شده */
  delta: number;
  href: string;
};

export type PriceAlert = {
  id: string;
  productSlug: string;
  productTitle: string;
  productImage: string;
  store: StoreId;
  delta: number;
  /** ISO date */
  at: string;
};

export type Category = {
  id: CategoryId;
  label: string;
  /** عنوان کوتاه برای چیپ‌های زیر هیرو */
  chipLabel: string;
  icon: string;
  description: string;
};

/** یک بلوک از بدنه‌ی مقاله */
export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date */
  date: string;
  readMinutes: number;
  tag: string;
  body: ArticleBlock[];
  /**
   * محصولاتی که این مقاله درباره‌شان است — پایه‌ی بلوک «کال تو اکشن»
   * انتهای مقاله.
   *
   * فقط `slug` ذخیره می‌شود، نه عنوان و قیمت. دلیلش همان قاعده‌ی همیشگی
   * این پروژه است: قیمت لحظه‌ی رندر از کاتالوگ زنده خوانده می‌شود، وگرنه
   * مقاله‌ای که هفته‌ی پیش نوشته شده قیمت هفته‌ی پیش را نشان می‌داد و با
   * صفحه‌ی محصول نمی‌خواند.
   *
   * برای مقاله‌های دستی خالی است.
   */
  productSlugs?: string[];
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  icon: "bell" | "activity" | "chart" | "heart";
};
