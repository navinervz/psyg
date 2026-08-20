"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, Send, ShoppingCart, X } from "lucide-react";
import { MagicOrb } from "@/components/chat/MagicOrb";
import { useUserData } from "@/store/useUserData";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { StoreId } from "@/lib/types";

/**
 * دستیار خرید سای‌جی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا پیشنهادها کارت‌اند و نه متن
 * ─────────────────────────────────────────────────────────────────────
 * مدل فقط `slug` انتخاب می‌کند؛ اسم، عکس و قیمت را سرور از کاتالوگ واقعی
 * پر می‌کند. یعنی هر چیزی که اینجا می‌بینید همان چیزی است که در صفحه‌ی
 * محصول هم هست. اگر می‌گذاشتیم مدل قیمت را داخل متن بنویسد، عدد اشتباه
 * دیر یا زود پیش می‌آمد و بین حرف دستیار و صفحه‌ی محصول اختلاف می‌افتاد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ریسپانسیو
 * ─────────────────────────────────────────────────────────────────────
 * روی موبایل شیت تمام‌صفحه (`inset-0`) و روی دسکتاپ پنل شناور گوشه.
 * ارتفاع با `dvh` گرفته می‌شود نه `vh` — چون نوار آدرس مرورگر موبایل
 * باز و بسته می‌شود و با `vh` فیلد ورودی زیر نوار گم می‌شد.
 */

type Pick = {
  why: string;
  id: string;
  slug: string;
  title: string;
  image: string;
  store: StoreId;
  currentPrice: number;
  previousPrice: number;
  delta: number;
  href: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  picks?: Pick[];
};

const OPENERS = [
  "یه گوشی خوب زیر ۲۰ میلیون می‌خوام",
  "بهترین تخفیف امروز چیه؟",
  "هدفون برای ورزش پیشنهاد بده",
];

/*
  متن خوش‌آمد نقش دستیار را از همان جمله‌ی اول روشن می‌کند.

  نسخه‌ی قبلی «من دستیار خرید سای‌جی‌ام» می‌گفت که مبهم بود — کاربر
  می‌توانست فکر کند پشتیبانی است. حالا صریح می‌گوید چه می‌پرسد و صریح
  می‌گوید چه کاری از او برنمی‌آید.
*/
const GREETING: Message = {
  role: "assistant",
  content:
    "سلام! مشاور خریدم. بگو دنبال چه محصولی هستی و چقدر می‌خواهی خرج کنی تا از بین چیزهایی که رصد می‌کنیم برایت انتخاب کنم. پیگیری سفارش و پشتیبانی از من برنمی‌آید — آن‌ها کار خود فروشگاه است.",
};

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [cart, setCart] = useState<Pick[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordPurchase = useUserData((s) => s.recordPurchase);

  // با هر پیام تازه به پایین می‌رود
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  // بستن با Escape — انتظار پایه‌ی هر دیالوگی
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          // فقط تاریخچه‌ی متنی می‌رود؛ کارت‌ها لازم نیستند
          history: next
            .slice(-7, -1)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: data?.message ?? "الان نتونستم جواب بدم. یه بار دیگه بفرست.",
          },
        ]);
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, picks: data.picks ?? [] },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "ارتباط برقرار نشد. اینترنتت رو چک کن." },
      ]);
    } finally {
      setPending(false);
      inputRef.current?.focus();
    }
  }

  function addToCart(pick: Pick) {
    setCart((c) => (c.some((x) => x.slug === pick.slug) ? c : [...c, pick]));
  }

  const cartTotal = cart.reduce((sum, p) => sum + p.currentPrice, 0);

  return (
    <>
      {/*
        دکمه‌ی شناور.

        سه لایه‌ی حرکت که هرکدام کار متفاوتی می‌کنند:

        `assistant-halo` — حلقه‌ای که کند از دکمه بیرون می‌زند. کارش فقط
        این است که کاربر بفهمد اینجا چیزی هست. با هاور می‌ایستد، چون از
        آن لحظه دیده شده و ادامه‌اش فقط حواس‌پرتی است.

        `group-hover` روی خود دکمه — بزرگ‌نمایی و چرخش کوچک ربات، تا لمس
        شدن حس زنده بدهد.

        `active:scale-90` — بازخورد فشردن. بدون آن، روی موبایل که هاور
        وجود ندارد، کاربر نمی‌فهمید کلیکش گرفته شده یا نه.
      */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="مشاور خرید سای‌جی — پیشنهاد محصول بگیر"
        className={cn(
          "assistant-fab group fixed bottom-5 end-5 z-50 flex items-center gap-2",
          "rounded-full transition-all duration-300 active:scale-95",
          open && "pointer-events-none scale-0 opacity-0",
        )}
      >
        {/*
          برچسب کنار گوی.

          بدون این، کاربر باید کلیک می‌کرد تا بفهمد این چیست — و چون شکل
          دکمه‌ی گرد گوشه‌ی صفحه در ذهن همه یعنی «پشتیبانی»، خیلی‌ها
          اصلاً کلیک نمی‌کردند.

          روی موبایل پنهان است چون عرض کم است و گوی خودش به‌اندازه‌ی
          کافی چشمگیر هست.
        */}
        <span
          className={cn(
            "hidden rounded-full border border-accent/30 bg-surface/90 px-3.5 py-2 sm:block",
            "text-xs font-bold text-hi shadow-lg backdrop-blur",
            "transition-all duration-300 group-hover:border-accent/60 group-hover:text-accent",
          )}
        >
          چی بخرم؟
        </span>

        <span className="relative grid size-14 shrink-0 place-items-center">
          <span
            aria-hidden
            className="assistant-halo pointer-events-none absolute inset-2 rounded-full bg-accent"
          />
          <MagicOrb className="relative size-14 transition-transform duration-500 group-hover:scale-110" />
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="دستیار خرید سای‌جی"
          dir="rtl"
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden border-line bg-surface",
            // موبایل: تمام‌صفحه
            "inset-0 border-0",
            // دسکتاپ: پنل گوشه‌ی پایین
            "sm:inset-auto sm:bottom-5 sm:end-5 sm:h-[min(640px,85dvh)] sm:w-[400px]",
            "sm:rounded-3xl sm:border sm:shadow-[0_0_60px_rgba(0,0,0,0.55)]",
          )}
        >
          {/* سربرگ */}
          <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <MagicOrb className="size-9 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-hi">مشاور خرید</p>
                {/*
                  این زیرنویس عمداً می‌گوید چه کاری می‌کند و چه کاری
                  نمی‌کند. کاربری که فکر کند اینجا پشتیبانی است و سؤال
                  پیگیری سفارش بپرسد، جواب بی‌ربط می‌گیرد و ناامید
                  می‌شود.
                */}
                <p className="truncate text-[11px] text-low">
                  بودجه‌ات را بگو تا محصول پیشنهاد بدهم
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="بستن دستیار"
              className="grid size-9 shrink-0 place-items-center rounded-full text-low transition-colors hover:bg-line hover:text-hi"
            >
              <X className="size-5" strokeWidth={2.2} />
            </button>
          </header>

          {/* گفتگو */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className="space-y-2.5">
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                    m.role === "user"
                      ? "ms-auto bg-accent/15 text-hi"
                      : "bg-night/60 text-mid",
                  )}
                >
                  {m.content}
                </div>

                {m.picks?.map((pick) => (
                  <PickCard
                    key={pick.slug}
                    pick={pick}
                    inCart={cart.some((x) => x.slug === pick.slug)}
                    onAdd={() => addToCart(pick)}
                  />
                ))}
              </div>
            ))}

            {pending && (
              <div className="flex w-fit gap-1.5 rounded-2xl bg-night/60 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-1.5 animate-bounce rounded-full bg-accent"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}

            {/* پیشنهادهای شروع گفتگو — فقط پیش از اولین پیام کاربر */}
            {messages.length === 1 && !pending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {OPENERS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => send(o)}
                    className="rounded-full border border-line px-3 py-1.5 text-[11px] text-mid transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* سبد */}
          {cart.length > 0 && <CartBar cart={cart} total={cartTotal} onGo={recordPurchase} />}

          {/* ورودی */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-line p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="دنبال چی می‌گردی؟"
              aria-label="پیام شما"
              maxLength={500}
              className={cn(
                "min-w-0 flex-1 rounded-xl border border-line bg-night px-3.5 py-2.5",
                // ۱۶ پیکسل تا سافاری موبایل موقع فوکوس صفحه را زوم نکند
                "text-[16px] text-hi outline-none placeholder:text-low sm:text-[13px]",
                "focus:border-accent/50",
              )}
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              aria-label="ارسال"
              className={cn(
                "btn-accent grid size-10 shrink-0 place-items-center rounded-xl text-night",
                "transition-opacity disabled:opacity-40",
              )}
            >
              <Send className="size-4.5 rotate-180" strokeWidth={2.2} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function PickCard({
  pick,
  inCart,
  onAdd,
}: {
  pick: Pick;
  inCart: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-night/40 p-2.5">
      {/* عکس اندازه‌ی ثابت دارد تا عنوان بلند جایش را تنگ نکند */}
      <Link
        href={pick.href}
        className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-night"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pick.image}
          alt={pick.title}
          loading="lazy"
          className="size-full object-contain p-1"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={pick.href}
          className="line-clamp-2 text-[12px] font-bold text-hi transition-colors hover:text-accent"
        >
          {pick.title}
        </Link>
        {pick.why && <p className="line-clamp-2 text-[11px] text-low">{pick.why}</p>}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-[13px] font-extrabold text-accent nums-fa">
            {formatPrice(pick.currentPrice)}
          </span>
          <button
            type="button"
            onClick={onAdd}
            disabled={inCart}
            className={cn(
              "shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors",
              inCart
                ? "bg-line text-low"
                : "bg-accent/15 text-accent hover:bg-accent/25",
            )}
          >
            {inCart ? "در سبد" : "افزودن"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * سبد پیشنهادی.
 *
 * سای‌جی فروشگاه نیست و پرداختی اینجا انجام نمی‌شود. «تکمیل خرید» کاربر را
 * به همان فروشگاه‌ها می‌فرستد. این را صریح می‌نویسیم چون کاربری که فکر کند
 * اینجا پول می‌دهد و بعد به دیجی‌کالا پرتاب شود، اعتمادش را از دست می‌دهد.
 */
function CartBar({
  cart,
  total,
  onGo,
}: {
  cart: Pick[];
  total: number;
  onGo: (slug: string) => void;
}) {
  return (
    <div className="shrink-0 border-t border-line bg-night/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-low">
          <ShoppingCart className="size-3.5" strokeWidth={2.2} />
          {cart.length} کالا در سبد
        </span>
        <span className="text-[13px] font-extrabold text-hi nums-fa">
          {formatPrice(total)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {cart.map((p) => (
          <a
            key={p.slug}
            href={`/go/${p.id}`}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={() => onGo(p.id)}
            className={cn(
              "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl",
              "btn-accent px-3 py-2 text-[11px] font-bold text-night",
              "transition-colors hover:bg-accent-dim active:scale-[0.98]",
            )}
          >
            <span className="truncate">تکمیل خرید</span>
            <ExternalLink className="size-3 shrink-0 opacity-70" strokeWidth={2.2} />
          </a>
        ))}
      </div>

      <p className="pt-1.5 text-center text-[10px] text-low">
        خرید در فروشگاه اصلی انجام می‌شود؛ سای‌جی فقط قیمت‌ها را رصد می‌کند
      </p>
    </div>
  );
}
