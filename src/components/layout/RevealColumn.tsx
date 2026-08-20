"use client";

import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { cn } from "@/lib/cn";

/**
 * پوشش کلاینتی برای انیمیشن ورود، بدون کلاینتی کردن فرزندان.
 *
 * نکته‌ی مهم: وقتی یک کامپوننت سروری JSX را به‌عنوان `children` به یک
 * کامپوننت کلاینتی می‌دهد، آن فرزندان روی سرور رندر می‌شوند و به‌شکل
 * payload منتقل می‌شوند — وارد باندل جاوااسکریپت مرورگر نمی‌شوند.
 *
 * قبلاً `Sidebar` خودش `"use client"` بود و `RecentAlertsCard` را
 * ایمپورت می‌کرد؛ در نتیجه آن کامپوننت سروری هم کلاینتی می‌شد و کل
 * کاتالوگ محصولات را با خودش به مرورگر می‌برد.
 */
export function RevealColumn({
  children,
  className,
  stagger = 0.12,
  y = 36,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
}) {
  const scope = useRevealOnScroll<HTMLDivElement>({
    y,
    stagger,
    duration: 0.85,
  });

  return (
    <div ref={scope} className={cn(className)}>
      {children}
    </div>
  );
}
