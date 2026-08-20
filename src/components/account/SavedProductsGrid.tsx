"use client";

import { Heart, TrendingUp } from "lucide-react";
import { DealCard } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { toFaDigits } from "@/lib/format";
import type { Product } from "@/lib/types";

type Kind = "favorites" | "tracked";

const COPY = {
  favorites: {
    icon: Heart,
    emptyTitle: "هنوز چیزی به علاقه‌مندی‌ها اضافه نکردی",
    emptyText:
      "روی آیکون قلب هر محصول بزن تا اینجا ذخیره شود و بتوانی قیمتش را دنبال کنی.",
    clearLabel: "پاک کردن همه علاقه‌مندی‌ها",
    countLabel: "محصول در علاقه‌مندی‌ها",
  },
  tracked: {
    icon: TrendingUp,
    emptyTitle: "هیچ محصولی را پیگیری نمی‌کنی",
    emptyText:
      "روی آیکون زنگ هر محصول بزن تا وقتی قیمتش تغییر کرد بهت خبر بدهیم.",
    clearLabel: "پاک کردن همه پیگیری‌ها",
    countLabel: "محصول در حال پیگیری",
  },
} as const;

/**
 * گرید مشترک صفحه‌های علاقه‌مندی و پیگیری.
 *
 * کدام محصولات ذخیره شده‌اند از localStorage می‌آید، ولی خود کاتالوگ
 * به‌صورت prop از کامپوننت سروری می‌رسد — وگرنه ۷۷ کیلوبایت JSON وارد
 * باندل مرورگر می‌شد.
 */
export function SavedProductsGrid({
  kind,
  catalog,
}: {
  kind: Kind;
  catalog: Product[];
}) {
  const hydrated = useHydrated();
  const favorites = useUserData((s) => s.favorites);
  const tracked = useUserData((s) => s.tracked);
  const clearFavorites = useUserData((s) => s.clearFavorites);
  const clearTracked = useUserData((s) => s.clearTracked);

  const copy = COPY[kind];
  const ids = kind === "favorites" ? favorites : tracked;
  const clear = kind === "favorites" ? clearFavorites : clearTracked;
  const items = hydrated ? catalog.filter((product) => ids.includes(product.id)) : [];

  /*
    این گرید قبلاً هیچ انیمیشن ورودی نداشت، ولی `DealCard` کلاس
    `will-reveal` دارد که در CSS یعنی `opacity: 0`. نتیجه این بود که
    کارت‌های علاقه‌مندی و پیگیری برای همیشه نامرئی می‌ماندند — صفحه
    خالی به نظر می‌رسید در حالی که داده‌اش سر جایش بود.

    هوک باید قبل از هر `return` زودهنگام صدا زده شود، وگرنه ترتیب
    هوک‌ها بین رندرها عوض می‌شود.
  */
  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".deal-card",
    y: 50,
    rotateX: 10,
    stagger: 0.04,
    duration: 0.8,
    deps: [hydrated, items.length],
  });

  // تا قبل از هیدریت چیزی نشان نده تا با HTML سرور تفاوت نکند
  if (!hydrated) {
    return (
      <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface/50" />
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={copy.icon}
        title={copy.emptyTitle}
        description={copy.emptyText}
        actionLabel="دیدن فرصت‌ها"
        actionHref="/deals"
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mid nums-fa">
          {toFaDigits(items.length)} {copy.countLabel}
        </p>
        <Button variant="ghost" size="sm" onClick={clear}>
          {copy.clearLabel}
        </Button>
      </div>

      <div
        ref={scope}
        dir="ltr"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6"
        style={{ perspective: "1100px" }}
      >
        {items.map((product, index) => (
          <DealCard
            key={product.id}
            product={product}
            index={index}
            showRank={false}
          />
        ))}
      </div>
    </div>
  );
}
