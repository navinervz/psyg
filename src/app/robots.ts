import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // مسیر خروج افیلیت و نتایج جستجو نباید خزیده شوند
      /*
        `/unsubscribe` هم بسته است.

        اگر خزنده آن را دنبال کند، توکن لغو اشتراک کاربر را با یک
        درخواست GET مصرف می‌کند — یعنی اشتراک کسی بدون اینکه خودش
        بخواهد لغو می‌شود. صفحه `noindex` هم دارد، ولی این لایه‌ی دوم
        است.
      */
      disallow: [
        "/go/",
        "/search",
        "/api/",
        "/account/",
        "/admin",
        "/unsubscribe",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
