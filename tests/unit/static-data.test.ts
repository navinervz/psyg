import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * محافظ در برابر پیش‌رندر شدن داده‌ی زنده.
 *
 * ─────────────────────────────────────────────────────────────────────
 * باگی که این تست از آن متولد شد
 * ─────────────────────────────────────────────────────────────────────
 * صفحه‌ی اصلی سایت محصولاتی مثل «AirPods Pro 2» و «PlayStation 5 Slim»
 * را نشان می‌داد که هیچ‌کدام وجود نداشتند — داده‌ی نمونه‌ی دوران توسعه.
 * سایت‌مپ هم ۳۱ آدرس مرده به گوگل می‌داد و هیچ‌کدام از ۸۰ محصول واقعی
 * را نداشت.
 *
 * زنجیره‌ی علت:
 *
 *   ۱. کاتالوگ در زمان اجرا از `/data/catalog.json` خوانده می‌شود.
 *   ۲. آن مسیر یک والیوم داکر است و فقط موقع **اجرا** مانت می‌شود.
 *   ۳. موقع **بیلد** وجود ندارد، پس `data.ts` به داده‌ی نمونه برمی‌گردد.
 *   ۴. هر صفحه‌ای که Next در زمان بیلد پیش‌رندر می‌کرد، آن داده‌ی نمونه
 *      را برای همیشه در HTML خودش حک می‌کرد.
 *
 * چرا ماه‌ها می‌توانست دیده نشود: `/deals` و صفحه‌ی محصول `force-dynamic`
 * داشتند و درست کار می‌کردند. یعنی هر بار که کسی سایت را چک می‌کرد،
 * محصولات واقعی را می‌دید — فقط نه در صفحه‌ی اول.
 *
 * هیچ خطایی هم جایی ثبت نمی‌شد. این تست تنها چیزی است که چنین حالتی را
 * پیدا می‌کند.
 */

const APP = join(process.cwd(), "src", "app");

/** چیزهایی که از کاتالوگ یا مقاله‌های زنده می‌آیند */
const LIVE_EXPORTS = [
  "products",
  "articles",
  "alerts",
  "suggestions",
  "getProduct",
  "productsByCategory",
  "productsByStore",
  "relatedProducts",
  "searchProducts",
  "topDeals",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

/** فقط فایل‌هایی که واقعاً یک مسیر می‌سازند */
function isRouteFile(path: string): boolean {
  const name = path.split(sep).pop() ?? "";
  return ["page.tsx", "route.ts", "sitemap.ts"].includes(name);
}

/** چه چیزهایی از `@/lib/data` ایمپورت شده‌اند */
function liveImports(source: string): string[] {
  const match = /import\s*\{([^}]+)\}\s*from\s*["']@\/lib\/data["']/.exec(source);
  if (!match) return [];

  return match[1]
    .split(",")
    .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
    .filter((name) => LIVE_EXPORTS.includes(name));
}

function isDynamic(source: string): boolean {
  // یا صریحاً پویاست، یا با ISR به‌مرور تازه می‌شود
  return (
    /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(source) ||
    /export\s+const\s+revalidate\s*=\s*\d+/.test(source)
  );
}

const routeFiles = walk(APP).filter(isRouteFile);

describe("داده‌ی زنده هرگز در زمان بیلد حک نمی‌شود", () => {
  test("مسیرهای بررسی‌شده واقعاً پیدا شده‌اند", () => {
    // اگر روزی ساختار پوشه‌ها عوض شد، این تست نباید بی‌صدا خالی بماند
    assert.ok(routeFiles.length > 15, `فقط ${routeFiles.length} مسیر پیدا شد`);
  });

  test("هر مسیری که کاتالوگ زنده می‌خواند، پویا رندر می‌شود", () => {
    const guilty: string[] = [];

    for (const file of routeFiles) {
      const source = readFileSync(file, "utf8");
      const live = liveImports(source);
      if (live.length === 0) continue;
      if (isDynamic(source)) continue;

      guilty.push(`${relative(process.cwd(), file)} — ${live.join(", ")}`);
    }

    assert.deepEqual(
      guilty,
      [],
      "این مسیرها داده‌ی زنده می‌خوانند ولی در زمان بیلد پیش‌رندر می‌شوند،\n" +
        "پس داده‌ی نمونه را برای همیشه در HTML حک می‌کنند:\n  " +
        guilty.join("\n  "),
    );
  });

  test("سایت‌مپ پویاست", () => {
    /*
      این جداگانه بررسی می‌شود چون بدترین حالتش سکوت مطلق است: کاربر
      هیچ‌وقت متوجه نمی‌شود، فقط گوگل ۳۱ آدرس ۴۰۴ می‌گیرد و رتبه‌ی سایت
      بی‌دلیل پایین می‌آید.
    */
    const source = readFileSync(join(APP, "sitemap.ts"), "utf8");
    assert.ok(isDynamic(source), "سایت‌مپ باید در زمان درخواست ساخته شود");
  });

  test("صفحه‌ی اصلی پویاست", () => {
    const source = readFileSync(join(APP, "page.tsx"), "utf8");
    assert.ok(isDynamic(source), "صفحه‌ی اصلی مهم‌ترین جایی است که نباید کهنه شود");
  });
});

describe("خودِ تست سالم است", () => {
  test("ایمپورت داده‌ی زنده را واقعاً تشخیص می‌دهد", () => {
    assert.deepEqual(
      liveImports(`import { products, categories } from "@/lib/data";`),
      ["products"],
      "باید فقط داده‌ی زنده را بگیرد، نه داده‌ی مرجع ثابت",
    );
    assert.deepEqual(liveImports(`import { cn } from "@/lib/cn";`), []);
  });

  test("هر دو حالت پویا را قبول می‌کند", () => {
    assert.ok(isDynamic(`export const dynamic = "force-dynamic";`));
    assert.ok(isDynamic(`export const revalidate = 900;`));
    assert.ok(!isDynamic(`export const dynamicParams = false;`));
  });
});
