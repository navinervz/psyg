import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Product } from "@/lib/types";

/**
 * لایه‌ی بازنویسی ادمین.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این جدا از کاتالوگ است
 * ─────────────────────────────────────────────────────────────────────
 * ورک‌فلوی همگام‌سازی هر بار **کل** `catalog.json` را بازنویسی می‌کند.
 * اگر محصول دستی یا لیست حذف‌شده‌ها داخل همان فایل بود، اولین اجرای بعدی
 * پاکشان می‌کرد و ادمین دوباره باید همه را وارد می‌کرد.
 *
 * پس دو فایل داریم:
 *
 *     catalog.json  ← فقط n8n می‌نویسد، هر بار کامل جایگزین می‌شود
 *     admin.json    ← فقط ادمین می‌نویسد، همگام‌سازی دستش نمی‌زند
 *
 * و سایت موقع خواندن این دو را روی هم می‌گذارد. نتیجه: حذف‌ها و
 * افزوده‌های دستی برای همیشه می‌مانند، حتی اگر سینک روزی صد بار اجرا شود.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا «پنهان» و نه «حذف»
 * ─────────────────────────────────────────────────────────────────────
 * محصولی که ادمین حذف می‌کند، اجرای بعدی سینک دوباره از افیلیو می‌آید.
 * پس حذف واقعی بی‌معناست — باید شناسه‌اش را نگه داریم و هر بار کنارش
 * بگذاریم. برای همین `hidden` فهرست شناسه است، نه عملیات پاک کردن.
 */

const DATA_DIR = process.env.PSYG_DATA_DIR ?? "/data";
const ADMIN_FILE = join(DATA_DIR, "admin.json");

export type AdminOverrides = {
  /** شناسه‌ی محصولاتی که ادمین از سایت برداشته */
  hidden: string[];
  /** محصولاتی که ادمین دستی اضافه کرده */
  manual: Product[];
  /** ISO — آخرین تغییر */
  updatedAt: string;
};

const EMPTY: AdminOverrides = { hidden: [], manual: [], updatedAt: "" };

export async function readOverrides(): Promise<AdminOverrides> {
  try {
    const raw = await readFile(ADMIN_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<AdminOverrides>;

    return {
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : [],
      manual: Array.isArray(parsed.manual) ? parsed.manual : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    // نبود فایل حالت طبیعیِ قبل از اولین تغییر ادمین است، نه خطا
    return EMPTY;
  }
}

/** نوشتن اتمیک — همان دلیل `catalog-store`: فایل نصفه نماند */
export async function writeOverrides(data: AdminOverrides): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  const payload: AdminOverrides = { ...data, updatedAt: new Date().toISOString() };
  const temp = `${ADMIN_FILE}.${process.pid}.tmp`;

  await writeFile(temp, JSON.stringify(payload), "utf8");
  await rename(temp, ADMIN_FILE);
}

/**
 * اعمال بازنویسی‌ها روی کاتالوگ.
 *
 * ترتیب مهم است: اول پنهان‌ها کنار می‌روند، بعد دستی‌ها اضافه می‌شوند.
 * اگر برعکس بود، ادمین نمی‌توانست محصول دستی خودش را پنهان کند.
 */
export function applyOverrides(
  catalog: Product[],
  overrides: AdminOverrides,
): Product[] {
  const hidden = new Set(overrides.hidden);
  const visible = catalog.filter((p) => !hidden.has(p.id));

  /*
    محصول دستی نباید نسخه‌ی افیلیو را دوبار نشان دهد.

    اگر ادمین محصولی را دستی اضافه کند که بعداً از افیلیو هم آمد، نسخه‌ی
    دستی برنده است — چون ادمین عمداً واردش کرده و احتمالاً دلیلی داشته.
  */
  const manualIds = new Set(overrides.manual.map((p) => p.id));
  const withoutDuplicates = visible.filter((p) => !manualIds.has(p.id));

  return [
    ...withoutDuplicates,
    ...overrides.manual.filter((p) => !hidden.has(p.id)),
  ];
}
