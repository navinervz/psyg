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
          /*
            ─────────────────────────────────────────────────────────
            ناحیه‌ی لمسی، نه فقط ناحیه‌ی متن
            ─────────────────────────────────────────────────────────
            اندازه‌گیری روی سایت زنده نشان داد این لینک ۱۶ تا ۱۸
            پیکسل ارتفاع دارد — یعنی روی گوشی باید دقیقاً روی متن
            ۱۲ پیکسلی زد. این تیتر در همه‌ی سکشن‌ها هست، پس همان
            خطا ده‌ها بار روی هر صفحه تکرار می‌شد.

            `after` ناحیه‌ی لمسی را به ۴۴ پیکسل می‌رساند بدون اینکه
            هم‌ترازی تیتر با متن به‌هم بخورد. بزرگ کردن خود لینک با
            پدینگ، `items-center` را جابه‌جا می‌کرد و تیتر هر سکشن
            کمی پایین می‌افتاد.
          */
          className="group relative inline-flex items-center gap-1 text-xs font-semibold text-accent transition-opacity hover:opacity-75 after:absolute after:-inset-x-2 after:-top-3 after:-bottom-3 after:content-['']"
        >
          {actionLabel}
          <Plus className="size-3 transition-transform group-hover:rotate-90" />
        </Link>
      )}
    </div>
  );
}
