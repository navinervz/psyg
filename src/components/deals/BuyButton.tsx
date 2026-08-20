"use client";

import { ExternalLink, ShoppingCart } from "lucide-react";
import { storesById } from "@/components/deals/StoreTag";
import { useUserData } from "@/store/useUserData";
import { cn } from "@/lib/cn";
import type { StoreId } from "@/lib/types";

type BuyButtonProps = {
  productId: string;
  store: StoreId;
  size?: "sm" | "lg";
  className?: string;
};

/**
 * دکمه خرید.
 *
 * همیشه از مسیر داخلی /go/[id] عبور می‌کند تا لینک افیلیت در یک نقطه ساخته شود.
 * rel="nofollow sponsored" الزام گوگل برای لینک‌های تبلیغاتی/کمیسیونی است و
 * نبودش می‌تواند به سئوی سایت آسیب بزند.
 */
export function BuyButton({
  productId,
  store,
  size = "sm",
  className,
}: BuyButtonProps) {
  const storeName = storesById[store]?.displayName ?? "فروشگاه";
  const recordPurchase = useUserData((s) => s.recordPurchase);

  return (
    <a
      href={`/go/${productId}`}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      aria-label={`خرید از ${storeName} (لینک خارجی)`}
      /*
        رفتن کاربر به فروشگاه را ثبت می‌کنیم تا بعداً در صفحه‌ی «خریدها»
        ببیند چه چیزهایی را دنبال کرده. چون لینک در تب جدید باز می‌شود،
        ثبت شدن مانع پیمایش نمی‌شود و نیازی به preventDefault نیست.
      */
      onClick={() => recordPurchase(productId)}
      className={cn(
        "btn-accent group/buy inline-flex items-center justify-center gap-2 rounded-xl font-bold text-night",
        "active:scale-[0.97]",
        size === "sm" ? "w-full py-2.5 text-xs" : "px-7 py-4 text-sm",
        className,
      )}
    >
      <ShoppingCart
        className={size === "sm" ? "size-4" : "size-5"}
        strokeWidth={2.1}
      />
      {/* در کارت‌های باریک فقط «خرید» جا می‌شود */}
      {size === "sm" ? "خرید" : `خرید از ${storeName}`}
      <ExternalLink
        className="size-3 opacity-60 transition-transform duration-300 group-hover/buy:-translate-y-0.5"
        strokeWidth={2.2}
      />
    </a>
  );
}
