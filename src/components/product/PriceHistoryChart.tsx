"use client";

import { useId, useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "@/animations/gsap";
import { formatPrice, toFaDigits, type PriceTrend } from "@/lib/format";
import type { PricePoint } from "@/lib/types";

const W = 720;
const H = 260;
const PAD = { top: 20, right: 16, bottom: 34, left: 16 };

/**
 * نمودار کامل تاریخچه‌ی قیمت با هاور تعاملی.
 * باز هم SVG خام — برای این حجم داده هیچ کتابخانه‌ای لازم نیست.
 */
export function PriceHistoryChart({
  history,
  trend,
}: {
  history: PricePoint[];
  trend: PriceTrend;
}) {
  const scope = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const gradientId = `hist-${useId().replace(/:/g, "")}`;
  // خط خنثی وقتی هنوز روندی نداریم — نمودار تک‌نقطه‌ای نباید سقوط یا جهش القا کند
  const color =
    trend === "drop"
      ? "var(--color-accent)"
      : trend === "rise"
        ? "var(--color-danger)"
        : "var(--color-mid)";

  const { points, line, area, min, max } = useMemo(() => {
    const prices = history.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;

    const points = history.map((point, i) => {
      const x = PAD.left + (i / Math.max(1, history.length - 1)) * innerW;
      const y = PAD.top + (1 - (point.price - min) / range) * innerH;
      return { x, y, ...point };
    });

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

    const area = `${line} L${points[points.length - 1]?.x ?? 0},${H - PAD.bottom} L${points[0]?.x ?? 0},${H - PAD.bottom} Z`;

    return { points, line, area, min, max };
  }, [history]);

  useGSAP(
    () => {
      const path = scope.current?.querySelector<SVGPathElement>(".hist-line");
      if (!path) return;

      const length = path.getTotalLength();
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

      gsap
        .timeline({
          scrollTrigger: { trigger: scope.current, start: "top 88%", once: true },
        })
        .to(path, { strokeDashoffset: 0, duration: 1.8, ease: "power2.inOut" })
        .from(".hist-area", { opacity: 0, duration: 0.8 }, "-=0.9")
        .from(".hist-dot", { scale: 0, stagger: 0.02, duration: 0.35 }, "-=0.8");
    },
    { scope, dependencies: [line] },
  );

  const active = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full">
      <svg
        ref={scope}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="نمودار تاریخچه قیمت"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* خطوط راهنمای افقی */}
        {[0, 0.5, 1].map((ratio) => {
          const y = PAD.top + ratio * (H - PAD.top - PAD.bottom);
          return (
            <line
              key={ratio}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--color-line)"
              strokeDasharray="4 6"
            />
          );
        })}

        <path className="hist-area" d={area} fill={`url(#${gradientId})`} />
        <path
          className="hist-line"
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, i) => (
          <g key={point.t}>
            <circle
              className="hist-dot"
              cx={point.x}
              cy={point.y}
              r={hover === i ? 6 : 3.5}
              fill={hover === i ? color : "var(--color-night)"}
              stroke={color}
              strokeWidth="2"
            />
            {/* ناحیه‌ی هاور پهن‌تر برای راحتی موس */}
            <rect
              x={point.x - 14}
              y={0}
              width={28}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}

        {active && (
          <line
            x1={active.x}
            x2={active.x}
            y1={PAD.top}
            y2={H - PAD.bottom}
            stroke={color}
            strokeOpacity="0.35"
            strokeDasharray="3 4"
          />
        )}
      </svg>

      {/* برچسب کف و سقف */}
      <div className="mt-1 flex justify-between text-[11px] text-low nums-fa">
        <span>کمترین: {formatPrice(min)}</span>
        <span>بیشترین: {formatPrice(max)}</span>
      </div>

      {/* تولتیپ */}
      {active && (
        <div
          /*
            تولتیپ با translateX(-50%) نسبت به نقطه وسط‌چین می‌شود؛ برای
            نقطه‌های اول و آخر نیمی از آن بیرون از نمودار می‌افتاد. با
            clamp موقعیت افقی بین ۱۰٪ و ۹۰٪ نگه داشته می‌شود.
          */
          className="pointer-events-none absolute -top-2 rounded-xl border border-line bg-elevated px-3 py-2 text-xs whitespace-nowrap shadow-xl"
          style={{
            left: `${Math.min(90, Math.max(10, (active.x / W) * 100))}%`,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-bold text-hi nums-fa">{formatPrice(active.price)}</p>
          <p className="text-[10px] text-low nums-fa">{toFaDigits(active.t)}</p>
        </div>
      )}
    </div>
  );
}
