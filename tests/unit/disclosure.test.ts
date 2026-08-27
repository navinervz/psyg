import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

/*
  ─────────────────────────────────────────────────────────────────────
  چرا این فایل وجود دارد
  ─────────────────────────────────────────────────────────────────────
  افشای کمیسیون از وسط صفحه‌ی اصلی به فوتر منتقل شد. تصمیم درستی بود —
  پیام اول سایت باید کاری باشد که برای کاربر انجام می‌دهیم، نه اینکه
  چطور پول درمی‌آوریم.

  ولی این جابه‌جایی یک خطر ساخت: حالا افشا فقط یک جا زندگی می‌کند. اگر
  کسی روزی فوتر را بازنویسی کند و آن جمله را بردارد، هیچ‌چیز خراب
  به‌نظر نمی‌رسد و هیچ خطایی تولید نمی‌شود — تا روزی که حساب افیلیت
  بسته شود یا رتبه‌ی سایت بیفتد.

  سه چیزی که این تست‌ها نگه می‌دارند:

    ۱. افشا وجود دارد و کلمه‌ی «کمیسیون» را واقعاً می‌گوید
    ۲. در فوتر است، یعنی روی هر صفحه‌ای دیده می‌شود
    ۳. با ارزش شروع می‌شود نه با پول — همان ترتیبی که عمداً انتخاب شد
*/

describe("افشای کمیسیون وجود دارد و صریح است", () => {
  const footer = read("src/components/layout/Footer.tsx");

  test("کلمه‌ی «کمیسیون» در فوتر هست", () => {
    /*
      «لینک‌های همکاری» یا «شراکت» کافی نیست. شرط برنامه‌های همکاری در
      فروش و توصیه‌ی گوگل هر دو روی صراحت‌اند، نه اشاره‌ی مؤدبانه.
    */
    assert.ok(
      footer.includes("کمیسیون"),
      "افشا باید صریح باشد — این شرط پذیرش در برنامه‌ی همکاری است",
    );
  });

  test("می‌گوید قیمت برای کاربر تغییر نمی‌کند", () => {
    /*
      بدون این جمله، افشا فقط یک هشدار است. با آن، پاسخ سؤالی است که
      کاربر بلافاصله می‌پرسد: «یعنی گران‌تر می‌خرم؟»
    */
    assert.ok(
      /قیمت برای تو تغییر/.test(footer),
      "افشا باید نگرانی اصلی کاربر را جواب بدهد، نه فقط اعلام کند",
    );
  });

  test("با ارزش شروع می‌شود، نه با پول", () => {
    /*
      نسخه‌ی قبلی با «محصولی نمی‌فروشد» شروع می‌شد و بلافاصله سراغ
      کمیسیون می‌رفت — یعنی اولین چیزی که کاربر درباره‌ی ما می‌خواند
      این بود که از او پول درمی‌آوریم.

      ترتیب عمدی است: اول کاری که می‌کنیم، بعد شفاف‌سازی.
    */
    const line = footer.match(/const DISCLOSURE =\s*\n?\s*"([^"]+)"/)?.[1];
    assert.ok(line, "متن افشا پیدا نشد");

    const valueAt = line!.indexOf("رصد");
    const moneyAt = line!.indexOf("کمیسیون");

    assert.ok(valueAt >= 0, "جمله باید از رصد کردن حرف بزند");
    assert.ok(
      valueAt < moneyAt,
      "افشا باید بعد از توضیح کاری که می‌کنیم بیاید، نه قبلش",
    );
  });
});

describe("افشا روی همه‌ی صفحه‌ها دیده می‌شود", () => {
  test("فوتر داخل پوسته‌ی صفحه‌هاست", () => {
    /*
      وقتی افشا فقط در فوتر است، «فوتر همه‌جا هست» دیگر یک جزئیات
      چیدمانی نیست — تنها چیزی است که افشا را روی صفحه‌ی محصول نگه
      می‌دارد، یعنی همان‌جا که دکمه‌ی خرید هست.
    */
    const shell = read("src/components/layout/PageShell.tsx");
    assert.ok(shell.includes("<Footer />"), "فوتر از پوسته حذف شده");

    const home = read("src/app/page.tsx");
    assert.ok(home.includes("<Footer />"), "صفحه‌ی اصلی فوتر ندارد");
  });

  test("هر صفحه‌ی عمومی یا پوسته دارد یا خودش فوتر", () => {
    /*
      صفحه‌ای که هیچ‌کدام را نداشته باشد، لینک خرید نشان می‌دهد بدون
      اینکه هیچ‌جا افشایی باشد.
    */
    const appDir = join(ROOT, "src/app");
    const skip = /[[\]()]|^api$|^admin$|^debug$|^account$/;

    /*
      استثناهای عمدی.

      نسخه‌ی اول این تست قاعده را «هر صفحه‌ای» گذاشت و روی
      `unsubscribe` قرمز شد. آن قرمزی درست بود ولی جواب اشتباه:
      آن صفحه `noindex` است، هیچ لینک خریدی ندارد و کاربر فقط برای
      تأیید لغو اشتراک یک بار می‌بیندش. افشای کمیسیون آنجا به هیچ
      سؤالی جواب نمی‌دهد.

      قاعده‌ی واقعی «هر صفحه» نیست؛ «هر صفحه‌ای که مسیر خرید دارد»
      است. استثناها اینجا با دلیل نوشته می‌شوند تا اضافه کردن یکی
      دیگر، یک تصمیم آگاهانه باشد نه یک فرار از تست.
    */
    const exempt = new Set(["src/app/unsubscribe/page.tsx"]);

    const pages: string[] = [];
    const walk = (dir: string, rel = "") => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (skip.test(entry)) continue;
          walk(full, `${rel}/${entry}`);
        } else if (entry === "page.tsx") {
          pages.push(join("src/app", rel, entry).replaceAll("\\", "/"));
        }
      }
    };
    walk(appDir);

    assert.ok(pages.length >= 5, `فقط ${pages.length} صفحه پیدا شد`);

    for (const page of pages) {
      if (exempt.has(page)) continue;

      const src = read(page);
      assert.ok(
        src.includes("PageShell") || src.includes("<Footer />"),
        `${page} نه پوسته دارد نه فوتر — افشا روی آن دیده نمی‌شود`,
      );
    }

    /*
      استثنایی که دیگر وجود ندارد، باید سر و صدا کند.

      وگرنه فهرست استثناها به‌مرور پر می‌شود از اسم فایل‌هایی که
      سال‌هاست پاک شده‌اند، و هیچ‌کس نمی‌داند کدامشان هنوز معنا دارد.
    */
    for (const path of exempt) {
      assert.ok(
        existsSync(join(ROOT, path)),
        `${path} در فهرست استثناهاست ولی وجود ندارد — از فهرست حذفش کن`,
      );
    }
  });
});

describe("کامپوننت قدیمی افشا واقعاً حذف شده", () => {
  test("فایلش نمانده", () => {
    /*
      اگر بماند، دفعه‌ی بعد کسی دوباره واردش می‌کند و سایت دو جای
      متفاوت افشا خواهد داشت که با هم فرق دارند — بدترین حالت، چون
      کدام‌یک درست است معلوم نیست.
    */
    assert.ok(
      !existsSync(join(ROOT, "src/components/product/AffiliateNotice.tsx")),
      "کامپوننت افشای قدیمی برگشته — یا حذفش کن یا تصمیم را عوض کن",
    );
  });

  test("هیچ صفحه‌ای به آن ارجاع نمی‌دهد", () => {
    const appDir = join(ROOT, "src/app");
    const hits: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (entry.endsWith(".tsx")) {
          if (readFileSync(full, "utf8").includes("AffiliateNotice")) {
            hits.push(entry);
          }
        }
      }
    };
    walk(appDir);

    assert.deepEqual(hits, [], `ارجاع باقی‌مانده: ${hits.join(", ")}`);
  });
});
