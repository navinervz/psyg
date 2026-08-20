import Link from "next/link";
import { Plus } from "lucide-react";
import { Sparkle } from "@/components/ui/Sparkle";
import { cn } from "@/lib/cn";

/** تیتر سکشن با آیکون درخشش + لینک «مشاهده همه» در سمت مقابل */
export function SectionHeader({
  title,
  actionLabel = "مشاهده همه",
  actionHref,
  className,
}: {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-hi">
        <Sparkle className="size-4 text-accent" />
        {title}
      </h2>

      {actionHref && (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1 text-xs font-semibold text-accent transition-opacity hover:opacity-75"
        >
          {actionLabel}
          <Plus className="size-3 transition-transform group-hover:rotate-90" />
        </Link>
      )}
    </div>
  );
}
