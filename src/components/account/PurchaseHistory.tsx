"use client";

import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Brand } from "@/components/ui/Brand";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { ChangeBadge } from "@/components/ui/Badge";
import { StoreTag } from "@/components/deals/StoreTag";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { formatPrice, priceDelta, timeAgo, toFaDigits } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * «خریدهای من».
 *
 * چرا اینجا سفارش واقعی نشان داده نمی‌شود:
 * PsyG فروشگاه نیست و هیچ دسترسی‌ای به پنل سفارش‌های دیجی‌کالا ندارد.
 * ساختن لیستی به اسم «سفارش‌ها» یعنی جعل داده‌ای که نداریم.
 *
 * ولی یک چیز را واقعاً می‌دانیم: کاربر روی کدام محصول‌ها «خرید» زده و از
 * اینجا به فروشگاه رفته. همان را نشان می‌دهیم، با اسم درست، به‌علاوه‌ی
 * چیزی که فروشگاه به کاربر نمی‌دهد — اینکه قیمت از آن روز تا حالا چه
 * کرده است.
 */
export function PurchaseHistory({ catalog }: { catalog: Product[] }) {
  const hydrated = useHydrated();
  const purchases = useUserData((s) => s.purchases);
  const clearPurchases = useUserData((s) => s.clearPurchases);

  const rows = hydrated
    ? purchases
        .map((visit) => ({
          visit,
          product: catalog.find((p) => p.id === visit.productId),
        }))
        .filter((row): row is { visit: typeof row.visit; product: Product } =>
          Boolean(row.product),
        )
    : [];

  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".purchase-row",
    y: 24,
    stagger: 0.06,
    duration: 0.7,
    deps: [hydrated, rows.length],
  });

  // تا قبل از هیدریت چیزی نشان نده تا با HTML سرور تفاوت نکند
  if (!hydrated) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface/50" />
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <EmptyState
          icon={ShoppingBag}
          title="هنوز از اینجا به فروشگاهی نرفتی"
          description="هر وقت روی «خرید» بزنی، همان محصول اینجا ثبت می‌شود تا بعداً یادت بماند چه چیزی را دنبال کرده بودی."
          actionLabel="دیدن فرصت‌ها"
          actionHref="/deals"
        />
        <WhyCard />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-mid nums-fa">
          {toFaDigits(rows.length)} محصول از <Brand glow={false} /> به فروشگاه رفتی
        </p>
        <Button variant="ghost" size="sm" onClick={clearPurchases}>
          پاک کردن تاریخچه
        </Button>
      </div>

      <div ref={scope} className="flex flex-col gap-3">
        {rows.map(({ visit, product }) => {
          const delta = priceDelta(product.previousPrice, product.currentPrice);

          return (
            <Card
              key={product.id}
              className="purchase-row will-reveal flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <Link
                href={`/product/${product.slug}`}
                className="shrink-0 self-start sm:self-auto"
              >
                <ProductThumb
                  src={product.image}
                  alt={product.title}
                  category={product.category}
                  className="size-20 rounded-xl"
                />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Link
                  href={`/product/${product.slug}`}
                  className="text-sm font-bold text-hi transition-colors hover:text-accent"
                >
                  {product.title}
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  <StoreTag store={product.store} />
                  <span className="text-[11px] text-low nums-fa">
                    {timeAgo(visit.at)}
                  </span>
                </div>

                {/* چیزی که فروشگاه نشانت نمی‌دهد: قیمت از آن روز تا حالا */}
                <p className="text-[11px] text-mid nums-fa">
                  قیمت الان: {formatPrice(product.currentPrice)} تومان
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <ChangeBadge delta={delta} showLabel />
                <a
                  href={`/go/${product.id}`}
                  target="_blank"
                  rel="nofollow sponsored noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-elevated/60 px-3 py-2 text-[11px] font-semibold text-mid transition-colors hover:border-accent/40 hover:text-accent"
                >
                  رفتن دوباره
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </Card>
          );
        })}
      </div>

      <WhyCard />
    </div>
  );
}

function WhyCard() {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="mb-2 text-sm font-bold text-hi">
        سفارش‌های واقعی‌ام کجاست؟
      </h2>
      <p className="text-xs leading-loose text-mid">
        <Brand glow={false} /> فروشگاه نیست؛ یک ابزار رصد قیمت است. وقتی روی
        «خرید» می‌زنی به صفحه‌ی محصول در فروشگاه می‌روی و سفارش، پرداخت، ارسال
        و مرجوعی همه آنجا انجام می‌شود — پس فهرست سفارش‌های قطعی‌ات را باید در
        پنل همان فروشگاه ببینی.
      </p>
      <p className="mt-2 text-xs leading-loose text-mid">
        چیزی که اینجا می‌بینی، محصول‌هایی است که از <Brand glow={false} /> به
        فروشگاه رفتی — همراه با اینکه قیمتشان از آن روز تا حالا چه کرده.
      </p>
    </Card>
  );
}
