import type { MetadataRoute } from "next";
import { products, articles, categories } from "@/lib/data";
import { NAV_LINKS } from "@/lib/nav";
import { SITE_URL } from "@/lib/site";

/**
 * رندر در زمان درخواست — چون این صفحه از کاتالوگ زنده می‌خواند.
 *
 * ⚠️ نبودِ این خط یک باگ واقعی و بی‌صدا ساخت.
 *
 * کاتالوگ در زمان اجرا از `/data/catalog.json` خوانده می‌شود، ولی آن
 * فایل روی یک والیوم داکر است که فقط موقع اجرا مانت می‌شود — نه موقع
 * بیلد. پس وقتی Next این صفحه را در زمان بیلد پیش‌رندر می‌کرد، فایل
 * وجود نداشت و `data.ts` به داده‌ی نمونه برمی‌گشت.
 *
 * نتیجه: صفحه‌ی اصلی سایت ماه‌ها می‌توانست محصولاتی مثل «AirPods Pro 2»
 * را نشان دهد که اصلاً وجود ندارند، در حالی که `/deals` — که
 * force-dynamic داشت — محصولات واقعی را نشان می‌داد. هیچ خطایی هم
 * جایی ثبت نمی‌شد.
 *
 * تست `static-data.test.ts` این قاعده را خودکار بررسی می‌کند.
 */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    ...NAV_LINKS.map((link) => ({
      url: `${SITE_URL}${link.href}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: link.href === "/" ? 1 : 0.8,
    })),
    { url: `${SITE_URL}/contact`, lastModified: now, priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: now, priority: 0.3 },
  ];

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/category/${category.id}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.85,
  }));

  const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${SITE_URL}/mag/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages, ...articlePages];
}
