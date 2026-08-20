"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";

/**
 * هاله‌های سبز پس‌زمینه که با اسکرول آرام جابه‌جا می‌شوند.
 * لایه‌ی صفر بصری کل صفحه — بدون تعامل، بدون هزینه‌ی چیدمان.
 */
export function BackdropGlow() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const blobs = gsap.utils.toArray<HTMLElement>(".glow-blob", scope.current);

      blobs.forEach((blob, i) => {
        gsap.to(blob, {
          yPercent: i % 2 === 0 ? -28 : 22,
          xPercent: i % 2 === 0 ? 8 : -10,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
          },
        });

        // تنفس آرام
        gsap.to(blob, {
          scale: 1.12,
          opacity: "+=0.06",
          duration: 6 + i,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="glow-blob absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-accent/12 blur-[140px]" />
      <div className="glow-blob absolute top-[45%] left-[-15%] h-[460px] w-[460px] rounded-full bg-accent/8 blur-[150px]" />
      <div className="glow-blob absolute bottom-[-10%] right-[25%] h-[380px] w-[380px] rounded-full bg-accent-deep/12 blur-[130px]" />
    </div>
  );
}
