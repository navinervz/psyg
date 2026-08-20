"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/animations/gsap";
import { toFaDigits } from "@/lib/format";

type CountUpOptions = {
  from: number;
  to: number;
  duration?: number;
  /** جداکننده هزارگان بگذارد؟ */
  grouped?: boolean;
  suffix?: string;
  start?: string;
};

/**
 * شمارنده‌ی عددی که وقتی وارد ویوپورت شد از `from` به `to` می‌رود.
 * خروجی همیشه با ارقام فارسی رندر می‌شود.
 */
export function useCountUp<T extends HTMLElement = HTMLSpanElement>({
  from,
  to,
  duration = 1.4,
  grouped = true,
  suffix = "",
  start = "top 90%",
}: CountUpOptions) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const counter = { value: from };
      const render = () => {
        const rounded = Math.round(counter.value);
        const text = grouped ? rounded.toLocaleString("en-US") : String(rounded);
        el.textContent = toFaDigits(text) + suffix;
      };

      /*
        ⚠️ اینجا عمداً `render()` اولیه صدا زده نمی‌شود.

        قبلاً می‌شد، و یک باگ جدی ساخت: متن فوراً روی `from` (قیمت قبلی)
        می‌نشست و فقط اگر انیمیشن شلیک می‌کرد به `to` (قیمت فعلی) می‌رسید.
        روی سایت زنده انیمیشن شلیک نکرد و نتیجه این شد که کارت «۹۷٪ کمتر»
        را کنار **قیمت کامل** نشان می‌داد.

        برای سایتی که کل ارزشش دقت قیمت است، این از نداشتن انیمیشن به‌مراتب
        بدتر است — عددی که کاربر می‌بیند با ادعای کنارش نمی‌خواند.

        حالا متنی که سرور رندر کرده — یعنی همان قیمت فعلی و درست — دست
        نخورده می‌ماند. انیمیشن فقط اگر واقعاً اجرا شود آن را موقتاً به
        `from` می‌برد و برمی‌گرداند.
      */

      if (prefersReducedMotion()) return;

      gsap.to(counter, {
        value: to,
        duration,
        ease: "power2.out",
        onUpdate: render,
        // تضمین اینکه عدد نهایی دقیقاً `to` باشد، نه نتیجه‌ی گرد کردن آخرین فریم
        onComplete: () => {
          counter.value = to;
          render();
        },
        scrollTrigger: { trigger: el, start, once: true },
      });
    },
    { dependencies: [from, to] },
  );

  return ref;
}
