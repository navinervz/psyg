import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Product } from "@/lib/types";

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

export type Catalog = {
  /** ISO — آخرین باری که n8n داده را به‌روز کرد */
  updatedAt: string;
  products: Product[];
};

const EMPTY: Catalog = { updatedAt: "", products: [] };

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

/**
 * ادغام محصولات تازه با تاریخچه‌ی موجود.
 *
 * منطق کلیدی: قیمت **امروز** جایگزین نقطه‌ی امروز می‌شود، نه اینکه نقطه‌ی
 * جدید اضافه کند. وگرنه اگر ورک‌فلو روزی چند بار اجرا شود، تاریخچه پر از
 * نقطه‌های تکراری همان روز می‌شد و نمودار بی‌معنا.
 */
export function mergeHistory(
  incoming: Product[],
  existing: Product[],
): Product[] {
  const previous = new Map(existing.map((p) => [p.id, p]));
  const today = new Date().toISOString().slice(0, 10);

  return incoming.map((product) => {
    const old = previous.get(product.id);
    if (!old) return product;

    // نقطه‌های قبلی، منهای امروز (که با مقدار تازه جایگزین می‌شود)
    const past = old.history.filter((point) => point.t !== today);
    const history = [...past, { t: today, price: product.currentPrice }].slice(
      -MAX_HISTORY_POINTS,
    );

    /*
      `previousPrice` از تاریخچه می‌آید نه از افیلیو.

      افیلیو «قیمت قبل از تخفیف» را می‌دهد که تخفیف *فروشگاه* است، نه
      تغییر قیمت در طول زمان. چیزی که این سایت ادعا می‌کند رصد قیمت است،
      پس مبنا باید آخرین قیمتی باشد که خودمان ثبت کرده‌ایم.

      تا وقتی فقط یک نقطه داریم، تغییری وجود ندارد و درصد صفر می‌شود —
      که درست است، چون واقعاً نمی‌دانیم قیمت بالا رفته یا پایین.
    */
    const lastKnown = past.at(-1)?.price ?? product.currentPrice;

    return { ...product, previousPrice: lastKnown, history };
  });
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
