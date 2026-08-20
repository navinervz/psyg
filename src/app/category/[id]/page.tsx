import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { DealGrid } from "@/components/deals/DealGrid";
import { AffiliateNotice } from "@/components/product/AffiliateNotice";
import { categories, getCategory, productsByCategory } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import type { CategoryId } from "@/lib/types";

/**
 * دسته‌ها ثابت‌اند؛ هر id دیگری باید ۴۰۴ بدهد نه صفحه‌ی خالی.
 * برخلاف صفحه‌ی محصول، اینجا `false` می‌ماند چون فهرست دسته‌ها با کاتالوگ
 * زنده عوض نمی‌شود.
 */
export const dynamicParams = false;

/** محتوای دسته با کاتالوگ زنده تغییر می‌کند، پس بازتولید دوره‌ای لازم است */
export const revalidate = 900;

export function generateStaticParams() {
  return categories.map((category) => ({ id: category.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) return { title: "دسته‌بندی پیدا نشد" };

  return {
    title: `قیمت ${category.label}`,
    description: category.description,
    alternates: { canonical: `/category/${category.id}` },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = getCategory(id);
  if (!category) notFound();

  const items = productsByCategory(category.id as CategoryId);

  return (
    <PageShell>
      <nav aria-label="مسیر" className="flex items-center gap-1.5 pt-6 text-xs text-low">
        <Link href="/" className="transition-colors hover:text-accent">
          خانه
        </Link>
        <ChevronLeft className="size-3.5" />
        <Link href="/deals" className="transition-colors hover:text-accent">
          فرصت‌ها
        </Link>
        <ChevronLeft className="size-3.5" />
        <span className="text-mid">{category.label}</span>
      </nav>

      <PageTitle title={category.label} subtitle={category.description} />

      <p className="-mt-2 text-xs text-mid nums-fa">
        {toFaDigits(items.length)} محصول در حال رصد
      </p>

      <DealGrid items={items} showStoreFilter={false} />

      {/* لینک داخلی به بقیه دسته‌ها — هم برای کاربر، هم برای خزنده‌ی گوگل */}
      <section className="mt-4">
        <h2 className="mb-3 text-sm font-bold text-hi">دسته‌های دیگر</h2>
        <div className="flex flex-wrap gap-2">
          {categories
            .filter((c) => c.id !== category.id)
            .map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="rounded-xl border border-line bg-elevated/60 px-3.5 py-2 text-xs text-mid transition-all duration-300 hover:border-accent/40 hover:text-hi"
              >
                {c.label}
              </Link>
            ))}
        </div>
      </section>

      <AffiliateNotice className="mt-2" />
    </PageShell>
  );
}
