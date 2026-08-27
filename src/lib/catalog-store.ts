import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { productKey } from "@/lib/product-key";
import type { PricePoint, Product, StoreId } from "@/lib/types";

/**
 * ذخیره‌ی کاتالوگ زنده و تاریخچه‌ی قیمت.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فایل و نه فراخوانی مستقیم افیلیو
 * ─────────────────────────────────────────────────────────────────────
 * افیلیو فقط قیمت **امروز** را می‌دهد. اگر سایت هر بار مستقیم از آن
 * می‌خواند، تاریخچه‌ی قیمت هیچ‌وقت ساخته نمی‌شد — یعنی نمودار قیمت و
 * هشدار افت قیمت، که کل ایده‌ی این سایت‌اند، برای همیشه خالی می‌ماندند.
 *
 * با ذخیره‌ی روزانه، هر اجرا یک نقطه‌ی واقعی اضافه می‌کند و بعد از چند
 * روز نمودارها معنا پیدا می‌کنند. ضمناً سایت به بالا بودن افیلیو وابسته
 * نمی‌ماند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فایل ساده و نه دیتابیس
 * ─────────────────────────────────────────────────────────────────────
 * حجم داده کوچک است (حدود ۷۰ محصول × ۳۰ نقطه) و فقط یک نویسنده دارد
 * (ورک‌فلوی n8n). دیتابیس اینجا فقط پیچیدگی و یک سرویس دیگر برای خراب
 * شدن اضافه می‌کرد. اگر روزی چند نویسنده یا حجم بالا شد، همین ماژول
 * جایگزین می‌شود و بقیه‌ی سایت دست نمی‌خورد.
 */

const DATA_DIR = process.env.PSYG_DATA_DIR ?? "/data";
const CATALOG_FILE = join(DATA_DIR, "catalog.json");

/** بیشتر از این تعداد نقطه نگه نمی‌داریم؛ نمودار سی‌روزه است */
const MAX_HISTORY_POINTS = 60;

/**
 * تاریخچه‌ی محصولی که دیگر در فید افیلیو نیست.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا آرشیو جداست و محصول در `products` نمی‌ماند
 * ─────────────────────────────────────────────────────────────────────
 * وسوسه‌ی اول این بود که محصول غایب را با یک فلگ در همان فهرست نگه
 * داریم. ولی محصولی که از فید بیرون رفته ممکن است ناموجود شده باشد و
 * لینک افیلیتش کار نکند. نمایشش یعنی فرستادن کاربر به صفحه‌ی ۴۰۴ — و
 * کمیسیونی هم در کار نیست.
 *
 * پس `products` دقیقاً همان چیزی می‌ماند که همین حالا قابل خرید است، و
 * تاریخچه در آرشیو زنده می‌ماند تا اگر محصول برگشت — با همان uid یا از
 * فروشگاهی دیگر — نقطه‌هایش را پس بگیرد.
 */
export type ArchivedHistory = {
  /** `Product.id` — همان uid افیلیو، برای بازگشت به همان فروشگاه */
  id: string;
  /**
   * کلید مستقل از فروشگاه، یا `null` وقتی عنوان سیگنال کافی نداشت.
   *
   * هر دو شناسه ذخیره می‌شوند چون هرکدام یک راه بازگشت‌اند: `id` وقتی
   * محصول به همان فروشگاه برگردد، `key` وقتی از فروشگاه دیگری بیاید.
   * نسخه‌ی اول فقط یکی را نگه می‌داشت و محصولی که با `id` آرشیو شده بود،
   * دور بعد از طریق `id` پیدا نمی‌شد.
   */
  key: string | null;
  /** آخرین فروشگاهی که این محصول در آن دیده شد */
  store: StoreId;
  /** برای اینکه آرشیو با چشم قابل بازبینی باشد */
  title: string;
  points: PricePoint[];
  /** ISO date — آخرین روزی که در فید بود */
  lastSeen: string;
};

/**
 * بعد از این مدت، تاریخچه‌ی محصول غایب دور ریخته می‌شود.
 *
 * محصولی که سه ماه در هیچ فروشگاهی نبوده، احتمالاً از بازار رفته. نگه
 * داشتن ابدی‌اش فقط فایل را بزرگ می‌کند بدون اینکه به کسی چیزی بدهد.
 */
const ARCHIVE_TTL_DAYS = 90;

export type Catalog = {
  /** ISO — آخرین باری که n8n داده را به‌روز کرد */
  updatedAt: string;
  products: Product[];
  /** تاریخچه‌ی محصولاتی که فعلاً در فید نیستند */
  archive?: ArchivedHistory[];
};

const EMPTY: Catalog = { updatedAt: "", products: [], archive: [] };

export async function readCatalog(): Promise<Catalog> {
  try {
    const raw = await readFile(CATALOG_FILE, "utf8");
    const parsed = JSON.parse(raw) as Catalog;

    if (!Array.isArray(parsed?.products)) return EMPTY;
    return parsed;
  } catch {
    /*
      نبود فایل خطا نیست — حالت طبیعیِ قبل از اولین اجرای n8n است.
      کاتالوگ خالی برمی‌گردد و سایت به داده‌ی نمونه برمی‌گردد.
    */
    return EMPTY;
  }
}

/** یک تاریخچه‌ی قابل ادعا — چه از محصول زنده‌ی قبلی، چه از آرشیو */
type Claimable = {
  key: string | null;
  id: string | null;
  store: StoreId;
  title: string;
  points: PricePoint[];
  lastSeen: string;
  claimed: boolean;
};

function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86_400_000);
}

/**
 * ادغام محصولات تازه با تاریخچه‌ی موجود و آرشیو.
 *
 * ─────────────────────────────────────────────────────────────────────
 * باگی که این تابع را بازنویسی کرد
 * ─────────────────────────────────────────────────────────────────────
 * نسخه‌ی قبلی `incoming.map(...)` بود. یعنی خروجی دقیقاً همان چیزی می‌شد
 * که افیلیو این بار داده — و هر محصولی که در آن دسته نبود، با تاریخچه‌اش
 * ناپدید می‌شد.
 *
 * روی پروداکشن اتفاق افتاد: فید چرخید، محصولات دیجی‌کالا رفتند، و
 * `/api/deals` از هشت محصول به صفر رسید. هیچ خطایی هم ثبت نشد؛ سایت فقط
 * ادعا کرد همه‌چیز «تازه» است.
 *
 * حالا سه اتفاق می‌افتد:
 *
 * ۱. محصول با `id` خودش تطبیق داده می‌شود (مسیر عادی).
 * ۲. اگر نشد، با `productKey` — تا همان گوشی که این بار از فروشگاه دیگری
 *    آمده، تاریخچه‌ی قبلی‌اش را پس بگیرد.
 * ۳. هرچه ادعا نشد، به آرشیو می‌رود تا اگر بعداً برگشت، چیزی از دست
 *    نرفته باشد.
 *
 * منطق نقطه‌ی روزانه مثل قبل است: قیمت **امروز** جایگزین نقطه‌ی امروز
 * می‌شود، نه اینکه نقطه‌ی تکراری اضافه کند.
 */
export function mergeCatalog(
  incoming: Product[],
  existing: Catalog,
  now: Date = new Date(),
): { products: Product[]; archive: ArchivedHistory[] } {
  const today = now.toISOString().slice(0, 10);

  /*
    همه‌ی تاریخچه‌های موجود در یک استخر: محصولات زنده‌ی قبلی و آرشیو.

    یکی کردنشان یعنی محصولی که دو هفته غایب بوده، دقیقاً مثل محصولی که
    دیروز بوده رفتار می‌شود — همان‌طور که باید.
  */
  const pool: Claimable[] = [
    ...existing.products.map((p) => ({
      key: productKey(p.title, p.category),
      id: p.id,
      store: p.store,
      title: p.title,
      points: p.history ?? [],
      lastSeen: p.history?.at(-1)?.t ?? today,
      claimed: false,
    })),
    ...(existing.archive ?? []).map((entry) => ({
      key: entry.key,
      id: entry.id,
      store: entry.store,
      title: entry.title,
      points: entry.points,
      lastSeen: entry.lastSeen,
      claimed: false,
    })),
  ];

  const byId = new Map<string, Claimable>();
  const byKey = new Map<string, Claimable>();
  for (const record of pool) {
    if (record.id && !byId.has(record.id)) byId.set(record.id, record);
    /*
      اولین رکورد با هر کلید برنده است. محصولات زنده اول در استخر آمده‌اند،
      پس تاریخچه‌ی زنده بر آرشیوِ کهنه‌تر اولویت دارد.
    */
    if (record.key && !byKey.has(record.key)) byKey.set(record.key, record);
  }

  const products = incoming.map((product) => {
    const key = productKey(product.title, product.category);

    const match =
      byId.get(product.id) ?? (key ? byKey.get(key) : undefined) ?? null;

    /*
      یک تاریخچه فقط یک بار ادعا می‌شود.

      بدون این، اگر دو محصول ورودی به یک کلید برسند (مثلاً همان گوشی در
      دو فروشگاه)، هر دو همان نقطه‌ها را برمی‌داشتند و یک تاریخچه‌ی واحد
      دو بار روی سایت دیده می‌شد.
    */
    /*
      محصول تازه — یا محصولی که تاریخچه‌اش را کس دیگری برداشته.

      نقطه‌ی امروز اینجا هم ساخته می‌شود، نه اینکه به `toProduct` تکیه
      کنیم. قبلاً تنها راهِ داشتن نقطه‌ی امروز برای محصول جدید این بود
      که `toProduct` آن را کاشته باشد — یعنی یک واقعیت واحد دو منبع
      داشت. تستِ همین فایل روی همان اختلاف قرمز شد.
    */
    if (!match || match.claimed) {
      return {
        ...product,
        history: [{ t: today, price: product.currentPrice }],
      };
    }
    match.claimed = true;

    // نقطه‌های قبلی، منهای امروز (که با مقدار تازه جایگزین می‌شود)
    const past = match.points.filter((point) => point.t !== today);
    const history = [...past, { t: today, price: product.currentPrice }].slice(
      -MAX_HISTORY_POINTS,
    );

    /*
      `previousPrice` از تاریخچه می‌آید نه از افیلیو.

      افیلیو «قیمت قبل از تخفیف» را می‌دهد که تخفیف *فروشگاه* است، نه
      تغییر قیمت در طول زمان. چیزی که این سایت ادعا می‌کند رصد قیمت است،
      پس مبنا باید آخرین قیمتی باشد که خودمان ثبت کرده‌ایم.
    */
    const lastKnown = past.at(-1)?.price ?? product.currentPrice;

    /*
      اگر نقطه‌های قبلی در فروشگاه دیگری ثبت شده‌اند، محصول این را با خود
      حمل می‌کند تا صفحه بتواند صادق باشد: «این تاریخچه در دیجی‌کالا ثبت
      شده؛ محصول اکنون در اسنپ‌شاپ موجود است.»

      بدون این، نمودار ادعا می‌کرد قیمت‌ها همه از فروشگاه فعلی‌اند.
    */
    const historyFrom =
      past.length > 0 && match.store !== product.store ? match.store : undefined;

    return { ...product, previousPrice: lastKnown, history, historyFrom };
  });

  const archive = pool
    .filter((record) => !record.claimed && record.points.length > 0)
    .filter((record) => daysBetween(record.lastSeen, today) <= ARCHIVE_TTL_DAYS)
    .map((record) => ({
      id: record.id ?? "",
      key: record.key,
      store: record.store,
      title: record.title,
      points: record.points,
      lastSeen: record.lastSeen,
    }))
    /*
      رکوردی که نه `id` دارد نه `key`، هیچ راه بازگشتی ندارد. نگه داشتنش
      فقط فایل را بزرگ می‌کند.
    */
    .filter((entry) => entry.id !== "" || entry.key !== null);

  return { products, archive };
}

/**
 * نوشتن اتمیک.
 *
 * اول در فایل موقت نوشته و بعد جابه‌جا می‌شود. اگر وسط نوشتن برق برود یا
 * پروسه بمیرد، فایل اصلی دست‌نخورده می‌ماند — به‌جای اینکه نصفه و خراب
 * شود و سایت با کاتالوگ ناقص بالا بیاید.
 */
export async function writeCatalog(catalog: Catalog): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  const temp = `${CATALOG_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(catalog), "utf8");
  await rename(temp, CATALOG_FILE);
}
