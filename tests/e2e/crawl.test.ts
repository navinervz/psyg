import test, { before, describe } from "node:test";
import assert from "node:assert/strict";

import { articles, categories, products } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";

const BASE = process.env.TEST_BASE_URL ?? "http://localhost:3000";

/* ───────────────────────────  ابزارها  ─────────────────────────── */

async function get(path: string, init?: RequestInit) {
  return fetch(new URL(path, BASE), { redirect: "manual", ...init });
}

async function getHtml(path: string): Promise<string> {
  const response = await fetch(new URL(path, BASE));
  assert.equal(response.status, 200, `${path} → ${response.status}`);
  return response.text();
}

/** استخراج همه‌ی href و src داخلی از HTML */
function internalLinks(html: string): string[] {
  const links = new Set<string>();

  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (!href.startsWith("/")) continue;
    if (href.startsWith("//")) continue;
    links.add(href.split("#")[0]);
  }

  return [...links].filter(Boolean);
}

const ALL_ROUTES = [
  "/",
  "/deals",
  "/stores",
  "/mag",
  "/about",
  "/contact",
  "/privacy",
  "/search?q=iphone",
  "/account/favorites",
  "/account/alerts",
  "/account/tracking",
  "/account/orders",
  "/account/settings",
  ...categories.map((c) => `/category/${c.id}`),
  ...products.map((p) => `/product/${p.slug}`),
  ...articles.map((a) => `/mag/${a.slug}`),
];

/* ───────────────────────────  تست‌ها  ─────────────────────────── */

describe("سرور بالا است", () => {
  before(async () => {
    const response = await fetch(BASE);
    assert.equal(response.status, 200, "سرور در دسترس نیست");
  });

  test("صفحه اصلی رندر می‌شود", async () => {
    const html = await getHtml("/");
    /*
      نام برند از `lib/site` خوانده می‌شود نه هاردکد. قبلاً اینجا «PsyG»
      نوشته شده بود و وقتی نام سایت به «سای‌جی» تغییر کرد، این تست قرمز
      شد در حالی که هیچ چیزی خراب نشده بود.
    */
    assert.match(html, new RegExp(SITE_NAME));
    assert.match(html, /بهترین فرصت/);
  });
});

describe("همه‌ی روت‌ها ۲۰۰ برمی‌گردانند", () => {
  for (const route of ALL_ROUTES) {
    test(route, async () => {
      const response = await get(route);
      assert.equal(response.status, 200, `${route} → ${response.status}`);
    });
  }
});

describe("هیچ لینک داخلی مرده‌ای وجود ندارد", () => {
  // فقط صفحه‌های کلیدی را می‌خزیم تا تست طولانی نشود؛
  // بقیه‌ی روت‌ها بالاتر مستقیماً چک شده‌اند.
  const pagesToCrawl = [
    "/",
    "/deals",
    "/stores",
    "/mag",
    "/about",
    "/contact",
    "/privacy",
    "/account/settings",
    `/category/${categories[0].id}`,
    `/product/${products[0].slug}`,
    `/mag/${articles[0].slug}`,
  ];

  for (const page of pagesToCrawl) {
    test(`لینک‌های ${page}`, async () => {
      const html = await getHtml(page);
      const links = internalLinks(html);

      assert.ok(links.length > 0, `${page} هیچ لینکی ندارد`);

      const broken: string[] = [];
      for (const link of links) {
        // /go/ عمداً ریدایرکت ۳۰۲ می‌دهد و مقصدش بیرونی است
        const expected302 = link.startsWith("/go/");
        const response = await get(link);
        const ok = expected302
          ? response.status === 302
          : response.status === 200;
        if (!ok) broken.push(`${link} → ${response.status}`);
      }

      assert.deepEqual(broken, [], `لینک‌های خراب در ${page}`);
    });
  }
});

describe("صفحه محصول", () => {
  const sample = products.slice(0, 5);

  for (const product of sample) {
    test(`${product.slug} محتوای درست دارد`, async () => {
      const html = await getHtml(`/product/${product.slug}`);

      assert.ok(html.includes(product.title), "عنوان محصول نیست");
      assert.ok(
        html.includes(`/go/${product.id}`),
        "دکمه خرید به مسیر افیلیت اشاره نمی‌کند",
      );
      assert.match(html, /nofollow sponsored/, "rel لینک خرید اشتباه است");
      assert.match(html, /application\/ld\+json/, "داده ساختاریافته ندارد");
      assert.ok(html.includes("تاریخچه قیمت"), "بخش نمودار نیست");
    });
  }

  test("محصول ناموجود ۴۰۴ می‌دهد", async () => {
    const response = await get("/product/این-محصول-وجود-ندارد");
    assert.equal(response.status, 404);
  });

  test("slug لاتین ناموجود هم ۴۰۴ می‌دهد", async () => {
    const response = await get("/product/no-such-product-123");
    assert.equal(response.status, 404);
  });
});

describe("۴۰۴ برای بقیه‌ی مسیرهای پویا", () => {
  test("دسته‌بندی ناموجود", async () => {
    assert.equal((await get("/category/no-such-category")).status, 404);
  });

  test("مقاله‌ی ناموجود", async () => {
    assert.equal((await get("/mag/no-such-article")).status, 404);
  });

  test("مسیر کاملاً بی‌ربط", async () => {
    assert.equal((await get("/totally/unknown/path")).status, 404);
  });

  test("صفحه ۴۰۴ محتوای فارسی درست دارد", async () => {
    const response = await fetch(new URL("/no-such-page", BASE));
    assert.equal(response.status, 404);

    const html = await response.text();
    assert.ok(html.includes("این صفحه پیدا نشد"));
    assert.ok(html.includes("/deals"), "راه برگشت به کاربر نشان داده نمی‌شود");
  });
});

describe("مسیر خروج افیلیت", () => {
  test("به دیجی‌کالا ریدایرکت می‌کند", async () => {
    const product = products[0];
    const response = await get(`/go/${product.id}`);

    assert.equal(response.status, 302);
    const location = response.headers.get("location") ?? "";
    assert.ok(
      location.startsWith("https://www.digikala.com/product/"),
      `مقصد اشتباه: ${location}`,
    );
  });

  test("شناسه نامعتبر به صفحه فرصت‌ها برمی‌گردد", async () => {
    const response = await get("/go/nope-not-real");
    assert.equal(response.status, 302);
    assert.match(response.headers.get("location") ?? "", /\/deals$/);
  });

  test("همه‌ی محصولات مسیر خروج سالم دارند", async () => {
    for (const product of products) {
      const response = await get(`/go/${product.id}`);
      assert.equal(response.status, 302, product.slug);
    }
  });
});

describe("صفحه دسته‌بندی", () => {
  for (const category of categories) {
    test(`${category.id} محصولاتش را نشان می‌دهد`, async () => {
      const html = await getHtml(`/category/${category.id}`);
      assert.ok(html.includes(category.label), "عنوان دسته نیست");

      const items = products.filter((p) => p.category === category.id);
      assert.ok(items.length > 0, "دسته خالی است");
      assert.ok(
        html.includes(items[0].title),
        `محصول ${items[0].slug} در صفحه نیست`,
      );
      assert.ok(!html.includes('data-testid="empty-state"'), "حالت خالی نمایش داده شده");
    });
  }
});

describe("مجله", () => {
  test("فهرست مجله همه‌ی مطالب را نشان می‌دهد", async () => {
    const html = await getHtml("/mag");
    for (const article of articles) {
      assert.ok(html.includes(article.title), `${article.slug} در فهرست نیست`);
    }
  });

  for (const article of articles) {
    test(`${article.slug} متن کامل دارد`, async () => {
      const html = await getHtml(`/mag/${article.slug}`);

      assert.ok(html.includes(article.title), "عنوان نیست");
      assert.match(html, /application\/ld\+json/, "داده ساختاریافته ندارد");

      // چند پاراگراف واقعی از بدنه باید در HTML باشد
      const paragraphs = article.body.filter((b) => b.type === "p").slice(0, 3);
      assert.ok(paragraphs.length >= 3, "مقاله پاراگراف کافی ندارد");

      for (const block of paragraphs) {
        const snippet = block.text.slice(0, 40);
        assert.ok(html.includes(snippet), `این متن رندر نشده: «${snippet}…»`);
      }

      assert.ok(
        !html.includes("هنوز نوشته نشده"),
        "هنوز متن جای‌نگهدار دارد",
      );
    });
  }
});

describe("جستجو", () => {
  test("نتیجه‌ی درست برمی‌گرداند", async () => {
    const html = await getHtml("/search?q=iphone");
    assert.ok(html.includes("iPhone"), "نتیجه‌ای پیدا نشد");
  });

  test("عبارت بی‌نتیجه، حالت خالی نشان می‌دهد", async () => {
    const html = await getHtml("/search?q=zzzzqqq");
    assert.ok(html.includes('data-testid="empty-state"'));
  });

  test("noindex دارد", async () => {
    const html = await getHtml("/search?q=test");
    assert.match(html, /name="robots"[^>]*noindex/);
  });
});

describe("API خبرنامه", () => {
  test("ایمیل معتبر پذیرفته می‌شود", async () => {
    const response = await get("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" }),
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
  });

  test("ایمیل نامعتبر رد می‌شود", async () => {
    const response = await get("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.equal(body.ok, false);
    assert.ok(body.message.length > 0);
  });

  test("بدنه‌ی خالی رد می‌شود", async () => {
    const response = await get("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    assert.equal(response.status, 422);
  });

  test("JSON خراب باعث ۵۰۰ نمی‌شود", async () => {
    const response = await get("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "}{",
    });
    assert.equal(response.status, 400);
  });
});

describe("اندپوینت MCP", () => {
  /**
   * توکن در محیط تست ست نشده، پس اندپوینت باید کاملاً بسته باشد.
   * این مهم‌ترین ویژگی امنیتی‌اش است: پیش‌فرض «بسته».
   */
  const rpc = (body: unknown, token?: string) =>
    get("/api/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

  test("بدون توکن سرور، اندپوینت پاسخ نمی‌دهد", async () => {
    const response = await rpc({ jsonrpc: "2.0", id: 1, method: "ping" });

    assert.ok(
      [401, 403, 503].includes(response.status),
      `اندپوینت MCP نباید بدون احراز هویت کار کند (وضعیت: ${response.status})`,
    );
  });

  test("توکن دلخواه هم نباید کار کند", async () => {
    const response = await rpc(
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      "a".repeat(64),
    );

    assert.notEqual(response.status, 200, "توکن جعلی نباید پذیرفته شود");
  });

  test("هیچ داده‌ای بدون احراز هویت درز نمی‌کند", async () => {
    const response = await rpc(
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "site_status" } },
    );

    const text = await response.text();
    assert.ok(!text.includes("catalog"), "داده‌ی سایت بدون توکن برگشت");
    assert.ok(!text.includes("products"), "داده‌ی محصولات بدون توکن برگشت");
  });

  test("GET هم بدون توکن بسته است", async () => {
    const response = await get("/api/mcp");
    assert.ok([401, 403, 503].includes(response.status));
  });

  test("GET با توکن معتبر باید ۴۰۵ بدهد نه ۲۰۰", async () => {
    // استاندارد MCP: اگر سرور استریم SSE روی GET ندارد باید ۴۰۵ بدهد.
    // برگرداندن JSON با کد ۲۰۰ باعث می‌شد کلاینت کلاد نتواند وصل شود.
    const token = process.env.TEST_MCP_TOKEN;
    if (!token) return; // در محیط بدون توکن این تست معنا ندارد

    const response = await get(`/api/mcp/${token}`);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  });

  test("مسیر توکن‌دار با توکن جعلی باز نمی‌شود", async () => {
    const response = await get(`/api/mcp/${"a".repeat(64)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });

    assert.notEqual(response.status, 200, "توکن جعلی در مسیر پذیرفته شد");

    const text = await response.text();
    assert.ok(!text.includes("site_status"), "فهرست ابزارها درز کرد");
  });

  test("مسیر MCP از خزش گوگل خارج است", async () => {
    const txt = await getHtml("/robots.txt");
    assert.match(txt, /Disallow: \/api\//);
  });
});

describe("سئو", () => {
  test("sitemap همه‌ی محصولات و دسته‌ها را دارد", async () => {
    const xml = await getHtml("/sitemap.xml");

    for (const product of products) {
      assert.ok(xml.includes(`/product/${product.slug}`), product.slug);
    }
    for (const category of categories) {
      assert.ok(xml.includes(`/category/${category.id}`), category.id);
    }
  });

  test("robots مسیرهای حساس را می‌بندد", async () => {
    const txt = await getHtml("/robots.txt");
    assert.match(txt, /Disallow: \/go\//);
    assert.match(txt, /Disallow: \/account\//);
    assert.match(txt, /Sitemap:/);
  });

  test("صفحه اصلی canonical و og دارد", async () => {
    const html = await getHtml("/");
    assert.match(html, /rel="canonical"/);
    assert.match(html, /property="og:title"/);
  });

  test("هر صفحه محصول عنوان یکتا دارد", async () => {
    const titles = new Set<string>();

    for (const product of products.slice(0, 8)) {
      const html = await getHtml(`/product/${product.slug}`);
      const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
      assert.ok(title, `${product.slug} عنوان ندارد`);
      assert.ok(!titles.has(title), `عنوان تکراری: ${title}`);
      titles.add(title);
    }
  });
});

describe("افشای افیلیت", () => {
  const pages = ["/", "/deals", "/about", `/product/${products[0].slug}`];

  for (const page of pages) {
    test(`${page} افشای کمیسیون دارد`, async () => {
      const html = await getHtml(page);
      assert.ok(
        html.includes("کمیسیون"),
        "متن شفاف‌سازی افیلیت پیدا نشد — این شرط تایید رسانه است",
      );
    });
  }
});

describe("دسترس‌پذیری پایه", () => {
  test("صفحه اصلی زبان و جهت درست دارد", async () => {
    const html = await getHtml("/");
    assert.match(html, /<html[^>]+lang="fa"/);
    assert.match(html, /<html[^>]+dir="rtl"/);
  });

  test("هر صفحه دقیقاً یک h1 دارد", async () => {
    /*
      `/` عمداً اضافه شد.

      صفحه‌ی اصلی از این فهرست جا مانده بود و نتیجه‌اش این شد که دو
      `<h1>` داشته باشد بدون اینکه کسی بفهمد: هر دو هیرو — موبایلی و
      دسکتاپی — یکی داشتند و هر دو در DOM بودند.

      فهرست دستیِ مسیرها همیشه همین ریسک را دارد؛ ولی مهم‌ترین صفحه‌ی
      سایت لااقل باید در آن باشد.
    */
    for (const route of ["/", "/deals", "/stores", "/about", "/contact", "/privacy"]) {
      const html = await getHtml(route);
      const count = [...html.matchAll(/<h1[\s>]/g)].length;
      assert.equal(count, 1, `${route} تعداد h1: ${count}`);
    }
  });

  test("دکمه‌های آیکونی برچسب دسترس‌پذیری دارند", async () => {
    const html = await getHtml("/");
    assert.match(html, /aria-label="اعلان‌ها"/);
    assert.match(html, /aria-label="جستجوی محصول"/);
  });
});
