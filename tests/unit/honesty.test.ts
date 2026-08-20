import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * محافظ ادعاهای سایت.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این تست وجود دارد
 * ─────────────────────────────────────────────────────────────────────
 * صفحه‌ی اصلی می‌گفت «از بین هزاران محصول» و نوار ویژگی‌ها می‌گفت
 * «قیمت میلیون‌ها محصول رو رصد می‌کنیم». هشتاد محصول داشتیم.
 *
 * این جمله‌ها موقع ساخت اولیه‌ی سایت نوشته شده بودند، وقتی هنوز داده‌ای
 * نبود و متن جای‌نگهدار بود. بعد داده‌ی واقعی آمد و کسی برنگشت متن را
 * درست کند.
 *
 * خطرش این نیست که کسی شکایت کند. خطرش این است که بازدیدکننده فهرست را
 * ببیند، بفهمد عدد دروغ است، و از آن لحظه به **قیمت‌ها** هم شک کند —
 * یعنی دقیقاً همان چیزی که کل این سایت رویش ساخته شده.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چه چیزی ممنوع نیست
 * ─────────────────────────────────────────────────────────────────────
 * این تست دنبال اغراق در **ادعاهای سایت درباره‌ی خودش** است، نه هر عدد
 * بزرگی. متن مقاله‌ها می‌توانند «میلیون‌ها تومان» بگویند — آن ادعای
 * قیمت است نه ادعای اندازه‌ی کاتالوگ.
 */

const ROOT = process.cwd();

/**
 * عبارت‌هایی که اندازه‌ی کاتالوگ را بزرگ‌نمایی می‌کنند.
 *
 * فقط وقتی مشکل‌اند که کنارشان کلمه‌ی «محصول» یا «کالا» باشد — چون
 * ادعای اندازه همان‌جا ساخته می‌شود.
 */
const INFLATED = [
  /هزاران\s+(محصول|کالا)/,
  /میلیون‌?ها\s+(محصول|کالا)/,
  /صدها\s+هزار\s+(محصول|کالا)/,
  /بزرگ‌?ترین\s+(سایت|پلتفرم|مرجع)/,
  /بهترین\s+قیمت\s+(ایران|بازار)/,
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts|json)$/.test(entry)) out.push(full);
  }
  return out;
}

/** کامنت‌ها کنار گذاشته می‌شوند تا توضیحِ همین قاعده تست را قرمز نکند */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("سایت درباره‌ی خودش اغراق نمی‌کند", () => {
  test("هیچ ادعای بزرگ‌نمایی‌شده‌ای درباره‌ی تعداد محصولات نیست", () => {
    /*
      مقاله‌ها کنار گذاشته شده‌اند: متنشان درباره‌ی بازار و قیمت است، نه
      ادعای سایت درباره‌ی خودش. «میلیون‌ها تومان» در مقاله مشکلی ندارد.
    */
    const files = [
      ...walk(join(ROOT, "src", "components")),
      ...walk(join(ROOT, "src", "app")),
      join(ROOT, "src", "data", "features.json"),
      join(ROOT, "src", "data", "categories.json"),
      join(ROOT, "src", "lib", "site.ts"),
    ];

    const guilty: string[] = [];

    for (const file of files) {
      const source = stripComments(readFileSync(file, "utf8"));
      for (const pattern of INFLATED) {
        const match = pattern.exec(source);
        if (match) {
          guilty.push(`${relative(ROOT, file)} — «${match[0]}»`);
        }
      }
    }

    assert.deepEqual(
      guilty,
      [],
      "این ادعاها با داده‌ی واقعی سایت نمی‌خوانند:\n  " + guilty.join("\n  "),
    );
  });

  test("صفحه‌ی اصلی اصلاً ادعای تعداد نمی‌کند", () => {
    /*
      این تست سه بار عوض شد و مسیرش خودش درس دارد.

      نسخه‌ی اول متن «از بین هزاران محصول» بود — دروغ.
      نسخه‌ی دوم عدد واقعی کاتالوگ را نشان می‌داد — راست، ولی کاتالوگ
      بالا و پایین می‌رود و دیدن یک عدد کوچک روی صفحه‌ی اصلی سایت را
      کوچک نشان می‌داد بدون اینکه به کسی کمکی کند.

      نسخه‌ی سوم: اصلاً ادعای اندازه نکن. آنچه ارزش دارد روزانه بودن رصد
      است، نه تعدادش.

      پس این تست حالا نبودِ عدد را تضمین می‌کند، نه درست بودنش.
    */
    const hero = stripComments(
      readFileSync(join(ROOT, "src", "components", "hero", "HeroCopy.tsx"), "utf8"),
    );

    assert.doesNotMatch(
      hero,
      /productCount/,
      "متن هیرو نباید هیچ شمارنده‌ای داشته باشد",
    );
    assert.doesNotMatch(
      hero,
      /از بین\s*[۰-۹0-9]/,
      "عدد ثابت در متن هیرو نباید باشد",
    );
  });
});

describe("هیچ فیلدی وعده‌ی بی‌عمل نمی‌دهد", () => {
  test("فرم قابل ارسالی وجود ندارد که کاری نکند", () => {
    /*
      `PromptInput` وسط صفحه‌ی اصلی دقیقاً همین بود: یک فیلد بزرگ با
      دکمه‌ی ارسال و پلیس‌هولدر متحرک، که `onSubmit` آن فقط
      `preventDefault()` می‌کرد. کاربر تایپ می‌کرد، Enter می‌زد، و هیچ
      اتفاقی نمی‌افتاد — بدون هیچ خطایی.

      اگر فرمی واقعاً نباید کاری کند، اصلاً نباید فرم باشد.
    */
    const files = walk(join(ROOT, "src", "components"));
    const guilty: string[] = [];

    for (const file of files) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (/onSubmit=\{\s*\(e\w*\)\s*=>\s*e\w*\.preventDefault\(\)\s*\}/.test(source)) {
        guilty.push(relative(ROOT, file));
      }
    }

    assert.deepEqual(
      guilty,
      [],
      "این فرم‌ها ارسال را می‌گیرند ولی هیچ کاری نمی‌کنند:\n  " +
        guilty.join("\n  "),
    );
  });
});

describe("زبان داخلی تیم به کاربر نشان داده نمی‌شود", () => {
  test("هیچ متنی از «فاز» یا اسم ابزارهای داخلی حرف نمی‌زند", () => {
    /*
      صفحه‌ی تنظیمات به کاربر می‌گفت:
      «فاز اول حساب کاربری ندارد… ارسال واقعی ایمیل در فاز دوم از طریق
      n8n انجام می‌شود.»

      سه ایراد داشت. «فاز اول/دوم» زبان داخلی ماست و برای کاربر معنایی
      ندارد. «n8n» اسم ابزار داخلی است و لو دادنش بی‌فایده و از نظر
      امنیتی بی‌دلیل است. و لحنش می‌گفت «سایت هنوز کامل نیست».

      کاربر باید بداند چه چیزی برایش کار می‌کند، نه اینکه ما در کدام
      مرحله‌ی نقشه‌ی راهمان هستیم.
    */
    const INTERNAL = [
      /فاز\s*(اول|دوم|۱|۲|1|2)/,
      /\bn8n\b/i,
      /\bwebhook\b/i,
      /\bMCP\b/,
    ];

    const files = [
      ...walk(join(ROOT, "src", "components")),
      ...walk(join(ROOT, "src", "app")),
    ].filter((f) => /\.tsx$/.test(f));

    const guilty: string[] = [];

    for (const file of files) {
      // فقط متن قابل مشاهده؛ کامنت‌ها و کد اهمیتی ندارند
      const source = stripComments(readFileSync(file, "utf8"));
      for (const pattern of INTERNAL) {
        const match = pattern.exec(source);
        if (match) guilty.push(`${relative(ROOT, file)} — «${match[0]}»`);
      }
    }

    assert.deepEqual(
      guilty,
      [],
      "این متن‌ها زبان داخلی تیم را به کاربر نشان می‌دهند:\n  " +
        guilty.join("\n  "),
    );
  });

  test("صفحه‌ی فروشگاه‌ها ادعای «فقط دیجی‌کالا» ندارد", () => {
    /*
      اسنپ‌شاپ هم وصل است و بخش بزرگی از کاتالوگ از آنجاست. متنی که با
      فهرست بالای همان صفحه نمی‌خواند، از نبودنش بدتر است.
    */
    const page = readFileSync(
      join(ROOT, "src", "app", "stores", "page.tsx"),
      "utf8",
    );
    assert.doesNotMatch(stripComments(page), /فقط دیجی‌کالا/);
  });
});

describe("خودِ تست سالم است", () => {
  test("الگوی اغراق را واقعاً تشخیص می‌دهد", () => {
    const sample = "از بین هزاران محصول برات پیدا می‌کنه";
    assert.ok(
      INFLATED.some((p) => p.test(sample)),
      "باید ادعای قدیمی صفحه‌ی اصلی را بگیرد",
    );
  });

  test("متن بی‌گناه را اشتباه علامت نمی‌زند", () => {
    const sample = "حتی درصد کم هم میلیون‌ها تومان است";
    assert.ok(
      !INFLATED.some((p) => p.test(sample)),
      "ادعای قیمت نباید با ادعای اندازه اشتباه گرفته شود",
    );
  });

  test("حذف کامنت واقعاً کار می‌کند", () => {
    assert.equal(stripComments("/* هزاران محصول */ ok").trim(), "ok");
  });
});
