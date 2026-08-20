import type { CategoryId, Product, StoreId } from "@/lib/types";

/**
 * خواندن محصولات از ویجت‌های هوشمند افیلیو.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چطور به این اندپوینت رسیدیم
 * ─────────────────────────────────────────────────────────────────────
 * افیلیو مستندات عمومی API ندارد. ولی کد ویجتی که در پنل ساخته می‌شود
 * یک `loader.js` صدا می‌زند، و داخل آن فایل دو اندپوینت عمومی هست:
 *
 *     GET /api/public/widgets/{id}/config
 *     GET /api/public/widgets/{id}/products
 *
 * هیچ‌کدام احراز هویت نمی‌خواهند، چون قرار است از مرورگر بازدیدکننده صدا
 * زده شوند. برای ما یعنی می‌شود مستقیم و بدون توکن خواندشان.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این مسیر، و نه ساختن لینک افیلیت
 * ─────────────────────────────────────────────────────────────────────
 * اول فکر کردیم می‌شود لینک افیلیت را از روی آدرس محصول ساخت. دو لینک
 * واقعی را مقایسه کردیم: `utm_source`، `utm_medium` و `utm_id` ثابت
 * بودند ولی `affid` برای هر لینک یک UUID متفاوت بود که سیستم افیلیو
 * تولید می‌کند. یعنی لینک دست‌ساز کمیسیون نمی‌آورد.
 *
 * این اندپوینت `tracking_link` آماده می‌دهد — همان چیزی که لازم داریم.
 */

const API_BASE = "https://static.affilio.ir";

/** شکل خام پاسخ افیلیو — از روی `loader.js` استخراج شده */
type AffilioProduct = {
  uid: string;
  name: string;
  /** قیمت اصلی، بدون تخفیف */
  price: number;
  /** قیمت با تخفیف؛ اگر تخفیفی نباشد ممکن است صفر یا برابر price باشد */
  price_discount: number;
  discount_percent: number;
  image_url: string;
  /** لینک کوتاه افیلیت — تنها چیزی که کمیسیون می‌آورد */
  tracking_link: string;
  description?: string;
  is_available: boolean;
};

/**
 * نگاشت ویجت به دسته‌ی سایت.
 *
 * عمداً صریح است و از روی اسم محصول حدس نمی‌زند. هر ویجت در پنل افیلیو
 * با فیلتر دسته‌بندی ساخته می‌شود، پس خودِ ویجت دقیق‌ترین منبع دسته است.
 * اگر ویجتی چند دسته را با هم داشته باشد، محصولاتش در دسته‌ی اشتباه
 * می‌نشینند — برای همین باید هر دسته ویجت جدا داشته باشد.
 */
export type WidgetSource = {
  id: string;
  category: CategoryId;
  store: StoreId;
  /** برای خوانایی لاگ و خطا */
  label: string;
};

export const WIDGET_SOURCES: WidgetSource[] = [
  {
    id: "64ac5d31-f263-4b6b-bd85-32aa328610b9",
    category: "mobile",
    store: "digikala",
    label: "موبایل — دیجی‌کالا",
  },
  {
    id: "d4f546a5-e14e-48b4-bfa8-e98a6a6f8cc8",
    category: "mobile",
    store: "snappshop",
    label: "موبایل — اسنپ‌شاپ",
  },
  {
    id: "fcf7796b-18e6-4de0-9c11-351c4beed820",
    category: "wearable",
    store: "digikala",
    label: "ساعت هوشمند — دیجی‌کالا",
  },
  {
    id: "29c8af6f-9001-458f-934b-e9048996aa07",
    category: "console",
    store: "snappshop",
    label: "کنسول بازی — اسنپ‌شاپ",
  },
  {
    id: "f471786a-c3d7-4dc4-b516-8ed1132222e3",
    category: "headphone",
    store: "snappshop",
    label: "هدفون و هندزفری — اسنپ‌شاپ",
  },
  {
    id: "f38e204f-a4b0-4aca-aa70-43ad7dbf546f",
    category: "tablet",
    store: "snappshop",
    label: "تبلت — اسنپ‌شاپ",
  },
  /*
    این دو قبلاً یک ویجت ترکیبی «لپ‌تاپ و لوازم جانبی» بودند و تفکیک شدند.
    دلیلش: دسته‌ی هر محصول از خودِ ویجت می‌آید نه از روی اسم محصول. با
    ویجت ترکیبی، کیف و کاور لپ‌تاپ هم در دسته‌ی «لپ‌تاپ» می‌نشستند.
  */
  {
    id: "6e496dfc-0537-44ab-8294-c0217d12a26b",
    category: "laptop",
    store: "snappshop",
    label: "لپ‌تاپ و اولترابوک — اسنپ‌شاپ",
  },
  {
    id: "e9ff22bf-f646-4ef2-b943-6edd2c3362de",
    category: "accessory",
    store: "snappshop",
    label: "لوازم جانبی لپ‌تاپ — اسنپ‌شاپ",
  },
];

/**
 * `slug` باید فقط حروف کوچک لاتین، عدد و خط تیره باشد — هم برای URL امن
 * است هم تست `routes.test.ts` همین را الزام می‌کند.
 *
 * اسم محصولات فارسی است و نمی‌شود از رویش slug ساخت. به‌جایش از `uid`
 * که خود افیلیو می‌دهد استفاده می‌کنیم: پایدار است و بین اجراها عوض
 * نمی‌شود، پس آدرس صفحه‌ی محصول هم ثابت می‌ماند.
 */
export function slugFromUid(uid: string): string {
  return `p-${uid.replace(/-/g, "").slice(0, 12).toLowerCase()}`;
}

/** برند را از اولین کلمه‌ی لاتین عنوان حدس می‌زند؛ اگر نبود، نام فروشگاه */
function guessBrand(name: string, fallback: string): string {
  const latin = name.match(/[A-Za-z][A-Za-z0-9+]{2,}/);
  return latin ? latin[0] : fallback;
}

/**
 * تبدیل محصول افیلیو به شکل داده‌ی سایت.
 *
 * نکته‌ی قیمت: افیلیو `price` را قیمت اصلی و `price_discount` را قیمت
 * پس از تخفیف می‌دهد. وقتی تخفیفی نیست، `price_discount` گاهی صفر است و
 * گاهی برابر `price` — هر دو حالت در داده‌ی واقعی دیده شد. پس نمی‌شود
 * مستقیم به آن اتکا کرد.
 */
/**
 * بالاتر از این درصد، «تخفیف» را باور نمی‌کنیم.
 *
 * در داده‌ی واقعی افیلیو تخفیف‌های ۹۴٪ و ۹۷٪ روی تبلت دیده شد. تخفیف
 * واقعی در این ابعاد وجود ندارد؛ یعنی فروشنده «قیمت قبل از تخفیف» را
 * غیرواقعی بالا گذاشته. نشان دادن «۹۷٪ تخفیف» روی چنین محصولی همان
 * اعتمادی را می‌برد که کل این سایت رویش ساخته شده.
 *
 * در این حالت محصول حذف نمی‌شود — فقط قیمت اصلی‌اش نادیده گرفته می‌شود و
 * بدون ادعای تخفیف نمایش داده می‌شود.
 */
const MAX_BELIEVABLE_DISCOUNT = 70;

export function toProduct(
  raw: AffilioProduct,
  source: WidgetSource,
): Product | null {
  // بدون لینک افیلیت، محصول برای ما بی‌ارزش است
  if (!raw.tracking_link || !raw.name || !raw.price) return null;

  /*
    محصول بدون عکس نمایش داده نمی‌شود.

    کارت بدون تصویر در گرید کنار کارت‌های تصویردار، شکسته به‌نظر می‌رسد و
    کاربر فکر می‌کند سایت خراب است. آیکون دسته‌بندی برای دوره‌ای که هیچ
    عکسی نداشتیم راه‌حل خوبی بود، ولی حالا که منبع واقعی داریم، محصول
    ناقص بهتر است اصلاً نیاید.
  */
  if (!raw.image_url || !/^https?:\/\//.test(raw.image_url)) return null;

  const hasDiscount =
    raw.discount_percent > 0 &&
    raw.discount_percent <= MAX_BELIEVABLE_DISCOUNT &&
    raw.price_discount > 0 &&
    raw.price_discount < raw.price;

  const currentPrice = hasDiscount ? raw.price_discount : raw.price;

  return {
    id: raw.uid,
    slug: slugFromUid(raw.uid),
    title: raw.name,
    image: raw.image_url,
    store: source.store,
    category: source.category,
    brand: guessBrand(raw.name, source.label),
    sourceUrl: raw.tracking_link,
    affiliateUrl: raw.tracking_link,
    currentPrice,
    previousPrice: raw.price,
    /*
      تاریخچه با یک نقطه شروع می‌شود — قیمت همین امروز.

      عمداً تاریخچه‌ی ساختگی تولید نمی‌کنیم. یک بازدید فقط قیمت امروز را
      می‌داند و ساختن سی نقطه‌ی جعلی دقیقاً همان چیزی است که کل ارزش این
      سایت را از بین می‌برد. ورک‌فلوی رصد قیمت هر روز یک نقطه‌ی واقعی
      اضافه می‌کند و نمودارها به‌مرور جان می‌گیرند.
    */
    history: [{ t: new Date().toISOString().slice(0, 10), price: currentPrice }],
  };
}

/** خواندن محصولات یک ویجت */
export async function fetchWidgetProducts(
  source: WidgetSource,
  init?: RequestInit,
): Promise<Product[]> {
  const url = `${API_BASE}/api/public/widgets/${source.id}/products`;

  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(
      `افیلیو پاسخ ${response.status} داد برای ویجت «${source.label}»`,
    );
  }

  const body = (await response.json()) as {
    success?: boolean;
    data?: { products?: AffilioProduct[] };
  };

  const raw = body?.data?.products ?? [];

  return raw
    .filter((p) => p.is_available !== false)
    .map((p) => toProduct(p, source))
    .filter((p): p is Product => p !== null);
}

/**
 * خواندن همه‌ی ویجت‌ها.
 *
 * شکست یک ویجت کل عملیات را زمین نمی‌زند: اگر یک دسته پاسخ ندهد، بقیه
 * می‌آیند و همان یکی خالی می‌ماند. برای سایتی که باید همیشه بالا باشد،
 * محصولات کمتر از صفحه‌ی خطا بهتر است.
 */
export async function fetchAllProducts(init?: RequestInit): Promise<{
  products: Product[];
  failures: { label: string; reason: string }[];
}> {
  const settled = await Promise.allSettled(
    WIDGET_SOURCES.map((source) => fetchWidgetProducts(source, init)),
  );

  const products: Product[] = [];
  const failures: { label: string; reason: string }[] = [];

  settled.forEach((result, index) => {
    const source = WIDGET_SOURCES[index];
    if (result.status === "fulfilled") {
      products.push(...result.value);
    } else {
      failures.push({
        label: source.label,
        reason: String(result.reason?.message ?? result.reason),
      });
    }
  });

  // یک محصول ممکن است در دو ویجت باشد؛ اولین نسخه می‌ماند
  const seen = new Set<string>();
  const unique = products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return { products: unique, failures };
}
