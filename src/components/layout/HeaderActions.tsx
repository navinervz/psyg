"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, LogOut, Mail, User } from "lucide-react";
import { ChangeBadge } from "@/components/ui/Badge";
import { Brand } from "@/components/ui/Brand";
import { ACCOUNT_TABS } from "@/components/account/AccountTabs";
import { timeAgo, toFaDigits } from "@/lib/format";
import type { PriceAlert } from "@/lib/types";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { cn } from "@/lib/cn";

type PanelId = "alerts" | "inbox" | "user" | null;

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      dir="rtl"
      role="menu"
      /*
        `right-0` فیزیکی است نه `end-0`. چون محتوای پنل rtl است، `end-0` به
        `left:0` ترجمه می‌شد و پنل ۲۸۸ پیکسلی از لبه‌ی راست صفحه بیرون می‌زد.
        عرض هم به عرض ویوپورت محدود شده تا در ۳۲۰ پیکسل جا شود.
      */
      className="absolute top-full right-0 z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
    >
      {children}
    </div>
  );
}

/**
 * هشدارها به‌صورت prop می‌آیند، نه ایمپورت مستقیم.
 * این کامپوننت در همه‌ی صفحه‌ها رندر می‌شود؛ اگر از `@/lib/data` بخواند
 * کل کاتالوگ محصولات وارد باندل مرورگر می‌شود.
 */
export function HeaderActions({ alerts }: { alerts: PriceAlert[] }) {
  const [open, setOpen] = useState<PanelId>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const favorites = useUserData((s) => s.favorites);
  const tracked = useUserData((s) => s.tracked);
  const clearFavorites = useUserData((s) => s.clearFavorites);
  const clearTracked = useUserData((s) => s.clearTracked);

  /*
    `hydrated` لازم است چون علاقه‌مندی‌ها از `localStorage` می‌آیند.

    بدون آن، سرور صفر رندر می‌کرد و مرورگر عدد واقعی — و React خطای
    hydration mismatch می‌داد. تا هیدرات شدن صفر نشان می‌دهیم و بعد
    عدد درست جایش می‌نشیند.
  */
  const savedCount = hydrated ? favorites.length + tracked.length : 0;

  // کلیک بیرون و Escape پنل را می‌بندند
  useEffect(() => {
    if (!open) return;

    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (id: Exclude<PanelId, null>) =>
    setOpen((current) => (current === id ? null : id));

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      {/* اعلان‌ها */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("alerts")}
          aria-label="اعلان‌ها"
          aria-expanded={open === "alerts"}
          data-testid="notifications-button"
          className={cn(
            "relative grid size-[44px] cursor-pointer place-items-center rounded-2xl border bg-surface transition-all duration-300",
            open === "alerts"
              ? "border-accent/50 text-accent"
              : "border-line text-mid hover:border-accent/40 hover:text-accent",
          )}
        >
          <Bell className="size-5" strokeWidth={1.8} />
          {alerts.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-accent text-[10px] font-bold text-night nums-fa">
              {toFaDigits(alerts.length)}
            </span>
          )}
        </button>

        {open === "alerts" && (
          <Panel>
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-hi">هشدارهای اخیر</p>
            </div>
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/product/${alert.productSlug}`}
                onClick={() => setOpen(null)}
                className="flex items-center gap-3 border-b border-line px-4 py-3 transition-colors hover:bg-elevated"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-xs font-bold text-hi">
                    {alert.productTitle}
                  </span>
                  <span className="text-[10px] text-low nums-fa">
                    {timeAgo(alert.at)}
                  </span>
                </div>
                <ChangeBadge delta={alert.delta} />
              </Link>
            ))}
            <Link
              href="/account/alerts"
              onClick={() => setOpen(null)}
              className="block px-4 py-3 text-center text-xs font-semibold text-accent transition-colors hover:bg-elevated"
            >
              مشاهده همه هشدارها
            </Link>
          </Panel>
        )}
      </div>

      {/* پیام‌ها — در موبایل مخفی است تا هدر در ۳۲۰ پیکسل سرریز نکند؛
          محتوایش (صندوق خالی) در آن عرض ارزش فضا گرفتن ندارد. */}
      <div className="relative hidden sm:block">
        <button
          type="button"
          onClick={() => toggle("inbox")}
          aria-label="پیام‌ها"
          aria-expanded={open === "inbox"}
          className={cn(
            "grid size-[44px] cursor-pointer place-items-center rounded-2xl border bg-surface transition-all duration-300",
            open === "inbox"
              ? "border-accent/50 text-accent"
              : "border-line text-mid hover:border-accent/40 hover:text-accent",
          )}
        >
          <Mail className="size-5" strokeWidth={1.8} />
        </button>

        {open === "inbox" && (
          <Panel>
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-hi">صندوق پیام</p>
            </div>
            <div className="px-4 py-6 text-center">
              <p className="mb-1 text-xs text-mid">پیامی نداری</p>
              <p className="text-[10px] leading-relaxed text-low">
                خبرنامه‌ی <Brand glow={false} /> را از ویجت «خبرم کن» فعال کن تا فرصت‌های داغ
                برایت ایمیل شود.
              </p>
            </div>
          </Panel>
        )}
      </div>

      {/* کاربر */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggle("user")}
          aria-expanded={open === "user"}
          aria-haspopup="menu"
          aria-label="منوی کاربر"
          className={cn(
            "flex cursor-pointer items-center gap-1.5 rounded-2xl border bg-surface p-1 transition-all duration-300 sm:pe-2",
            open === "user" ? "border-accent/50" : "border-line hover:border-accent/40",
          )}
        >
          <span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-elevated text-mid">
            <User className="size-5" strokeWidth={1.8} />
          </span>
          <ChevronDown
            className={cn(
              "hidden size-4 text-low transition-transform duration-300 sm:block",
              open === "user" && "rotate-180",
            )}
          />
        </button>

        {open === "user" && (
          <Panel>
            {/*
              اینجا قبلاً عنوان سطح کاربر بود — «تازه‌وارد».

              دو ایراد داشت. اول اینکه شبیه اسم کاربر به‌نظر می‌رسید و
              کسی که وارد سایت می‌شود دوست ندارد اولین چیزی که می‌بیند
              برچسبی باشد که او را مبتدی خطاب می‌کند. دوم اینکه آن سطح
              از تعداد علاقه‌مندی‌ها می‌آمد، یعنی برای بازدیدکننده‌ی
              جدید همیشه پایین‌ترین حالت بود.

              جایش همان چیزی نشسته که واقعاً مال اوست: تعداد محصولاتی که
              خودش ذخیره کرده.
            */}
            <div className="border-b border-line px-4 py-3">
              <p className="text-sm font-bold text-hi">حساب من</p>
              <p className="text-xs text-low nums-fa">
                {savedCount === 0
                  ? "هنوز محصولی ذخیره نکرده‌ای"
                  : `${toFaDigits(savedCount)} محصول ذخیره‌شده`}
              </p>
            </div>

            {ACCOUNT_TABS.map(({ icon: Icon, label, href }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(null)}
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-mid transition-colors hover:bg-elevated hover:text-hi"
              >
                <Icon className="size-4" strokeWidth={1.8} />
                {label}
              </Link>
            ))}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                clearFavorites();
                clearTracked();
                setOpen(null);
              }}
              className="flex w-full cursor-pointer items-center gap-3 border-t border-line px-4 py-2.5 text-sm text-mid transition-colors hover:bg-elevated hover:text-danger"
            >
              <LogOut className="size-4" strokeWidth={1.8} />
              خروج
            </button>

            {/*
              اینجا قبلاً یک لینک «تنظیمات» دیگر بود.

              `ACCOUNT_TABS` بالاتر خودش «تنظیمات حساب» را دارد و هر دو
              به یک صفحه می‌رفتند. کاربر دو گزینه‌ی هم‌معنی می‌دید و
              نمی‌فهمید فرقشان چیست — و همین باعث می‌شود به بقیه‌ی منو
              هم شک کند.
            */}
          </Panel>
        )}
      </div>
    </div>
  );
}
