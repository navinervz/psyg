"use client";

import { useCallback, useRef, useState } from "react";
import type { CategoryId, StoreId } from "@/lib/types";

/**
 * منطق گفتگوی مشاور خرید.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا از کامپوننت جدا شد
 * ─────────────────────────────────────────────────────────────────────
 * این منطق قبلاً داخل `Assistant` بود — همان دکمه‌ی شناور گوشه‌ی صفحه.
 * وقتی تصمیم گرفتیم گفتگو داخل خود فیلد جستجو اتفاق بیفتد، دو راه بود:
 * کپی کردن منطق در سرچ‌بار، یا بیرون کشیدنش.
 *
 * کپی کردن یعنی دو نسخه که با هم فرق می‌کنند و کسی نمی‌فهمد کدام درست
 * است. این همان الگویی است که در `priceTrend` و `priceStanding` هم به
 * آن رسیدیم: منطق مشترک یک جا، و رابط کاربری هرچقدر خواست جدا.
 */

export type Pick = {
  why: string;
  id: string;
  slug: string;
  title: string;
  image: string;
  category: CategoryId;
  store: StoreId;
  currentPrice: number;
  previousPrice: number;
  delta: number;
  href: string;
};

export type Message = {
  role: "user" | "assistant";
  content: string;
  picks?: Pick[];
};

/*
  متن خوش‌آمد نقش دستیار را از همان جمله‌ی اول روشن می‌کند.

  نسخه‌ی قبلی «من دستیار خرید سای‌جی‌ام» می‌گفت که مبهم بود — کاربر
  می‌توانست فکر کند پشتیبانی است. حالا صریح می‌گوید چه می‌پرسد و صریح
  می‌گوید چه کاری از او برنمی‌آید.
*/
export const GREETING: Message = {
  role: "assistant",
  content:
    "بگو دنبال چی هستی و چقدر می‌خوای خرج کنی. چند تا سؤال می‌پرسم تا دقیق بفهمم چی می‌خوای، بعد از بین چیزهایی که رصد می‌کنیم انتخاب می‌کنم. پیگیری سفارش و پشتیبانی کار خود فروشگاهه.",
};

/** چند پیام آخر که به مدل فرستاده می‌شود */
const HISTORY_DEPTH = 8;

export function useAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [pending, setPending] = useState(false);

  /*
    `messages` در ref هم نگه داشته می‌شود.

    بدون آن، اگر کاربر دو پیام پشت سر هم بفرستد، دومی تاریخچه‌ای را
    می‌بیند که هنوز state‌اش به‌روز نشده — و مدل نیمی از گفتگو را از
    دست می‌دهد. برای دستیاری که کارش «پیوسته پرسیدن تا رسیدن به نیاز
    دقیق» است، این یعنی همان کار اصلی‌اش شکسته باشد.
  */
  const latest = useRef<Message[]>([GREETING]);

  const push = useCallback((message: Message) => {
    setMessages((prev) => {
      const next = [...prev, message];
      latest.current = next;
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      push({ role: "user", content: trimmed });
      setPending(true);

      /*
        تاریخچه از `latest` خوانده می‌شود نه از `messages`، به همان
        دلیل بالا. پیام تازه‌ی کاربر جداگانه در `message` می‌رود، پس
        از انتهای تاریخچه حذفش می‌کنیم.
      */
      const history = [...latest.current, { role: "user" as const, content: trimmed }]
        .slice(-HISTORY_DEPTH)
        .map((m) => ({ role: m.role, content: m.content }));

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history: history.slice(0, -1) }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          push({
            role: "assistant",
            content: data?.message ?? "الان نتونستم جواب بدم. یه بار دیگه بفرست.",
          });
          return;
        }

        push({ role: "assistant", content: data.reply, picks: data.picks ?? [] });
      } catch {
        push({
          role: "assistant",
          content: "ارتباط برقرار نشد. اینترنتت رو چک کن.",
        });
      } finally {
        setPending(false);
      }
    },
    [pending, push],
  );

  const reset = useCallback(() => {
    latest.current = [GREETING];
    setMessages([GREETING]);
  }, []);

  return { messages, pending, send, reset };
}
