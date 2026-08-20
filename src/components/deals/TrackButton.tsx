"use client";

import { Bell, BellRing } from "lucide-react";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/cn";

/** دکمه‌ی پیگیری قیمت — وضعیتش در localStorage می‌ماند */
export function TrackButton({
  productId,
  productTitle,
  className,
}: {
  productId: string;
  productTitle: string;
  className?: string;
}) {
  const hydrated = useHydrated();
  const tracked = useUserData((s) => s.tracked);
  const toggleTracked = useUserData((s) => s.toggleTracked);

  const isTracked = hydrated && tracked.includes(productId);

  return (
    <button
      type="button"
      data-testid="track-button"
      onClick={() => toggleTracked(productId)}
      aria-pressed={isTracked}
      title={isTracked ? "لغو پیگیری قیمت" : "پیگیری قیمت"}
      aria-label={
        isTracked ? `لغو پیگیری ${productTitle}` : `پیگیری قیمت ${productTitle}`
      }
      className={cn(
        "grid w-full cursor-pointer place-items-center rounded-xl border py-2.5 transition-all duration-300",
        isTracked
          ? "border-accent/50 bg-accent/12 text-accent shadow-[0_0_20px_rgba(163,230,53,0.2)]"
          : "border-line bg-elevated/50 text-low hover:border-accent/35 hover:text-accent",
        className,
      )}
    >
      {isTracked ? (
        <BellRing className="size-4" strokeWidth={1.9} />
      ) : (
        <Bell className="size-4" strokeWidth={1.9} />
      )}
    </button>
  );
}
