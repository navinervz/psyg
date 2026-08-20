import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Clock } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { ArticleBody } from "@/components/mag/ArticleBody";
import { ArticleCta } from "@/components/mag/ArticleCta";
import { articles, products } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * رندر در زمان درخواست.
 *
 * ⚠️ قبلاً `dynamicParams = false` بود به‌همراه `generateStaticParams()`.
 * وقتی مقاله‌ها فقط از `src/data/articles.json` می‌آمدند این درست بود —
 * فهرستشان در زمان بیلد معلوم بود و قفل کردنش هزینه‌ای نداشت.
 *
 * ولی حالا ورک‌فلوی محتوا مقاله‌ی تازه می‌نویسد و آن فهرست دیگر کامل
 * نیست. با تنظیم قبلی، هر مقاله‌ی تولیدشده ۴۰۴ می‌گرفت تا بیلد بعدی —
 * یعنی کل زحمت تولید خودکار محتوا بی‌صدا هدر می‌رفت و هیچ خطایی هم
 * جایی ثبت نمی‌شد.
 *
 * همان الگوی صفحه‌ی محصول: پویا رندر شود و `notFound()` کار ۴۰۴ را
 * بکند.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) return { title: "مطلب پیدا نشد" };

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/mag/${article.slug}` },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles.find((a) => a.slug === slug);
  if (!article) notFound();

  const others = articles.filter((a) => a.slug !== article.slug).slice(0, 3);

  /*
    محصولات مقاله از کاتالوگ زنده خوانده می‌شوند، نه از خود مقاله.

    مقاله فقط `slug` را نگه می‌دارد. اگر محصولی از سایت برداشته شده باشد
    (چه با پنهان کردن در پنل ادمین، چه با ناموجود شدن در افیلیو) اینجا
    ساکت کنار می‌رود — به‌جای اینکه لینکی به صفحه‌ی ۴۰۴ بماند.
  */
  const ctaProducts = (article.productSlugs ?? [])
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // داده ساختاریافته‌ی مقاله برای گوگل
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    inLanguage: "fa-IR",
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/mag/${article.slug}`,
  };

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="مسیر" className="flex items-center gap-1.5 pt-6 text-xs text-low">
        <Link href="/" className="transition-colors hover:text-accent">
          خانه
        </Link>
        <ChevronLeft className="size-3.5" />
        <Link href="/mag" className="transition-colors hover:text-accent">
          مجله
        </Link>
      </nav>

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
            {article.tag}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-low nums-fa">
            <Clock className="size-3" strokeWidth={1.8} />
            {toFaDigits(article.readMinutes)} دقیقه مطالعه
          </span>
          <span className="text-[11px] text-low nums-fa">
            {toFaDigits(article.date)}
          </span>
        </div>

        {/*
          عنوان مقاله‌های تولیدشده بلند است. با ۳xl روی موبایل، تیتر
          چهار خط می‌شد و کل صفحه‌ی اول را می‌گرفت.
        */}
        <h1 className="text-2xl leading-[1.45] font-extrabold text-hi sm:text-3xl sm:leading-[1.5]">
          {article.title}
        </h1>

        <p className="border-s-2 border-accent/40 ps-4 text-base leading-loose text-hi">
          {article.excerpt}
        </p>

        <ArticleBody blocks={article.body} />

        <ArticleCta products={ctaProducts} />

        {/* مطالب دیگر — هم برای کاربر، هم لینک داخلی برای خزنده */}
        {others.length > 0 && (
          <section className="mt-6 border-t border-line pt-6">
            <h2 className="mb-4 text-base font-extrabold text-hi">
              مطالب دیگر
            </h2>
            <ul className="flex flex-col gap-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`/mag/${other.slug}`}
                    className="group flex items-start gap-3 text-sm text-mid transition-colors hover:text-accent"
                  >
                    <ChevronLeft className="mt-1 size-4 shrink-0 transition-transform group-hover:-translate-x-1" />
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/mag"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent"
        >
          <ChevronLeft className="size-3.5 rotate-180" />
          برگشت به مجله
        </Link>
      </article>
    </PageShell>
  );
}
