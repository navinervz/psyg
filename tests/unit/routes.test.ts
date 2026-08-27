import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { articles, categories, products } from "@/lib/data";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "src", "app");
const SRC_DIR = join(ROOT, "src");

/* ─────────────────────  کشف روت‌ها از روی فایل‌سیستم  ───────────────────── */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/**
 * از ساختار App Router الگوی روت می‌سازد.
 * `src/app/product/[slug]/page.tsx`  →  `/product/[slug]`
 */
function discoverRoutes(): string[] {
  const routes = new Set<string>();

  for (const file of walk(APP_DIR)) {
    const name = file.split(sep).pop() ?? "";
    if (!/^(page|route)\.(tsx?|jsx?)$/.test(name)) continue;

    const dirPath = relative(APP_DIR, file).split(sep).slice(0, -1);

    // گروه‌های روت مثل (site) در URL ظاهر نمی‌شوند
    const segments = dirPath.filter((s) => !/^\(.+\)$/.test(s));
    routes.add("/" + segments.join("/"));
  }

  return [...routes].map((r) => (r === "/" ? "/" : r.replace(/\/$/, "")));
}

const ROUTES = discoverRoutes();

/** آیا این مسیر با یکی از الگوهای روت می‌خواند؟ */
function routeExists(path: string): boolean {
  const clean = path.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  const parts = clean.split("/").filter(Boolean);

  return ROUTES.some((route) => {
    const routeParts = route.split("/").filter(Boolean);
    if (routeParts.length !== parts.length) return false;

    return routeParts.every((segment, i) => {
      if (segment.startsWith("[") && segment.endsWith("]")) return true;
      return segment === parts[i];
    });
  });
}

/* ─────────────────────  استخراج لینک‌ها از سورس  ───────────────────── */

type FoundLink = { href: string; file: string };

function collectLinks(): FoundLink[] {
  const found: FoundLink[] = [];

  for (const file of walk(SRC_DIR)) {
    if (!/\.(tsx|ts)$/.test(file)) continue;
    const source = readFileSync(file, "utf8");
    const short = relative(ROOT, file);

    // href="/..."  یا  href={"/..."}
    for (const match of source.matchAll(/href=\{?["'`](\/[^"'`\s{}]*)["'`]/g)) {
      found.push({ href: match[1], file: short });
    }

    // href={`/product/${x}`} → پارامتر پویا را با placeholder جایگزین می‌کنیم
    for (const match of source.matchAll(/href=\{`(\/[^`]*)`\}/g)) {
      found.push({
        href: match[1].replace(/\$\{[^}]+\}/g, "__param__"),
        file: short,
      });
    }
  }

  return found;
}

const LINKS = collectLinks();

/* ───────────────────────────  تست‌ها  ─────────────────────────── */

describe("خودِ تست سالم است", () => {
  // کنترل منفی: اگر این‌ها پاس نشوند یعنی تست‌های بعدی الکی سبزند
  test("routeExists مسیر بی‌ربط را رد می‌کند", () => {
    assert.equal(routeExists("/این-صفحه-وجود-ندارد"), false);
    assert.equal(routeExists("/product"), false, "بدون پارامتر نباید بخواند");
    assert.equal(routeExists("/deals/extra/segment"), false);
  });

  test("routeExists مسیر واقعی را قبول می‌کند", () => {
    assert.equal(routeExists("/"), true);
    assert.equal(routeExists("/deals"), true);
    assert.equal(routeExists("/deals?c=laptop"), true);
    assert.equal(routeExists("/product/airpods-pro-2"), true);
  });

  test("استخراج‌کننده لینک واقعاً کار می‌کند", () => {
    assert.ok(LINKS.length > 20, `فقط ${LINKS.length} لینک پیدا شد`);
    assert.ok(LINKS.some((l) => l.href === "/deals"));
    assert.ok(LINKS.some((l) => l.href.startsWith("/product/")));
  });
});

describe("کشف روت‌ها", () => {
  test("روت‌های اصلی وجود دارند", () => {
    for (const expected of [
      "/",
      "/deals",
      "/stores",
      "/mag",
      "/about",
      "/contact",
      "/privacy",
      "/search",
      "/category/[id]",
      "/product/[slug]",
      "/mag/[slug]",
      "/go/[id]",
      "/api/subscribe",
      "/account/favorites",
      "/account/alerts",
      "/account/tracking",
      "/account/orders",
      "/account/settings",
    ]) {
      assert.ok(ROUTES.includes(expected), `روت گم‌شده: ${expected}`);
    }
  });
});

describe("هیچ لینک مرده‌ای در سورس نیست", () => {
  test("همه‌ی hrefها به روت موجود اشاره می‌کنند", () => {
    assert.ok(LINKS.length > 20, "لینکی پیدا نشد — استخراج‌کننده خراب است");

    const broken = LINKS.filter((link) => {
      /*
        ─────────────────────────────────────────────────────────────
        فایل استاتیک: وجودش روی دیسک سنجیده می‌شود، نه در فهرست روت‌ها
        ─────────────────────────────────────────────────────────────
        نسخه‌ی قبلی فقط پسوند را می‌دید و رد می‌شد. یعنی `href` به یک
        عکسِ ناموجود هم از تست می‌گذشت — تستی که ادعا می‌کرد لینک مرده
        نیست ولی همان چیز را نمی‌سنجید.

        وقتی `preload` فونت‌ها اضافه شد، `.woff2` در فهرست پسوندها نبود
        و تست قرمز شد. جواب درست، بلندتر کردن فهرست پسوندها نبود؛ این
        بود که به‌جای حدس زدن، وجود فایل بررسی شود.
      */
      if (/\.[a-z0-9]{2,5}$/i.test(link.href)) {
        const onDisk = join(ROOT, "public", link.href.split("?")[0]);
        assert.ok(
          existsSync(onDisk),
          `فایل استاتیک روی دیسک نیست: ${link.href}  ←  ${link.file}`,
        );
        return false;
      }
      return !routeExists(link.href);
    });

    assert.deepEqual(
      broken.map((b) => `${b.href}  ←  ${b.file}`),
      [],
      "لینک‌های زیر به هیچ صفحه‌ای نمی‌رسند",
    );
  });
});

describe("پیوستگی داده و روت", () => {
  test("هر محصول صفحه‌ی قابل تولید دارد", () => {
    for (const product of products) {
      assert.ok(
        routeExists(`/product/${product.slug}`),
        `صفحه‌ی محصول تولید نمی‌شود: ${product.slug}`,
      );
      assert.ok(
        /^[a-z0-9-]+$/.test(product.slug),
        `slug نامعتبر برای URL: ${product.slug}`,
      );
    }
  });

  test("هر دسته صفحه‌ی قابل تولید دارد", () => {
    for (const category of categories) {
      assert.ok(routeExists(`/category/${category.id}`), category.id);
      assert.ok(/^[a-z0-9-]+$/.test(category.id), category.id);
    }
  });

  test("هر مقاله صفحه‌ی قابل تولید دارد", () => {
    for (const article of articles) {
      assert.ok(routeExists(`/mag/${article.slug}`), article.slug);
      assert.ok(/^[a-z0-9-]+$/.test(article.slug), article.slug);
    }
  });

  test("هر محصول مسیر خروج افیلیت دارد", () => {
    for (const product of products) {
      assert.ok(routeExists(`/go/${product.id}`), product.id);
    }
  });
});

describe("قواعد لینک افیلیت", () => {
  const buyButton = readFileSync(
    join(SRC_DIR, "components", "deals", "BuyButton.tsx"),
    "utf8",
  );

  test("دکمه خرید از مسیر داخلی /go عبور می‌کند", () => {
    assert.match(buyButton, /\/go\/\$\{productId\}/);
  });

  test("دکمه خرید rel درست دارد", () => {
    assert.match(
      buyButton,
      /nofollow sponsored/,
      "لینک کمیسیونی بدون nofollow sponsored به سئو آسیب می‌زند",
    );
    assert.match(buyButton, /noopener/);
  });

  test("هیچ‌جای سورس مستقیم به دیجی‌کالا لینک نمی‌دهد", () => {
    const offenders = LINKS.filter((l) => l.href.includes("digikala.com"));
    assert.deepEqual(offenders, []);
  });

  test("robots مسیر خروج و حساب را می‌بندد", () => {
    const robots = readFileSync(join(APP_DIR, "robots.ts"), "utf8");
    assert.match(robots, /"\/go\/"/);
    assert.match(robots, /"\/account\/"/);
  });
});

describe("مرز استریم جلوی ۴۰۴ واقعی را نمی‌گیرد", () => {
  /**
   * این تست از یک باگ واقعی آمده که دو بار برگشت و سومین بار هم نزدیک
   * بود از دستمان در برود.
   *
   * ماجرا: صفحه‌ی محصول با `notFound()` باید ۴۰۴ بدهد. ولی وقتی
   * `src/app/loading.tsx` وجود داشت، Next یک مرز Suspense سراسری
   * می‌ساخت و برای هر صفحه‌ی پویا **بلافاصله پوسته را با وضعیت ۲۰۰**
   * می‌فرستاد. تا نوبت به `notFound()` می‌رسید، هدرها رفته بودند و
   * وضعیت دیگر قابل تغییر نبود.
   *
   * نتیجه: هر آدرس ناموجود پاسخ ۲۰۰ می‌گرفت — یعنی گوگل می‌توانست
   * بی‌نهایت صفحه‌ی بی‌محتوا ایندکس کند. همان چیزی که در ممیزی اول
   * به‌عنوان ریسک رد شدن رسانه ثبت شده بود.
   *
   * تست e2e این را می‌گیرد، ولی فقط بعد از یک بیلد کامل. این تست همان
   * را در چند میلی‌ثانیه می‌گیرد و مهم‌تر: **دلیلش را توضیح می‌دهد**.
   */
  test("loading.tsx در ریشه‌ی app نیست", () => {
    const rootLoading = join(APP_DIR, "loading.tsx");

    assert.ok(
      !existsSync(rootLoading),
      "فایل `src/app/loading.tsx` برگشته است.\n" +
        "  این فایل یک مرز Suspense روی کل سایت می‌سازد و باعث می‌شود\n" +
        "  صفحه‌های پویا قبل از رسیدن به notFound() وضعیت ۲۰۰ را قفل کنند.\n" +
        "  اگر اسپینر بارگذاری لازم داری، آن را در سطح پایین‌تری بگذار که\n" +
        "  مسیر /product/[slug] را در بر نگیرد.",
    );
  });

  test("خودِ تست سالم است — وجود فایل را واقعاً می‌سنجد", () => {
    // کنترل مثبت: فایلی که قطعاً هست
    assert.ok(existsSync(join(APP_DIR, "layout.tsx")));
    // کنترل منفی: فایلی که قطعاً نیست
    assert.ok(!existsSync(join(APP_DIR, "این-فایل-وجود-ندارد.tsx")));
  });
});

describe("اطلاعات تماس با دامنه می‌خواند", () => {
  /**
   * صفحه‌ی تماس قبلاً `info@psyg.ir` را نشان می‌داد در حالی که دامنه‌ی
   * سایت `psygstore.shop` است — یعنی آدرسی که وجود خارجی نداشت.
   * کارشناس دیجی‌کالا همین صفحه را برای احراز مالکیت دامنه می‌بیند.
   */
  test("هیچ ایمیل هاردکدشده‌ای در صفحه‌ها نیست", () => {
    const offenders: string[] = [];

    for (const file of walk(SRC_DIR)) {
      if (!/\.(tsx|ts)$/.test(file)) continue;
      if (relative(ROOT, file).includes(join("lib", "site.ts"))) continue;

      /*
        ─────────────────────────────────────────────────────────────
        کامنت‌ها اول برداشته می‌شوند
        ─────────────────────────────────────────────────────────────
        این تست مراقب است نشانی ایمیل در *کد* هاردکد نشود، تا همیشه از
        `CONTACT_EMAIL` بیاید و با دامنه‌ی واقعی یکی بماند.

        ولی نسخه‌ی قبلی متن کامنت‌ها را هم می‌خواند. وقتی در
        `api/contact/route.ts` توضیح دادیم «خبرنامه از info@… می‌فرستد
        پس این دامنه در Resend تأیید شده»، تست قرمز شد — نه چون قاعده
        شکسته بود، بلکه چون توضیحِ *چرایی* را با کد اشتباه گرفت.

        نوشتن توضیح نباید تست را بشکند، وگرنه دفعه‌ی بعد کسی به‌جای
        اصلاح، توضیح را پاک می‌کند.
      */
      const source = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

      for (const match of source.matchAll(/[\w.]+@[\w.-]+\.[a-z]{2,}/gi)) {
        // نمونه‌ی داخل تست‌ها و placeholder فرم‌ها اشکالی ندارند
        if (/example\.(com|org)/i.test(match[0])) continue;
        offenders.push(`${match[0]}  ←  ${relative(ROOT, file)}`);
      }
    }

    assert.deepEqual(
      offenders,
      [],
      "ایمیل باید از `CONTACT_EMAIL` در lib/site بیاید تا همیشه با دامنه‌ی\n" +
        "  واقعی سایت یکی بماند",
    );
  });

  test("خودِ تست سالم است — حذف کامنت آن را کور نکرده", () => {
    /*
      بعد از اینکه تست را از خواندن کامنت‌ها بازداشتیم، این سؤال می‌ماند
      که آیا هنوز چیزی را می‌گیرد یا فقط ساکت شده. اینجا همان منطق روی
      نمونه‌ی ساختگی اجرا می‌شود.
    */
    const strip = (s: string) =>
      s
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

    const find = (s: string) =>
      [...strip(s).matchAll(/[\w.]+@[\w.-]+\.[a-z]{2,}/gi)]
        .map((m) => m[0])
        .filter((m) => !/example\.(com|org)/i.test(m));

    // ایمیل در کد → باید گرفته شود
    assert.deepEqual(
      find('const to = "info@psygstore.shop";'),
      ["info@psygstore.shop"],
      "ایمیل هاردکد در کد باید گرفته شود",
    );

    // همان ایمیل داخل کامنت → نباید گرفته شود
    assert.deepEqual(
      find("/* خبرنامه از info@psygstore.shop می‌فرستد */\nconst x = 1;"),
      [],
      "ایمیل داخل کامنت نباید تست را بشکند",
    );

    // کامنت تک‌خطی هم همین‌طور
    assert.deepEqual(find("// info@psygstore.shop\nconst y = 2;"), []);
  });

  test("ایمیل تماس از دامنه‌ی سایت ساخته می‌شود", () => {
    const site = readFileSync(join(SRC_DIR, "lib", "site.ts"), "utf8");
    assert.match(site, /CONTACT_EMAIL/);
    assert.match(
      site,
      /psygstore\.shop/,
      "باید برای محیط توسعه فالبک دامنه‌ی واقعی داشته باشد، نه localhost",
    );
  });
});

describe("سلامت کامپوننت‌ها", () => {
  const clientHookPattern =
    /\b(useState|useEffect|useRef|useRouter|usePathname|useGSAP|create\()/;

  test("هر فایلی که هوک دارد «use client» هم دارد", () => {
    const offenders: string[] = [];

    for (const file of walk(join(SRC_DIR, "components"))) {
      if (!file.endsWith(".tsx") && !file.endsWith(".ts")) continue;
      const source = readFileSync(file, "utf8");

      if (clientHookPattern.test(source) && !source.startsWith('"use client"')) {
        offenders.push(relative(ROOT, file));
      }
    }

    assert.deepEqual(offenders, []);
  });

  test("هیچ کامپوننتی مستقیم از data/*.json نمی‌خواند", () => {
    const allowed = [join("lib", "data.ts"), join("lib", "reference.ts")];
    const offenders: string[] = [];

    for (const file of walk(SRC_DIR)) {
      if (!/\.(tsx|ts)$/.test(file)) continue;

      const short = relative(ROOT, file);
      if (allowed.some((path) => short.includes(path))) continue;

      const source = readFileSync(file, "utf8");
      if (/from ["']@\/data\//.test(source)) offenders.push(short);
    }

    assert.deepEqual(
      offenders,
      [],
      "همه باید از @/lib/data یا @/lib/reference بخوانند تا تایپ‌ها یکجا مدیریت شوند",
    );
  });
});

describe("کاتالوگ سنگین وارد باندل کلاینت نمی‌شود", () => {
  /**
   * `@/lib/data` کاتالوگ محصولات و مقاله‌ها را ایمپورت می‌کند و چون
   * `alerts` را در سطح ماژول می‌سازد، tree-shaking نمی‌تواند حذفش کند.
   * پس هر کامپوننت `"use client"` که از آن بخواند، حدود ۹۷ کیلوبایت
   * JSON را به مرورگر می‌فرستد — روی هر صفحه‌ای که رندر شود.
   *
   * این دقیقاً اتفاقی بود که برای `HeaderActions` افتاد و حجم صفحه‌ی
   * اصلی را بالا برد.
   */
  /**
   * مرز کلاینت زنجیره‌ای است: اگر فایلی `"use client"` داشته باشد، هر
   * ماژولی که ایمپورت می‌کند هم وارد باندل مرورگر می‌شود — حتی اگر خودش
   * `"use client"` نداشته باشد.
   *
   * نسخه‌ی اول این تست همین را نمی‌دید و یک نشتی واقعی از دستش در رفت:
   * `Sidebar` کلاینتی بود و `RecentAlertsCard` سروری را ایمپورت می‌کرد،
   * و آن هم از `@/lib/data` می‌خواند.
   */
  function buildClientClosure(): Set<string> {
    const files = walk(SRC_DIR).filter((f) => /\.(tsx|ts)$/.test(f));
    const sources = new Map<string, string>();
    for (const file of files) sources.set(file, readFileSync(file, "utf8"));

    /** ایمپورت‌های داخلی یک فایل را به مسیر واقعی تبدیل می‌کند */
    function localImports(file: string): string[] {
      const source = sources.get(file) ?? "";
      const out: string[] = [];

      for (const match of source.matchAll(/from ["'](@\/[^"']+)["']/g)) {
        const base = join(SRC_DIR, match[1].slice(2));
        for (const suffix of [".ts", ".tsx", "/index.ts", "/index.tsx"]) {
          const candidate = base + suffix;
          if (sources.has(candidate)) {
            out.push(candidate);
            break;
          }
        }
      }
      return out;
    }

    // ریشه‌ها: فایل‌هایی که خودشان "use client" دارند
    const queue = files.filter((f) => (sources.get(f) ?? "").startsWith('"use client"'));
    const inClient = new Set(queue);

    while (queue.length > 0) {
      const current = queue.pop()!;
      for (const dep of localImports(current)) {
        if (!inClient.has(dep)) {
          inClient.add(dep);
          queue.push(dep);
        }
      }
    }

    return inClient;
  }

  test("کاتالوگ سنگین در هیچ مسیر ایمپورتی از سمت کلاینت نیست", () => {
    const inClient = buildClientClosure();
    const dataModule = join(SRC_DIR, "lib", "data.ts");

    assert.ok(
      !inClient.has(dataModule),
      "lib/data (شامل ۹۷ کیلوبایت JSON) از یک کامپوننت کلاینتی قابل‌دسترسی است.\n" +
        "  کامپوننت‌های کلاینتی باید از @/lib/reference بخوانند یا داده را prop بگیرند.\n" +
        "  یادت باشد فرزندانی که به‌صورت children پاس داده می‌شوند کلاینتی نمی‌شوند.",
    );
  });

  test("خودِ تشخیص مرز کلاینت درست کار می‌کند", () => {
    const inClient = buildClientClosure();

    // کنترل مثبت: یک کامپوننت قطعاً کلاینتی
    assert.ok(
      inClient.has(join(SRC_DIR, "components", "deals", "DealCard.tsx")),
      "DealCard باید کلاینتی تشخیص داده شود",
    );

    // کنترل زنجیره‌ای: ماژولی که فقط از طریق کلاینت ایمپورت می‌شود
    assert.ok(
      inClient.has(join(SRC_DIR, "lib", "reference.ts")),
      "reference باید از طریق زنجیره‌ی ایمپورت کلاینتی دیده شود",
    );

    // کنترل منفی: یک فایل کاملاً سروری
    assert.ok(
      !inClient.has(join(SRC_DIR, "app", "sitemap.ts")),
      "sitemap نباید کلاینتی شمرده شود",
    );
  });

  test("داده‌ی مرجع واقعاً سبک است", () => {
    const heavy = ["products.json", "articles.json"];
    const source = readFileSync(join(SRC_DIR, "lib", "reference.ts"), "utf8");

    for (const file of heavy) {
      assert.ok(
        !source.includes(file),
        `reference.ts نباید ${file} را ایمپورت کند`,
      );
    }
  });
});
