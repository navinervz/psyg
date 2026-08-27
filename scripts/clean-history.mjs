#!/usr/bin/env node
/**
 * پاک‌سازی یک‌باره‌ی نقطه‌های آلوده‌ی تاریخچه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * تا پیش از اصلاح `toProduct`، سقف «تخفیف باورپذیر» به فیلد
 * `discount_percent` افیلیو نگاه می‌کرد. آن فیلد گاهی با قیمت‌های خودِ
 * همان رکورد نمی‌خواند، پس تخفیف‌های ساختگی از فیلتر رد می‌شدند.
 *
 * نمونه‌ی واقعی: تبلتی که فروشنده قیمت اصلی‌اش را ۱۰ میلیون گذاشته بود
 * و «۳۱۰٬۰۰۰ تومان» می‌فروخت. ما آن ۳۱۰ هزار را به‌عنوان قیمت روز ثبت
 * کردیم — یعنی یک نقطه‌ی دروغ وارد تاریخچه شد.
 *
 * کد اصلاح شده، ولی نقطه‌های ثبت‌شده سر جایشان می‌مانند. تا وقتی در
 * پنجره‌ی ۳۰ روزه باشند، نمودار و «کف قیمت» را خراب می‌کنند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * قاعده‌ی حذف
 * ─────────────────────────────────────────────────────────────────────
 * نقطه‌ای حذف می‌شود که بیش از ۷۰٪ زیر بیشترین قیمت ثبت‌شده‌ی همان
 * محصول باشد — دقیقاً همان آستانه‌ای که `MAX_BELIEVABLE_DISCOUNT` برای
 * تخفیف به کار می‌برد.
 *
 * این یعنی افت واقعی ۷۰ درصدی هم حذف می‌شود. می‌پذیریم، چون فرضش همان
 * فرض جای دیگر است: افت واقعی در این ابعاد وجود ندارد. اگر روزی داشت،
 * از دست دادن یک نقطه از نشان دادن نمودار جعلی بهتر است.
 *
 * ─────────────────────────────────────────────────────────────────────
 * اجرا
 * ─────────────────────────────────────────────────────────────────────
 *   بازبینی (چیزی نمی‌نویسد):
 *     docker exec psyg-web node /app/scripts/clean-history.mjs
 *
 *   اعمال:
 *     docker exec psyg-web node /app/scripts/clean-history.mjs --apply
 *
 * پیش‌فرض عمداً «بازبینی» است. اسکریپتی که مستقیم می‌نویسد، دیر یا زود
 * روی داده‌ای اجرا می‌شود که نباید.
 */

import { readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";

const DATA_DIR = process.env.PSYG_DATA_DIR ?? "/data";
const CATALOG = join(DATA_DIR, "catalog.json");

/** همان عددی که در `affilio.ts` تخفیف را باورناپذیر می‌کند */
const MAX_BELIEVABLE_DISCOUNT = 70;

const apply = process.argv.includes("--apply");

const fa = (n) => n.toLocaleString("fa-IR");

function cleanPoints(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return { kept: points ?? [], dropped: [] };
  }

  const highest = Math.max(...points.map((p) => p.price));
  const floor = highest * (1 - MAX_BELIEVABLE_DISCOUNT / 100);

  const kept = [];
  const dropped = [];
  for (const point of points) {
    (point.price >= floor ? kept : dropped).push(point);
  }

  /*
    اگر پاک‌سازی همه‌چیز را برداشت، دست نمی‌زنیم.

    محصولی با تاریخچه‌ی خالی از محصولی با تاریخچه‌ی مشکوک بدتر نیست —
    ولی این حالت یعنی فرض ما درباره‌ی آن محصول غلط بوده، و در آن صورت
    بهتر است آدم نگاهش کند تا اسکریپت.
  */
  if (kept.length === 0) return { kept: points, dropped: [], suspicious: true };

  return { kept, dropped };
}

const raw = await readFile(CATALOG, "utf8");
const catalog = JSON.parse(raw);

let touched = 0;
let removed = 0;
const suspicious = [];

for (const product of catalog.products ?? []) {
  const { kept, dropped, suspicious: odd } = cleanPoints(product.history);

  if (odd) {
    suspicious.push(product.title);
    continue;
  }

  if (dropped.length === 0) continue;

  touched += 1;
  removed += dropped.length;

  console.log(`\n${product.title.slice(0, 60)}`);
  for (const point of dropped) {
    console.log(`  حذف: ${point.t} — ${fa(point.price)} تومان`);
  }

  product.history = kept;

  /*
    `previousPrice` هم باید بازحساب شود، وگرنه به نقطه‌ای اشاره می‌ماند
    که دیگر وجود ندارد و صفحه درصدی نشان می‌دهد که پشتش داده‌ای نیست.
  */
  const past = kept.filter((p) => p.price !== product.currentPrice);
  product.previousPrice = past.at(-1)?.price ?? product.currentPrice;
}

// آرشیو هم همان داده را دارد و همان مشکل
for (const entry of catalog.archive ?? []) {
  const { kept, dropped } = cleanPoints(entry.points);
  if (dropped.length > 0) {
    removed += dropped.length;
    entry.points = kept;
  }
}

console.log(
  `\n${touched} محصول، ${removed} نقطه‌ی مشکوک${apply ? " حذف شد" : " پیدا شد"}.`,
);

if (suspicious.length > 0) {
  console.log(
    `\n${suspicious.length} محصول دست‌نخورده ماند چون پاک‌سازی کل تاریخچه‌شان را می‌برد:`,
  );
  for (const title of suspicious.slice(0, 10)) {
    console.log(`  ${title.slice(0, 60)}`);
  }
}

if (!apply) {
  console.log("\nبازبینی بود؛ چیزی نوشته نشد. برای اعمال: --apply");
  process.exit(0);
}

if (removed === 0) {
  console.log("چیزی برای حذف نبود.");
  process.exit(0);
}

/*
  نوشتن اتمیک، مثل `writeCatalog`. اگر وسط کار چیزی قطع شود، فایل اصلی
  دست‌نخورده می‌ماند به‌جای اینکه نصفه بنویسد.
*/
const temp = `${CATALOG}.clean.tmp`;
await writeFile(temp, JSON.stringify(catalog), "utf8");
await rename(temp, CATALOG);

console.log("نوشته شد.");
