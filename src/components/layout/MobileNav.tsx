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

  /*
    قفل اسکرول، به‌علاوه‌ی یک نشانه روی <html> که بقیه‌ی سایت بفهمد منو
    باز است.

    ─────────────────────────────────────────────────────────────────
    چرا کلاس روی html و نه فقط z-index
    ─────────────────────────────────────────────────────────────────
    منو `z-[70]` دارد و دکمه‌ی شناور دستیار `z-50`، پس روی کاغذ منو
    بالاتر است. ولی روی سافاری موبایل، گوی دستیار *روی* منوی باز دیده
    می‌شد — احتمالاً به‌خاطر `backdrop-filter` که زمینه‌ی چینش جدید
    می‌سازد و ترتیب را به‌هم می‌ریزد.

    بالا بردن عدد z-index شاید مشکل را حل می‌کرد و شاید نه، و در هر
    صورت به رفتاری وابسته می‌ماند که در یک مرورگر خاص غیرمنتظره است.
    پنهان کردن صریح دکمه، به عدد وابسته نیست.
  */
  useEffect(() => {
    const root = document.documentElement;

    document.body.style.overflow = open ? "hidden" : "";
    root.classList.toggle("menu-open", open);

    return () => {
      document.body.style.overflow = "";
      root.classList.remove("menu-open");
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
          /*
            پس‌زمینه‌ی کاملاً مات، نه ۹۵ درصد.

            ۹۵ درصد روی پس‌زمینه‌ی تیره بی‌عیب به‌نظر می‌رسید و در تست
            دسکتاپ هم چیزی معلوم نبود. ولی کارت محصولات عکس‌های
            پس‌زمینه‌سفید دارند، و سفید از پشت ۵ درصد شفافیت کاملاً
            خوانا می‌شود.

            روی گوشی این یعنی وقتی منو را وسط فهرست محصولات باز می‌کنی،
            کلمه‌ی «فرصت‌ها» روی عکس یک گوشی می‌افتد و نمودارهای سبز از
            پشت رد می‌شوند. منو خراب به‌نظر می‌رسد، نه شیشه‌ای.

            `backdrop-blur` هم حذف شد: پشت یک لایه‌ی مات چیزی برای محو
            کردن نیست، و همان است که ترتیب چینش را روی سافاری به‌هم
            می‌ریخت.
          */
          className="fixed inset-0 z-[70] flex flex-col bg-night lg:hidden"
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
