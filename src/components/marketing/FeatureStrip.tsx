"use client";

import {
  Activity,
  BellRing,
  Heart,
  LineChart,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { features } from "@/lib/reference";
import type { Feature } from "@/lib/types";

const ICONS: Record<Feature["icon"], LucideIcon> = {
  bell: BellRing,
  activity: Activity,
  chart: LineChart,
  heart: Heart,
};

/** نوار چهار ویژگی زیر گرید فرصت‌ها */
export function FeatureStrip() {
  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".feature-item",
    y: 34,
    stagger: 0.1,
    duration: 0.8,
  });

  return (
    <Card as="section" className="p-4 sm:p-6">
      {/* چهار ستونه فقط از xl؛ در lg هر ستون ~۱۷۰ پیکسل می‌شد و متن‌ها
          به چهار خط می‌شکستند. */}
      <div
        ref={scope}
        className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0"
      >
        {features.map((feature, i) => {
          const Icon = ICONS[feature.icon];

          return (
            <div
              key={feature.id}
              /* مطابق دیزاین آیکون سمت چپ متن قرار می‌گیرد */
              className={`feature-item will-reveal group flex min-w-0 flex-row-reverse items-start gap-4 xl:px-4 ${
                i > 0 ? "xl:border-e xl:border-line" : ""
              }`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/8 text-accent transition-all duration-400 group-hover:bg-accent/16 group-hover:shadow-[0_0_26px_rgba(163,230,53,0.28)]">
                <Icon className="size-6" strokeWidth={1.6} />
              </span>

              <div className="flex min-w-0 flex-col gap-1.5">
                <h3 className="text-sm font-bold text-hi">{feature.title}</h3>
                <p className="text-[11px] leading-relaxed text-mid">
                  {feature.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
