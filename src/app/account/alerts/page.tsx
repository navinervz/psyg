import type { Metadata } from "next";
import Link from "next/link";
import { BellOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { EmptyState } from "@/components/ui/EmptyState";
import { StoreTag } from "@/components/deals/StoreTag";
import { alerts, getProduct } from "@/lib/data";
import { timeAgo } from "@/lib/format";

/**
 * رندر در زمان درخواست — چون این صفحه از کاتالوگ زنده می‌خواند.
 *
 * ⚠️ نبودِ این خط یک باگ واقعی و بی‌صدا ساخت.
 *
 * کاتالوگ در زمان اجرا از `/data/catalog.json` خوانده می‌شود، ولی آن
 * فایل روی یک والیوم داکر است که فقط موقع اجرا مانت می‌شود — نه موقع
 * بیلد. پس وقتی Next این صفحه را در زمان بیلد پیش‌رندر می‌کرد، فایل
 * وجود نداشت و `data.ts` به داده‌ی نمونه برمی‌گشت.
 *
 * نتیجه: صفحه‌ی اصلی سایت ماه‌ها می‌توانست محصولاتی مثل «AirPods Pro 2»
 * را نشان دهد که اصلاً وجود ندارند، در حالی که `/deals` — که
 * force-dynamic داشت — محصولات واقعی را نشان می‌داد. هیچ خطایی هم
 * جایی ثبت نمی‌شد.
 *
 * تست `static-data.test.ts` این قاعده را خودکار بررسی می‌کند.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "هشدارهای قیمت",
  robots: { index: false, follow: false },
};

export default function AlertsPage() {
  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="هنوز هشداری نداری"
        description="روی محصولاتی که برایت مهم‌اند پیگیری بگذار تا افت قیمتشان را اینجا ببینی."
        actionLabel="دیدن فرصت‌ها"
        actionHref="/deals"
      />
    );
  }

  return (
    <Card>
      <ul className="flex flex-col">
        {alerts.map((alert, index) => (
          <li key={alert.id}>
            <Link
              href={`/product/${alert.productSlug}`}
              className={`group flex items-center gap-4 px-5 py-4 transition-colors duration-300 hover:bg-elevated/60 ${
                index > 0 ? "border-t border-line" : ""
              }`}
            >
              <ProductThumb
                src={alert.productImage}
                alt={alert.productTitle}
                category={getProduct(alert.productSlug)?.category}
                className="size-14 shrink-0 rounded-xl p-1.5"
                iconClassName="size-6"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="truncate text-sm font-bold text-hi transition-colors group-hover:text-accent">
                  {alert.productTitle}
                </p>
                <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-low">
                  <StoreTag store={alert.store} className="text-[11px]" />
                  <span>·</span>
                  <span className="nums-fa">{timeAgo(alert.at)}</span>
                </div>
              </div>

              <ChangeBadge delta={alert.delta} showLabel className="shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
