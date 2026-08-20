"use client";

import { Heart } from "lucide-react";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/cn";

/** دکمه‌ی علاقه‌مندی — گوشه‌ی کارت محصول */
export function FavoriteButton({
  productId,
  productTitle,
  className,
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const hydrated = useHydrated();
  const favorites = useUserData((s) => s.favorites);
  const toggleFavorite = useUserData((s) => s.toggleFavorite);

  const isFavorite = hydrated && favorites.includes(productId);

  return (
    <button
      type="button"
      data-testid="favorite-button"
      onClick={() => toggleFavorite(productId)}
      aria-pressed={isFavorite}
      title={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-label={
        isFavorite
          ? `حذف ${productTitle} از علاقه‌مندی‌ها`
          : `افزودن ${productTitle} به علاقه‌مندی‌ها`
      }
      className={cn(
        "grid size-8 cursor-pointer place-items-center rounded-lg transition-all duration-300",
        isFavorite
          ? "text-danger"
          : "text-low hover:bg-elevated hover:text-danger",
        className,
      )}
    >
      <Heart
        className="size-4"
        strokeWidth={1.9}
        fill={isFavorite ? "currentColor" : "none"}
      />
    </button>
  );
}
