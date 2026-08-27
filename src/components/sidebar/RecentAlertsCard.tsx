import Link from "next/link";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChangeBadge } from "@/components/ui/Badge";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { StoreTag } from "@/components/deals/StoreTag";
import { timeAgo } from "@/lib/format";
import { getProduct } from "@/lib/data";
import type { PriceAlert } from "@/lib/types";

/** کامپوننت سروری — هشدارها به‌صورت prop می‌آیند */
export function RecentAlertsCard({ alerts }: { alerts: PriceAlert[] }) {
  return (
    <Card neon className="will-reveal">
      <div className="flex items-center justify-between px-5 pt-5">
        <h3 className="text-base font-extrabold text-hi">هشدارهای اخیر</h3>
        <Link
          href="/account/alerts"
          className="text-[11px] font-semibold text-accent transition-opacity hover:opacity-75"
        >
          مشاهده همه
        </Link>
      </div>

      {/*
        حالت خالی.

        هشدارها از افت واقعی قیمت ساخته می‌شوند، و تا وقتی تاریخچه‌ی
        چندروزه نداشته باشیم ممکن است هیچ افتی ثبت نشده باشد. بدون این
        بخش، کارت فقط یک عنوان و دو لینک بود که شکسته به‌نظر می‌رسید.

        متن عمداً توضیح می‌دهد چرا خالی است. «هشداری نیست» بدون دلیل،
        کاربر را به این فکر می‌اندازد که سایت کار نمی‌کند.
      */}
      {alerts.length === 0 && (
        <p className="mt-3 border-t border-line px-5 py-5 text-xs leading-relaxed text-low">
          هنوز افت قیمتی ثبت نشده. قیمت‌ها را هر روز می‌گیریم و به‌محض اینکه
          چیزی ارزان شود همین‌جا می‌بینی‌اش.
        </p>
      )}

      <ul className="mt-4 flex flex-col">
        {alerts.map((alert) => (
          <li key={alert.id}>
            <Link
              href={`/product/${alert.productSlug}`}
              className="group flex items-center gap-3 border-t border-line px-5 py-3.5 transition-colors duration-300 hover:bg-elevated/60"
            >
              <ProductThumb
                src={alert.productImage}
                alt={alert.productTitle}
                category={getProduct(alert.productSlug)?.category}
                className="size-11 shrink-0 rounded-xl p-1"
                iconClassName="size-5"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="truncate text-xs font-bold text-hi transition-colors group-hover:text-accent">
                  {alert.productTitle}
                </p>
                <div className="flex items-center gap-2">
                  <ChangeBadge delta={alert.delta} showLabel />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-low">
                  <StoreTag store={alert.store} className="text-[10px]" />
                  <span>·</span>
                  <span className="nums-fa">{timeAgo(alert.at)}</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/account/alerts"
        className="group flex items-center justify-center gap-1.5 border-t border-line py-3.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/8"
      >
        مشاهده همه هشدارها
        <Plus className="size-3.5 transition-transform group-hover:rotate-90" />
      </Link>
    </Card>
  );
}
