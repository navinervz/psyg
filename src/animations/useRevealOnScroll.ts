"use client";

import { useRef } from "react";
import {
  gsap,
  ScrollTrigger,
  useGSAP,
  prefersReducedMotion,
} from "@/animations/gsap";

type RevealOptions = {
  /** سلکتور فرزندانی که باید یکی‌یکی وارد شوند */
  selector?: string;
  y?: number;
  rotateX?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  start?: string;
  /** اگر false باشد، انیمیشن فقط یک‌بار اجرا می‌شود */
  replay?: boolean;
  /**
   * مقادیری که با تغییرشان باید انیمیشن از نو اجرا شود.
   *
   * اگر کانتینر با `key` بازسازی می‌شود (مثل گرید `/deals` که با تغییر
   * فیلتر کلیدش عوض می‌شود) حتماً همان مقادیر را اینجا هم بده. وگرنه
   * React عنصر قدیمی را برمی‌دارد و عنصر تازه را می‌گذارد، ولی این هوک
   * دوباره اجرا نمی‌شود و کارت‌های جدید با `opacity: 0` کلاس
   * `.will-reveal` نامرئی می‌مانند.
   */
  deps?: readonly unknown[];
};

/**
 * ورود مرحله‌ای عناصر هنگام رسیدن به ویوپورت.
 * روی کانتینر ref می‌گذاریم و فرزندان با کلاس `.will-reveal` انیمیت می‌شوند.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const {
    selector = ".will-reveal",
    y = 48,
    rotateX = 0,
    stagger = 0.08,
    duration = 0.9,
    delay = 0,
    start = "top 82%",
    replay = false,
    deps = [],
  } = options;

  const scope = useRef<T>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      const targets = gsap.utils.toArray<HTMLElement>(selector, root);
      if (!targets.length) return;

      /** یک‌بار بیشتر اجرا نمی‌شود؛ هر سه مسیرِ فعال‌سازی از همین رد می‌شوند */
      let played = false;
      const show = (instant = false) => {
        if (played) return;
        played = true;
        gsap.to(targets, {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: instant ? 0 : duration,
          delay: instant ? 0 : delay,
          stagger: instant ? 0 : stagger,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      // کاربری که انیمیشن کمتر خواسته، فقط محتوا را می‌بیند
      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0, rotateX: 0 });
        return;
      }

      gsap.set(targets, { opacity: 0, y, rotateX, transformPerspective: 900 });

      /*
        چرا اینجا خودمان چک می‌کنیم که عنصر در دید هست یا نه:

        این هوک وقتی کلید کامپوننت عوض می‌شود دوباره اجرا می‌شود — دقیقاً
        همان اتفاقی که با کلیک روی فیلتر دسته‌بندی در `/deals` می‌افتد.
        در آن لحظه کاربر همان‌جا ایستاده و گرید جلوی چشمش است، ولی
        ScrollTrigger تازه‌ساخته اسکرول جدیدی نمی‌بیند تا شلیک کند و
        `gsap.set(opacity: 0)` بالا سر جایش می‌ماند. نتیجه: کاربر روی
        «لپ‌تاپ» کلیک می‌کرد و صفحه کاملاً خالی می‌شد.

        پس اگر عنصر همین حالا در دید است، بی‌درنگ نشانش می‌دهیم و اصلاً
        سراغ ScrollTrigger نمی‌رویم.
      */
      const isInView = () => {
        const rect = root.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
      };

      /*
        یک فریم صبر می‌کنیم. اگر همین لحظه اندازه بگیریم، چیدمان هنوز
        قطعی نشده و `getBoundingClientRect` صفر برمی‌گرداند — که یعنی
        «در دید نیست» و دقیقاً همان حالت خالی‌ماندن پیش می‌آید.
      */
      const frame = requestAnimationFrame(() => {
        if (isInView()) show();
      });

      const trigger = ScrollTrigger.create({
        trigger: root,
        start,
        once: !replay,
        onEnter: () => show(),
      });

      /*
        تور نجات. اگر به هر دلیلی (تداخل Lenis، تغییر ارتفاع صفحه بعد از
        لود فونت، رفرش‌نشدن ScrollTrigger) تریگر شلیک نکرد، محتوا نباید
        برای همیشه نامرئی بماند. نامرئی ماندن محتوا از نداشتن انیمیشن
        خیلی بدتر است.
      */
      const rescue = window.setTimeout(() => {
        if (isInView()) show(true);
      }, 2500);

      return () => {
        cancelAnimationFrame(frame);
        trigger.kill();
        window.clearTimeout(rescue);
      };
    },
    { scope, dependencies: [selector, ...deps], revertOnUpdate: true },
  );

  return scope;
}
