import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

/** حالت خالی مشترک همه‌ی لیست‌ها */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line py-16 text-center"
    >
      <Icon className="size-10 text-low" strokeWidth={1.3} />
      <h2 className="text-base font-bold text-hi">{title}</h2>
      <p className="max-w-sm text-xs leading-relaxed text-mid">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-2">
          <Button size="sm">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
