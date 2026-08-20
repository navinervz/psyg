import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * ذخیره‌ی مشترکان خبرنامه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این فایل ساخته شد
 * ─────────────────────────────────────────────────────────────────────
 * `/api/subscribe` ایمیل را اعتبارسنجی می‌کرد و بعد فقط در لاگ سرور
 * می‌نوشت. یعنی هر کسی که تا امروز روی «خبرم کن» کلیک کرده، پیام
 * «ثبت شد!» دیده — ولی ایمیلش هیچ‌جا ذخیره نشده و از دست رفته.
 *
 * این بدترین نوع باگ است: کاربر فکر می‌کند کاری انجام شده، سایت هم
 * می‌گوید انجام شده، و هیچ خطایی هم ثبت نمی‌شود.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فایل و نه دیتابیس
 * ─────────────────────────────────────────────────────────────────────
 * همان دلیل `catalog-store`: حجم کوچک، یک نویسنده، و اینکه سرویس
 * دیگری برای خراب شدن اضافه نمی‌کند. اگر روزی تعداد مشترکان زیاد شد،
 * همین ماژول عوض می‌شود و بقیه‌ی سایت دست نمی‌خورد.
 */

const DATA_DIR = process.env.PSYG_DATA_DIR ?? "/data";
const FILE = join(DATA_DIR, "subscribers.json");

export type Subscriber = {
  email: string;
  /** ISO */
  at: string;
  /**
   * توکن لغو اشتراک.
   *
   * لینک لغو با همین ساخته می‌شود. اگر به‌جایش خود ایمیل در آدرس
   * می‌رفت، هر کسی می‌توانست با حدس زدن ایمیل دیگران، اشتراکشان را
   * لغو کند — و ضمناً نشانی‌ها در لاگ سرورها و ارجاع‌دهنده‌ها پخش
   * می‌شد.
   */
  token: string;
  /** با لغو اشتراک `false` می‌شود؛ رکورد پاک نمی‌شود */
  active: boolean;
};

type Store = { updatedAt: string; subscribers: Subscriber[] };

const EMPTY: Store = { updatedAt: "", subscribers: [] };

export async function readSubscribers(): Promise<Store> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as Store;
    if (!Array.isArray(parsed?.subscribers)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

async function write(store: Store): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const payload: Store = {
    updatedAt: new Date().toISOString(),
    subscribers: store.subscribers,
  };
  const temp = `${FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(payload), "utf8");
  await rename(temp, FILE);
}

/**
 * افزودن مشترک.
 *
 * ایمیل تکراری خطا نیست — کاربری که دوباره ثبت می‌کند احتمالاً یادش
 * رفته یا قبلاً لغو کرده. در هر دو حالت نتیجه‌ی درست این است که فعال
 * شود، نه اینکه پیام خطا بگیرد.
 */
export async function addSubscriber(email: string): Promise<{ created: boolean }> {
  const normalized = email.trim().toLowerCase();
  const store = await readSubscribers();

  const existing = store.subscribers.find((s) => s.email === normalized);

  if (existing) {
    if (!existing.active) {
      existing.active = true;
      existing.at = new Date().toISOString();
      await write(store);
    }
    return { created: false };
  }

  store.subscribers.push({
    email: normalized,
    at: new Date().toISOString(),
    token: randomBytes(16).toString("hex"),
    active: true,
  });

  await write(store);
  return { created: true };
}

/** لغو اشتراک با توکن. رکورد می‌ماند تا اگر دوباره ثبت کرد تاریخچه‌اش گم نشود */
export async function unsubscribe(token: string): Promise<boolean> {
  const store = await readSubscribers();
  const found = store.subscribers.find((s) => s.token === token);

  if (!found || !found.active) return false;

  found.active = false;
  await write(store);
  return true;
}
