import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * محافظ خبرنامه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * باگی که این تست از آن متولد شد
 * ─────────────────────────────────────────────────────────────────────
 * `/api/subscribe` ایمیل را اعتبارسنجی می‌کرد، بعد `console.info` صدا
 * می‌زد و به کاربر می‌گفت «ثبت شد! فرصت‌های داغ رو برات می‌فرستیم».
 *
 * هیچ‌کدامش درست نبود. ایمیل ذخیره نمی‌شد، با ری‌استارت بعدی کانتینر
 * لاگ هم می‌رفت، و هیچ فرصتی هرگز فرستاده نمی‌شد.
 *
 * تست e2e هم سبز بود، چون فقط می‌سنجید که پاسخ ۲۰۰ باشد.
 */

const ROOT = process.cwd();
const SUBSCRIBE = readFileSync(
  join(ROOT, "src", "app", "api", "subscribe", "route.ts"),
  "utf8",
);
const LIST = readFileSync(
  join(ROOT, "src", "app", "api", "subscribers", "route.ts"),
  "utf8",
);
const STORE = readFileSync(
  join(ROOT, "src", "lib", "subscriber-store.ts"),
  "utf8",
);
const UNSUB = readFileSync(
  join(ROOT, "src", "app", "unsubscribe", "page.tsx"),
  "utf8",
);

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("ایمیل ثبت‌شده واقعاً ذخیره می‌شود", () => {
  test("اندپوینت ثبت‌نام به فضای ذخیره‌سازی می‌نویسد", () => {
    assert.match(stripComments(SUBSCRIBE), /addSubscriber\(email\)/);
  });

  test("لاگ کردن جایگزین ذخیره کردن نشده", () => {
    /*
      این دقیقاً همان چیزی است که قبلاً بود. اگر روزی کسی برای
      «ساده‌تر شدن» به آن برگشت، اینجا قرمز می‌شود.
    */
    assert.doesNotMatch(
      stripComments(SUBSCRIBE),
      /console\.(info|log)\([^)]*email/,
      "ایمیل نباید فقط در لاگ نوشته شود",
    );
  });

  test("اگر ذخیره نشد، به کاربر «ثبت شد» نمی‌گوییم", () => {
    /*
      وسوسه‌ی نشان دادن پیام موفقیت و لاگ کردن بی‌صدای خطا زیاد است —
      تجربه‌ی کاربر روان‌تر به‌نظر می‌رسد. ولی همان کاری است که این باگ
      را ساخت.
    */
    const code = stripComments(SUBSCRIBE);
    assert.match(code, /catch \{[\s\S]*?status: 503/, "خطا باید به کاربر گفته شود");

    // پیام موفقیت باید بعد از تلاش برای ذخیره باشد، نه قبلش
    const saveAt = code.indexOf("addSubscriber");
    const okAt = code.indexOf("ok: true");
    assert.ok(saveAt !== -1 && okAt > saveAt, "پیام موفقیت زودتر از ذخیره نباشد");
  });

  test("ایمیل تکراری خطا نمی‌دهد", () => {
    // کاربری که دوباره ثبت می‌کند یا یادش رفته یا قبلاً لغو کرده؛
    // در هر دو حالت نتیجه‌ی درست فعال شدن است، نه پیام خطا
    assert.match(STORE, /if \(existing\)/);
    assert.match(STORE, /existing\.active = true/);
  });

  test("ایمیل پیش از ذخیره یکدست می‌شود", () => {
    // بدون این، «A@X.com» و «a@x.com» دو مشترک جدا می‌شدند و کاربر
    // دو نسخه از هر نامه می‌گرفت
    assert.match(STORE, /\.trim\(\)\.toLowerCase\(\)/);
  });
});

describe("امنیت فهرست مشترکان", () => {
  test("توکنش از بقیه جداست", () => {
    /*
      خروجی این اندپوینت نشانی ایمیل آدم‌های واقعی است. اگر همان توکن
      سینک یا محتوا را می‌پذیرفت، لو رفتن هرکدام یعنی فهرست ایمیل
      کاربران ما دست کسی که آن را برای اسپم می‌فروشد.
    */
    assert.match(LIST, /PSYG_SUBSCRIBERS_TOKEN/);
    assert.doesNotMatch(LIST, /PSYG_INGEST_TOKEN|PSYG_CONTENT_TOKEN/);
  });

  test("بدون توکن غیرفعال است و مقایسه timing-safe دارد", () => {
    assert.match(LIST, /status: 503/);
    assert.match(LIST, /timingSafeEqual/);
  });

  test("فقط GET دارد — از اینجا نمی‌شود چیزی نوشت", () => {
    const methods = LIST.match(/export async function (GET|POST|PUT|PATCH|DELETE)/g);
    assert.deepEqual(methods, ["export async function GET"]);
  });

  test("کسی که لغو اشتراک کرده برنمی‌گردد", () => {
    // تا اشتباهِ ورک‌فلو نتواند برایش نامه بفرستد
    assert.match(LIST, /\.filter\(\(s\) => s\.active\)/);
  });

  test("پاسخ کش نمی‌شود", () => {
    assert.match(LIST, /"Cache-Control": "no-store"/);
  });
});

describe("لغو اشتراک", () => {
  test("با توکن کار می‌کند نه با ایمیل", () => {
    /*
      اگر آدرس `?email=...` بود، هر کسی می‌توانست با حدس زدن نشانی
      دیگران اشتراکشان را لغو کند — و ایمیل‌ها در لاگ سرورها و هدر
      ارجاع‌دهنده پخش می‌شد.
    */
    assert.match(UNSUB, /searchParams: Promise<\{ token\?: string \}>/);
    assert.doesNotMatch(stripComments(UNSUB), /email\?: string/);
  });

  test("توکن تصادفی است نه قابل حدس", () => {
    assert.match(STORE, /randomBytes\(16\)/);
  });

  test("صفحه‌اش ایندکس نمی‌شود", () => {
    assert.match(UNSUB, /robots: \{ index: false/);
  });

  test("رکورد پاک نمی‌شود، فقط غیرفعال", () => {
    // تا اگر دوباره ثبت کرد، تاریخچه و توکنش گم نشود
    assert.match(STORE, /found\.active = false/);
  });
});
