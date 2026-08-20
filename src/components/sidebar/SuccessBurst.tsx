"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/animations/gsap";

/** انفجار ذرات سبز بعد از ثبت موفق ایمیل */
export function SuccessBurst({ active }: { active: boolean }) {
  const scope = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !scope.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const particles = gsap.utils.toArray<HTMLElement>(".burst-dot");

      gsap.set(particles, { x: 0, y: 0, scale: 1, opacity: 1 });

      particles.forEach((dot) => {
        const angle = gsap.utils.random(0, Math.PI * 2);
        const distance = gsap.utils.random(40, 110);

        gsap.to(dot, {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 0,
          opacity: 0,
          duration: gsap.utils.random(0.7, 1.3),
          ease: "power2.out",
        });
      });
    }, scope);

    return () => ctx.revert();
  }, [active]);

  if (!active) return null;

  return (
    <div
      ref={scope}
      aria-hidden
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="burst-dot absolute size-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(163,230,53,0.9)]"
        />
      ))}
    </div>
  );
}
