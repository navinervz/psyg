import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { PriceSparkline } from "@/components/deals/PriceSparkline";
import { formatPercent, formatPrice, priceStanding, toFaDigits } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * کارت افقی «بیشترین کاهش قیمت» — مخصوص موبایل، مطابق طرح.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا افقی و نه یک کارت دیگر در همان گرید
 * ─────────────────────────────────────────────────────────────────────
 * این بخش یک محصول را برجسته می‌کند، نه فهرستی را. کارت افقی تمام عرض
 * صفحه را می‌گیرد و بلافاصله از گرید دوستونی بالایش متمایز می‌شود —
 * یعنی چشم می‌فهمد این یکی جداست، بدون اینکه لازم باشد عنوانش را
 * بخواند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا هیچ‌وقت خالی رندر نمی‌شود
 * ─────────────────────────────────────────────────────────────────────
 * اگر هیچ محصولی افت واقعی نداشته باشد، این کامپوننت `null` برمی‌گرداند
 * و بخش اصلاً نمی‌آید. عنوانی که زیرش چیزی نیست، بدتر از نبودن بخش
 * است — کاربر فکر می‌کند صفحه خراب بارگذاری شده.
 */
export function MobileTopDrop({ products }: { products: Product[] }) {
  const best = products
    .map((product) => ({
      product,
      standing: priceStanding(product.history, product.currentPrice),
    }))
    .filter((entry) => entry.standing.known)
    .sort((a, b) => b.standing.belowHigh - a.standing.belowHigh)[0];

  if (!best) return null;

  const { product, standing } = best;

  return (
    <section dir="rtl" className="lg:hidden">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-base font-extrabold text-hi">بیشترین کاهش قیمت</h2>
        <Link
          href="/deals"
          className="text-[11px] font-semibold text-accent transition-opacity hover:opacity-75"
        >
          مشاهده همه
        </Link>
      </div>

      <Link
        href={`/product/${product.slug}`}
        className="card-surface neon-edge group flex items-center gap-3 p-3 transition-colors hover:border-accent/40"
      >
        <ProductThumb
          src={product.image}
          alt={product.title}
          category={product.category}
          className="size-16 shrink-0 rounded-xl bg-white/95 p-1"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="line-clamp-2 text-xs font-bold leading-relaxed text-hi transition-colors group-hover:text-accent">
            {product.title}
          </p>

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-extrabold text-accent nums-fa">
              {formatPrice(product.currentPrice)}
            </span>
            <span className="text-[10px] text-mid">تومان</span>
          </div>

          {/*
            سقف ثبت‌شده خط‌خورده، و کنارش درصد.

            هر دو با هم می‌آیند چون درصد به‌تنهایی مبهم است: «۱۱٪ کمتر
            از چه؟» — عددِ مبنا همان‌جا جواب می‌دهد.
          */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-low line-through nums-fa">
              {formatPrice(standing.high)}
            </span>
            <span className="text-[10px] font-bold text-accent nums-fa">
              {formatPercent(standing.belowHigh)} زیر سقف اخیر
            </span>
          </div>
        </div>

        {/*
          نمودار عرض ثابت دارد تا عنوان‌های بلند فشارش ندهند.

          نسخه‌ی اول اینجا `min-[380px]:block` داشت تا روی باریک‌ترین
          گوشی‌ها پنهان شود. اگر Tailwind آن نقطه‌ی شکست دلخواه را
          نمی‌ساخت، کلاس بی‌صدا حذف می‌شد و `hidden` می‌ماند — یعنی
          نمودار روی هیچ گوشی‌ای نمی‌آمد و هیچ خطایی هم نبود.

          عرض ثابت بدون شرط، همان کار را بدون آن ریسک می‌کند: در
          بدترین حالت (۳۲۰ پیکسل) حدود ۱۴۰ پیکسل برای عنوان می‌ماند
          که با `line-clamp-2` کافی است.
        */}
        <PriceSparkline
          history={product.history}
          trend="drop"
          className="w-14 shrink-0"
        />

        <ChevronLeft
          className="size-4 shrink-0 text-low transition-transform group-hover:-translate-x-0.5"
          strokeWidth={2}
        />
      </Link>

      {standing.daysAgo !== null && (
        <p className="mt-2 text-[10px] text-low nums-fa">
          بالاترین قیمت ثبت‌شده، {toFaDigits(standing.daysAgo)} روز پیش بود.
        </p>
      )}
    </section>
  );
}
