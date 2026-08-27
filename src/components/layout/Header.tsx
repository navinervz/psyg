"use client";

import { useRef } from "react";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { gsap, useGSAP } from "@/animations/gsap";
import type { PriceAlert } from "@/lib/types";

/**
 * هدر چسبان.
 * با اسکرول به پایین جمع می‌شود: ارتفاع کم، بلور پس‌زمینه و خط زیرین ظاهر می‌شود.
 *
 * هشدارها از کامپوننت سروری والد می‌آیند تا کاتالوگ محصولات وارد
 * باندل کلاینت نشود.
 */
export function Header({ alerts }: { alerts: PriceAlert[] }) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      gsap
        .timeline({
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "+=180",
            scrub: 0.6,
          },
        })
        .to(el, {
          paddingTop: 10,
          paddingBottom: 10,
          backgroundColor: "rgba(8,9,10,0.72)",
          backdropFilter: "blur(16px)",
          borderBottomColor: "rgba(31,36,32,1)",
          ease: "none",
        });
    },
    { scope: ref },
  );

  return (
    <header
      ref={ref}
      /*
        شیشه‌ی مات.

        هدر `sticky` است و محتوا از زیرش رد می‌شود. قبلاً پس‌زمینه‌اش
        شفاف بود، یعنی عکس محصول و متن هدر روی هم می‌افتادند و هر دو
        ناخوانا می‌شدند. حالا هرچه از پشت رد شود محو است.

        `border-b` هم دیگر شفاف نیست: بدون یک خط، لبه‌ی شیشه معلوم
        نیست و هدر شناور به‌نظر می‌رسد نه یک سطح.
      */
      className="glass sticky top-0 z-50 border-b border-line/60 py-4"
    >
      {/*
        دو چیدمان، یک نشانه‌گذاری.

        دسکتاپ: لوگو چپ، نویگیشن وسط، اکشن‌ها راست.
        موبایل: همبرگری چپ، لوگو دقیقاً وسط، اکشن‌ها راست.

        ─────────────────────────────────────────────────────────────
        چرا لوگو `absolute` است و دو بار رندر نمی‌شود
        ─────────────────────────────────────────────────────────────
        راه ساده‌تر این بود که دو لوگو بگذاریم و هرکدام را در یک نقطه‌ی
        شکست پنهان کنیم. ولی آن‌وقت دو لینک به صفحه‌ی اصلی در DOM
        می‌ماند — چیزی که صفحه‌خوان دو بار می‌خواند.

        با موقعیت مطلق، لوگو از جریان flex بیرون می‌رود و دقیقاً وسط
        می‌نشیند؛ روی `lg` به حالت عادی برمی‌گردد و چون همبرگری آنجا
        پنهان است، خودش اولین عنصر می‌شود.

        gap کوچک‌تر در موبایل عمدی است: با `gap-6` مجموع عناصر از عرض
        ۳۲۰ پیکسل بیشتر می‌شد و هدر سرریز می‌کرد.
      */}
      <div
        dir="ltr"
        /*
          `justify-end` روی موبایل عمدی است.

          با حذف همبرگری، تنها عنصر داخل جریان flex اکشن‌هاست — و
          `justify-between` با یک عضو، آن را به ابتدا یعنی چپ می‌برد.
          زنگوله و حساب می‌رفتند سمت چپ و راست صفحه خالی می‌ماند.

          لوگو چون `absolute` است در این محاسبه شرکت نمی‌کند و وسط
          می‌ماند.
        */
        className="shell relative flex items-center justify-end gap-3 sm:gap-6 lg:justify-between"
      >
        <Logo className="absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0" />

        <MainNav className="hidden lg:flex" />

        <div className="flex shrink-0 items-center gap-2">
          <HeaderActions alerts={alerts} />
        </div>
      </div>
    </header>
  );
}
