import {
  alerts,
  articles,
  getProduct,
  products,
  productsByCategory,
  relatedProducts,
  searchProducts,
  suggestions,
  topDeals,
} from "@/lib/data";
import { categories, stores } from "@/lib/reference";
import { analyzePrice } from "@/lib/analysis";
import { priceDelta } from "@/lib/format";
import { runSecurityAudit } from "@/lib/security-audit";
import { SITE_URL } from "@/lib/site";
import { toolError, toolOk, type ToolResult } from "@/lib/mcp/protocol";
import type { CategoryId, Product } from "@/lib/types";

/**
 * ابزارهای MCP.
 *
 * **همه فقط-خواندنی‌اند.** این تصمیم عمدی است:
 *
 * اندپوینت روی اینترنت باز است و هرکس توکن را داشته باشد می‌تواند
 * صدایش بزند. ابزار نوشتنی — چه رسد به اجرای دستور — یعنی ساختن یک در
 * پشتی روی سرور پروداکشن. اگر توکن لو برود (در تاریخچه‌ی چت، در لاگ یک
 * سرویس، در اسکرین‌شات)، مهاجم کنترل کامل می‌گیرد.
 *
 * تغییر محتوا و کد از مسیر امن انجام می‌شود: ویرایش در مخزن، بیلد، دیپلوی.
 */

export type ToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<ToolResult> | ToolResult;
};

/* ────────────────────────────  کمکی‌ها  ──────────────────────────── */

function slim(product: Product) {
  return {
    slug: product.slug,
    title: product.title,
    category: product.category,
    brand: product.brand,
    currentPrice: product.currentPrice,
    previousPrice: product.previousPrice,
    weeklyChangePercent: Number(
      priceDelta(product.previousPrice, product.currentPrice).toFixed(2),
    ),
    url: `${SITE_URL}/product/${product.slug}`,
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/* ────────────────────────────  ابزارها  ──────────────────────────── */

export const TOOLS: ToolDefinition[] = [
  {
    name: "site_status",
    title: "وضعیت سایت",
    description:
      "نمای کلی سایت: تعداد محصولات و مقالات، فروشگاه‌های فعال، آدرس سایت و اینکه کدام تنظیمات محیطی پر شده‌اند. مقدار متغیرهای محرمانه هرگز برگردانده نمی‌شود.",
    inputSchema: { type: "object", properties: {} },
    handler: () =>
      toolOk(
        {
          siteUrl: SITE_URL,
          environment: process.env.NODE_ENV ?? "unknown",
          catalog: {
            products: products.length,
            categories: categories.length,
            articles: articles.length,
            storesTotal: stores.length,
            storesActive: stores.filter((s) => s.active).length,
          },
          priceMovement: {
            drops: products.filter((p) => p.currentPrice < p.previousPrice)
              .length,
            rises: products.filter((p) => p.currentPrice > p.previousPrice)
              .length,
          },
          /*
            چند محصول لینک افیلیت واقعی دارند.

            جای «آیا شناسه‌ی ناشر ست شده» را گرفت، چون چنین شناسه‌ای اصلاً
            وجود ندارد: در افیلیو هر لینک `affid` یکتای خودش را دارد. عددی
            که واقعاً معنا دارد این است که چند محصول درآمدزا هستند.
          */
          monetization: {
            productsWithAffiliateLink: products.filter((p) => p.affiliateUrl)
              .length,
            productsWithoutAffiliateLink: products.filter(
              (p) => !p.affiliateUrl,
            ).length,
          },
          // فقط «ست شده یا نه» — نه مقدار
          configuration: {
            siteUrlConfigured: !SITE_URL.includes("localhost"),
            newsletterWebhookConfigured: Boolean(
              process.env.N8N_SUBSCRIBE_WEBHOOK_URL,
            ),
          },
        },
        "وضعیت فعلی سایت PsyG",
      ),
  },

  {
    name: "list_products",
    title: "فهرست محصولات",
    description:
      "فهرست محصولات با امکان فیلتر بر اساس دسته‌بندی و مرتب‌سازی. برای دیدن تاریخچه‌ی قیمت از get_product استفاده کن.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "شناسه دسته",
          enum: categories.map((c) => c.id),
        },
        sort: {
          type: "string",
          enum: ["biggest_drop", "biggest_rise", "cheapest", "most_expensive"],
          default: "biggest_drop",
        },
        limit: { type: "number", default: 20, minimum: 1, maximum: 100 },
      },
    },
    handler: (args) => {
      const category = asString(args.category);
      const sort = asString(args.sort) ?? "biggest_drop";
      const limit = Math.min(100, Math.max(1, asNumber(args.limit, 20)));

      if (category && !categories.some((c) => c.id === category)) {
        return toolError(
          `دسته‌ی «${category}» وجود ندارد. دسته‌های معتبر: ${categories.map((c) => c.id).join(", ")}`,
        );
      }

      let list = category
        ? productsByCategory(category as CategoryId)
        : [...products];

      list = list.sort((a, b) => {
        const da = priceDelta(a.previousPrice, a.currentPrice);
        const db = priceDelta(b.previousPrice, b.currentPrice);

        switch (sort) {
          case "biggest_rise":
            return db - da;
          case "cheapest":
            return a.currentPrice - b.currentPrice;
          case "most_expensive":
            return b.currentPrice - a.currentPrice;
          default:
            return da - db;
        }
      });

      return toolOk(
        { total: list.length, returned: Math.min(limit, list.length), items: list.slice(0, limit).map(slim) },
        `${list.length} محصول یافت شد`,
      );
    },
  },

  {
    name: "get_product",
    title: "جزئیات محصول",
    description:
      "اطلاعات کامل یک محصول شامل تاریخچه‌ی ۳۰ روزه‌ی قیمت، تحلیل «الان بخرم یا صبر کنم» و محصولات مشابه.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "شناسه محصول در URL" },
      },
      required: ["slug"],
    },
    handler: (args) => {
      const slug = asString(args.slug);
      if (!slug) return toolError("پارامتر slug لازم است");

      const product = getProduct(slug);
      if (!product) {
        return toolError(
          `محصولی با شناسه‌ی «${slug}» پیدا نشد. از list_products برای دیدن شناسه‌های معتبر استفاده کن.`,
        );
      }

      const verdict = analyzePrice(product);

      return toolOk(
        {
          ...slim(product),
          sourceUrl: product.sourceUrl,
          affiliateExitPath: `/go/${product.id}`,
          history: product.history,
          analysis: {
            headline: verdict.headline,
            detail: verdict.detail,
            tone: verdict.tone,
            lowest30d: verdict.lowest,
            average30d: verdict.average,
            highest30d: verdict.highest,
            positionInRange: verdict.position,
          },
          related: relatedProducts(product, 4).map((p) => p.slug),
        },
        `جزئیات ${product.title}`,
      );
    },
  },

  {
    name: "search_products",
    title: "جستجوی محصول",
    description: "جستجو در عنوان، برند و دسته‌بندی محصولات.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"],
    },
    handler: (args) => {
      const query = asString(args.query);
      if (!query) return toolError("پارامتر query لازم است");

      const results = searchProducts(query);
      return toolOk(
        { query, count: results.length, items: results.map(slim) },
        `${results.length} نتیجه برای «${query}»`,
      );
    },
  },

  {
    name: "price_analysis",
    title: "تحلیل بازار",
    description:
      "خلاصه‌ی حرکت قیمت‌ها: بیشترین افت و افزایش، و وضعیت هر دسته‌بندی. برای فهمیدن اینکه امروز کجا فرصت هست.",
    inputSchema: { type: "object", properties: {} },
    handler: () => {
      const byCategory = categories.map((category) => {
        const items = productsByCategory(category.id);
        const deltas = items.map((p) =>
          priceDelta(p.previousPrice, p.currentPrice),
        );
        const average =
          deltas.length === 0
            ? 0
            : deltas.reduce((a, b) => a + b, 0) / deltas.length;

        return {
          category: category.id,
          label: category.label,
          products: items.length,
          drops: items.filter((p) => p.currentPrice < p.previousPrice).length,
          averageChangePercent: Number(average.toFixed(2)),
        };
      });

      const sorted = [...products].sort(
        (a, b) =>
          priceDelta(a.previousPrice, a.currentPrice) -
          priceDelta(b.previousPrice, b.currentPrice),
      );

      const nearLow = [...products]
        .map((product) => ({ product, verdict: analyzePrice(product) }))
        .filter((entry) => entry.verdict.position <= 15)
        .map((entry) => ({
          slug: entry.product.slug,
          title: entry.product.title,
          positionInRange: entry.verdict.position,
        }));

      return toolOk(
        {
          biggestDrops: sorted.slice(0, 5).map(slim),
          biggestRises: sorted.slice(-5).reverse().map(slim),
          nearThirtyDayLow: nearLow,
          byCategory,
        },
        "تحلیل حرکت قیمت‌ها",
      );
    },
  },

  {
    name: "list_categories",
    title: "دسته‌بندی‌ها",
    description: "فهرست دسته‌بندی‌ها با تعداد محصول هرکدام.",
    inputSchema: { type: "object", properties: {} },
    handler: () =>
      toolOk(
        categories.map((category) => ({
          id: category.id,
          label: category.label,
          description: category.description,
          products: productsByCategory(category.id).length,
          url: `${SITE_URL}/category/${category.id}`,
        })),
      ),
  },

  {
    name: "list_articles",
    title: "مطالب مجله",
    description:
      "فهرست مقالات مجله. با دادن slug، متن کامل همان مقاله برگردانده می‌شود.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "برای دریافت متن کامل" },
      },
    },
    handler: (args) => {
      const slug = asString(args.slug);

      if (slug) {
        const article = articles.find((a) => a.slug === slug);
        if (!article) return toolError(`مقاله‌ای با شناسه‌ی «${slug}» نیست`);
        return toolOk(article, `متن کامل: ${article.title}`);
      }

      return toolOk(
        articles.map((article) => ({
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          tag: article.tag,
          date: article.date,
          readMinutes: article.readMinutes,
          url: `${SITE_URL}/mag/${article.slug}`,
        })),
        `${articles.length} مطلب`,
      );
    },
  },

  {
    name: "homepage_content",
    title: "محتوای صفحه اصلی",
    description:
      "چیزی که همین الان روی صفحه‌ی اصلی نمایش داده می‌شود: بهترین فرصت‌ها، هشدارهای اخیر و پیشنهادها. همه از داده‌ی واقعی مشتق می‌شوند.",
    inputSchema: { type: "object", properties: {} },
    handler: () =>
      toolOk({
        topDeals: topDeals(6).map(slim),
        recentAlerts: alerts,
        suggestions,
      }),
  },

  {
    name: "security_audit",
    title: "ممیزی امنیتی",
    description:
      "بررسی خودکار وضعیت امنیتی سایت: هدرهای HTTP، گواهی، robots.txt، بهداشت متغیرهای محیطی و لینک‌های افیلیت. هر یافته توضیح می‌دهد چرا مهم است و چطور رفع می‌شود.",
    inputSchema: {
      type: "object",
      properties: {
        includeNetwork: {
          type: "boolean",
          default: true,
          description:
            "اگر false باشد فقط بررسی‌های محلی انجام می‌شود (بدون درخواست شبکه)",
        },
      },
    },
    handler: async (args) => {
      const includeNetwork =
        typeof args.includeNetwork === "boolean" ? args.includeNetwork : true;

      const report = await runSecurityAudit({ includeNetwork });

      const problems = report.findings.filter((f) => f.severity !== "ok");
      const summary =
        problems.length === 0
          ? `همه‌ی ${report.score.total} بررسی سالم بود.`
          : `${problems.length} مورد نیاز به رسیدگی دارد (بدترین سطح: ${report.worstSeverity}).`;

      return toolOk(report, summary);
    },
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

/** شکل ابزار برای پاسخ tools/list */
export function toolsManifest() {
  return TOOLS.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }));
}
