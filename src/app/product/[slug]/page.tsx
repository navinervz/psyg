import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { StandingBadge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { StoreTag } from "@/components/deals/StoreTag";
import { BuyButton } from "@/components/deals/BuyButton";
import { TrackButton } from "@/components/deals/TrackButton";
import { FavoriteButton } from "@/components/deals/FavoriteButton";
import { RevealGrid } from "@/components/deals/RevealGrid";
import { PriceHistoryChart } from "@/components/product/PriceHistoryChart";
import { BuyVerdictCard } from "@/components/product/BuyVerdictCard";
import { AffiliateNotice } from "@/components/product/AffiliateNotice";
import { getCategory, getProduct, relatedProducts } from "@/lib/data";
import { analyzePrice } from "@/lib/analysis";
import {
  formatPrice,
  priceDelta,
  priceStanding,
  priceTrend,
  toFaDigits,
} from "@/lib/format";
import { cn } from "@/lib/cn";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * فهرست محصولات در زمان بیلد کاملاً مشخص است، پس هر slug دیگری
 * باید ۴۰۴ بدهد — نه اینکه on-demand رندر شود.
 *
 * بدون این خط، Next برای slugهای ناشناخته صفحه را در لحظه می‌سازد و
 * پاسخ ۲۰۰ برمی‌گرداند؛ یعنی گوگل بی‌نهایت آدرس بی‌محتوا ایندکس می‌کند.
 *
 * فاز ۲ که محصولات از دیتابیس می‌آیند: این را true کنید و به‌جایش
 * `revalidate` بگذارید.
 */
/**
 * صفحه‌ی محصول کاملاً پویا رندر می‌شود.
 *
 * تاریخچه‌ی این تصمیم مهم است، چون دو بار اشتباه شد:
 *
 * ۱. اول `dynamicParams` پیش‌فرض (`true`) بود بدون بررسی وجود محصول، و
 *    هر آدرس ناشناخته پاسخ ۲۰۰ می‌گرفت. گوگل می‌توانست بی‌نهایت صفحه‌ی
 *    بی‌محتوا ایندکس کند.
 *
 * ۲. بعد `false` شد و مشکل حل شد — تا وقتی کاتالوگ ثابت بود. با آمدن
 *    کاتالوگ زنده، `false` یعنی هر محصولی که n8n اضافه می‌کند تا بیلد
 *    بعدی ۴۰۴ می‌دهد، در حالی که کارت‌هایش در صفحه‌ی فرصت‌ها دیده می‌شود.
 *
 * ۳. تلاش سوم `true` + ISR بود با این فرض که `notFound()` کافی است. تست
 *    e2e ثابت کرد نیست: Next وضعیت ۲۰۰ را قبل از رسیدن به `notFound()`
 *    قطعی می‌کند و مشکل بند ۱ برمی‌گردد.
 *
 * `force-dynamic` هر سه را حل می‌کند: صفحه در زمان درخواست اجرا می‌شود،
 * محصول تازه بلافاصله در دسترس است، و `notFound()` واقعاً ۴۰۴ می‌دهد.
 *
 * هزینه‌اش نداشتن کش ایستا است. برای این مقیاس بی‌اهمیت است: رندر ارزان
 * است و خواندن کاتالوگ خودش یک دقیقه در حافظه کش می‌شود.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return { title: "محصول پیدا نشد" };

  const delta = priceDelta(product.previousPrice, product.currentPrice);
  /*
    توضیح متا فقط وقتی جهت را ادعا می‌کند که واقعاً بداند.
    برای محصول تازه، «افزایش» گفتن یعنی دروغ در همان چیزی که گوگل
    نشان می‌دهد.
  */
  const trendForMeta = priceTrend(delta);
  const direction = trendForMeta === "drop" ? "کاهش" : "افزایش";

  return {
    title: `قیمت ${product.title}`,
    description: `تاریخچه و نمودار قیمت ${product.title} — قیمت فعلی ${formatPrice(product.currentPrice)} تومان با ${direction} نسبت به هفته‌ی قبل. بهترین زمان خرید را با سای‌جی پیدا کن.`,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: "website",
      title: `قیمت ${product.title} | ${SITE_NAME}`,
      url: `${SITE_URL}/product/${product.slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const standing = priceStanding(product.history, product.currentPrice);
  const trend = standing.known
    ? "drop"
    : priceTrend(priceDelta(product.previousPrice, product.currentPrice));
  const verdict = analyzePrice(product);
  const related = relatedProducts(product, 6);
  const category = getCategory(product.category);

  // داده‌ی ساختاریافته برای نتایج غنی گوگل
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: `${SITE_URL}${product.image}`,
    brand: { "@type": "Brand", name: product.brand },
    category: category?.label,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.currentPrice,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/product/${product.slug}`,
    },
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* مسیر راهنما */}
      <nav aria-label="مسیر" className="flex flex-wrap items-center gap-1.5 pt-6 text-xs text-low">
        <Link href="/" className="transition-colors hover:text-accent">
          خانه
        </Link>
        <ChevronLeft className="size-3.5" />
        <Link href="/deals" className="transition-colors hover:text-accent">
          فرصت‌ها
        </Link>
        {category && (
          <>
            <ChevronLeft className="size-3.5" />
            <Link
              href={`/category/${category.id}`}
              className="transition-colors hover:text-accent"
            >
              {category.label}
            </Link>
          </>
        )}
        <ChevronLeft className="size-3.5" />
        <span className="text-mid">{product.title}</span>
      </nav>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ستون اصلی */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card glow className="p-4 sm:p-6">
            <div className="grid gap-6 sm:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
              <div className="grid place-items-center rounded-2xl bg-elevated/40 p-4 sm:p-6">
                <ProductThumb
                  src={product.image}
                  alt={product.title}
                  category={product.category}
                  className="h-44 w-full"
                  iconClassName="size-20"
                />
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-xl font-extrabold text-hi sm:text-2xl">
                    {product.title}
                  </h1>
                  <FavoriteButton
                    productId={product.id}
                    productTitle={product.title}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <StoreTag store={product.store} />
                  {category && (
                    <Link
                      href={`/category/${category.id}`}
                      className="rounded-lg bg-elevated px-2.5 py-1 text-[11px] text-mid transition-colors hover:text-accent"
                    >
                      {category.label}
                    </Link>
                  )}
                  <StandingBadge standing={standing} showLabel />
                </div>

                <div className="flex flex-wrap items-end gap-3">
                  {/*
                    قیمت خط‌خورده، بالاترین قیمتی است که خودمان ثبت
                    کرده‌ایم — نه قیمت دیروز و نه «قیمت مصرف‌کننده»‌ی
                    اعلامی فروشگاه.
                  */}
                  {standing.known && (
                    <span className="text-sm text-low line-through nums-fa">
                      {formatPrice(standing.high)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-2xl font-extrabold nums-fa sm:text-3xl",
                      trend === "drop" && "text-accent",
                      trend === "rise" && "text-danger",
                      trend === "unknown" && "text-hi",
                    )}
                  >
                    {formatPrice(product.currentPrice)}
                  </span>
                  <span className="pb-1 text-xs text-mid">تومان</span>
                </div>

                {/*
                  این جمله قبلاً دو اشکال داشت و هر دو در سایت زنده
                  دیده می‌شد.

                  یک: عدد ۷ دستی نوشته شده بود، در حالی که مبنای
                  مقایسه قیمت یکی دو روز پیش بود. دو: هیچ شرطی نداشت،
                  پس روی محصولی که اصلاً قیمت خط‌خورده نداشت هم چاپ
                  می‌شد — جمله‌ای درباره‌ی چیزی که وجود نداشت.

                  حالا هم شرط دارد و هم تاریخش از خود تاریخچه می‌آید.
                */}
                {standing.known && standing.daysAgo !== null && (
                  <p className="text-[11px] text-low nums-fa">
                    {standing.daysAgo === 0
                      ? "قیمت خط‌خورده مربوط به امروز است."
                      : `بالاترین قیمت ثبت‌شده، ${toFaDigits(standing.daysAgo)} روز پیش بود.`}
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <BuyButton
                    productId={product.id}
                    store={product.store}
                    size="lg"
                  />
                  <div className="w-12">
                    <TrackButton
                      productId={product.id}
                      productTitle={product.title}
                    />
                  </div>
                </div>

                <AffiliateNotice />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6">
            <h2 className="mb-5 text-lg font-extrabold text-hi">
              تاریخچه قیمت ۳۰ روز اخیر
            </h2>
            <PriceHistoryChart history={product.history} trend={trend} />
          </Card>
        </div>

        {/* سایدبار تحلیل */}
        <BuyVerdictCard verdict={verdict} />
      </div>

      {/* محصولات مرتبط */}
      <Card className="mt-2 p-6">
        <h2 className="mb-5 text-lg font-extrabold text-hi">
          {category ? `${category.label}‌های دیگر` : "فرصت‌های دیگر"}
        </h2>
        <RevealGrid items={related} />
      </Card>
    </PageShell>
  );
}
