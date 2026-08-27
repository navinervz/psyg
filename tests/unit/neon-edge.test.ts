import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const css = readFileSync("src/styles/globals.css", "utf8");

/**
 * نوار نئونی چرخان دور کارت‌ها.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این تست‌ها وجود دارند
 * ─────────────────────────────────────────────────────────────────────
 * این افکت از چند تکه ساخته شده که هرکدام بی‌صدا شکسته می‌شوند: اگر
 * `@property` حذف شود انیمیشن می‌پرد ولی خطایی نمی‌دهد، اگر پیشوند
 * `-webkit-` نباشد در سافاری کل کارت سبز می‌شود به‌جای قابش، و اگر
 * گارد `hover: hover` برداشته شود روی موبایل نوار گیر می‌کند.
 *
 * هیچ‌کدام در بیلد خطا نمی‌دهند. فقط روی دستگاه واقعی دیده می‌شوند — و
 * دستگاه واقعی همان جایی است که تا حالا هر بار دیر فهمیدیم.
 */

test("زاویه به‌عنوان angle ثبت شده تا انیمیشن نرم باشد", () => {
  /*
    بدون این، `--neon-angle` از نظر مرورگر رشته است و بین ۰ و ۳۶۰ درجه
    درون‌یابی نمی‌شود — نوار به‌جای چرخیدن، می‌پرد.
  */
  assert.match(css, /@property\s+--neon-angle\s*\{/, "@property تعریف نشده");

  const block = css.slice(css.indexOf("@property --neon-angle"));
  const body = block.slice(0, block.indexOf("}"));

  assert.match(body, /syntax:\s*"<angle>"/, "syntax باید <angle> باشد");
  assert.match(body, /initial-value:\s*0deg/, "مقدار اولیه لازم است");
});

test("ماسک هر دو نسخه را دارد — وگرنه سافاری کل کارت را سبز می‌کند", () => {
  const i = css.indexOf("@utility neon-edge");
  assert.ok(i > -1, "neon-edge تعریف نشده");
  const block = css.slice(i, i + 2600);

  assert.match(block, /-webkit-mask:/, "ماسک وبکیت لازم است");
  assert.match(block, /\n\s+mask:/, "ماسک استاندارد لازم است");
  assert.match(block, /-webkit-mask-composite:\s*xor/, "xor برای وبکیت لازم است");
  assert.match(block, /mask-composite:\s*exclude/, "exclude استاندارد لازم است");

  /*
    padding همان ضخامت نوار است. اگر صفر شود، ناحیه‌ی محتوا هم‌اندازه‌ی
    کل می‌شود، تفاضلشان هیچ می‌شود و نوار کاملاً نامرئی — بدون هیچ خطایی.
  */
  assert.match(block, /padding:\s*1px/, "ضخامت نوار باید مشخص باشد");
});

test("چرخش فقط روی دستگاه دارای موس", () => {
  /*
    مرورگر موبایل بعد از لمس، hover را شبیه‌سازی می‌کند و نگه می‌دارد.
    بدون این گارد، نوار روی کارتی که کاربر رد شده می‌چرخد و نمی‌ایستد.
  */
  assert.match(
    css,
    /@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)/,
    "گارد hover لازم است",
  );

  const guard = css.indexOf("@media (hover: hover) and (pointer: fine)");
  const activeRule = css.indexOf(".neon-edge:active::before");
  assert.ok(activeRule > -1, "حالت لمس تعریف نشده");
  assert.ok(activeRule > guard, "حالت لمس باید بیرون از گارد hover باشد");
});

test("حرکت کم‌شده فقط چرخش را می‌بندد، نه خود نور را", () => {
  /*
    حذف کامل بازخورد یعنی کاربری که حرکت را کم کرده، نفهمد کدام کارت
    زیر اشاره‌گر است. نور می‌ماند، چرخش نه.
  */
  const blocks = [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g)];
  assert.ok(blocks.length > 0, "بلوک reduced-motion وجود ندارد");

  const covered = blocks.some((m) => {
    const chunk = css.slice(m.index ?? 0, (m.index ?? 0) + 900);
    return chunk.includes("neon-edge") && /animation:\s*none/.test(chunk);
  });
  assert.ok(covered, "چرخش نوار در حالت حرکت کم متوقف نمی‌شود");
});

test("افکت به کارت محصول و ویجت‌ها وصل شده", () => {
  /*
    مهم‌تر از خود CSS. کلاسی که هیچ‌جا استفاده نشود، همان مشکل را
    حل‌نشده می‌گذارد و کسی هم متوجه نمی‌شود.
  */
  const deal = readFileSync("src/components/deals/DealCard.tsx", "utf8");
  assert.match(deal, /neon-edge/, "کارت محصول نوار ندارد");

  const card = readFileSync("src/components/ui/Card.tsx", "utf8");
  assert.match(card, /neon\s*&&\s*"neon-edge"/, "Card گزینه‌ی neon ندارد");

  const mobile = readFileSync("src/components/mobile/MobileTopDrop.tsx", "utf8");
  assert.match(mobile, /neon-edge/, "کارت موبایل نوار ندارد");

  for (const f of [
    "src/components/sidebar/NewArrivalsCard.tsx",
    "src/components/sidebar/RecentAlertsCard.tsx",
    "src/components/sidebar/NotifyMeWidget.tsx",
  ]) {
    assert.match(readFileSync(f, "utf8"), /<Card[^>]*\bneon\b/s, `${f} نوار ندارد`);
  }
});

test("کارت «گران‌تر شده» نوار سبز نمی‌گیرد", () => {
  /*
    قاب سبزِ چرخان روی کارتی که هشدار افزایش قیمت می‌دهد، پیام را وارونه
    می‌کند: چشم سبز را «فرصت» می‌خواند.
  */
  const deal = readFileSync("src/components/deals/DealCard.tsx", "utf8");
  assert.match(
    deal,
    /trend\s*!==\s*"rise"\s*&&\s*"neon-edge"/,
    "نوار باید روی حالت rise خاموش باشد",
  );
});

test("کارت با حرکت موس نمی‌چرخد", () => {
  /*
    ─────────────────────────────────────────────────────────────────
    باگی که این تست جلویش را می‌گیرد
    ─────────────────────────────────────────────────────────────────
    کارت یک تیلت سه‌بعدی داشت: با `pointermove` تا ۹ درجه در دو محور
    می‌چرخید و ۴ پیکسل بالا می‌آمد. کنار نوار نئون، دو افکت برای یک
    پیام شد و عنوان و قیمت هم کج می‌شدند.

    این تست عمداً دنبال *سازوکار* می‌گردد نه فقط کلمه‌ی «تیلت»: اگر
    کسی روزی دوباره `pointermove` یا `rotationX` به این کارت اضافه
    کند، همین‌جا گرفته می‌شود.

    درسی که پشت این تست است: دور اول این افکت را در فایل CSS جستجو
    کردم و پیدا نکردم، چون در جاوااسکریپت زندگی می‌کرد. تشخیص اشتباه
    یک دیپلوی هدر داد.
  */
  const deal = readFileSync("src/components/deals/DealCard.tsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(deal, /pointermove/, "کارت نباید به حرکت موس واکنش سه‌بعدی بدهد");
  assert.doesNotMatch(deal, /rotationX|rotationY/, "چرخش سه‌بعدی برگشته");
  assert.doesNotMatch(deal, /quickTo/, "توییِن هاور برگشته");
});

test("روی دستگاه لمسی متن انتخاب نمی‌شود، ولی ورودی‌ها باز می‌مانند", () => {
  /*
    نگه‌داشتن انگشت روی کارت، منوی کپی می‌آورد. ولی اگر `user-select:
    none` روی ورودی‌ها هم بیفتد، کاربر نمی‌تواند چیزی را که در فیلد
    جستجو تایپ کرده اصلاح کند — یعنی یک آزار را با آزار بدتری عوض
    کرده‌ایم.
  */
  const m = css.match(/@media\s*\(pointer:\s*coarse\)\s*\{[\s\S]*?\n\}/);
  assert.ok(m, "بلوک دستگاه لمسی وجود ندارد");

  const block = m[0];
  assert.match(block, /user-select:\s*none/, "انتخاب متن بسته نشده");
  assert.match(block, /-webkit-user-select:\s*none/, "نسخه‌ی وبکیت لازم است — سافاری iOS");
  assert.match(block, /-webkit-tap-highlight-color:\s*transparent/, "هایلایت لمس برداشته نشده");

  assert.match(block, /input,[\s\S]*?user-select:\s*text/, "ورودی‌ها باید انتخاب‌پذیر بمانند");
  assert.match(block, /textarea/, "textarea هم باید مستثنا باشد");
});

test("کارت در فضای سه‌بعدی والد کج نمی‌شود", () => {
  /*
    ─────────────────────────────────────────────────────────────────
    باگی که این تست جلویش را می‌گیرد
    ─────────────────────────────────────────────────────────────────
    گرید والد `perspective: 1100px` دارد. کارت `transform-style:
    preserve-3d` داشت، که یعنی فرزندانش در همان فضای سه‌بعدی رندر شوند.

    تا وقتی کارت فرزند لایه‌داری نداشت، هیچ اثری نداشت. با آمدن دو
    شبه‌عنصرِ نئون، کارت زیر موس کج و کشیده می‌شد — و هرچه از مرکز گرید
    دورتر، بدتر.

    این همان الگوی همیشگی است: خاصیتی که سال‌ها بی‌ضرر بود، با اضافه
    شدن چیز تازه‌ای معنا پیدا کرد.
  */
  const deal = readFileSync("src/components/deals/DealCard.tsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(deal, /preserve-3d/, "کارت نباید فضای سه‌بعدی بسازد");
  assert.match(deal, /\bisolate\b/, "بافت لایه‌بندی لازم است تا نوار داخل کارت بماند");
});

test("فیلد جستجو شکلش با فوکوس نمی‌پرد", () => {
  const bar = readFileSync("src/components/hero/AiSearchBar.tsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  /*
    شعاع گوشه نباید به `open` وابسته باشد. قبلاً در حالت بسته گوشه‌ی
    کارتی می‌گرفت و در حالت باز کاملاً گرد می‌شد — با هر کلیک، یک پرش.
  */
  assert.doesNotMatch(
    bar,
    /!open\s*&&\s*"sm:rounded/,
    "شعاع گوشه هنوز به حالت باز/بسته وابسته است",
  );

  /*
    حلقه‌ی فوکوس سراسری روی این ورودی باید خاموش باشد.

    آن قانون `border-radius: 4px` می‌گذارد و روی ورودی شفافِ داخل یک قرص
    گرد، یک مستطیل سبز وسط فیلد می‌کشد.
  */
  assert.match(
    bar,
    /focus-visible:outline-none/,
    "حلقه‌ی فوکوس سراسری روی ورودی خاموش نشده",
  );

  // نشان ⌘K برداشته شده
  assert.doesNotMatch(bar, /<kbd/, "نشان کیبورد هنوز هست");
  assert.doesNotMatch(bar, /\bCommand\b/, "آیکون Command هنوز ایمپورت می‌شود");
});

test("میان‌بر ⌘K با حذف نشانش از کار نیفتاده", () => {
  /*
    نشان حذف شد، نه خود قابلیت. کاربری که میان‌بر را می‌شناسد همچنان
    باید بتواند از هر جای صفحه جستجو را باز کند.
  */
  const bar = readFileSync("src/components/hero/AiSearchBar.tsx", "utf8");
  assert.match(bar, /metaKey \|\| event\.ctrlKey/, "شنونده‌ی میان‌بر برداشته شده");
});

test("فیلد جستجو نوار نئون می‌گیرد و حالتش را از ری‌اکت می‌خواند", () => {
  const bar = readFileSync("src/components/hero/AiSearchBar.tsx", "utf8");
  assert.match(bar, /neon-edge/, "فیلد جستجو نوار ندارد");
  assert.match(bar, /data-neon=/, "حالت نوار به CSS نمی‌رسد");

  /* چرخش تند وقتی مشاور دارد جواب می‌سازد */
  assert.match(bar, /assistant\.pending \? "busy"/, "حالت «در حال پاسخ» تعریف نشده");

  assert.match(css, /\.neon-edge\[data-neon="on"\]::before/, "حالت on در CSS نیست");
  assert.match(css, /\.neon-edge\[data-neon="busy"\]::before/, "حالت busy در CSS نیست");
});

test("هاله‌ی جعبه‌ای قدیمی کنار نوار نمانده", () => {
  /*
    دو نور با شدت و رنگ متفاوت روی یک لبه، کثیف می‌شود. این تست همان
    الگوی همیشگی را می‌گیرد: راه‌حل تازه اضافه شود ولی قدیمی برداشته
    نشود.
  */
  /*
    کامنت‌ها اول برداشته می‌شوند.

    نسخه‌ی اول این تست قرمز شد چون همین فایل در توضیحِ *چرا* هاله برداشته
    شده، اسمش را نوشته بود. تستی که متن توضیح را با کد اشتباه بگیرد،
    همان‌قدر بی‌فایده است که تستی که هیچ‌چیز نسنجد.
  */
  const deal = readFileSync("src/components/deals/DealCard.tsx", "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  assert.doesNotMatch(
    deal,
    /hover:shadow-\[0_0_44px/,
    "هاله‌ی قدیمی هنوز روی کارت است",
  );
});
