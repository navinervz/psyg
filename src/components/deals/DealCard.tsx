"use client";

import { useRef } from "react";
import Link from "next/link";
import { RankBadge, StandingBadge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { PriceBlock } from "@/components/deals/PriceBlock";
import { PriceSparkline } from "@/components/deals/PriceSparkline";
import { StoreTag } from "@/components/deals/StoreTag";
import { TrackButton } from "@/components/deals/TrackButton";
import { FavoriteButton } from "@/components/deals/FavoriteButton";
import { BuyButton } from "@/components/deals/BuyButton";
import { formatRank, priceDelta, priceStanding, priceTrend } from "@/lib/format";
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

  /*
    معیار کارت «چقدر زیر سقف اخیر» است، نه «چقدر نسبت به دیروز».

    تغییر روزانه تقریباً همیشه صفر بود، پس هر ۸۰ محصول برچسب «تازه»
    می‌گرفتند و صفحه‌ی فرصت‌ها هیچ فرصتی نشان نمی‌داد — در حالی که
    صفحه‌ی همان محصول می‌گفت «نزدیک کف بازه». توضیح کامل در
    `priceStanding`.
  */
  const standing = priceStanding(product.history, product.currentPrice);

  /*
    سه‌حالته، نه دوحالته.

    قبلاً `isDrop = delta < 0` بود، یعنی محصولی که تازه اضافه شده و
    تغییرش صفر است در دسته‌ی «گران شده» می‌افتاد: قیمت قرمز، حاشیه‌ی
    قرمز، نمودار قرمز.

    حالا رنگ سبز از `standing` می‌آید، ولی قرمز همچنان از تغییر روزانه:
    اگر قیمت امروز واقعاً بالا رفته، پنهان کردنش هم به همان اندازه
    نادرست است.
  */
  const trend = standing.known
    ? "drop"
    : priceTrend(priceDelta(product.previousPrice, product.currentPrice));

  /*
    ══════════════════════════════════════════════════════════════════
    اینجا قبلاً یک تیلت سه‌بعدی با pointermove بود — برداشته شد
    ══════════════════════════════════════════════════════════════════
    کارت با حرکت موس تا ۹ درجه در دو محور می‌چرخید و ۴ پیکسل بالا
    می‌آمد. حالا نوار نئون همان کار را می‌کند: می‌گوید موس کجاست.

    دو افکت برای یک پیام، یعنی هیچ‌کدام تمیز دیده نمی‌شوند. چرخش سه‌بعدی
    عنوان و قیمت را هم کج می‌کرد و خواندنشان را سخت‌تر — و در گرید شش
    ستونه که کارت‌ها به هم نزدیک‌اند، شبکه موج‌دار به‌نظر می‌رسید.

    نکته‌ی مهم برای آینده: این تیلت با `useGSAP` روی خود کارت اجرا
    می‌شد، نه با CSS. دور اول دنبالش در فایل CSS گشتم و `preserve-3d`
    را متهم کردم — که واقعاً هم بی‌مصرف بود ولی علت نبود. افکتی که در
    جاوااسکریپت زندگی می‌کند، در جستجوی CSS پیدا نمی‌شود.
  */

  // تیلت برداشته شد؛ بازخورد هاور فقط از نوار نئون می‌آید

  return (
    <article
      ref={scope}
      dir="rtl"
      data-testid="deal-card"
      data-product-slug={product.slug}
      className={cn(
        "deal-card will-reveal group relative flex flex-col gap-3 rounded-[20px] border bg-surface p-4",
        /*
          ─────────────────────────────────────────────────────────────
          چرا preserve-3d برداشته شد
          ─────────────────────────────────────────────────────────────
          گرید والد `perspective: 1100px` دارد و انیمیشن ورود کارت را با
          `rotateX` می‌چرخاند. `preserve-3d` روی خود کارت یعنی فرزندانش
          هم در همان فضای سه‌بعدی رندر شوند.

          تا وقتی کارت هیچ فرزند لایه‌داری نداشت، این بی‌اثر بود. با
          آمدن `neon-edge` دو شبه‌عنصر اضافه شد و کارت زیر موس در فضای
          سه‌بعدی والد کج و کشیده می‌شد — بیشتر برای کارت‌های دور از
          مرکز گرید، چون مبدأ پرسپکتیو وسط است.

          کارت برای چرخش خودش به `preserve-3d` نیازی ندارد؛ آن فقط برای
          سه‌بعدی کردن *فرزندان* است و ما چنین چیزی نمی‌خواهیم.

          `isolate` جایش می‌نشیند: بافت لایه‌بندی می‌سازد تا نوار نئون
          داخل کارت بماند، ولی هیچ فضای سه‌بعدی‌ای نمی‌سازد.
        */
        "transition-[border-color] duration-300 isolate",
        /*
          ─────────────────────────────────────────────────────────────
          چرا هاله‌ی جعبه‌ای برداشته شد
          ─────────────────────────────────────────────────────────────
          قبلاً هر حالت یک `hover:shadow-[0_0_44px_...]` داشت. حالا
          `neon-edge` همان کار را بهتر می‌کند و اگر هر دو با هم بمانند،
          دو نور با شدت و رنگ متفاوت روی یک لبه می‌افتند و کثیف می‌شود.

          حاشیه می‌ماند چون رنگش معنا دارد: قرمز یعنی قیمت بالا رفته.
        */
        trend === "drop" && "border-line hover:border-accent/45",
        trend === "rise" && "border-danger/25 hover:border-danger/50",
        trend === "unknown" && "border-line hover:border-mid/40",
        /*
          نوار نئونی فقط روی کارت‌هایی که قیمتشان بالا نرفته.

          روی کارت «گران‌تر شده» یک قاب سبزِ چرخان، پیام را وارونه
          می‌کند: چشم سبز را «فرصت» می‌خواند در حالی که کارت دارد هشدار
          می‌دهد.
        */
        trend !== "rise" && "neon-edge",
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
        <StandingBadge standing={standing} />
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
        {/*
          قیمت خط‌خورده، سقف ثبت‌شده‌ی خودمان است نه قیمت دیروز.

          قیمت دیروز معمولاً با امروز برابر بود، پس چیزی خط نمی‌خورد و
          کارت هیچ نشانی از افت نمی‌داد. وقتی افتی نداریم، همچنان
          `currentPrice` پاس داده می‌شود تا `PriceBlock` چیزی نشان ندهد.
        */}
        <PriceBlock
          previousPrice={standing.known ? standing.high : product.currentPrice}
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
