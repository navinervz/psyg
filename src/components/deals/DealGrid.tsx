"use client";

import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";
import { DealCard } from "@/components/deals/DealCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import { priceDelta } from "@/lib/format";
import { categories } from "@/lib/reference";
import { cn } from "@/lib/cn";
import type { CategoryId, Product } from "@/lib/types";

type SortKey = "biggest-drop" | "cheapest" | "most-expensive" | "biggest-rise";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "biggest-drop", label: "بیشترین کاهش" },
  { key: "biggest-rise", label: "بیشترین افزایش" },
  { key: "cheapest", label: "ارزان‌ترین" },
  { key: "most-expensive", label: "گران‌ترین" },
];

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "cursor-pointer rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-300",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-line bg-elevated/60 text-mid hover:text-hi",
      )}
    >
      {children}
    </button>
  );
}

/** گرید فرصت‌ها با فیلتر دسته‌بندی و مرتب‌سازی */
export function DealGrid({
  items,
  showFilters = true,
  showStoreFilter = true,
  initialCategory = "all",
}: {
  items: Product[];
  showFilters?: boolean;
  /** در صفحه‌ی دسته‌بندی، فیلتر دسته اضافی است */
  showStoreFilter?: boolean;
  initialCategory?: CategoryId | "all";
}) {
  const [category, setCategory] = useState<CategoryId | "all">(initialCategory);
  const [sort, setSort] = useState<SortKey>("biggest-drop");

  const visible = useMemo(() => {
    const filtered =
      category === "all"
        ? [...items]
        : items.filter((p) => p.category === category);

    return filtered.sort((a, b) => {
      if (sort === "cheapest") return a.currentPrice - b.currentPrice;
      if (sort === "most-expensive") return b.currentPrice - a.currentPrice;

      const da = priceDelta(a.previousPrice, a.currentPrice);
      const db = priceDelta(b.previousPrice, b.currentPrice);
      return sort === "biggest-rise" ? db - da : da - db;
    });
  }, [items, category, sort]);

  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".deal-card",
    y: 50,
    rotateX: 10,
    stagger: 0.04,
    duration: 0.8,
    // گرید با تغییر فیلتر `key` عوض می‌کند، پس انیمیشن هم باید از نو اجرا شود
    deps: [category, sort],
  });

  // دسته‌هایی که واقعاً محصولی در این لیست دارند
  const availableCategories = useMemo(
    () => categories.filter((c) => items.some((p) => p.category === c.id)),
    [items],
  );

  return (
    <div className="flex flex-col gap-5">
      {showFilters && (
        <div className="flex flex-col gap-3">
          {showStoreFilter && availableCategories.length > 1 && (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="فیلتر دسته‌بندی"
            >
              <FilterChip
                active={category === "all"}
                onClick={() => setCategory("all")}
              >
                همه دسته‌ها
              </FilterChip>
              {availableCategories.map((c) => (
                <FilterChip
                  key={c.id}
                  active={category === c.id}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2" role="group" aria-label="مرتب‌سازی">
            {SORTS.map((option) => (
              <FilterChip
                key={option.key}
                active={sort === option.key}
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="محصولی با این فیلتر پیدا نشد"
          description="فیلتر دیگری امتحان کن یا همه‌ی فرصت‌ها را ببین."
          actionLabel="همه فرصت‌ها"
          actionHref="/deals"
        />
      ) : (
        <div
          key={`${category}-${sort}`}
          ref={scope}
          dir="ltr"
          data-testid="deal-grid"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-6"
          style={{ perspective: "1100px" }}
        >
          {visible.map((product, index) => (
            <DealCard
              key={product.id}
              product={product}
              index={index}
              showRank={sort === "biggest-drop" && category === "all"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
