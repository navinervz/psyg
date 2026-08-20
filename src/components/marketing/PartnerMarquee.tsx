"use client";

import { useRef } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/animations/gsap";
import { stores } from "@/lib/reference";

type MarqueeItem = {
  id: string;
  displayName: string;
  url: string;
  /** لینک بیرونی است؟ (تعیین‌کننده‌ی target و rel) */
  external: boolean;
};

/** لیست ثابت است، پس بیرون از کامپوننت ساخته می‌شود تا هر رندر بازسازی نشود */
const ITEMS: MarqueeItem[] = [
  ...stores.map((store) => ({
    id: store.id,
    displayName: store.displayName,
    url: store.url,
    external: true,
  })),
  { id: "more", displayName: "و بیشتر...", url: "/stores", external: false },
];

/**
 * لوپ بی‌نهایت افقی فروشگاه‌های همکار.
 * سرعت لوپ با سرعت اسکرول کاربر تغییر می‌کند.
 */
export function PartnerMarquee() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;

      const track = scope.current?.querySelector<HTMLElement>(".marquee-track");
      if (!track) return;

      // نصف عرض = یک دور کامل، چون لیست دوبار رندر شده
      const loop = gsap.to(track, {
        xPercent: 50, // RTL: حرکت به سمت راست
        duration: 26,
        ease: "none",
        repeat: -1,
      });

      const st = ScrollTrigger.create({
        trigger: scope.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 900, 3.5);
          gsap.to(loop, { timeScale: boost, duration: 0.4, overwrite: true });
        },
      });

      return () => {
        st.kill();
        loop.kill();
      };
    },
    { scope },
  );

  return (
    <Card as="section" className="overflow-hidden p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:gap-8">
        <div className="shrink-0">
          <h2 className="text-base font-extrabold text-hi">فروشگاه‌های همکار</h2>
          <Link
            href="/stores"
            className="text-[11px] text-low transition-colors hover:text-accent"
          >
            مشاهده همه
          </Link>
        </div>

        <div
          ref={scope}
          className="relative flex-1 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(to left, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to left, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="marquee-track flex w-max gap-3">
            {/* لیست دقیقاً دو بار تکرار می‌شود تا لوپ در ۵۰٪ بی‌درز بسته شود */}
            {[...ITEMS, ...ITEMS].map((store, i) => (
              <Link
                key={`${store.id}-${i}`}
                href={store.url}
                target={store.external ? "_blank" : undefined}
                rel={
                  store.external
                    ? "noopener noreferrer nofollow sponsored"
                    : undefined
                }
                className="grid h-14 w-36 shrink-0 place-items-center rounded-2xl border border-line bg-elevated/60 px-4 text-sm font-bold text-mid transition-all duration-300 hover:border-accent/40 hover:text-hi"
              >
                {store.displayName}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
