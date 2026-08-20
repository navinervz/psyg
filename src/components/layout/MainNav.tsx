"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV_LINKS as links } from "@/lib/nav";

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex items-center gap-1", className)}>
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
              active ? "text-accent" : "text-mid hover:text-hi",
            )}
          >
            {link.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-0.5 h-px bg-accent shadow-[0_0_12px_rgba(163,230,53,0.8)]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
