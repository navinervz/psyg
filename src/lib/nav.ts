export type NavLink = { href: string; label: string };

/** تک‌منبع لینک‌های نویگیشن — هدر دسکتاپ، منوی موبایل و sitemap از همین می‌خوانند */
export const NAV_LINKS: NavLink[] = [
  { href: "/", label: "خانه" },
  { href: "/deals", label: "فرصت‌ها" },
  { href: "/stores", label: "فروشگاه‌ها" },
  { href: "/mag", label: "مجله" },
  { href: "/about", label: "درباره ما" },
];
