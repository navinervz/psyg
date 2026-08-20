"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/nav";
import { cn } from "@/lib/cn";

/** منوی همبرگری برای صفحه‌های کوچک‌تر از lg */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // با تغییر مسیر بسته شود
  useEffect(() => setOpen(false), [pathname]);

  // قفل اسکرول هنگام باز بودن
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
        /*
          ۴۴ پیکسل ثابت، نه `size-11`.

          `size-11` یعنی ۲.۷۵rem و با فونت پایه‌ی ۱۸ پیکسلی سایت به ۴۹.۵
          پیکسل می‌رسد. ۴۴ حداقل استاندارد هدف لمسی است و بزرگ‌تر شدنش
          هیچ سودی ندارد، ولی در عرض ۳۲۰ پیکسل باعث سرریز هدر می‌شد.
        */
        className="grid size-[44px] cursor-pointer place-items-center rounded-2xl border border-line bg-surface text-mid transition-colors hover:border-accent/40 hover:text-accent lg:hidden"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </button>

      {open && (
        <div
          dir="rtl"
          className="fixed inset-0 z-[70] flex flex-col bg-night/95 backdrop-blur-xl lg:hidden"
        >
          <div className="flex items-center justify-between px-4 py-5">
            <span className="text-lg font-extrabold text-hi">منو</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن منو"
              className="grid size-11 cursor-pointer place-items-center rounded-2xl border border-line bg-surface text-mid"
            >
              <X className="size-5" strokeWidth={1.8} />
            </button>
          </div>

          <nav className="flex flex-col gap-2 px-4">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-2xl border px-5 py-4 text-base font-bold transition-colors",
                    active
                      ? "border-accent/45 bg-accent/10 text-accent"
                      : "border-line bg-surface text-mid hover:text-hi",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
