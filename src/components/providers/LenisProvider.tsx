"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/animations/gsap";

/**
 * اسکرول نرم سراسری.
 * RAF لنیس به ticker گازپ وصل می‌شود تا هر دو روی یک لوپ اجرا شوند
 * و ScrollTrigger دقیقاً با موقعیت واقعی اسکرول سینک بماند.
 */
export function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    /*
      روی دستگاه لمسی اسکرول نرم اجرا نمی‌شود.

      موبایل خودش اسکرول اینرسی بومی دارد که از هر شبیه‌سازی جاوااسکریپتی
      روان‌تر است. گذاشتن Lenis رویش سه مشکل واقعی می‌سازد:

      ۱. `touchMultiplier: 1.6` یعنی صفحه ۱.۶ برابر حرکت انگشت جابه‌جا
         می‌شود — حس می‌کنی صفحه از دستت در می‌رود.
      ۲. وقتی کیبورد باز می‌شود، ارتفاع ویوپورت عوض می‌شود و محاسبات
         Lenis به‌هم می‌ریزد.
      ۳. اسکرول به فیلد فوکوس‌شده درست کار نمی‌کند.

      `pointer: coarse` یعنی ورودی اصلی دستگاه انگشت است نه موس.
    */
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const lenis = new Lenis({
      lerp: 0.08,
      wheelMultiplier: 1,
      smoothWheel: true,
      // جهت افقی صفحه RTL است ولی اسکرول عمودی می‌ماند
      orientation: "vertical",
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
