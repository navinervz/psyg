import type { CategoryId } from "@/lib/types";

/**
 * شناسه‌ی مستقل از فروشگاه برای یک محصول فیزیکی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * مسئله‌ای که این فایل حل می‌کند
 * ─────────────────────────────────────────────────────────────────────
 * `Product.id` همان `uid` افیلیوست. برای یک فروشگاه پایدار است، ولی
 * «Redmi Note 15 Pro» در دیجی‌کالا و همان گوشی در اسنپ‌شاپ دو uid
 * متفاوت دارند.
 *
 * نتیجه‌اش را روی سایت دیدیم: فید افیلیو چرخید، محصولات دیجی‌کالا رفتند
 * و همان گوشی‌ها با uid اسنپ‌شاپی برگشتند. برای ما محصول *جدید* بودند،
 * پس تاریخچه‌ی چندروزه‌شان دور ریخته شد و همه‌ی کارت‌ها «تازه» شدند.
 *
 * این کلید از خود عنوان ساخته می‌شود تا آن دو به هم وصل شوند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا محافظه‌کارانه است و اجازه دارد `null` برگرداند
 * ─────────────────────────────────────────────────────────────────────
 * اشتباهِ اینجا از دست دادن تاریخچه بدتر است. اگر دو محصول *متفاوت* یک
 * کلید بگیرند، نقطه‌هایشان قاطی می‌شود و نمودار قیمتی می‌سازد که هرگز
 * وجود نداشته — یعنی دقیقاً همان دروغی که کل سایت برای نگفتنش ساخته شده.
 *
 * پس وقتی سیگنال کافی نیست، `null` برمی‌گردد و آن محصول فقط با `id`
 * خودش تطبیق داده می‌شود. از دست دادن تاریخچه‌ی یک محصول، قابل جبران
 * است؛ نمودار جعلی نه.
 */

/** ارقام فارسی و عربی به لاتین */
function latinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * کلماتی که در عنوان هستند ولی محصول را از هم جدا نمی‌کنند.
 *
 * بیشترشان از خود عنوان فروشگاه می‌آیند («... مدل ... اورجینال») و در
 * دو فروشگاه یکسان نیستند. ماندنشان یعنی دو عنوان از یک گوشی، دو کلید
 * متفاوت بگیرند.
 */
const NOISE = new Set([
  "model",
  "original",
  "new",
  "smartphone",
  "mobile",
  "phone",
  "laptop",
  "notebook",
  "global",
  "version",
  "dual",
  "sim",
  "nfc",
  "gb",
  "tb",
  "mb",
  "ram",
  "rom",
  "digikala",
  "snappshop",
  "technolife",
]);

/**
 * ظرفیت و رم، از هر دو شکل نگارشی.
 *
 * یک فروشگاه «ظرفیت ۲۵۶ گیگابایت رم ۸ گیگابایت» می‌نویسد و دیگری
 * «256GB / 8GB». اگر این عددها را در جریان توکن‌ها رها کنیم، همان محصول
 * دو کلید می‌گیرد. پس جدا استخراج و به گیگابایت یکسان‌سازی می‌شوند.
 */
function extractSpecs(text: string): {
  capacity: number | null;
  ram: number | null;
  stripped: string;
} {
  let capacity: number | null = null;
  let ram: number | null = null;
  let stripped = text;

  const faCapacity = text.match(/ظرفیت\s*(\d+)\s*(ترابایت|گیگابایت)/);
  if (faCapacity) {
    capacity = Number(faCapacity[1]) * (faCapacity[2] === "ترابایت" ? 1024 : 1);
    stripped = stripped.replace(faCapacity[0], " ");
  }

  const faRam = text.match(/رم\s*(\d+)\s*گیگابایت/);
  if (faRam) {
    ram = Number(faRam[1]);
    stripped = stripped.replace(faRam[0], " ");
  }

  /*
    شکل لاتین فقط وقتی خوانده می‌شود که شکل فارسی نبوده. وگرنه روی عنوانی
    که هر دو را دارد، مقدار دوم مقدار اول را خراب می‌کرد.
  */
  if (capacity === null && ram === null) {
    const latin = [...text.matchAll(/(\d+)\s*(gb|tb)\b/gi)].map((m) => ({
      raw: m[0],
      gb: Number(m[1]) * (m[2].toLowerCase() === "tb" ? 1024 : 1),
    }));

    if (latin.length > 0) {
      /*
        بزرگ‌تر ظرفیت است و کوچک‌تر رم — نه ترتیب ظاهرشان در متن.

        ترتیب بین فروشگاه‌ها یکسان نیست («128GB / 4GB» در یکی، «4GB RAM
        128GB» در دیگری) ولی حافظه‌ی داخلی همیشه از رم بیشتر است.
      */
      const sorted = [...latin].sort((a, b) => b.gb - a.gb);
      capacity = sorted[0].gb;
      if (sorted.length > 1) ram = sorted[sorted.length - 1].gb;
      for (const item of latin) stripped = stripped.replace(item.raw, " ");
    }
  }

  return { capacity, ram, stripped };
}

/** حداقل توکن لاتین برای اینکه تطبیق بین‌فروشگاهی را باور کنیم */
const MIN_TOKENS = 2;

/**
 * کلید تطبیق، یا `null` وقتی عنوان سیگنال کافی ندارد.
 *
 * دسته‌بندی هم در کلید هست تا دو محصول هم‌نام از دو دسته‌ی متفاوت به هم
 * وصل نشوند.
 */
export function productKey(title: string, category: CategoryId): string | null {
  const normalized = latinDigits(title);
  const { capacity, ram, stripped } = extractSpecs(normalized);

  const tokens = (stripped.match(/[A-Za-z][A-Za-z0-9+]*/g) ?? [])
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 2 && !NOISE.has(token));

  if (tokens.length < MIN_TOKENS) return null;

  /*
    ترتیب توکن‌ها حفظ می‌شود، مرتب نمی‌شود.

    «Note 15 Pro» و «Pro 15 Note» اگر مرتب شوند یکی می‌شوند. بعید است ولی
    چیزی هم به ما نمی‌دهد که ارزش این ریسک را داشته باشد.
  */
  return [
    category,
    tokens.join("-"),
    capacity ?? "?",
    ram ?? "?",
  ].join("|");
}
