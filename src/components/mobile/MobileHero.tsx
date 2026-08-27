"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { Sparkle } from "@/components/ui/Sparkle";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { RobotMascot } from "@/components/hero/RobotMascot";
import { HERO_HEADLINE } from "@/lib/site";
import { cn } from "@/lib/cn";

/**
 * بنر جمع‌وجور بالای صفحه‌ی موبایل.
 *
 * ─────────────────────────────────────────────────────────────────────
 * مشکلی که این کامپوننت حل می‌کند
 * ─────────────────────────────────────────────────────────────────────
 * `HeroSection` روی موبایل یک کارت بود که تیتر، ربات، چیپ‌های دسته‌بندی
 * و پنل پیشنهادها را زیر هم می‌چید. روی گوشی ۳۹۰ پیکسلی این یعنی کل
 * صفحه‌ی اول فقط هیرو بود — کاربر باید تا آخر اسکرول می‌کرد تا یک
 * محصول ببیند.
 *
 * روی دسکتاپ همان چیدمان درست است، چون ستون پهن است و ربات و پنل کنار
 * تیتر می‌نشینند نه زیرش. پس این نسخه جایگزین آن نمی‌شود؛ کنارش
 * می‌نشیند و هرکدام در نقطه‌ی شکست خودش دیده می‌شود.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا اسلایدها واقعی‌اند
 * ─────────────────────────────────────────────────────────────────────
 * طرح موبایل زیر بنر سه نقطه دارد. ساده‌ترین راه این بود که سه بنر
 * تزئینی بسازیم تا نقطه‌ها پر شوند.
 *
 * به‌جایش دو اسلاید هست که هرکدام کاری می‌کنند: یکی به فرصت‌ها می‌برد و
 * یکی ایمیل می‌گیرد. تعداد نقطه‌ها هم دو تاست، نه سه. نقطه‌ای که به
 * جایی نمی‌رود، فقط جای انگشت کاربر را می‌گیرد.
 */

const SLIDE_COUNT = 2;

export function MobileHero({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  /*
    اسلاید فعال از روی موقعیت اسکرول خوانده می‌شود، نه با state جدا.

    اگر state منبع حقیقت بود، کشیدن با انگشت آن را به‌روز نمی‌کرد و
    نقطه‌ها با چیزی که روی صفحه است نمی‌خواندند.

    `Math.abs` برای RTL است: مرورگرها در جهت راست‌به‌چپ `scrollLeft` را
    منفی می‌دهند و بعضی نسخه‌های قدیمی‌تر مثبت. قدر مطلق هر دو را
    درست می‌خواند.
  */
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth || 1;
    setIndex(Math.round(Math.abs(track.scrollLeft) / width));
  };

  const goTo = (target: number) => {
    const track = trackRef.current;
    if (!track) return;
    const width = track.clientWidth;
    const sign = track.scrollLeft < 0 ? -1 : 1;
    track.scrollTo({ left: sign * target * width, behavior: "smooth" });
  };

  return (
    <section className={cn("flex flex-col gap-2.5", className)}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        dir="rtl"
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
      >
        {/*
          ─────────────────────────────────────────────────────────────
          چرا هر دو کارت `h-full`اند
          ─────────────────────────────────────────────────────────────
          در یک فلکس افقی، ارتفاع نوار برابر بلندترین اسلاید است.
          اسلاید «خبرم کن» فرم دارد و بلندتر است؛ پس وقتی اسلاید اول
          دیده می‌شد، کارت کوتاهش در یک جعبه‌ی بلند می‌نشست و زیرش
          حدود ۷۰ پیکسل فضای خالی می‌ماند — همان شکاف بین بنر و
          نقطه‌ها در اسکرین‌شات.

          `h-full` روی خود کارت‌ها یعنی هر دو کل ارتفاع نوار را پر
          می‌کنند و شکافی نمی‌ماند.
        */}

        {/* اسلاید اول — معرفی و مسیر به فرصت‌ها */}
        <div className="w-full shrink-0 snap-center px-0.5">
          <div className="card-surface relative flex h-full items-center gap-1 overflow-hidden rounded-[var(--radius-card)] p-3">
            <div className="pointer-events-none absolute -top-14 -left-10 size-36 rounded-full bg-accent/18 blur-3xl" />

            <div className="relative flex min-w-0 flex-1 flex-col items-start gap-2">
              {/* همان ترتیب دسکتاپ: ضربه اول، توضیح بعد */}
              {/* `<p>` — تیتر اصلی صفحه یک بار در `page.tsx` است */}
              <p className="text-lg leading-snug font-extrabold">
                <span className="text-hi">{HERO_HEADLINE.lead}</span>{" "}
                <span className="text-accent">{HERO_HEADLINE.accent}</span>
              </p>

              {/*
                متن کوتاه‌تر از نسخه‌ی دسکتاپ است. جمله‌ی کامل دسکتاپ در
                عرض ~۱۷۰ پیکسل به هفت سطر می‌رسد و بنر را دوباره بلند
                می‌کند — یعنی همان مشکلی که این کامپوننت برای حلش نوشته
                شد.
              */}
              <p className="text-[11px] leading-relaxed text-mid">
                <Brand /> هر روز قیمت‌ها رو بررسی می‌کنه تا فرصت‌ها از دستت نرن.
              </p>

              <Link
                href="/deals"
                /*
                  `whitespace-nowrap` چون در عرض ۳۲۰ پیکسل «مشاهده
                  فرصت‌ها» دو سطر می‌شد و فلش وسط دو تکه‌ی متن
                  می‌افتاد — دکمه شکسته به‌نظر می‌رسید.

                  ۳۲۰ پیکسل حالت فرضی نیست: آیفون در حالت Display
                  Zoom همین عرض را گزارش می‌کند، و اسکرین‌شات گوشی
                  دقیقاً همین را نشان داد.
                */
                className="btn-accent btn-hunt mt-1 inline-flex items-center gap-1 rounded-full px-4 py-2.5 text-xs font-extrabold whitespace-nowrap text-night"
              >
                شکار فرصت‌ها
                <ChevronLeft className="size-3.5" strokeWidth={2.4} />
              </Link>
            </div>

            {/*
              ربات عرض ثابت دارد نه کسری.

              با `flex-1` روی صفحه‌ی باریک، ربات و متن سر عرض دعوا
              می‌کردند و تیتر دو کلمه‌ای می‌شکست.

              ۱۳۶ پیکسل جایگزین ۱۰۴ شد. دلیلش این بود که با بزرگ شدن
              `viewBox` برای جا دادن رادار، خودِ ربات کسر کوچک‌تری از
              کادر شد و روی گوشی ریز به‌نظر می‌رسید — یعنی رادار به
              قیمت ربات تمام شده بود. عرض بیشتر، هر دو را با هم بزرگ
              می‌کند.

              پدینگ کارت هم از ۱۶ به ۱۲ آمد تا این ۳۲ پیکسل از جیب
              متن نرود.
            */}
            <div className="relative w-[136px] shrink-0">
              <RobotMascot />
            </div>
          </div>
        </div>

        {/* اسلاید دوم — «خبرم کن» */}
        <div className="w-full shrink-0 snap-center px-0.5">
          <div className="card-surface relative flex h-full flex-col justify-center gap-2 overflow-hidden rounded-[var(--radius-card)] p-4">
            <div className="pointer-events-none absolute -top-14 -left-10 size-36 rounded-full bg-accent/18 blur-3xl" />

            <h2 className="relative flex items-center gap-1.5 text-lg font-extrabold text-hi">
              <Sparkle className="size-4 text-accent" />
              خبرم کن
            </h2>
            {/*
              یک سطر، نه دو.

              فرم زیرش روی موبایل عمداً عمودی است (فیلد و دکمه زیر هم)
              چون در عرض کمتر از ۴۰۰ پیکسل کنار هم گذاشتنشان دکمه را
              به هدف لمسی زیر استاندارد می‌رساند. همین یعنی این اسلاید
              ذاتاً بلندتر است — پس متنش باید کوتاه‌تر باشد تا کل بنر
              ورم نکند.
            */}
            <p className="relative text-[11px] leading-relaxed text-mid">
              افت قیمت‌های مهم را برایت می‌فرستیم.
            </p>
            <div className="relative">
              <SubscribeForm compact />
            </div>
          </div>
        </div>
      </div>

      {/* نقطه‌ها */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`اسلاید ${i + 1}`}
            aria-current={i === index ? "true" : undefined}
            /*
              ─────────────────────────────────────────────────────
              ناحیه‌ی لمسی بزرگ‌تر از ناحیه‌ی دیده‌شده
              ─────────────────────────────────────────────────────
              نسخه‌ی اول `h-6` بود — ۲۴ پیکسل، خیلی کمتر از حداقل
              ۴۴ پیکسلی که برای هدف لمسی توصیه می‌شود.

              بزرگ کردن خود دکمه، ۲۰ پیکسل فضای عمودی به بنر اضافه
              می‌کرد برای دو نقطه‌ی کوچک. `after` این را بدون هزینه‌ی
              چیدمان حل می‌کند: ناحیه‌ی لمسی تا ۴۴ پیکسل کشیده
              می‌شود ولی چیزی جابه‌جا نمی‌شود.
            */
            className="relative grid h-6 cursor-pointer place-items-center px-1 after:absolute after:inset-x-0 after:-top-2.5 after:-bottom-2.5 after:content-['']"
          >
            <span
              className={cn(
                "block h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-accent" : "w-1.5 bg-line",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
