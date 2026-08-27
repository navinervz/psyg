import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { fetchAllProducts } from "@/lib/affilio";
import { mergeCatalog, readCatalog, writeCatalog } from "@/lib/catalog-store";

/**
 * اندپوینت ورود داده — فقط برای ورک‌فلوی n8n.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این یکی نوشتنی است، در حالی که MCP عمداً فقط-خواندنی ماند
 * ─────────────────────────────────────────────────────────────────────
 * تصمیم قبلی پروژه این بود که هیچ اندپوینت نوشتنی روی پروداکشن نباشد،
 * چون توکنش دیر یا زود بیرون می‌رود و آن‌وقت هرکس می‌تواند لینک‌های
 * افیلیت را به نام خودش عوض کند.
 *
 * این اندپوینت آن ریسک را با سه محدودیت مهار می‌کند:
 *
 * ۱. **هیچ داده‌ای از بیرون نمی‌پذیرد.** بدنه‌ی درخواست خوانده نمی‌شود.
 *    خودِ سرور می‌رود از افیلیو می‌خواند. یعنی حتی اگر توکن لو برود،
 *    مهاجم فقط می‌تواند باعث شود کاتالوگ زودتر از موعد به‌روز شود —
 *    نمی‌تواند محتوای دلخواه تزریق کند یا لینک افیلیت را عوض کند.
 * ۲. **fail closed.** بدون `PSYG_INGEST_TOKEN` اندپوینت اصلاً وجود ندارد.
 * ۳. **مقایسه‌ی timing-safe** مثل اندپوینت MCP.
 *
 * محدودیت اول از همه مهم‌تر است. اگر بدنه می‌پذیرفت، عملاً یک در پشتی
 * برای نوشتن هرچیزی روی سایت بود.
 */

export const dynamic = "force-dynamic";

const MIN_TOKEN_LENGTH = 32;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function authorize(header: string | null): {
  ok: boolean;
  status?: 401 | 403 | 503;
  message?: string;
} {
  const secret = process.env.PSYG_INGEST_TOKEN;

  if (!secret || secret.length < MIN_TOKEN_LENGTH) {
    return {
      ok: false,
      status: 503,
      message: "اندپوینت ورود داده فعال نیست",
    };
  }

  const match = /^Bearer\s+(.+)$/i.exec((header ?? "").trim());
  if (!match) return { ok: false, status: 401, message: "توکن لازم است" };

  if (!timingSafeEqual(sha256(match[1]), sha256(secret))) {
    return { ok: false, status: 403, message: "توکن نامعتبر است" };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const auth = authorize(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { products, failures } = await fetchAllProducts({
      // پاسخ افیلیو نباید کش شود، وگرنه قیمت‌ها کهنه می‌مانند
      cache: "no-store",
    });

    /*
      اگر هیچ محصولی نیامد، کاتالوگ قبلی را پاک نمی‌کنیم.

      یک قطعی موقت در افیلیو نباید سایت را خالی کند. محصول قدیمی با قیمت
      دیروز، از صفحه‌ی خالی خیلی بهتر است.
    */
    if (products.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "هیچ محصولی از افیلیو نیامد — کاتالوگ قبلی دست‌نخورده ماند",
          failures,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } },
      );
    }

    const existing = await readCatalog();
    const merged = mergeCatalog(products, existing);

    await writeCatalog({
      updatedAt: new Date().toISOString(),
      products: merged.products,
      archive: merged.archive,
    });

    /*
      این دو عدد در گزارش هستند چون بار قبل دقیقاً همین‌ها را نداشتیم.

      وقتی فید چرخید و تاریخچه‌ها دور ریخته شدند، پاسخ ingest همچنان
      `ok: true` بود و می‌گفت ۸۰ محصول نوشته شد — که درست بود و هیچ‌چیز
      از فاجعه را نشان نمی‌داد. `archived` و `rejoined` همان چیزی‌اند که
      آن شب باید دیده می‌شد.
    */
    const rejoined = merged.products.filter(
      (product) => product.historyFrom,
    ).length;

    return NextResponse.json(
      {
        ok: true,
        productsWritten: merged.products.length,
        archived: merged.archive.length,
        rejoined,
        // اگر بعضی ویجت‌ها پاسخ ندادند، در همان گزارش دیده شود
        failures,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    // جزئیات خطا در لاگ سرور می‌ماند، نه در پاسخ
    console.error("[ingest] failed:", error);
    return NextResponse.json(
      { ok: false, message: "به‌روزرسانی کاتالوگ ناموفق بود" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
