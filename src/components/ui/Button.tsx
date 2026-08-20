import { forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "accent" | "ghost" | "outline" | "elevated";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  /*
    استایل بصری در کلاس `.btn-accent` داخل globals.css است، نه اینجا.

    قبلاً هر دکمه‌ی سبز سایت — این، دکمه‌ی خرید، و دکمه‌ی جستجو —
    سایه و رنگ خودش را داشت و کم‌کم از هم جدا می‌شدند. با یک کلاس
    مشترک، هر اصلاحی همه‌جا اعمال می‌شود.
  */
  accent: "btn-accent text-night font-bold",
  ghost: "bg-transparent text-mid hover:text-hi hover:bg-elevated",
  outline:
    "bg-transparent text-hi border border-line hover:border-accent/50 hover:text-accent",
  elevated:
    "bg-elevated text-hi border border-line hover:border-accent/40 hover:bg-elevated/80",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs rounded-xl",
  md: "h-11 px-5 text-sm rounded-2xl",
  lg: "h-14 px-7 text-base rounded-2xl",
  icon: "h-11 w-11 rounded-2xl",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "accent", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 transition-all duration-300 outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-night",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.97]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = "Button";
