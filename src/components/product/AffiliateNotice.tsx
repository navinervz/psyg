import { Info } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { cn } from "@/lib/cn";

/**
 * افشای رابطه‌ی افیلیت.
 *
 * این فقط یک تزئین نیست: شفاف بودن درباره‌ی کمیسیون هم شرط پذیرش در
 * برنامه‌های همکاری در فروش است، هم توصیه‌ی صریح گوگل برای سایت‌های افیلیت.
 * نبودش می‌تواند دلیل رد شدن رسانه یا افت رتبه باشد.
 */
export function AffiliateNotice({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-line bg-elevated/40 px-4 py-3 text-[11px] leading-relaxed text-low",
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" strokeWidth={1.8} />
      <span>
        <Brand glow={false} /> محصولی نمی‌فروشد. با کلیک روی «خرید» به فروشگاه فروشنده منتقل
        می‌شوی و ممکن است بابت خریدت کمیسیون به ما تعلق بگیرد — بدون اینکه
        قیمت برای تو تغییری کند. قیمت‌ها لحظه‌ای رصد می‌شوند اما ملاک نهایی،
        قیمت درج‌شده در خود فروشگاه است.
      </span>
    </p>
  );
}
