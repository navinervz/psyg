import Link from "next/link";
import { cn } from "@/lib/cn";

/** چیپ دسته‌بندی زیر هیرو */
export function Chip({
  href,
  children,
  icon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 rounded-xl border border-line bg-elevated/70 px-3.5 py-2.5",
        "text-xs font-medium text-mid transition-all duration-300",
        "hover:-translate-y-0.5 hover:border-accent/45 hover:text-hi",
        "hover:shadow-[0_0_22px_rgba(163,230,53,0.16)]",
        className,
      )}
    >
      {icon && (
        <span className="text-low transition-colors group-hover:text-accent">
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
}
