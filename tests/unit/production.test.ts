import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * محافظ آمادگی پروداکشن.
 *
 * این تست‌ها از یک ممیزی «آیا این سایت آماده‌ی استفاده‌ی عمومی است؟»
 * بیرون آمدند. هر کدام یک شکاف واقعی را می‌بندد، نه یک بهترین‌روش
 * عمومی.
 */

const ROOT = process.cwd();
const MIDDLEWARE = readFileSync(join(ROOT, "src", "middleware.ts"), "utf8");

describe("هر اندپوینتی که هزینه یا داده‌ی حساس دارد سقف دارد", () => {
  /*
    پیش‌فرض ۶۰ درخواست در دقیقه برای صفحه‌های عادی منطقی است، ولی برای
    اندپوینتی که هر فراخوانی‌اش یک درخواست به مدل زبانی است یعنی اجازه‌ی
    سوزاندن سهمیه‌ی کلیدها. و برای اندپوینتی که ایمیل آدم‌های واقعی
    برمی‌گرداند یعنی اجازه‌ی استخراج فهرست.
  */
  const costly = [
    { path: "/api/assistant", why: "هر فراخوانی یک درخواست به مدل زبانی است" },
    { path: "/api/subscribers", why: "خروجی‌اش ایمیل آدم‌های واقعی است" },
    { path: "/api/admin/login", why: "تنها جایی که رمز را می‌سنجد" },
    { path: "/api/ingest", why: "هر فراخوانی چند درخواست به افیلیو می‌فرستد" },
    { path: "/api/content", why: "محتوا روی سایت منتشر می‌کند" },
  ];

  for (const { path, why } of costly) {
    test(`${path} سقف اختصاصی دارد`, () => {
      const match = new RegExp(
        `prefix: "${path.replace(/\//g, "\\/")}", max: (\\d+)`,
      ).exec(MIDDLEWARE);

      assert.ok(match, `${path} سقف ندارد — ${why}`);

      const max = Number(match[1]);
      assert.ok(
        max <= 20,
        `سقف ${path} برابر ${max} است؛ برای «${why}» زیادی بالاست`,
      );
    });
  }

  test("هر اندپوینت API یا سقف دارد یا فقط-خواندنی است", () => {
    /*
      اگر روزی اندپوینت جدیدی اضافه شود و کسی یادش برود سقف بگذارد،
      این تست پیدایش می‌کند.
    */
    const apiDir = join(ROOT, "src", "app", "api");
    const endpoints = readdirSync(apiDir);

    // این‌ها عمداً روی پیش‌فرض می‌مانند: خواندنی، ارزان، و بدون داده‌ی حساس
    const readOnly = new Set(["search", "health", "mcp"]);

    const missing = endpoints.filter((name) => {
      if (readOnly.has(name)) return false;
      return !MIDDLEWARE.includes(`/api/${name}`);
    });

    assert.deepEqual(missing, [], `این اندپوینت‌ها سقف ندارند: ${missing}`);
  });
});

describe("داده‌ی غیرقابل‌بازسازی پشتیبان دارد", () => {
  test("اسکریپت پشتیبان‌گیری وجود دارد", () => {
    /*
      تاریخچه‌ی قیمت قابل بازسازی نیست: افیلیو فقط قیمت امروز را
      می‌دهد. اگر والیوم از بین برود، هفته‌ها داده و نمودارها و
      هشدارها — یعنی کل ارزش سایت — از صفر شروع می‌کنند.

      فهرست مشترکان هم قابل بازسازی نیست و متعلق به آدم‌های دیگری است.
    */
    const script = join(ROOT, "scripts", "backup.sh");
    assert.ok(existsSync(script), "اسکریپت پشتیبان‌گیری وجود ندارد");

    const source = readFileSync(script, "utf8");
    assert.match(source, /\/data/, "باید از مسیر داده پشتیبان بگیرد");
    assert.match(source, /KEEP_DAYS/, "باید نسخه‌های قدیمی را پاک کند");
  });

  test("پشتیبان خالی نگه داشته نمی‌شود", () => {
    /*
      آرشیو خالی از نداشتن پشتیبان بدتر است، چون بعداً فکر می‌کنی
      پشتیبان داری در حالی که نداری.
    */
    const source = readFileSync(join(ROOT, "scripts", "backup.sh"), "utf8");
    assert.match(source, /size.*-lt|lt.*size/, "باید حجم آرشیو را بسنجد");
    assert.match(source, /rm -f "\$target"/, "آرشیو مشکوک باید حذف شود");
  });
});

describe("خرابی قابل تشخیص است", () => {
  test("اندپوینت سلامت وجود دارد", () => {
    assert.ok(
      existsSync(join(ROOT, "src", "app", "api", "health", "route.ts")),
      "بدون این، تنها راه فهمیدن خرابی سر زدن دستی است",
    );
  });

  test("سلامت چیزی معنادار می‌سنجد، نه فقط بالا بودن سرور", () => {
    /*
      اندپوینتی که همیشه `{ok:true}` می‌دهد بی‌فایده است. سایت می‌تواند
      بالا باشد و کاتالوگ خالی یا داده‌ی نمونه سرو کند — دقیقاً همان
      چیزی که یک بار ماه‌ها ادامه داشت و هیچ تستی نگرفتش.
    */
    const source = readFileSync(
      join(ROOT, "src", "app", "api", "health", "route.ts"),
      "utf8",
    );

    assert.match(source, /catalog_empty/, "باید کاتالوگ خالی را بگیرد");
    assert.match(source, /serving_seed_data/, "باید داده‌ی نمونه را بگیرد");
    assert.match(source, /catalog_stale/, "باید کهنه بودن داده را بگیرد");
    assert.match(source, /status: healthy \? 200 : 503/, "باید ۵۰۳ بدهد");
  });

  test("خطای لایوت ریشه صفحه‌ی خام مرورگر نشان نمی‌دهد", () => {
    const path = join(ROOT, "src", "app", "global-error.tsx");
    assert.ok(existsSync(path), "global-error.tsx وجود ندارد");

    const source = readFileSync(path, "utf8");
    assert.match(source, /<html lang="fa" dir="rtl">/, "باید تگ html خودش را داشته باشد");
    assert.match(source, /reset/, "باید راه تلاش دوباره بدهد");
  });

  test("صفحه‌ی خطا جزئیات فنی را به کاربر نشان نمی‌دهد", () => {
    /*
      پیام خطای خام می‌تواند مسیر فایل‌های سرور یا ساختار داخلی را لو
      دهد، و برای کاربر هم هیچ کمکی نیست.
    */
    const source = readFileSync(
      join(ROOT, "src", "app", "global-error.tsx"),
      "utf8",
    );
    assert.doesNotMatch(source, /\{error\.message\}|\{error\.stack\}/);
  });
});
