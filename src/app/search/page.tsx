import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { DealGrid } from "@/components/deals/DealGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { categories, searchProducts } from "@/lib/data";
import { toFaDigits } from "@/lib/format";

/**
 * پویا بودن صریح اعلام می‌شود، نه استنتاج.
 *
 * این مسیر به‌خاطر `searchParams` یا پارامتر مسیر، عملاً پویا بود و
 * Next خودش تشخیص می‌داد. ولی همان اتکای ضمنی جای دیگر باگ ساخت:
 * صفحه‌ی اصلی چون هیچ نشانه‌ی پویایی نداشت، در زمان بیلد پیش‌رندر شد و
 * ماه‌ها می‌توانست محصولات نمونه را به‌جای واقعی نشان دهد.
 *
 * وقتی صفحه‌ای داده‌ی زنده می‌خواند، این تضمین باید نوشته شود نه حدس
 * زده — تا یک تغییر بی‌ربط در آینده نتواند بی‌صدا برش گرداند.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "جستجو",
  // صفحه‌ی نتایج جستجو نباید ایندکس شود — محتوای تکراری تولید می‌کند
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = searchProducts(query);

  return (
    <PageShell>
      <PageTitle
        title={query ? `نتایج «${query}»` : "جستجو"}
        subtitle={
          query
            ? `${toFaDigits(results.length)} محصول پیدا شد.`
            : "از نوار جستجوی بالای صفحه‌ی اصلی استفاده کن یا یکی از دسته‌ها را ببین."
        }
      />

      {query && results.length === 0 && (
        <EmptyState
          icon={SearchX}
          title={`چیزی برای «${query}» پیدا نکردیم`}
          description="جستجو بین محصولاتی است که در حال رصدشان هستیم. یکی از دسته‌ها را ببین یا از دستیار خرید بپرس."
          actionLabel="همه فرصت‌ها"
          actionHref="/deals"
        />
      )}

      {results.length > 0 && <DealGrid items={results} showStoreFilter={false} />}

      <section className="mt-4">
        <h2 className="mb-3 text-sm font-bold text-hi">مرور بر اساس دسته</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.id}`}
              className="rounded-xl border border-line bg-elevated/60 px-3.5 py-2 text-xs text-mid transition-all duration-300 hover:border-accent/40 hover:text-hi"
            >
              {category.label}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
