"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChangeBadge, RankBadge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { PriceSparkline } from "@/components/deals/PriceSparkline";
import { StoreTag } from "@/components/deals/StoreTag";
import { TrackButton } from "@/components/deals/TrackButton";
import { FavoriteButton } from "@/components/deals/FavoriteButton";
import { BuyButton } from "@/components/deals/BuyButton";
import { gsap, useGSAP, prefersReducedMotion } from "@/animations/gsap";
import { formatRank, priceDelta, priceTrend } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

export function DealCard({
  product,
  index,
  showRank = true,
}: {
  product: Product;
  index: number;
  showRank?: boolean;
}) {
  const scope = useRef<HTMLElement>(null);
  const delta = priceDelta(product.previousPrice, product.currentPrice);

  /*
    سه‌حالته، نه دوحالته.

    قبلاً `isDrop = delta < 0` بود، یعنی محصولی که تازه اضافه شده و
    تغییرش صفر است در دسته‌ی «گران شده» می‌افتاد: قیمت قرمز، حاشیه‌ی
    قرمز، نمودار قرمز.

    در صفحه‌ی فرصت‌ها این یعنی پنج کارت از شش تا قرمز بودند بدون اینکه
    قیمت هیچ‌کدام بالا رفته باشد. هم اطلاعات غلطی می‌داد هم صفحه را
    ترسناک می‌کرد.
  */
  const trend = priceTrend(delta);

  // تیلت سه‌بعدی در هاور
  useGSAP(
    () => {
      const el = scope.current;
      if (!el || prefersReducedMotion()) return;

      /*
        تیلت سه‌بعدی فقط با موس.

        `pointermove` روی گوشی هم شلیک می‌شود — یعنی موقع اسکرول، انگشت
        از روی کارت رد می‌شد و کارت می‌چرخید. کاربر فکر می‌کند صفحه خراب
        است، در حالی که «افکت هاور» روی دستگاهی اجرا می‌شد که اصلاً هاور
        ندارد.
      */
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const rotX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3" });
      const rotY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3" });

      /*
        بلند شدن کارت هنگام هاور.

        تیلت به‌تنهایی کارت را می‌چرخاند ولی حس «برداشته شدن از صفحه»
        نمی‌داد. چهار پیکسل بالا آمدن همان چیزی است که مغز به‌عنوان
        نزدیک‌تر شدن می‌خواند و کل افکت را از چرخش تخت به عمق واقعی
        تبدیل می‌کند.

        `quickTo` استفاده شده نه `gsap.to` چون در صفحه‌ی فرصت‌ها ده‌ها
        کارت هم‌زمان هاورپذیرند؛ ساختن توییِن تازه به‌ازای هر رویداد،
        زباله‌ی حافظه تولید می‌کند.

        فقط `y` انیمیت می‌شود که روی ترد کامپوزیتور می‌ماند — نه
        `width` یا `margin` که باعث چیدمان دوباره‌ی کل صفحه می‌شوند.
      */
      const lift = gsap.quickTo(el, "y", { duration: 0.25, ease: "power2.out" });

      const onMove = (e: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotY(px * 9);
        rotX(-py * 9);
      };

      const onEnter = () => lift(-4);

      /*
        بازگشت روی `pointerleave` حیاتی است.

        اگر ماوس سریع از کارت بیرون برود و توییِن معکوس نباشد، کارت
        بالا و کج گیر می‌کند — و چون کارت بعدی هم همین را دارد، شبکه
        به‌هم‌ریخته به‌نظر می‌رسد.
      */
      const onLeave = () => {
        rotX(0);
        rotY(0);
        lift(0);
      };

      el.addEventListener("pointerenter", onEnter);
      el.addEventListener("pointermove", onMove);
      el.addEventListener("pointerleave", onLeave);

      return () => {
        el.removeEventListener("pointerenter", onEnter);
        el.removeEventListener("pointermove", onMove);
        el.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope },
  );

  return (
    <article
      ref={scope}
      dir="rtl"
      data-testid="deal-card"
      data-product-slug={product.slug}
      className={cn(
        "deal-card will-reveal group relative flex flex-col gap-3 rounded-[20px] border bg-surface p-4",
        "transition-[border-color,box-shadow] duration-300 [transform-style:preserve-3d]",
        /*
          حالت «unknown» عمداً همان حاشیه‌ی خنثای بقیه‌ی سایت را دارد.

          قرمز فقط وقتی معنا دارد که قیمت واقعاً بالا رفته باشد. اگر
          نمی‌دانیم، هیچ ادعایی نمی‌کنیم — و صفحه هم آرام می‌ماند.
        */
        trend === "drop" &&
          "border-line hover:border-accent/45 hover:shadow-[0_0_44px_rgba(163,230,53,0.18)]",
        trend === "rise" &&
          "border-danger/25 hover:border-danger/50 hover:shadow-[0_0_44px_rgba(255,77,77,0.16)]",
        trend === "unknown" &&
          "border-line hover:border-mid/40 hover:shadow-[0_0_44px_rgba(255,255,255,0.06)]",
      )}
    >
      {/* ردیف بالا: مطابق دیزاین رنک چپ و درصد تغییر راست */}
      <div className="flex flex-row-reverse items-center justify-between">
        {showRank ? (
          <RankBadge rank={formatRank(index)} />
        ) : (
          <FavoriteButton
            productId={product.id}
            productTitle={product.title}
            className="-ms-1.5"
          />
        )}
        <ChangeBadge delta={delta} />
      </div>

      {/* تصویر */}
      <Link
        href={`/product/${product.slug}`}
        className="deal-card__thumb-box grid place-items-center transition-transform duration-500 group-hover:scale-105"
      >
        <ProductThumb
          src={product.image}
          alt={product.title}
          category={product.category}
          className="h-full w-full"
        />
      </Link>

      {/*
        `mt-1` فاصله‌ی تضمین‌شده با تصویر.

        `gap-3` کارت به‌تنهایی کافی نبود چون تصویر با `object-contain`
        ممکن است تا لبه‌ی پایینی جعبه‌اش پر شود و متن بلافاصله بچسبد.
      */}
      <div className="mt-1 flex min-w-0 flex-col items-center gap-1.5 text-center">
        <Link
          href={`/product/${product.slug}`}
          className="deal-card__title line-clamp-2 font-bold text-hi transition-colors hover:text-accent"
        >
          {product.title}
        </Link>
        <StoreTag store={product.store} />
      </div>

      {/* قیمت */}
      <div className="mt-auto flex min-w-0 justify-center text-center">
        <PriceBlock
          previousPrice={product.previousPrice}
          currentPrice={product.currentPrice}
          trend={trend}
        />
      </div>

      {/* نمودار */}
      <PriceSparkline
        history={product.history}
        trend={trend}
        className="deal-card__spark w-full"
      />

      {/* خرید (اصلی) + پیگیری قیمت (ثانویه) */}
      <div className="deal-card__actions flex gap-2">
        <BuyButton productId={product.id} store={product.store} />
        <div className="deal-card__track shrink-0">
          <TrackButton productId={product.id} productTitle={product.title} />
        </div>
      </div>
    </article>
  );
}
