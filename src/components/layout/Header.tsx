"use client";

import { useRef } from "react";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { HeaderActions } from "@/components/layout/HeaderActions";
import { MobileNav } from "@/components/layout/MobileNav";
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
      className="sticky top-0 z-50 border-b border-transparent py-4"
    >
      {/* مطابق دیزاین: لوگو چپ، نویگیشن وسط، اکشن‌ها راست → جهت ltr */}
      {/* gap کوچک‌تر در موبایل: با gap-6 مجموع لوگو + منو + اکشن‌ها از عرض
          ۳۲۰ پیکسل بیشتر می‌شد و هدر سرریز می‌کرد. */}
      <div dir="ltr" className="shell flex items-center justify-between gap-3 sm:gap-6">
        <Logo />
        <MainNav className="hidden lg:flex" />
        <div className="flex shrink-0 items-center gap-2">
          <MobileNav />
          <HeaderActions alerts={alerts} />
        </div>
      </div>
    </header>
  );
}
