import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock, Store as StoreIcon } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { productsByStore, stores } from "@/lib/data";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

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
  title: "فروشگاه‌های همکار",
  description:
    "فروشگاه‌هایی که سای‌جی قیمت محصولاتشان را رصد می‌کند و می‌توانی از آن‌ها خرید کنی.",
  alternates: { canonical: "/stores" },
};

export default function StoresPage() {
  return (
    <PageShell>
      <PageTitle
        title="فروشگاه‌های همکار"
        subtitle="قیمت‌ها را از این فروشگاه‌ها جمع می‌کنیم. با کلیک روی خرید، مستقیم به صفحه‌ی محصول در همان فروشگاه می‌روی."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => {
          const count = productsByStore(store.id).length;

          return (
            <Card
              key={store.id}
              className={cn(
                "group flex flex-col p-6 transition-colors",
                store.active ? "hover:border-accent/40" : "opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-12 place-items-center rounded-2xl transition-all duration-300",
                  store.active
                    ? "bg-accent/8 text-accent group-hover:bg-accent/16"
                    : "bg-elevated text-low",
                )}
              >
                <StoreIcon className="size-6" strokeWidth={1.6} />
              </span>

              <h2 className="mt-4 text-lg font-extrabold text-hi">
                {store.displayName}
              </h2>

              {store.active ? (
                <>
                  <p className="mt-1 text-xs text-mid nums-fa">
                    {toFaDigits(count)} محصول در حال رصد
                  </p>
                  <Link
                    href="/deals"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-accent transition-opacity hover:opacity-75"
                  >
                    دیدن فرصت‌های این فروشگاه
                    <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
                  </Link>
                </>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-low">
                  <Clock className="size-3.5" strokeWidth={1.8} />
                  در نوبت اتصال
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="mt-2 p-6">
        {/*
          عنوان قبلی «چرا فعلاً فقط دیجی‌کالا؟» بود.

          دیگر درست نیست: اسنپ‌شاپ هم وصل است و بخش بزرگی از کاتالوگ از
          آنجا می‌آید. متنی که با فهرست بالای همان صفحه نمی‌خواند، بدتر
          از نبودنش است.
        */}
        <h2 className="mb-2 text-base font-extrabold text-hi">
          چرا این فروشگاه‌ها؟
        </h2>
        <p className="text-sm leading-loose text-mid">
          هر فروشگاه ساختار داده و برنامه‌ی همکاری خودش را دارد. به‌جای اینکه
          نصفه‌نیمه چند فروشگاه را وصل کنیم، هرکدام را کامل و دقیق راه
          می‌اندازیم و بعد سراغ بعدی می‌رویم. قیمتی که اینجا می‌بینی مستقیم
          از خودشان می‌آید، نه از تخمین ما.
        </p>
      </Card>

    </PageShell>
  );
}
