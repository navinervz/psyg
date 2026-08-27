"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { BuyButton } from "@/components/deals/BuyButton";
import { ChangeBadge } from "@/components/ui/Badge";
import { formatPrice, priceDelta } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

/**
 * اسلایدر «تازه‌ رسیده‌ها» در سایدبار.
 *
 * ─────────────────────────────────────────────────────────────────────
 * جای چه چیزی را گرفت و چرا
 * ─────────────────────────────────────────────────────────────────────
 * اینجا قبلاً کارت «سطح کاربر» بود: امتیاز، نوار پیشرفت و عنوان
 * «تازه‌وارد». مشکلش این بود که امتیاز از تعداد علاقه‌مندی‌ها می‌آمد و
 * برای کسی که تازه وارد سایت شده همیشه صفر بود — یعنی گران‌ترین جای
 * صفحه به یک نوار خالی می‌رفت که هیچ کاری برای کاربر نمی‌کرد.
 *
 * محصولات تازه هم به کاربر چیزی می‌دهد و هم دلیلی برای برگشتن.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا چرخش خودکار متوقف‌شدنی است
 * ─────────────────────────────────────────────────────────────────────
 * اسلایدری که موقع خواندن جابه‌جا شود آزاردهنده است. با هاور، فوکوس
 * صفحه‌کلید، یا اولین کلیک کاربر روی فلش‌ها، چرخش برای همیشه می‌ایستد —
 * چون از آن لحظه کاربر خودش دارد هدایت می‌کند.
 */

const ROTATE_MS = 5000;

export function NewArrivalsCard({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const takenOver = useRef(false);

  const count = products.length;

  useEffect(() => {
    if (count < 2 || paused || takenOver.current) return;

    /*
      `prefers-reduced-motion` اینجا هم رعایت می‌شود. برای کسی که حرکت
      خودکار برایش مشکل‌ساز است، اسلایدر روی مورد اول می‌ماند و با
      فلش‌ها قابل کنترل است.
    */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(
      () => setIndex((i) => (i + 1) % count),
      ROTATE_MS,
    );
    return () => clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;

  function go(next: number) {
    takenOver.current = true;
    setIndex(((next % count) + count) % count);
  }

  const product = products[index];
  const delta = priceDelta(product.previousPrice, product.currentPrice);

  return (
    <Card
      neon
      className="p-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-center justify-between pb-3">
        <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-hi">
          <Sparkles className="size-4 text-accent" strokeWidth={2.2} />
          تازه رسیده‌ها
        </h2>

        {count > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="محصول قبلی"
              className="grid size-7 place-items-center rounded-lg text-low transition-colors hover:bg-elevated hover:text-hi"
            >
              <ChevronRight className="size-4" strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="محصول بعدی"
              className="grid size-7 place-items-center rounded-lg text-low transition-colors hover:bg-elevated hover:text-hi"
            >
              <ChevronLeft className="size-4" strokeWidth={2.2} />
            </button>
          </div>
        )}
      </div>

      {/*
        `key` روی شناسه‌ی محصول است تا React موقع تعویض، گره را از نو
        بسازد و انیمیشن محو-ورود دوباره اجرا شود. بدون آن، متن‌ها بدون
        هیچ گذاری عوض می‌شدند و جابه‌جایی ناگهانی به‌نظر می‌رسید.
      */}
      <div key={product.id} className="animate-[fadeIn_320ms_ease-out]">
        <Link
          href={`/product/${product.slug}`}
          className="group flex gap-3"
          aria-live="polite"
        >
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-night">
            <ProductThumb
              src={product.image}
              alt={product.title}
              category={product.category}
              className="size-full p-1 transition-transform duration-500 group-hover:scale-110"
            />
          </span>

          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2 text-xs font-bold text-hi transition-colors group-hover:text-accent">
              {product.title}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-accent nums-fa">
                {formatPrice(product.currentPrice)}
              </span>
              {delta !== 0 && <ChangeBadge delta={delta} />}
            </span>
          </span>
        </Link>

        <div className="pt-3">
          <BuyButton productId={product.id} store={product.store} />
        </div>
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5 pt-3">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`محصول ${i + 1} از ${count}`}
              aria-current={i === index}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-5 bg-accent" : "w-1.5 bg-line hover:bg-mid",
              )}
            />
          ))}
        </div>
      )}

      <Link
        href="/deals"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[11px] font-bold text-mid transition-colors hover:border-accent/45 hover:text-accent"
      >
        دیدن همه‌ی فرصت‌های امروز
        <ArrowLeft className="size-3.5" strokeWidth={2.4} />
      </Link>
    </Card>
  );
}
