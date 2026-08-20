import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { readCatalog } from "@/lib/catalog-store";

/**
 * بررسی سلامت — برای سرویس‌های مانیتورینگ بیرونی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فقط «۲۰۰ برگرداندن» کافی نیست
 * ─────────────────────────────────────────────────────────────────────
 * ساده‌ترین اندپوینت سلامت `{ ok: true }` برمی‌گرداند و همیشه سبز است —
 * حتی وقتی سایت کاتالوگ خالی سرو می‌کند یا داده‌اش سه هفته کهنه شده.
 *
 * دقیقاً همین اتفاق در این پروژه افتاد: صفحه‌ی اصلی ماه‌ها می‌توانست
 * محصولات نمونه را نشان دهد و هر تست «آیا صفحه بالا می‌آید؟» سبز بود.
 *
 * پس اینجا سه چیز واقعی سنجیده می‌شود:
 *
 * ۱. کاتالوگ خوانده می‌شود و خالی نیست.
 * ۲. داده‌ی نمونه سرو نمی‌شود (نشانه‌اش شناسه‌های `dk-` است).
 * ۳. همگام‌سازی بیش از حد کهنه نشده.
 *
 * هر کدام شکست بخورد، وضعیت ۵۰۳ برمی‌گردد تا مانیتورینگ خبر دهد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا بدون احراز هویت
 * ─────────────────────────────────────────────────────────────────────
 * سرویس‌های مانیتورینگ رایگان معمولاً توکن نمی‌فرستند. خروجی هم هیچ
 * چیز محرمانه‌ای ندارد — فقط تعداد محصول و تازگی داده، که هر دو از
 * صفحه‌ی اصلی هم قابل استنتاج‌اند.
 */

export const dynamic = "force-dynamic";

/** بیشتر از این، داده کهنه حساب می‌شود */
const STALE_AFTER_HOURS = 48;

export async function GET() {
  const problems: string[] = [];

  let productCount = 0;
  let ageHours: number | null = null;

  try {
    productCount = products.length;

    if (productCount === 0) {
      problems.push("catalog_empty");
    }

    /*
      داده‌ی نمونه شناسه‌هایی مثل `dk-airpods-pro-2` دارد، ولی داده‌ی
      واقعی افیلیو UUID است. اگر اولی را می‌بینیم یعنی سایت به داده‌ی
      دوران توسعه برگشته — همان باگی که یک بار صفحه‌ی اصلی را ماه‌ها
      با محصولات جعلی پر کرده بود.
    */
    if (products.some((p) => p.id.startsWith("dk-"))) {
      problems.push("serving_seed_data");
    }

    const catalog = await readCatalog();

    if (catalog.updatedAt) {
      ageHours = (Date.now() - new Date(catalog.updatedAt).getTime()) / 3_600_000;
      if (ageHours > STALE_AFTER_HOURS) {
        problems.push("catalog_stale");
      }
    } else {
      problems.push("never_synced");
    }
  } catch {
    problems.push("catalog_unreadable");
  }

  const healthy = problems.length === 0;

  return NextResponse.json(
    {
      ok: healthy,
      products: productCount,
      catalogAgeHours: ageHours === null ? null : Math.round(ageHours),
      problems,
    },
    {
      status: healthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
