"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import { Brand } from "@/components/ui/Brand";

const LINE_ONE = ["دنبال", "بهترین"];
const LINE_TWO = ["فرصت", "خرید", "هستی؟"];

/**
 * تیتر هیرو با ورود کلمه‌به‌کلمه.
 * تقسیم کلمات دستی انجام شده تا وابسته به پلاگین SplitText نباشیم.
 */
export function HeroCopy() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap
        .timeline({ delay: 0.15 })
        .from(".hero-word", {
          yPercent: 118,
          opacity: 0,
          duration: 0.9,
          stagger: 0.07,
          ease: "power4.out",
        })
        .from(
          ".hero-sub",
          { y: 18, opacity: 0, duration: 0.8, ease: "power3.out" },
          "-=0.45",
        );
    },
    { scope },
  );

  return (
    <div ref={scope} className="max-w-md">
      <h1 className="text-3xl leading-[1.5] font-extrabold text-hi sm:text-4xl sm:leading-[1.45]">
        {[LINE_ONE, LINE_TWO].map((line, i) => (
          <span key={i} className="block overflow-hidden py-0.5">
            {line.map((word, j) => (
              <span key={j} className="hero-word inline-block">
                {word}
                {j < line.length - 1 && " "}
              </span>
            ))}
          </span>
        ))}
      </h1>

      {/*
        اینجا عمداً هیچ عددی نیست.

        نسخه‌ی اول «از بین هزاران محصول» می‌گفت که دروغ بود. نسخه‌ی دوم
        عدد واقعی کاتالوگ را نشان می‌داد که راست بود ولی مشکل دیگری
        داشت: کاتالوگ بالا و پایین می‌رود و دیدن «۸۰ محصول» روی صفحه‌ی
        اصلی، سایت را کوچک نشان می‌دهد بدون اینکه به کسی کمکی کند.

        راه سوم این است که اصلاً ادعای اندازه نکنیم. آنچه ارزش دارد
        روزانه بودن رصد است، نه تعدادش.
      */}
      <p className="hero-sub mt-4 text-sm leading-relaxed text-mid">
        به <Brand /> بگو دنبال چی می‌گردی؛ قیمت‌ها را هر روز رصد می‌کنیم و
        بهترین لحظه‌ی خرید را بهت می‌گوییم.
      </p>
    </div>
  );
}
