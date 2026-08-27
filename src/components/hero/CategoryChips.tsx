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

/**
 * چیپ‌های دسته‌بندی زیر هیرو — هرکدام به صفحه‌ی دسته می‌روند.
 *
 * `ids` فهرست دسته‌هایی است که واقعاً محصول دارند. صفحه‌ی سرور آن را
 * حساب می‌کند و اینجا فقط فیلتر می‌شود؛ این کامپوننت کلاینتی است و به
 * کاتالوگ دسترسی ندارد.
 *
 * چرا لازم شد: دسته‌ی «ساعت هوشمند» صفر محصول داشت و چیپش کاربر را به
 * صفحه‌ای خالی می‌برد. چیپی که به بن‌بست می‌رسد، بدتر از نبودن چیپ است —
 * کاربر یک بار کلیک می‌کند و دفعه‌ی بعد به بقیه‌ی چیپ‌ها هم اعتماد نمی‌کند.
 *
 * وقتی ویجت آن دسته پر شود، چیپ خودبه‌خود برمی‌گردد. هیچ فهرست دستی‌ای
 * نیست که کسی یادش برود به‌روزش کند.
 */
export function CategoryChips({ ids }: { ids?: string[] }) {
  const scope = useRevealOnScroll<HTMLDivElement>({
    y: 20,
    stagger: 0.06,
    duration: 0.6,
  });

  const shown = ids ? categories.filter((c) => ids.includes(c.id)) : categories;

  return (
    <div ref={scope} className="flex flex-wrap gap-2.5">
      {shown.slice(0, 5).map((category) => {
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
