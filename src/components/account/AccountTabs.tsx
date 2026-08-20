"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Heart,
  Package,
  Settings,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

export const ACCOUNT_TABS: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/account/favorites", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/account/alerts", label: "هشدارهای قیمت", icon: Bell },
  { href: "/account/tracking", label: "پیگیری‌ها", icon: TrendingUp },
  // «خریدهای من» نه «سفارش‌ها» — چون سفارش واقعاً در فروشگاه ثبت می‌شود
  { href: "/account/orders", label: "خریدهای من", icon: Package },
  { href: "/account/settings", label: "تنظیمات حساب", icon: Settings },
];

export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="بخش‌های حساب کاربری">
      {ACCOUNT_TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-medium transition-all duration-300",
              active
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-line bg-elevated/60 text-mid hover:text-hi",
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.8} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
