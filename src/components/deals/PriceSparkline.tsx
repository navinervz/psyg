"use client";

import { useId, useMemo, useRef } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import type { PriceTrend } from "@/lib/format";
import type { PricePoint } from "@/lib/types";

const W = 200;
const H = 56;
const PAD = 4;

/**
 * نمودار کوچک تاریخچه‌ی قیمت.
 *
 * SVG خام به‌جای Recharts: ۶ کارت همزمان روی صفحه است و هر رندر
 * اضافه هزینه دارد. کشیده‌شدن خط با stroke-dasharray انیمیت می‌شود
 * (معادل رفتار DrawSVG بدون نیاز به پلاگین).
 */
export function PriceSparkline({
  history,
  trend,
  className,
}: {
  history: PricePoint[];
  trend: PriceTrend;
  className?: string;
}) {
  const scope = useRef<SVGSVGElement>(null);

  const { line, area } = useMemo(() => {
    if (history.length < 2) return { line: "", area: "" };

    const prices = history.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = history.map((point, i) => {
      const x = PAD + (i / (history.length - 1)) * (W - PAD * 2);
      const y = PAD + (1 - (point.price - min) / range) * (H - PAD * 2);
      return [x, y] as const;
    });

    const line = points
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");

    const area = `${line} L${W - PAD},${H} L${PAD},${H} Z`;

    return { line, area };
  }, [history]);

  /*
    خط خنثی برای محصولی که هنوز تاریخچه ندارد.

    نمودار تک‌نقطه‌ای که قرمز باشد، سقوط یا جهش را القا می‌کند در حالی
    که فقط یک اندازه‌گیری داریم.
  */
  const color =
    trend === "drop"
      ? "var(--color-accent)"
      : trend === "rise"
        ? "var(--color-danger)"
        : "var(--color-mid)";

  // useId به‌جای Math.random تا سرور و کلاینت یک شناسه بدهند (بدون hydration mismatch).
  // کاراکتر «:» در خروجی useId برای url(#...) نامعتبر است، پس حذف می‌شود.
  const gradientId = `spark-${useId().replace(/:/g, "")}`;

  useGSAP(
    () => {
      const path = scope.current?.querySelector<SVGPathElement>(".spark-line");
      const fill = scope.current?.querySelector<SVGPathElement>(".spark-area");
      if (!path || !fill) return;

      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.set(fill, { opacity: 0 });

      gsap
        .timeline({
          scrollTrigger: { trigger: scope.current, start: "top 92%", once: true },
        })
        .to(path, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" })
        .to(fill, { opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.7");
    },
    { scope, dependencies: [line] },
  );

  if (!line) return null;

  return (
    <svg
      ref={scope}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path className="spark-area" d={area} fill={`url(#${gradientId})`} />
      <path
        className="spark-line"
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
