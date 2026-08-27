"use client";

import { useRef } from "react";
import { Card } from "@/components/ui/Card";
import { Sparkle } from "@/components/ui/Sparkle";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { gsap, useGSAP, prefersReducedMotion } from "@/animations/gsap";

/**
 * ویجت «خبرم کن» در سایدبار.
 *
 * خودِ فرم در `SubscribeForm` است تا صفحه‌ی تنظیمات هم بتواند همان را
 * نشان دهد — قبلاً آنجا فرمی نبود و متن، کاربر را به اینجا می‌فرستاد.
 */
export function NotifyMeWidget() {
  const scope = useRef<HTMLDivElement>(null);

  // درخشش دورانی روی قاب کارت
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.to(".notify-glow", {
        opacity: 0.55,
        scale: 1.06,
        duration: 2.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope },
  );

  return (
    <Card glow neon className="will-reveal relative p-5">
      <div ref={scope}>
        <div className="notify-glow pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-accent/22 blur-3xl" />
      </div>

      <div className="relative flex flex-col gap-4">
        <h3 className="flex items-center gap-2 text-lg font-extrabold text-hi">
          <Sparkle className="size-5 text-accent" />
          خبرم کن
        </h3>

        <p className="text-xs leading-relaxed text-mid">
          ایمیلت رو بذار تا هر وقت قیمت محصولات موردعلاقه‌ت افتاد، اولین نفر
          باخبر بشی.
        </p>

        {/*
          فرم مشترک است با صفحه‌ی تنظیمات.

          قبلاً همین فرم اینجا نوشته شده بود و صفحه‌ی تنظیمات فرمی
          نداشت — فقط کاربر را به اینجا ارجاع می‌داد. حالا هر دو یک
          کامپوننت را صدا می‌زنند تا اصلاح یکی، دیگری را هم بگیرد.
        */}
        <SubscribeForm />

        <p className="text-[10px] leading-relaxed text-low">
          هر وقت بخوای می‌تونی لغو اشتراک کنی. ایمیلت جای دیگه‌ای استفاده نمی‌شه.
        </p>
      </div>
    </Card>
  );
}
