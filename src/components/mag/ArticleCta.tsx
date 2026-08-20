import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { BuyButton } from "@/components/deals/BuyButton";
import { ChangeBadge } from "@/components/ui/Badge";
import { formatPrice, priceDelta } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * بلوک «کال تو اکشن» انتهای مقاله.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا قیمت اینجا و نه داخل متن مقاله
 * ─────────────────────────────────────────────────────────────────────
 * مقاله یک بار نوشته می‌شود و ماه‌ها می‌ماند. اگر قیمت داخل متنش بود،
 * هفته‌ی بعد عددی را نشان می‌داد که با صفحه‌ی محصول نمی‌خواند — و خواننده
 * حق داشت به بقیه‌ی حرف‌های سایت هم شک کند.
 *
 * پس مقاله فقط `slug` محصولات را نگه می‌دارد و قیمت لحظه‌ی رندر از
 * کاتالوگ زنده خوانده می‌شود. متن کهنه می‌شود، عدد نه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این کامپوننت سروری است
 * ─────────────────────────────────────────────────────────────────────
 * محصولات به‌صورت prop از صفحه‌ی سروری می‌آیند. اگر کلاینتی بود، باید از
 * `data.ts` می‌خواند و کل کاتالوگ وارد باندل مرورگر می‌شد — چیزی که تست
 * `routes.test.ts` هم ممنوعش کرده.
 */
export function ArticleCta({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <aside
      dir="rtl"
      className="mt-10 rounded-[20px] border border-accent/20 bg-surface p-5"
    >
      <h2 className="text-base font-extrabold text-hi">
        {products.length === 1
          ? "محصولی که در این مطلب بررسی شد"
          : "محصولاتی که در این مطلب بررسی شدند"}
      </h2>
      <p className="pt-1 pb-4 text-xs leading-relaxed text-low">
        قیمت‌ها همین الان از فروشگاه خوانده شده‌اند. خرید در دیجی‌کالا یا
        اسنپ‌شاپ انجام می‌شود؛ سای‌جی فقط قیمت‌ها را رصد می‌کند.
      </p>

      <ul className="space-y-3">
        {products.map((product) => {
          const delta = priceDelta(product.previousPrice, product.currentPrice);

          return (
            <li
              key={product.slug}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-night/40 p-3"
            >
              <Link
                href={`/product/${product.slug}`}
                className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-night"
              >
                <ProductThumb
                  src={product.image}
                  alt={product.title}
                  category={product.category}
                  className="size-full p-1"
                />
              </Link>

              <div className="min-w-0 flex-1 basis-40">
                <Link
                  href={`/product/${product.slug}`}
                  className="line-clamp-2 text-xs font-bold text-hi transition-colors hover:text-accent"
                >
                  {product.title}
                </Link>
                <p className="flex items-center gap-2 pt-1">
                  <span className="text-sm font-extrabold text-accent nums-fa">
                    {formatPrice(product.currentPrice)}
                  </span>
                  {delta !== 0 && <ChangeBadge delta={delta} />}
                </p>
              </div>

              <div className="w-full sm:w-32">
                <BuyButton productId={product.id} store={product.store} />
              </div>
            </li>
          );
        })}
      </ul>

      <Link
        href="/deals"
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-accent transition-opacity hover:opacity-80"
      >
        دیدن همه‌ی فرصت‌های امروز
        <ArrowLeft className="size-3.5" strokeWidth={2.4} />
      </Link>
    </aside>
  );
}
