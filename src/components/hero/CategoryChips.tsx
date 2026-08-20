"use client";

import {
  Cable,
  Gamepad2,
  Headphones,
  Laptop,
  Smartphone,
  Tablet,
  Watch,
  type LucideIcon,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { categories } from "@/lib/reference";

const ICONS: Record<string, LucideIcon> = {
  laptop: Laptop,
  smartphone: Smartphone,
  headphones: Headphones,
  watch: Watch,
  gamepad: Gamepad2,
  tablet: Tablet,
  cable: Cable,
};

/** چیپ‌های دسته‌بندی زیر هیرو — هرکدام به صفحه‌ی دسته می‌روند */
export function CategoryChips() {
  const scope = useRevealOnScroll<HTMLDivElement>({
    y: 20,
    stagger: 0.06,
    duration: 0.6,
  });

  return (
    <div ref={scope} className="flex flex-wrap gap-2.5">
      {categories.slice(0, 5).map((category) => {
        const Icon = ICONS[category.icon] ?? Laptop;
        return (
          <Chip
            key={category.id}
            href={`/category/${category.id}`}
            icon={<Icon className="size-3.5" strokeWidth={1.8} />}
            className="will-reveal"
          >
            {category.chipLabel}
          </Chip>
        );
      })}
    </div>
  );
}
