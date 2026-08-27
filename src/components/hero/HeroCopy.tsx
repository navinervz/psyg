"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { gsap, useGSAP } from "@/animations/gsap";
import { Brand } from "@/components/ui/Brand";
import { HERO_HEADLINE } from "@/lib/site";

/**
 * متن هیروی دسکتاپ.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا انیمیشن کلمه‌به‌کلمه حذف شد
 * ─────────────────────────────────────────────────────────────────────
 * تیتر قبلی پنج کلمه بود («دنبال بهترین فرصت خرید هستی؟») و ورود
 * کلمه‌به‌کلمه رویش قشنگ بود. تیتر جدید بیست کلمه است؛ همان انیمیشن
 * رویش یعنی کاربر یک و نیم ثانیه به جمله‌ای نگاه کند که دارد سطر
 * می‌سازد.
 *
 * انیمیشن‌هایی که با طول محتوا مقیاس نمی‌گیرند، دیر یا زود به مشکل
 * می‌خورند. حالا کل بلوک با هم می‌آید.
 */
export function HeroCopy() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ delay: 0.15 })
        .from(".hero-line", {
          y: 24,
          opacity: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: "power3.out",
        });
    },
    { scope },
  );

  return (
    <div ref={scope} className="max-w-md">
      {/*
        ─────────────────────────────────────────────────────────────────
        ضربه اول، توضیح بعد
        ─────────────────────────────────────────────────────────────────
        نسخه‌ی قبلی جمله‌ی بلند را تیتر کرده بود و خط کوتاه را زیرش
        گذاشته بود. برعکسش درست است: چشم اول به بزرگ‌ترین چیز می‌رود، و
        آن باید چیزی باشد که در یک نگاه خوانده می‌شود.

        دو رنگ هم دو کار می‌کنند: «فرصت‌ها» موضوع جمله است و
        «موندنی نیستن» دلیلی که کاربر باید همین حالا نگاه کند نه فردا.
      */}
      {/*
        `<p>` و نه `<h1>`.

        صفحه‌ی اصلی دو هیرو دارد و هر دو در DOM هستند؛ اگر هر دو `<h1>`
        باشند صفحه دو تیتر اصلی دارد. تیتر واقعی یک بار در `page.tsx`
        است و همین متن را می‌گوید.
      */}
      <p className="hero-line text-3xl font-extrabold sm:text-4xl">
        <span className="text-hi">{HERO_HEADLINE.lead}</span>{" "}
        <span className="text-accent">{HERO_HEADLINE.accent}</span>
      </p>

      <p className="hero-line mt-4 text-sm leading-[2] text-mid sm:text-base">
        <Brand /> هر روز قیمت‌ها و تخفیف‌ها رو بررسی می‌کنه تا فرصت‌های واقعی
        خرید رو قبل از اینکه تموم بشن پیدا کنی
      </p>

      {/*
        ─────────────────────────────────────────────────────────────────
        چرا این دکمه اینجا اضافه شد
        ─────────────────────────────────────────────────────────────────
        نسخه‌ی موبایل از اول دکمه‌ی «شکار فرصت‌ها» داشت ولی دسکتاپ نداشت
        — یعنی کاربر دسکتاپ بعد از خواندن هیرو هیچ مسیر مشخصی نداشت و
        باید خودش در نویگیشن دنبال «فرصت‌ها» می‌گشت.

        وقتی دو چیدمان جدا داریم (`MobileHero` و `HeroSection`)، این نوع
        جاافتادگی بی‌صدا اتفاق می‌افتد. تست `hero.test.ts` حالا هر دو را
        با هم می‌سنجد.
      */}
      <Link
        href="/deals"
        className="btn-accent btn-hunt hero-line mt-6 inline-flex items-center gap-1.5 rounded-full px-6 py-3.5 text-base font-extrabold whitespace-nowrap text-night"
      >
        شکار فرصت‌ها
        <ChevronLeft className="size-4" strokeWidth={2.4} />
      </Link>
    </div>
  );
}
