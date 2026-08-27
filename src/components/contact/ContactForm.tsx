"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; message: string }
  | { kind: "error"; message: string };

/**
 * فرم تماس.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا کارت‌های اطلاعاتی سر جایشان ماندند
 * ─────────────────────────────────────────────────────────────────────
 * وسوسه این بود که با آمدن فرم، سه کارت بالای صفحه («ایمیل»، «همکاری
 * فروشگاه‌ها»، «گزارش قیمت اشتباه») برداشته شوند. ولی آن‌ها کار دیگری
 * می‌کنند: به کاربر می‌گویند *چه چیزی* بنویسد. فرم خالی بدون آن‌ها
 * یعنی کاربر جلوی یک کادر سفید بنشیند و نداند چه بگوید.
 *
 * نشانی ایمیل مستقیم هم می‌ماند — اگر روزی این فرم خراب شود، کاربر راه
 * دیگری دارد. فرم تنها راه ارتباط نیست، راه *ساده‌تر* است.
 */
export function ContactForm() {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  /*
    تله‌ی ربات — برای کاربر نامرئی است.

    با `sr-only` و `tabIndex={-1}` نه دیده می‌شود، نه با Tab بهش می‌رسی،
    نه صفحه‌خوان اعلامش می‌کند. ربات‌ها ولی همه‌ی ورودی‌ها را پر می‌کنند.
  */
  const [website, setWebsite] = useState("");

  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const sending = status.kind === "sending";
  const canSend = email.trim().length > 0 && message.trim().length >= 10;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !canSend) return;

    setStatus({ kind: "sending" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, message, website }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setStatus({
          kind: "error",
          message: data?.message ?? "ارسال نشد. کمی بعد دوباره تلاش کن.",
        });
        return;
      }

      setStatus({ kind: "done", message: data.message });
      /*
        فیلدها بعد از موفقیت خالی می‌شوند.

        بدون این، کاربر متن پیامش را روی صفحه می‌بیند و مطمئن نیست رفته
        یا نه — و معمولاً دوباره می‌فرستد.
      */
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus({
        kind: "error",
        message: "ارتباط برقرار نشد. اینترنتت رو چک کن.",
      });
    }
  }

  return (
    <Card as="section" className="p-5 sm:p-6">
      <h2 className="text-base font-extrabold text-hi">پیام مستقیم</h2>
      <p className="pt-1.5 text-xs leading-relaxed text-mid">
        ایمیلت رو بگذار و بنویس چه کاری داری. جواب به همین ایمیل می‌آید.
      </p>

      <form onSubmit={submit} className="flex flex-col gap-3 pt-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-mid">ایمیل</span>
          <Input
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            className="card-surface h-11 rounded-xl px-3.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-mid">
            موضوع <span className="font-normal text-low">(اختیاری)</span>
          </span>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="مثلاً: قیمت این محصول اشتباهه"
            maxLength={120}
            className="card-surface h-11 rounded-xl px-3.5 text-sm"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-mid">درخواست</span>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={2000}
            placeholder="هرچه لازم است بدانیم — اگر درباره‌ی محصولی است، لینکش را هم بگذار."
            className="card-surface min-h-32 resize-y rounded-xl px-3.5 py-3 text-sm text-hi outline-none placeholder:text-low focus-visible:border-accent/45"
          />
          {/*
            شمارنده فقط وقتی معنا دارد که کاربر به سقف نزدیک شده. نشان
            دادن دائمی‌اش، فرم را شبیه امتحان می‌کند.
          */}
          {message.length > 1700 && (
            <span className="self-start text-[11px] text-low nums-fa">
              {message.length} از ۲۰۰۰
            </span>
          )}
        </label>

        {/* تله‌ی ربات */}
        <label className="sr-only" aria-hidden="true">
          وب‌سایت
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={sending || !canSend}
          className={cn(
            "btn-accent mt-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-extrabold text-night",
            "transition-opacity disabled:cursor-not-allowed disabled:opacity-45",
          )}
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.4} />
          ) : (
            <Send className="size-4" strokeWidth={2.4} />
          )}
          {sending ? "در حال ارسال…" : "ارسال پیام"}
        </button>

        {/*
          `aria-live` لازم است وگرنه کاربر صفحه‌خوان هیچ‌وقت نتیجه را
          نمی‌شنود — دکمه را می‌زند و سکوت.
        */}
        <p
          aria-live="polite"
          className={cn(
            "min-h-5 text-xs leading-relaxed",
            status.kind === "error" && "text-danger",
            status.kind === "done" && "text-accent",
          )}
        >
          {status.kind === "done" || status.kind === "error" ? status.message : ""}
        </p>
      </form>
    </Card>
  );
}
