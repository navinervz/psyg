"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { useUserData } from "@/store/useUserData";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Message, Pick } from "@/components/chat/useAssistantChat";

/**
 * بدنه‌ی گفتگوی مشاور خرید — بدون فیلد ورودی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا ورودی اینجا نیست
 * ─────────────────────────────────────────────────────────────────────
 * ورودی همان فیلد جستجوی بالای صفحه است. دستیار قبلاً یک پنل شناور با
 * فیلد مستقل خودش بود، یعنی صفحه دو جای شبیه به هم برای تایپ داشت و
 * کاربر باید حدس می‌زد کدام چه می‌کند.
 *
 * یک ورودی، دو حالت: تایپ کن تا محصول پیدا شود، یا بپرس تا مشاور جواب
 * بدهد. این کامپوننت فقط جوابِ حالت دوم را نشان می‌دهد.
 */
export function ChatPanel({
  messages,
  pending,
}: {
  messages: Message[];
  pending: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cart, setCart] = useState<Pick[]>([]);

  // با هر پیام تازه به پایین می‌رود
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  const total = cart.reduce((sum, p) => sum + p.currentPrice, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3"
      >
        {messages.map((message, i) => (
          <div key={i} className="space-y-2">
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12.5px] leading-relaxed",
                message.role === "user"
                  ? "ms-auto bg-accent/15 text-hi"
                  : "bg-elevated/70 text-mid",
              )}
            >
              {message.content}
            </div>

            {message.picks && message.picks.length > 0 && (
              <div className="space-y-2">
                {message.picks.map((pick) => (
                  <PickCard
                    key={pick.slug}
                    pick={pick}
                    inCart={cart.some((c) => c.slug === pick.slug)}
                    onAdd={() =>
                      setCart((c) =>
                        c.some((x) => x.slug === pick.slug) ? c : [...c, pick],
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        ))}

        {pending && (
          /*
            سه نقطه‌ی متحرک، نه متن «در حال نوشتن».

            مدل گاهی چند ثانیه طول می‌کشد و بدون هیچ نشانه‌ای کاربر فکر
            می‌کند پیامش نرفته و دوباره می‌فرستد.
          */
          <div className="flex w-fit gap-1 rounded-2xl bg-elevated/70 px-3.5 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 animate-bounce rounded-full bg-accent/70"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {cart.length > 0 && <CartBar cart={cart} total={total} />}
    </div>
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
        <ProductThumb
          src={pick.image}
          alt={pick.title}
          category={pick.category}
          className="size-full"
          iconClassName="size-7"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={pick.href}
          className="line-clamp-2 text-[12px] font-bold text-hi transition-colors hover:text-accent"
        >
          {pick.title}
        </Link>
        {pick.why && (
          <p className="line-clamp-2 text-[11px] text-low">{pick.why}</p>
        )}

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
 * سای‌جی فروشگاه نیست و پرداختی اینجا انجام نمی‌شود. «تکمیل خرید» کاربر
 * را به همان فروشگاه‌ها می‌فرستد. این را صریح می‌نویسیم چون کاربری که فکر
 * کند اینجا پول می‌دهد و بعد به فروشگاه پرتاب شود، اعتمادش را از دست
 * می‌دهد.
 */
function CartBar({ cart, total }: { cart: Pick[]; total: number }) {
  const recordPurchase = useUserData((s) => s.recordPurchase);

  return (
    <div className="shrink-0 border-t border-line bg-night/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-low">
          <ShoppingCart className="size-3.5" strokeWidth={2.2} />
          {cart.length} مورد انتخابی
        </span>
        <span className="text-[12px] font-extrabold text-accent nums-fa">
          {formatPrice(total)}
        </span>
      </div>

      <p className="pb-2 text-[10px] leading-relaxed text-low">
        خرید در خود فروشگاه انجام می‌شود؛ اینجا فقط انتخاب می‌کنی.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {cart.map((pick) => (
          <a
            key={pick.slug}
            href={`/go/${pick.id}`}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            onClick={() => recordPurchase(pick.id)}
            className="btn-accent inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-night"
          >
            <ExternalLink className="size-3" strokeWidth={2.4} />
            {pick.title.slice(0, 18)}
          </a>
        ))}
      </div>
    </div>
  );
}
