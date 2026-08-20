import { Card } from "@/components/ui/Card";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { RevealGrid } from "@/components/deals/RevealGrid";
import { topDeals } from "@/lib/data";

/**
 * «بهترین فرصت‌ها» — کامپوننت سروری.
 * انتخاب شش محصول برتر روی سرور انجام می‌شود تا کل کاتالوگ
 * به باندل کلاینت راه پیدا نکند.
 */
export function BestDealsSection() {
  return (
    <Card as="section" className="p-4 sm:p-6">
      <SectionHeader title="بهترین فرصت‌ها" actionHref="/deals" />

      {/* مطابق دیزاین کارت ۰۱ سمت چپ است → گرید ltr، داخل هر کارت rtl */}
      <div className="mt-5">
        <RevealGrid items={topDeals(6)} showRank />
      </div>
    </Card>
  );
}
