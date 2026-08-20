"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * ثبت یک‌باره‌ی پلاگین‌های GSAP.
 * SplitText و DrawSVG از نسخه ۳.۱۳ در پکیج عمومی هستند؛
 * اگر روی نسخه‌ی قدیمی‌تر بودید ایمپورتشان را کامنت کنید.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);

  gsap.defaults({ ease: "power3.out", duration: 0.9 });

  ScrollTrigger.config({
    ignoreMobileResize: true,
  });
}

/** آیا کاربر انیمیشن کم‌تر خواسته است؟ */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger, useGSAP };
