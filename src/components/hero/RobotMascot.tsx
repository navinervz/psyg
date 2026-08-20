"use client";

import { useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/animations/gsap";

/**
 * ماسکوت ربات PsyG — نسخه‌ی SVG.
 *
 * چشم‌ها موس را دنبال می‌کنند، آنتن‌ها می‌لرزند و کل بدنه شناور است.
 * در مرحله‌ی بعد می‌توان این کامپوننت را با نسخه‌ی Three.js (R3F + Bloom)
 * جایگزین کرد بدون تغییر در HeroSection — همین API را حفظ کنید.
 */
export function RobotMascot() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      // ورود
      gsap.from(".robot-body", {
        scale: 0.82,
        opacity: 0,
        duration: 1.3,
        ease: "power3.out",
      });

      if (prefersReducedMotion()) return;

      // شناور بودن
      gsap.to(".robot-float", {
        y: -14,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // تنفس هاله
      gsap.to(".robot-halo", {
        scale: 1.14,
        opacity: 0.85,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // لرزش آنتن‌ها
      gsap.to(".robot-antenna", {
        rotate: 5,
        transformOrigin: "bottom center",
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.25, from: "random" },
      });

      // پلک زدن
      const blink = () => {
        gsap.to(".robot-eye", {
          scaleY: 0.08,
          transformOrigin: "center",
          duration: 0.09,
          yoyo: true,
          repeat: 1,
          onComplete: () => gsap.delayedCall(gsap.utils.random(2.5, 6), blink),
        });
      };
      gsap.delayedCall(2.5, blink);

      // ردیابی موس با چشم‌ها
      const eyes = gsap.utils.toArray<SVGElement>(".robot-pupil", root);
      const quickX = eyes.map((el) => gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }));
      const quickY = eyes.map((el) => gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }));

      const onMove = (e: MouseEvent) => {
        const rect = root.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = gsap.utils.clamp(-7, 7, (e.clientX - cx) / 26);
        const dy = gsap.utils.clamp(-5, 5, (e.clientY - cy) / 30);
        quickX.forEach((fn) => fn(dx));
        quickY.forEach((fn) => fn(dy));
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      return () => window.removeEventListener("mousemove", onMove);
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative grid w-full min-w-0 place-items-center"
      aria-hidden
    >
      {/* هاله‌ی پس‌زمینه — نسبت به ربات مقیاس می‌گیرد، نه اندازه‌ی ثابت */}
      <div className="robot-halo pointer-events-none absolute aspect-square w-[115%] max-w-[300px] rounded-full bg-accent/22 blur-[80px]" />

      <div className="robot-float relative w-full max-w-[260px]">
        <svg
          viewBox="0 0 260 240"
          className="robot-body w-full drop-shadow-[0_0_38px_rgba(163,230,53,0.35)]"
        >
          <defs>
            <linearGradient id="botFace" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a12" />
              <stop offset="100%" stopColor="#0b1207" />
            </linearGradient>
            <radialGradient id="eyeGlow">
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="60%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#65a30d" />
            </radialGradient>
          </defs>

          {/* آنتن‌ها */}
          <g stroke="#a3e635" strokeWidth="4" strokeLinecap="round" fill="none">
            <path className="robot-antenna" d="M86 74 C 72 46, 58 34, 44 26" />
            <path className="robot-antenna" d="M174 74 C 188 46, 202 34, 216 26" />
          </g>
          <circle className="robot-antenna" cx="44" cy="24" r="8" fill="#a3e635" />
          <circle className="robot-antenna" cx="216" cy="24" r="8" fill="#a3e635" />

          {/* سر */}
          <rect
            x="52"
            y="66"
            width="156"
            height="118"
            rx="42"
            fill="url(#botFace)"
            stroke="#a3e635"
            strokeWidth="3"
          />

          {/* چشم‌ها */}
          <g className="robot-eye">
            <ellipse className="robot-pupil" cx="104" cy="126" rx="19" ry="23" fill="url(#eyeGlow)" />
            <ellipse className="robot-pupil" cx="156" cy="126" rx="19" ry="23" fill="url(#eyeGlow)" />
          </g>

          {/* لبخند */}
          <path
            d="M112 158 Q130 170 148 158"
            stroke="#a3e635"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity=".8"
          />

          {/* گوش‌ها */}
          <rect x="34" y="108" width="14" height="36" rx="7" fill="#4d7c0f" />
          <rect x="212" y="108" width="14" height="36" rx="7" fill="#4d7c0f" />

          {/* بدنه */}
          <rect x="92" y="188" width="76" height="30" rx="14" fill="#0f1a09" stroke="#4d7c0f" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
