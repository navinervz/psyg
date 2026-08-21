import type { NextConfig } from "next";

/**
 * هدرهای امنیتی.
 *
 * CSP اضافه شد، ولی فعلاً فقط در حالت گزارش. دلیلش پایین‌تر کنار خود
 * سیاست نوشته شده.
 */
/**
 * سیاست امنیت محتوا — فعلاً فقط گزارش، بدون مسدود کردن.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا Report-Only و نه مستقیم اجباری
 * ─────────────────────────────────────────────────────────────────────
 * CSP نادرست، صفحه را برای کاربر سفید می‌کند و هیچ خطایی هم به ما
 * نشان نمی‌دهد — فقط مرورگرِ او چیزی را بلاک می‌کند و ما هرگز
 * نمی‌فهمیم. الان کاربر واقعی داریم و از گوگل هم ترافیک می‌آید، پس
 * ریسکش واقعی است.
 *
 * در حالت گزارش، مرورگر همه‌چیز را عادی اجرا می‌کند و تخلف‌ها را در
 * کنسول می‌نویسد. وقتی چند روز چیزی گزارش نشد، همین رشته را زیر کلید
 * `Content-Security-Policy` می‌گذاریم و اجباری می‌شود.
 *
 * ─────────────────────────────────────────────────────────────────────
 * صادقانه دربارهٔ ضعفش: script-src
 * ─────────────────────────────────────────────────────────────────────
 * `'unsafe-inline'` عملاً بیشتر محافظت script-src را خنثی می‌کند. اینجا
 * هست چون سه اسکریپت اینلاین داریم: داده‌ی ساختاریافته، تور نجات
 * انیمیشن، و راه‌اندازی گوگل آنالیتیکس. به‌علاوه خود Next اسکریپت‌های
 * بوت‌استرپ اینلاین تولید می‌کند که محتوایشان در هر صفحه فرق دارد، پس
 * هش کردن جواب نمی‌دهد.
 *
 * راه درستش nonce است، ولی nonce یعنی میدل‌ور روی همه‌ی صفحه‌ها اجرا
 * شود و کل سایت پویا رندر شود. آن معامله ارزشش را دارد یا نه، تصمیمی
 * است که با داده‌ی واقعیِ همین گزارش‌ها بهتر گرفته می‌شود.
 *
 * بقیه‌ی دستورها همین حالا ارزش واقعی دارند: تزریق تگ base، ربودن
 * مقصد فرم، جاسازی افزونه، و اتصال به دامنه‌های ناشناس را می‌بندند.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // توضیح ضعفش بالا آمده
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  // GSAP سبک را مستقیم روی خود المان می‌نویسد
  "style-src 'self' 'unsafe-inline'",
  // فونت‌ها خودمیزبان‌اند
  "font-src 'self'",
  /*
    تصویر محصولات از CDN فروشگاه‌های همکار می‌آید و فهرستشان با اضافه
    شدن هر فروشگاه عوض می‌شود. `https:` یعنی هر مبدأ امنی مجاز است ولی
    http ساده همچنان بلاک می‌ماند.
  */
  "img-src 'self' data: https:",
  "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com",
  // این سایت هیچ‌وقت چیزی را در iframe نمی‌گذارد
  "frame-src 'none'",
  // فلش و اپلت و امثالش
  "object-src 'none'",
  // جلوگیری از تزریق <base> که همه‌ی لینک‌های نسبی را می‌دزدد
  "base-uri 'self'",
  // فرم‌ها فقط به خود سایت ارسال شوند
  "form-action 'self'",
  // همتای امروزی X-Frame-Options
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  /*
    عمداً `-Report-Only`. تا وقتی کنسول مرورگر روی صفحه‌های اصلی تمیز
    نباشد، این هدر به شکل اجباری در نمی‌آید.
  */
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  // جلوگیری از قرار گرفتن سایت در iframe سایت دیگر (کلیک‌جکینگ)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // مرورگر نوع فایل را حدس نزند
  { key: "X-Content-Type-Options", value: "nosniff" },
  // آدرس کامل صفحه به سایت مقصد لو نرود — برای لینک‌های افیلیت مهم است
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // دسترسی‌هایی که این سایت هرگز لازم ندارد
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  /*
    HSTS: مرورگر بعد از اولین بازدید، دیگر هرگز با http به این دامنه وصل
    نمی‌شود. این هدر قبلاً فقط در `deploy/nginx/psyg.conf` بود، ولی سایت با
    Cloudflare Tunnel منتشر می‌شود و Nginx در مسیر درخواست نیست — یعنی در
    پروداکشن اصلاً ارسال نمی‌شد.

    عمداً بدون `includeSubDomains` و بدون `preload`:
    زیردامنه‌ی n8n جداگانه مدیریت می‌شود و `preload` عملاً برگشت‌ناپذیر است.
  */
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * خروجی standalone: Next یک سرور مستقل با فقط وابستگی‌های لازم
   * می‌سازد. ایمیج داکر به‌جای چند صد مگابایت node_modules، حدود
   * ۱۵۰ مگابایت می‌شود.
   */
  output: "standalone",

  // نسخه‌ی Next را در هدر پاسخ اعلام نکن
  poweredByHeader: false,

  // آدرس با و بدون اسلش انتهایی یکی باشند (جلوگیری از محتوای تکراری)
  trailingSlash: false,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "dkstatics-public.digikala.com" },
      { protocol: "https", hostname: "**.digikala.com" },
    ],
  },

  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // فونت‌ها هش ندارند ولی عملاً هیچ‌وقت عوض نمی‌شوند
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
