import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  ورک‌فلوی خبرنامه بیرون از این مخزن زندگی می‌کند و به این اندپوینت
  وابسته است. یعنی تغییر بی‌دقتِ نام یک کلید اینجا، هفته‌ی بعد در جای
  دیگری بی‌صدا می‌شکند — دقیقاً همان اتفاقی که با `llms.txt` افتاد و
  چهار روز کسی نفهمید.

  این تست‌ها آن قرارداد را در همین مخزن نگه می‌دارند. اگر کلیدی عوض
  شود، اینجا قرمز می‌شود نه دوشنبه‌ی بعد در صندوق ایمیل کسی.
*/

const src = read("src/app/api/deals/route.ts");

describe("قرارداد اندپوینت فرصت‌ها", () => {
  test("پویا رندر می‌شود تا داده‌ی زنده بدهد", () => {
    assert.ok(
      /export const dynamic = "force-dynamic"/.test(src),
      "بدون این، پاسخ در زمان بیلد حک می‌شود",
    );
  });

  test("فقط خواندنی است — هیچ متد نوشتنی ندارد", () => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      assert.ok(
        !new RegExp(`export (async )?function ${method}\\b`).test(src),
        `${method} نباید وجود داشته باشد`,
      );
    }
    assert.ok(/export function GET/.test(src), "GET باید وجود داشته باشد");
  });

  test("کلیدهایی که خبرنامه به آن‌ها تکیه می‌کند حاضرند", () => {
    /*
      این نام‌ها بخشی از قرارداد بیرونی‌اند. عوض کردنشان یعنی عوض کردن
      ورک‌فلوی n8n در همان کامیت — وگرنه خبرنامه خالی می‌ماند.
    */
    for (const key of [
      "title",
      "url",
      "currentPrice",
      "previousHigh",
      "percentBelowHigh",
      "highDaysAgo",
    ]) {
      assert.ok(
        src.includes(`${key}:`),
        `کلید «${key}» از قرارداد حذف شده — مصرف‌کننده‌ی بیرونی می‌شکند`,
      );
    }
  });

  test("همان معیار سایت را استفاده می‌کند، نه منطق موازی", () => {
    assert.ok(
      src.includes("priceStanding("),
      "اگر اینجا حساب جدا داشته باشد، عدد ایمیل با عدد سایت فرق می‌کند",
    );
  });

  test("درصد گرد‌شده است تا با آنچه کاربر روی سایت می‌بیند بخواند", () => {
    assert.ok(src.includes("Math.round(standing.belowHigh)"));
  });

  test("سقف تعداد دارد تا پاسخ بی‌مرز رشد نکند", () => {
    assert.ok(/MAX_DEALS\s*=\s*\d+/.test(src));
    assert.ok(src.includes(".slice(0, MAX_DEALS)"));
  });

  test("هیچ داده‌ی محرمانه‌ای برنمی‌گرداند", () => {
    for (const leak of ["token", "TOKEN", "password", "SECRET", "subscriber"]) {
      assert.ok(
        !src.includes(leak),
        `«${leak}» نباید در پاسخ عمومی باشد`,
      );
    }
  });
});

describe("خبرنامه دیگر متن خواندنی را پارس نمی‌کند", () => {
  /*
    `llms.txt` برای انسان و مدل‌های زبانی نوشته می‌شود و عبارت‌هایش
    آزادانه عوض می‌شوند. هر مصرف‌کننده‌ی ماشینی باید JSON بخواند.
  */
  test("llms.txt همچنان وجود دارد ولی قرارداد ماشینی نیست", () => {
    const llms = read("src/app/llms.txt/route.ts");
    assert.ok(
      llms.includes("priceStanding("),
      "llms.txt هم باید همان معیار را نشان دهد",
    );
  });
});
