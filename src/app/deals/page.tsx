import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { DealGrid } from "@/components/deals/DealGrid";
import { categories, getCategory, products } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import type { CategoryId } from "@/lib/types";

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
  title: "بهترین فرصت‌های خرید",
  description:
    "همه‌ی محصولاتی که سای‌جی رصد می‌کند، مرتب‌شده بر اساس بیشترین کاهش قیمت. بر اساس دسته‌بندی فیلتر کن.",
  alternates: { canonical: "/deals" },
};

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const initialCategory = (getCategory(c ?? "")?.id ?? "all") as
    | CategoryId
    | "all";

  return (
    <PageShell>
      <PageTitle
        title="بهترین فرصت‌ها"
        subtitle="همه‌ی محصولاتی که رصد می‌کنیم، با تاریخچه‌ی قیمت و تحلیل بهترین زمان خرید."
      />

      <p className="-mt-2 text-xs text-mid nums-fa">
        {toFaDigits(products.length)} محصول در حال رصد
      </p>

      <DealGrid items={products} initialCategory={initialCategory} />

      {/* لینک‌های داخلی به صفحه‌های دسته‌بندی — برای سئو مهم‌اند */}
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
