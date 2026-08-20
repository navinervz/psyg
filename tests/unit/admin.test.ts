import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyOverrides } from "@/lib/admin-store";
import type { Product } from "@/lib/types";

/**
 * محافظ پنل مدیریت.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این تست وجود دارد
 * ─────────────────────────────────────────────────────────────────────
 * پنل ادمین تنها جای سایت است که می‌تواند داده را **بنویسد**. بقیه‌ی
 * سایت فقط می‌خواند. یعنی اگر جایی از این مسیر باز بماند، مهاجم می‌تواند
 * محصول جعلی با لینک افیلیت خودش اضافه کند — و کاربران ما را بفرستد جایی
 * که ما اصلاً نمی‌دانیم کجاست.
 *
 * دو چیز اینجا قفل می‌شود: اینکه بدون رمز کاری نمی‌شود کرد، و اینکه
 * تغییرات ادمین از همگام‌سازی بعدی جان سالم به در می‌برند.
 */

const ROOT = process.cwd();
const AUTH = readFileSync(join(ROOT, "src", "lib", "admin-auth.ts"), "utf8");
const PRODUCTS_ROUTE = readFileSync(
  join(ROOT, "src", "app", "api", "admin", "products", "route.ts"),
  "utf8",
);
const LOGIN_ROUTE = readFileSync(
  join(ROOT, "src", "app", "api", "admin", "login", "route.ts"),
  "utf8",
);
const MIDDLEWARE = readFileSync(join(ROOT, "src", "middleware.ts"), "utf8");
const ROBOTS = readFileSync(join(ROOT, "src", "app", "robots.ts"), "utf8");
const DATA = readFileSync(join(ROOT, "src", "lib", "data.ts"), "utf8");

function product(id: string, title = "کالا"): Product {
  return {
    id,
    slug: id,
    title,
    image: "https://example.com/a.jpg",
    store: "digikala",
    category: "mobile",
    brand: "X",
    sourceUrl: "https://example.com",
    currentPrice: 1000,
    previousPrice: 1000,
    history: [{ t: "2026-08-16", price: 1000 }],
  };
}

describe("لایه‌ی بازنویسی ادمین", () => {
  test("محصول پنهان‌شده از سایت حذف می‌شود", () => {
    const result = applyOverrides(
      [product("a"), product("b")],
      { hidden: ["a"], manual: [], updatedAt: "" },
    );
    assert.deepEqual(result.map((p) => p.id), ["b"]);
  });

  test("محصول دستی به کاتالوگ اضافه می‌شود", () => {
    const result = applyOverrides(
      [product("a")],
      { hidden: [], manual: [product("m-1")], updatedAt: "" },
    );
    assert.deepEqual(result.map((p) => p.id), ["a", "m-1"]);
  });

  test("محصول دستی هم قابل پنهان کردن است", () => {
    /*
      اگر ترتیب اعمال برعکس بود — اول افزودن بعد پنهان کردن — ادمین
      نمی‌توانست محصول دستی خودش را موقتاً از سایت بردارد.
    */
    const result = applyOverrides(
      [product("a")],
      { hidden: ["m-1"], manual: [product("m-1")], updatedAt: "" },
    );
    assert.deepEqual(result.map((p) => p.id), ["a"]);
  });

  test("نسخه‌ی دستی بر نسخه‌ی افیلیو اولویت دارد", () => {
    const result = applyOverrides(
      [product("x", "نسخه‌ی افیلیو")],
      { hidden: [], manual: [product("x", "نسخه‌ی دستی")], updatedAt: "" },
    );
    assert.equal(result.length, 1, "نباید دوبار بیاید");
    assert.equal(result[0].title, "نسخه‌ی دستی");
  });

  test("بدون هیچ بازنویسی، کاتالوگ دست‌نخورده می‌ماند", () => {
    const catalog = [product("a"), product("b")];
    const result = applyOverrides(catalog, { hidden: [], manual: [], updatedAt: "" });
    assert.deepEqual(result.map((p) => p.id), ["a", "b"]);
  });
});

describe("تغییرات ادمین از همگام‌سازی جان سالم به در می‌برند", () => {
  test("بازنویسی‌ها در فایل جدا از کاتالوگ ذخیره می‌شوند", () => {
    /*
      ورک‌فلوی همگام‌سازی هر بار کل `catalog.json` را بازنویسی می‌کند.
      اگر حذف‌ها و افزوده‌های دستی همان‌جا بودند، اولین اجرای بعدی
      پاکشان می‌کرد و ادمین باید همه را دوباره وارد می‌کرد.
    */
    const store = readFileSync(join(ROOT, "src", "lib", "admin-store.ts"), "utf8");
    assert.match(store, /admin\.json/, "بازنویسی‌ها باید فایل خودشان را داشته باشند");

    /*
      کامنت‌ها حذف می‌شوند قبل از بررسی.

      نسخه‌ی اول این تست روی متن خام کار می‌کرد و به‌خاطر همین توضیحی که
      *دلیل* جدا بودن دو فایل را شرح می‌داد قرمز شد. تستی که نوشتن
      مستندات را جریمه کند، تست بدی است.
    */
    const code = store
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\/\/.*$/gm, "");

    assert.doesNotMatch(
      code,
      /catalog\.json/,
      "لایه‌ی ادمین نباید به فایل کاتالوگ دست بزند",
    );
  });

  test("سایت هنگام خواندن، لایه‌ی ادمین را اعمال می‌کند", () => {
    assert.match(DATA, /applyOverrides/, "بدون این، پنهان کردن هیچ اثری ندارد");
  });
});

describe("امنیت پنل مدیریت", () => {
  test("بدون رمز، پنل کاملاً غیرفعال است", () => {
    // همان الگوی MCP و ingest: فراموش کردن تنظیم رمز یعنی بسته، نه باز
    assert.match(AUTH, /if \(!value \|\| value\.length < MIN_PASSWORD_LENGTH\) return null/);
    assert.match(LOGIN_ROUTE, /isAdminEnabled\(\)/);
    assert.match(LOGIN_ROUTE, /status: 503/);
  });

  test("هر عملیات نوشتن، بلیت معتبر می‌خواهد", () => {
    /*
      این مهم‌ترین تست این فایل است. هر متدی که داده را عوض می‌کند باید
      اول `authorized()` را صدا بزند. اگر روزی متد جدیدی اضافه شد و این
      خط یادش رفت، تعداد پایین می‌آید و تست قرمز می‌شود.
    */
    const writeMethods = PRODUCTS_ROUTE.match(
      /export async function (POST|PATCH|DELETE|PUT)/g,
    );
    assert.ok(writeMethods, "روت باید متد نوشتن داشته باشد");

    const guards = PRODUCTS_ROUTE.match(/if \(!\(await authorized\(\)\)\) return unauthorized\(\)/g);
    assert.equal(
      guards?.length,
      writeMethods.length,
      `${writeMethods.length} متد نوشتن هست ولی ${guards?.length ?? 0} نگهبان — یکی بدون احراز هویت مانده`,
    );
  });

  test("مقایسه‌ی رمز و امضا مقاوم در برابر حمله‌ی زمانی است", () => {
    assert.match(AUTH, /timingSafeEqual/);
    assert.doesNotMatch(
      AUTH,
      /input === secret|signature === sign/,
      "مقایسه‌ی معمولی رشته، طول رمز را از روی زمان پاسخ لو می‌دهد",
    );
  });

  test("کوکی از دسترس جاوااسکریپت صفحه خارج است", () => {
    assert.match(AUTH, /httpOnly: true/);
    assert.match(AUTH, /sameSite: "lax"/);
    assert.match(AUTH, /secure: process\.env\.NODE_ENV === "production"/);
  });

  test("رمز خودش داخل کوکی نمی‌رود", () => {
    /*
      اگر رمز در کوکی می‌رفت، هر کسی که یک بار کوکی را می‌دید رمز را
      داشت. بلیت امضاشده این مشکل را ندارد.
    */
    assert.match(AUTH, /createHmac/);
    assert.doesNotMatch(
      AUTH,
      /cookies\(\)\.set\([^)]*secret/,
      "رمز نباید در کوکی نوشته شود",
    );
  });

  test("بلیت تاریخ انقضا دارد و منقضی رد می‌شود", () => {
    assert.match(AUTH, /at > Date\.now\(\)/);
  });

  test("ورود محدودیت نرخ دارد", () => {
    assert.match(
      MIDDLEWARE,
      /prefix: "\/api\/admin\/login"/,
      "بدون سقف، حدس زدن رمز فقط مسئله‌ی زمان است",
    );
  });

  test("پنل از خزش گوگل خارج است", () => {
    assert.match(ROBOTS, /"\/admin"/);
  });

  test("ورودی محصول دستی اعتبارسنجی می‌شود", () => {
    // بدون این، می‌شد لینک `javascript:` یا `http://` ساده تزریق کرد
    assert.match(PRODUCTS_ROUTE, /\^https:\\\/\\\//);
    assert.match(PRODUCTS_ROUTE, /CATEGORIES\.includes\(category\)/);
    assert.match(PRODUCTS_ROUTE, /STORES\.includes\(store\)/);
  });
});
