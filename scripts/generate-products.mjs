/**
 * تولید کاتالوگ محصولات با تاریخچه‌ی قیمت ۳۰ روزه.
 *
 * چرا اسکریپت و نه JSON دستی؟ چون ۳۰ نقطه قیمت × ده‌ها محصول را
 * دستی نوشتن هم خسته‌کننده است هم غیرواقعی درمی‌آید. اینجا از یک
 * random با seed ثابت استفاده می‌کنیم تا خروجی همیشه یکسان باشد
 * (تست‌ها به داده‌ی ثابت نیاز دارند).
 *
 * اجرا:  node scripts/generate-products.mjs
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "data", "products.json");

/** mulberry32 — PRNG کوچک با seed ثابت برای خروجی تکرارپذیر */
function makeRandom(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAYS = 30;
const END_DATE = new Date("2026-07-26T00:00:00Z");

/**
 * محصولات پایه. همه از دیجی‌کالا — طبق تصمیم فاز اول.
 * `trend` جهت کلی حرکت قیمت در ۳۰ روز اخیر است.
 */
const CATALOG = [
  // ── هدفون و هدست ────────────────────────────────────────────────
  { slug: "airpods-pro-2", title: "AirPods Pro 2", category: "headphone", brand: "apple", dkp: "dkp-3901234", start: 11890000, end: 9190000 },
  { slug: "sony-wh-1000xm5", title: "Sony WH-1000XM5", category: "headphone", brand: "sony", dkp: "dkp-4412876", start: 17900000, end: 19290000 },
  { slug: "airpods-4-anc", title: "AirPods 4 با نویز کنسلینگ", category: "headphone", brand: "apple", dkp: "dkp-9120044", start: 8900000, end: 7450000 },
  { slug: "bose-quietcomfort-ultra", title: "Bose QuietComfort Ultra", category: "headphone", brand: "bose", dkp: "dkp-7733201", start: 24500000, end: 22100000 },
  { slug: "jbl-tune-770nc", title: "JBL Tune 770NC", category: "headphone", brand: "jbl", dkp: "dkp-5510923", start: 4290000, end: 3690000 },

  // ── گوشی موبایل ─────────────────────────────────────────────────
  { slug: "iphone-15-pro-max-256gb", title: "iPhone 15 Pro Max 256GB", category: "mobile", brand: "apple", dkp: "dkp-8123456", start: 68900000, end: 74900000 },
  { slug: "galaxy-s24-ultra-256gb", title: "Samsung Galaxy S24 Ultra 256GB", category: "mobile", brand: "samsung", dkp: "dkp-8890012", start: 62900000, end: 55400000 },
  { slug: "galaxy-a55-128gb", title: "Samsung Galaxy A55 128GB", category: "mobile", brand: "samsung", dkp: "dkp-6620188", start: 19900000, end: 16750000 },
  { slug: "iphone-16-128gb", title: "iPhone 16 128GB", category: "mobile", brand: "apple", dkp: "dkp-9901122", start: 51900000, end: 48300000 },
  { slug: "xiaomi-redmi-note-14-pro", title: "Xiaomi Redmi Note 14 Pro", category: "mobile", brand: "xiaomi", dkp: "dkp-7011456", start: 14900000, end: 12480000 },
  { slug: "galaxy-z-flip6", title: "Samsung Galaxy Z Flip6", category: "mobile", brand: "samsung", dkp: "dkp-8845571", start: 71900000, end: 76200000 },

  // ── لپ‌تاپ ──────────────────────────────────────────────────────
  { slug: "asus-tuf-gaming-a15", title: "ASUS TUF Gaming A15", category: "laptop", brand: "asus", dkp: "dkp-4470912", start: 49900000, end: 40900000 },
  { slug: "asus-rog-strix-g16", title: "ASUS ROG Strix G16", category: "laptop", brand: "asus", dkp: "dkp-4471180", start: 89900000, end: 82400000 },
  { slug: "asus-vivobook-16", title: "ASUS Vivobook 16", category: "laptop", brand: "asus", dkp: "dkp-4468833", start: 32900000, end: 28650000 },
  { slug: "macbook-air-m3-13", title: "MacBook Air M3 13 اینچ", category: "laptop", brand: "apple", dkp: "dkp-9950231", start: 76900000, end: 71200000 },
  { slug: "lenovo-ideapad-slim-5", title: "Lenovo IdeaPad Slim 5", category: "laptop", brand: "lenovo", dkp: "dkp-3320987", start: 36900000, end: 39400000 },

  // ── ساعت و پوشیدنی ──────────────────────────────────────────────
  { slug: "galaxy-watch6-classic", title: "Galaxy Watch6 Classic", category: "wearable", brand: "samsung", dkp: "dkp-6612340", start: 15900000, end: 13499000 },
  { slug: "apple-watch-series-10", title: "Apple Watch Series 10", category: "wearable", brand: "apple", dkp: "dkp-9977123", start: 34900000, end: 31200000 },
  { slug: "xiaomi-smart-band-9", title: "Xiaomi Smart Band 9", category: "wearable", brand: "xiaomi", dkp: "dkp-7018820", start: 2490000, end: 1990000 },
  { slug: "galaxy-watch-fe", title: "Samsung Galaxy Watch FE", category: "wearable", brand: "samsung", dkp: "dkp-6618890", start: 9900000, end: 8450000 },

  // ── کنسول بازی ──────────────────────────────────────────────────
  { slug: "playstation-5-slim", title: "PlayStation 5 Slim", category: "console", brand: "sony", dkp: "dkp-7654321", start: 26900000, end: 21590000 },
  { slug: "playstation-5-pro", title: "PlayStation 5 Pro", category: "console", brand: "sony", dkp: "dkp-7659988", start: 58900000, end: 61400000 },
  { slug: "xbox-series-x", title: "Xbox Series X", category: "console", brand: "microsoft", dkp: "dkp-5540019", start: 39900000, end: 35700000 },
  { slug: "nintendo-switch-oled", title: "Nintendo Switch OLED", category: "console", brand: "nintendo", dkp: "dkp-5583311", start: 22900000, end: 20100000 },

  // ── تبلت ────────────────────────────────────────────────────────
  { slug: "ipad-air-m2-11", title: "iPad Air M2 11 اینچ", category: "tablet", brand: "apple", dkp: "dkp-9930012", start: 44900000, end: 40100000 },
  { slug: "galaxy-tab-s9-fe", title: "Samsung Galaxy Tab S9 FE", category: "tablet", brand: "samsung", dkp: "dkp-6690455", start: 26900000, end: 23400000 },
  { slug: "xiaomi-pad-7", title: "Xiaomi Pad 7", category: "tablet", brand: "xiaomi", dkp: "dkp-7022119", start: 17900000, end: 15200000 },

  // ── لوازم جانبی ─────────────────────────────────────────────────
  { slug: "anker-powerbank-20000", title: "پاوربانک انکر ۲۰۰۰۰ میلی‌آمپر", category: "accessory", brand: "anker", dkp: "dkp-2210567", start: 3290000, end: 2690000 },
  { slug: "logitech-mx-master-3s", title: "ماوس Logitech MX Master 3S", category: "accessory", brand: "logitech", dkp: "dkp-2298811", start: 6900000, end: 5950000 },
  { slug: "samsung-t7-ssd-1tb", title: "SSD اکسترنال Samsung T7 یک ترابایت", category: "accessory", brand: "samsung", dkp: "dkp-6601239", start: 8900000, end: 9650000 },
  { slug: "apple-magsafe-charger", title: "شارژر MagSafe اپل", category: "accessory", brand: "apple", dkp: "dkp-9910077", start: 2890000, end: 2390000 },
];

/** تولید تاریخچه‌ی قیمت با نوسان واقعی بین دو قیمت شروع و پایان */
function buildHistory(start, end, random) {
  const points = [];
  const totalDrift = end - start;

  for (let i = 0; i < DAYS; i++) {
    const progress = i / (DAYS - 1);

    // حرکت اصلی + نویز روزانه + یک موج آرام برای طبیعی شدن نمودار
    const base = start + totalDrift * progress;
    const noise = (random() - 0.5) * Math.abs(start) * 0.025;
    const wave = Math.sin(progress * Math.PI * 2.4) * Math.abs(start) * 0.012;

    const raw = i === DAYS - 1 ? end : base + noise + wave;

    // گرد کردن به نزدیک‌ترین ۱۰ هزار تومان — مثل قیمت‌گذاری واقعی فروشگاه‌ها
    const price = Math.max(10000, Math.round(raw / 10000) * 10000);

    const date = new Date(END_DATE);
    date.setUTCDate(date.getUTCDate() - (DAYS - 1 - i));

    points.push({ t: date.toISOString().slice(0, 10), price });
  }

  // نقطه‌ی آخر باید دقیقاً قیمت فعلی باشد
  points[points.length - 1].price = end;
  return points;
}

const products = CATALOG.map((item, index) => {
  const random = makeRandom(1000 + index * 37);
  const history = buildHistory(item.start, item.end, random);

  // «قیمت قبلی» = قیمت هفت روز پیش، نه قیمت ۳۰ روز پیش.
  // این عدد است که در کارت خط‌خورده نمایش داده می‌شود.
  const previousPrice = history[history.length - 8].price;

  return {
    id: `dk-${item.slug}`,
    slug: item.slug,
    title: item.title,
    image: `/products/${item.slug}.png`,
    store: "digikala",
    category: item.category,
    brand: item.brand,
    sourceUrl: `https://www.digikala.com/product/${item.dkp}/`,
    currentPrice: item.end,
    previousPrice,
    history,
  };
});

writeFileSync(OUT, JSON.stringify(products, null, 2) + "\n", "utf8");

const drops = products.filter((p) => p.currentPrice < p.previousPrice).length;
console.log(`✓ ${products.length} محصول نوشته شد در ${OUT}`);
console.log(`  ${drops} کاهش قیمت، ${products.length - drops} افزایش قیمت`);
