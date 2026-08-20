"use client";

import { DealCard } from "@/components/deals/DealCard";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import type { Product } from "@/lib/types";

/**
 * گرید کارت‌ها با انیمیشن ورود.
 *
 * محصولات را به‌صورت prop می‌گیرد و از `@/lib/data` ایمپورت نمی‌کند —
 * وگرنه کل کاتالوگ (۳۱ محصول × ۳۰ نقطه قیمت) وارد باندل کلاینت می‌شد
 * حتی در صفحه‌هایی که فقط ۶ کارت نشان می‌دهند.
 */
export function RevealGrid({
  items,
  showRank = false,
  columns = "six",
}: {
  items: Product[];
  showRank?: boolean;
  columns?: "six" | "auto";
}) {
  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".deal-card",
    y: 60,
    rotateX: 12,
    stagger: 0.08,
    duration: 0.95,
  });

  return (
    <div
      ref={scope}
      dir="ltr"
      data-testid="deal-grid"
      className={
        /* شش‌ستونه فقط از xl — چون این گرید در صفحه‌ی اصلی کنار سایدبار
           می‌نشیند و در lg کارت‌ها به ۸۴ پیکسل می‌رسیدند. */
        columns === "six"
          ? "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-6"
          : "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6"
      }
      style={{ perspective: "1100px" }}
    >
      {items.map((product, index) => (
        <DealCard
          key={product.id}
          product={product}
          index={index}
          showRank={showRank}
        />
      ))}
    </div>
  );
}
