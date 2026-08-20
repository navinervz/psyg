import type { NextConfig } from "next";

/**
 * هدرهای امنیتی.
 *
 * CSP عمداً اینجا نیست: Next برای اسکریپت‌های اینلاین خودش به nonce
 * نیاز دارد و CSP نادرست سایت را بی‌صدا می‌شکند. اگر خواستید اضافه کنید،
 * اول با `Content-Security-Policy-Report-Only` تست کنید.
 */
const securityHeaders = [
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
