import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        /*
          ۱۶ پیکسل در موبایل عمدی است: سافاری iOS روی هر ورودی با فونت
          کوچک‌تر از ۱۶ پیکسل هنگام فوکوس صفحه را زوم می‌کند و کاربر در
          صفحه‌ی زوم‌شده گیر می‌افتد. از sm به بعد به ۱۴ پیکسل برمی‌گردد.
        */
        "w-full min-w-0 bg-transparent text-base text-hi placeholder:text-low sm:text-sm",
        "outline-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
