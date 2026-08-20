"use client";

import { useRef } from "react";
import { Sparkle } from "@/components/ui/Sparkle";
import { Card } from "@/components/ui/Card";
import { Brand } from "@/components/ui/Brand";
import { gsap, useGSAP } from "@/animations/gsap";
import { formatPrice } from "@/lib/format";
import type { BuyVerdict } from "@/lib/analysis";

const TONE = {
  good: { text: "text-accent", bar: "bg-accent", ring: "border-accent/40" },
  neutral: { text: "text-hi", bar: "bg-mid", ring: "border-line" },
  bad: { text: "text-danger", bar: "bg-danger", ring: "border-danger/40" },
} as const;

/** کارت تحلیل «الان بخرم یا صبر کنم؟» */
export function BuyVerdictCard({ verdict }: { verdict: BuyVerdict }) {
  const scope = useRef<HTMLDivElement>(null);
  const tone = TONE[verdict.tone];

  useGSAP(
    () => {
      gsap.fromTo(
        ".verdict-marker",
        { left: "0%" },
        {
          left: `${verdict.position}%`,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: scope.current, start: "top 90%", once: true },
        },
      );
    },
    { scope, dependencies: [verdict.position] },
  );

  return (
    <div ref={scope} className="flex flex-col gap-5">
      <Card glow className={`border p-6 ${tone.ring}`}>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-mid">
          <Sparkle className="size-4 text-accent" />
          تحلیل <Brand glow={false} />
        </h2>

        <p className={`mb-2 text-2xl font-extrabold ${tone.text}`}>
          {verdict.headline}
        </p>
        <p className="mb-6 text-xs leading-relaxed text-mid">{verdict.detail}</p>

        {/* موقعیت قیمت فعلی روی بازه‌ی کف تا سقف */}
        <div className="flex flex-col gap-2">
          <div className="relative h-2 w-full rounded-full bg-gradient-to-l from-danger/50 via-mid/30 to-accent/60">
            <span
              className={`verdict-marker absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-night ${tone.bar}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-low">
            <span>کف بازه</span>
            <span>سقف بازه</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="mb-4 text-sm font-bold text-hi">آمار بازه‌ی اخیر</h3>
        <dl className="flex flex-col gap-3 text-xs">
          {[
            { label: "کمترین قیمت", value: verdict.lowest, tone: "text-accent" },
            { label: "میانگین", value: verdict.average, tone: "text-hi" },
            { label: "بیشترین قیمت", value: verdict.highest, tone: "text-danger" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between border-b border-line pb-3 last:border-0 last:pb-0"
            >
              <dt className="text-mid">{row.label}</dt>
              <dd className={`font-bold nums-fa ${row.tone}`}>
                {formatPrice(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
