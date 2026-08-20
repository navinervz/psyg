"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { ChangeBadge } from "@/components/ui/Badge";
import { useRevealOnScroll } from "@/animations/useRevealOnScroll";
import type { Suggestion } from "@/lib/types";

/** پنل «پیشنهادهای برای شما» در سمت چپ کارت هیرو */
export function SuggestionsPanel({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  const scope = useRevealOnScroll<HTMLDivElement>({
    selector: ".suggestion-row",
    y: 24,
    stagger: 0.1,
    duration: 0.7,
    delay: 0.25,
  });

  return (
    <div ref={scope} className="flex h-full flex-col gap-3">
      <h3 className="text-sm font-bold text-hi">پیشنهادهای برای شما</h3>

      <div className="flex flex-1 flex-col gap-2.5">
        {suggestions.map((suggestion) => (
          <Link
            key={suggestion.id}
            href={suggestion.href}
            className="suggestion-row will-reveal group flex items-start justify-between gap-3 rounded-2xl border border-line bg-elevated/60 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-accent/35 hover:bg-elevated"
          >
            <p className="text-xs leading-relaxed text-mid transition-colors group-hover:text-hi">
              {suggestion.text}
            </p>
            <ChangeBadge delta={suggestion.delta} showLabel className="shrink-0" />
          </Link>
        ))}
      </div>

      <Link
        href="/deals"
        className="group inline-flex items-center justify-center gap-1.5 rounded-2xl border border-line bg-elevated/40 py-3 text-xs font-semibold text-accent transition-all duration-300 hover:border-accent/40 hover:bg-accent/8"
      >
        مشاهده همه پیشنهادها
        <Plus className="size-3.5 transition-transform group-hover:rotate-90" />
      </Link>
    </div>
  );
}
