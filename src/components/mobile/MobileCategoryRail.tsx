"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  Cable,
} from "lucide-react";
import { categories } from "@/lib/reference";
import { cn } from "@/lib/cn";

/**
 * نوار دسته‌بندی موبایل — اسکرول افقی، مطابق طرح.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا اسکرول افقی و نه چیدمان چندسطری
 * ─────────────────────────────────────────────────────────────────────
 * هفت دسته در عرض ۳۶۰ پیکسل یعنی سه سطر چیپ که یک‌سوم صفحه‌ی اول را
 * می‌گیرد — پیش از اینکه کاربر حتی یک محصول ببیند.
 *
 * نوار افقی همه را در یک سطر نگه می‌دارد و کاربر موبایل این الگو را
 * می‌شناسد. کارتِ نیمه‌بریده در لبه‌ی سمت چپ عمدی است: نشانه‌ی بصری
 * که چیز بیشتری آن‌طرف هست.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا از `@/lib/reference` می‌خواند نه `@/lib/data`
 * ─────────────────────────────────────────────────────────────────────
 * این کامپوننت `"use client"` است. `lib/data` کاتالوگ ۷۷ کیلوبایتی
 * محصولات را ایمپورت می‌کند و tree-shaking نمی‌تواند حذفش کند، پس
 * خواندن از آنجا کل کاتالوگ را به باندل مرورگر می‌آورد.
 */

const ICONS: Record<string, typeof Smartphone> = {
  smartphone: Smartphone,
  laptop: Laptop,
  headphones: Headphones,
  watch: Watch,
  gamepad: Gamepad2,
  tablet: Tablet,
  cable: Cable,
};

export function MobileCategoryRail({ ids }: { ids?: string[] }) {
  /*
    فقط دسته‌هایی که محصول دارند.

    نوار افقی موبایل جای کمی دارد و هر کارتش یک وعده است. کارتی که به
    صفحه‌ی خالی می‌رسد، همان جایی را گرفته که یک دسته‌ی واقعی می‌توانست
    بگیرد — و کاربر موبایل بعد از یک بن‌بست، معمولاً دیگر اسکرول نمی‌کند.
  */
  const shown = ids ? categories.filter((c) => ids.includes(c.id)) : categories;

  const pathname = usePathname();

  return (
    <section dir="rtl" className="lg:hidden">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-extrabold text-hi">دسته‌بندی‌ها</h2>
        <Link
          href="/deals"
          /* همان دلیل `SectionHeader`: متن ۱۱ پیکسلی، هدف لمسی ۴۴ پیکسلی */
          className="relative text-[11px] font-semibold text-accent transition-opacity hover:opacity-75 after:absolute after:-inset-x-2 after:-top-3.5 after:-bottom-3.5 after:content-['']"
        >
          مشاهده همه
        </Link>
      </div>

      {/*
        `-mx-3 px-3` باعث می‌شود نوار تا لبه‌ی صفحه اسکرول شود ولی
        اولین و آخرین کارت هم‌تراز بقیه‌ی محتوا بایستند. بدون این،
        کارت‌ها یا به لبه می‌چسبند یا وسط صفحه تمام می‌شوند و انگار
        چیزی جا مانده.

        `scrollbar-none` چون روی موبایل نوار اسکرول دیده نمی‌شود و
        روی دسکتاپ این کامپوننت اصلاً رندر نمی‌شود.
      */}
      <div className="scrollbar-none -mx-3 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-3 pb-1">
        {shown.map((category) => {
          const Icon = ICONS[category.icon] ?? Laptop;
          const href = `/category/${category.id}`;
          const active = pathname === href;

          return (
            <Link
              key={category.id}
              href={href}
              className={cn(
                /*
                  ─────────────────────────────────────────────────
                  چرا ۸۸ پیکسل و نه ۷۶
                  ─────────────────────────────────────────────────
                  با ۷۶ پیکسل و پدینگ ۱۲، فقط ۵۲ پیکسل برای متن
                  می‌ماند. «هدفون و هندزفری» و «گوشی موبایل» در آن
                  عرض جا نمی‌شدند و `line-clamp-1` وسط کلمه
                  می‌بریدشان — روی گوشی «هدفون …» و «گوشی…» دیده
                  می‌شد.

                  پدینگ افقی هم کمتر شد تا عرض اضافه به متن برسد،
                  نه به حاشیه.
                */
                "flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border px-1.5 py-3 transition-colors",
                active
                  ? "border-accent/45 bg-accent/10"
                  : "border-line bg-surface hover:border-accent/30",
              )}
            >
              <span
                className={cn(
                  "grid size-11 place-items-center rounded-xl transition-colors",
                  active ? "bg-accent/15 text-accent" : "bg-elevated text-mid",
                )}
              >
                <Icon className="size-5" strokeWidth={1.8} />
              </span>
              {/*
                دو سطر مجاز است، نه یک سطر.

                نسخه‌ی قبلی `line-clamp-1` داشت تا کارت‌ها هم‌ارتفاع
                بمانند — ولی نتیجه‌اش این شد که نام‌های بلند بریده
                شوند و کاربر «هدفون …» ببیند.

                `min-h` همان هم‌ارتفاعی را بدون بریدن می‌دهد: کارت
                یک‌سطری هم به‌اندازه‌ی دوسطری جا باز می‌کند، پس نوار
                هموار می‌ماند.
              */}
              <span
                className={cn(
                  "line-clamp-2 min-h-[2.5em] text-center text-[10px] leading-tight font-semibold",
                  active ? "text-accent" : "text-mid",
                )}
              >
                {category.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
