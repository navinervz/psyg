"use client";

import { useCallback, useState } from "react";
import {
  Cable,
  Gamepad2,
  Headphones,
  Laptop,
  Package,
  Smartphone,
  Tablet,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { CategoryId } from "@/lib/types";

const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  mobile: Smartphone,
  laptop: Laptop,
  headphone: Headphones,
  wearable: Watch,
  console: Gamepad2,
  tablet: Tablet,
  accessory: Cable,
};

/**
 * تصویر محصول با فالبک معنادار.
 *
 * تا وقتی فایل‌های واقعی در public/products قرار نگرفته‌اند، به‌جای آیکون
 * شکسته، آیکون همان دسته‌بندی را نشان می‌دهد — سایت خالی به‌نظر نمی‌رسد
 * و کاربر هم می‌فهمد با چه نوع محصولی طرف است.
 */
export function ProductThumb({
  src,
  alt,
  category,
  className,
  iconClassName,
}: {
  src: string;
  alt: string;
  category?: CategoryId;
  className?: string;
  iconClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  /*
    چرا فقط `onError` کافی نیست:

    HTML روی سرور ساخته می‌شود، پس مرورگر تصویر را قبل از اینکه React
    هیدریت شود شروع می‌کند. برای تصویرهای بالای صفحه — مثل تصویر اصلی
    صفحه‌ی محصول — رویداد `error` معمولاً *پیش از* وصل شدن هندلر شلیک
    می‌شود و برای همیشه از دست می‌رود. نتیجه: آیکون شکسته‌ی مرورگر
    به‌جای فالبک دسته‌بندی.

    کارت‌های پایین صفحه این مشکل را نشان نمی‌دادند چون `loading="lazy"`
    بارگذاریشان را تا زمان اسکرول عقب می‌انداخت و تا آن موقع هندلر
    وصل شده بود. یعنی باگ فقط جایی دیده می‌شد که بیشترین اهمیت را داشت.

    راه‌حل: موقع اتصال ref، وضعیت واقعی تصویر را می‌پرسیم.
    `complete && naturalWidth === 0` یعنی بارگذاری تمام شده و شکست خورده.
  */
  const checkAlreadyFailed = useCallback((node: HTMLImageElement | null) => {
    if (node && node.complete && node.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    const Icon = category ? CATEGORY_ICONS[category] : Package;

    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-elevated to-surface",
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <Icon
          className={cn("size-8 text-accent/35", iconClassName)}
          strokeWidth={1.2}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={checkAlreadyFailed}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-contain", className)}
    />
  );
}
