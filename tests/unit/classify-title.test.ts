import { strict as assert } from "node:assert";
import { test } from "node:test";
import { classifyByTitle, resolveCategory } from "@/lib/affilio";

/**
 * دسته‌بندی از روی عنوان — فقط برای ویجت ترکیبی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این تست‌ها مهم‌اند
 * ─────────────────────────────────────────────────────────────────────
 * این تنها جایی است که دسته از متن حدس زده می‌شود، و حدس زدن دقیقاً
 * همان کاری است که کامنت اصلی `WIDGET_SOURCES` منع کرده بود. اجازه‌اش
 * را فقط به این شرط دادیم که مرزش تنگ باشد و آزموده.
 *
 * خطرناک‌ترین حالت اول فایل است: عنوانی که واژه‌ی «کنسول» را دارد ولی
 * کنسول نیست.
 */

test("کیفی که واژه‌ی کنسول در عنوانش هست، کنسول نمی‌شود", () => {
  const traps = [
    "کیف حمل کنسول ps5 نهل مدل 30th anniversary",
    "کیف حمل کنسول ps5 slim نهل مدل minecraft",
    "روکش آنالوگ KontrolFreek طرح Vortex مناسب PS5/PS4",
    "پایه شارژ دسته بازی دابی مدل DualSense TP5-05",
    "نگهدارنده دسته بازی مدل مرد عنکبوتی",
  ];

  for (const title of traps) {
    assert.equal(classifyByTitle(title), "accessory", `تله گرفت: ${title}`);
  }
});

test("محصولات واقعی به دسته‌ی درست می‌روند", () => {
  const cases: [string, string][] = [
    ["کنسول خانگی سونی مدل PS5 اسلیم ریجن اروپا", "console"],
    [
      "کنسول خانگی سونی مدل PS5 Drive Slim نسخه استاندارد ریجن آسیا ظرفیت ۱ ترابایت",
      "console",
    ],
    ["هدفون بی سیم اوی مدل BGH DEVICE T35", "headphone"],
    ["هدفون بلوتوثی ساندپیتز مدل ERF BUTTOM T3 PRO", "headphone"],
    ["هدفون بی سیم ساندپیتز مدل SHO AIR 5 LITE BREATHABLE", "headphone"],
    ["هدفون بلوتوثی ساندپیتز مدل TZA CLEAR DOT VARIOUS", "headphone"],
    ["گوشی موبایل اپل مدل iPhone 16 JP/N", "mobile"],
    ["لپ تاپ 16 اینچی ایسوس مدل TUF Gaming F16", "laptop"],
    ["لپ‌تاپ 13 اینچ اپل مدل MacBook Neo", "laptop"],
    ["تبلت سامسونگ مدل Galaxy Tab S11", "tablet"],
    ["ساعت هوشمند شیائومی مدل Amazfit", "wearable"],
  ];

  for (const [title, expected] of cases) {
    assert.equal(classifyByTitle(title), expected, `اشتباه دسته‌بندی شد: ${title}`);
  }
});

test("عنوان ناشناس به لوازم جانبی می‌رود، نه به دسته‌ی گران‌تر", () => {
  /*
    وقتی نمی‌دانیم چیست، محافظه‌کارانه‌ترین جواب درست است. حدس زدن
    دسته‌ی گران‌تر همان اشتباهی است که اول ماجرا کیف را کنسول کرد.
  */
  assert.equal(classifyByTitle("چیزی که نمی‌شناسیم"), "accessory");
  assert.equal(classifyByTitle(""), "accessory");
});

test("فقط ویجت auto از عنوان حدس می‌زند", () => {
  /*
    ویجت‌های موجود نباید رفتارشان عوض شود. اگر روزی کسی `auto` را
    پیش‌فرض کرد، این تست قرمز می‌شود.
  */
  const laptop = "لپ تاپ 16 اینچی ایسوس مدل TUF Gaming F16";

  // ویجت صریح: دسته‌ی اعلام‌شده برنده است حتی اگر عنوان چیز دیگری بگوید
  assert.equal(resolveCategory("کنسول خانگی سونی مدل PS5", "mobile"), "mobile");
  assert.equal(resolveCategory(laptop, "laptop"), "laptop");

  // ویجت auto: از عنوان می‌آید
  assert.equal(resolveCategory("کنسول خانگی سونی مدل PS5", "auto"), "console");
  assert.equal(resolveCategory(laptop, "auto"), "laptop");
});

test("تنزل لوازم جانبی در ویجت صریح هنوز کار می‌کند", () => {
  assert.equal(resolveCategory("کیف حمل کنسول ps5", "console"), "accessory");
  assert.equal(
    resolveCategory(
      "گوشی موبایل سامسونگ مدل Galaxy A37 - به همراه یک عدد کاور سیلیکونی",
      "mobile",
    ),
    "mobile",
  );
});
