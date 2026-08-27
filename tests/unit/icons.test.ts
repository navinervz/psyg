import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const p = (rel: string) => join(ROOT, rel);

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  سایت ماه‌ها بدون هیچ آیکونی زنده بود و هیچ تست و هیچ خطایی به آن
  اشاره نکرد. تنها جایی که معلوم شد، نتایج جستجوی گوگل بود: کنار
  psygstore.shop یک کره‌ی خاکستری خالی، و درست زیرش رقیبی با لوگوی
  خودش.

  همان الگوی همیشگی این پروژه — چیزی که نبودنش خطا تولید نمی‌کند و
  فقط وقتی دیده می‌شود که کسی به خروجی واقعی نگاه کند.
*/

describe("آیکون‌های سایت وجود دارند", () => {
  /*
    Next این سه فایل را از روی نامشان در `src/app/` پیدا می‌کند و
    خودش تگ‌ها را می‌سازد. تغییر نام یعنی حذف بی‌صدای آیکون.
  */
  const required = [
    "src/app/favicon.ico",
    "src/app/icon.png",
    "src/app/apple-icon.png",
    "public/icon-192.png",
    "public/icon-512.png",
    "public/site.webmanifest",
  ];

  for (const rel of required) {
    test(rel, () => {
      assert.ok(existsSync(p(rel)), `${rel} وجود ندارد`);
      assert.ok(
        statSync(p(rel)).size > 500,
        `${rel} برای یک آیکون واقعی خیلی کوچک است`,
      );
    });
  }
});

describe("مانیفست معتبر است", () => {
  const manifest = JSON.parse(readFileSync(p("public/site.webmanifest"), "utf8"));

  test("فیلدهای لازم را دارد", () => {
    for (const key of ["name", "short_name", "start_url", "icons"]) {
      assert.ok(manifest[key], `مانیفست «${key}» ندارد`);
    }
  });

  test("هر آیکونی که اعلام کرده واقعاً وجود دارد", () => {
    /*
      مانیفستی که به فایل نبوده اشاره کند، بدتر از نداشتن مانیفست
      است: مرورگر خطا می‌دهد و اندروید هیچ آیکونی نصب نمی‌کند.
    */
    for (const icon of manifest.icons) {
      const file = p(join("public", icon.src));
      assert.ok(existsSync(file), `مانیفست به ${icon.src} اشاره می‌کند که نیست`);
    }
  });

  test("یک آیکون maskable دارد", () => {
    // اندروید لبه‌های آیکون را می‌برد؛ بدون نسخه‌ی maskable لوگو قیچی می‌شود
    assert.ok(
      manifest.icons.some((i: { purpose?: string }) => i.purpose === "maskable"),
      "نسخه‌ی maskable برای اندروید لازم است",
    );
  });

  test("رنگ‌ها با خود سایت می‌خوانند", () => {
    assert.equal(manifest.background_color, "#08090A");
    assert.equal(manifest.theme_color, "#08090A");
  });
});

describe("آیکون از دید گوگل قابل خزیدن است", () => {
  test("robots مسیر آیکون‌ها را نمی‌بندد", () => {
    /*
      آیکون بلاک‌شده یعنی همان کره‌ی خاکستری — با این تفاوت که این بار
      فایل هست و کسی دنبال دلیلش نمی‌گردد.
    */
    const robots = readFileSync(p("src/app/robots.ts"), "utf8");
    const blocked = ["/icon", "/favicon", "/apple-icon", "/site.webmanifest"];

    for (const path of blocked) {
      assert.ok(
        !robots.includes(`"${path}`),
        `robots مسیر ${path} را بسته — گوگل آیکون را نمی‌بیند`,
      );
    }
  });

  test("مانیفست در متادیتا اعلام شده", () => {
    const layout = readFileSync(p("src/app/layout.tsx"), "utf8");
    assert.ok(
      layout.includes('manifest: "/site.webmanifest"'),
      "بدون این خط، فایل مانیفست ساخته می‌شود ولی هیچ صفحه‌ای به آن لینک نمی‌دهد",
    );
  });
});
