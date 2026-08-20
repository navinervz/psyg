"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { subscribeSchema, type SubscribeInput } from "@/lib/schemas";
import { cn } from "@/lib/cn";

/**
 * فرم ثبت ایمیل — مشترک بین ویجت «خبرم کن» و صفحه‌ی تنظیمات.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا جدا شد
 * ─────────────────────────────────────────────────────────────────────
 * صفحه‌ی تنظیمات کلیدهای اعلان ایمیلی داشت ولی هیچ راهی برای دادن
 * ایمیل. متنش کاربر را به ویجتی در صفحه‌ی دیگر می‌فرستاد: «نشانی‌ات را
 * در ویجت خبرم کن ثبت کن».
 *
 * اگر برای انجام کاری باید کاربر را به جای دیگری بفرستیم، عملاً آن کار
 * انجام نمی‌شود. کسی که کلید اعلان را روشن کرده، همان‌جا آماده‌ی دادن
 * ایمیلش است.
 *
 * کپی کردن فرم هم گزینه نبود: دو نسخه یعنی دیر یا زود یکی اصلاح می‌شود
 * و دیگری نه.
 */

type Status = "idle" | "loading" | "success" | "error";

export function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubscribeInput>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: SubscribeInput) => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !data.ok) {
        setStatus("error");
        setMessage(data.message ?? "مشکلی پیش اومد");
        return;
      }

      setStatus("success");
      setMessage(data.message);
      reset();
    } catch {
      setStatus("error");
      setMessage("ارتباط برقرار نشد، دوباره تلاش کن");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn("flex flex-col gap-3", compact && "sm:flex-row sm:items-start")}
      >
        <div
          className={cn(
            "flex flex-1 items-center gap-2.5 rounded-2xl border bg-elevated/70 px-3.5 py-3 transition-colors duration-300",
            errors.email
              ? "border-danger/60"
              : "border-line focus-within:border-accent/50",
          )}
        >
          <Mail className="size-4 shrink-0 text-low" strokeWidth={1.8} />
          <input
            {...register("email")}
            type="email"
            inputMode="email"
            dir="ltr"
            placeholder="you@example.com"
            aria-label="ایمیل شما"
            aria-invalid={!!errors.email}
            /*
              ۱۶ پیکسل روی موبایل تا سافاری iOS موقع فوکوس کل صفحه را
              زوم نکند — همان مشکلی که در فیلد دستیار هم داشتیم.
            */
            className="w-full bg-transparent text-start text-[16px] text-hi outline-none placeholder:text-low sm:text-sm"
          />
        </div>

        <Button
          type="submit"
          disabled={status === "loading"}
          className={cn("gap-2", compact ? "sm:w-auto sm:shrink-0" : "w-full")}
        >
          {status === "loading" && (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.2} />
          )}
          {status === "success" && <Check className="size-4" strokeWidth={2.6} />}
          {status === "success" ? "ثبت شد" : "خبرم کن"}
        </Button>
      </form>

      {errors.email && (
        <p role="alert" className="pt-2 text-[11px] text-danger">
          {errors.email.message}
        </p>
      )}

      {message && (
        <p
          role="status"
          className={cn(
            "pt-2 text-[11px]",
            status === "success" ? "text-accent" : "text-danger",
          )}
        >
          {message}
        </p>
      )}
    </>
  );
}
