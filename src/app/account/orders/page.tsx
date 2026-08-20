import type { Metadata } from "next";
import { PurchaseHistory } from "@/components/account/PurchaseHistory";
import { products } from "@/lib/data";

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

export const metadata: Metadata = {
  title: "خریدهای من",
  robots: { index: false, follow: false },
};

/**
 * کامپوننت سروری است تا کاتالوگ اینجا خوانده شود و به‌صورت prop برود.
 * اگر `PurchaseHistory` خودش از `@/lib/data` می‌خواند، کل کاتالوگ وارد
 * باندل مرورگر می‌شد.
 */
export default function OrdersPage() {
  return <PurchaseHistory catalog={products} />;
}
