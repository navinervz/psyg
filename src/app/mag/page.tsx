import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { articles } from "@/lib/data";
import { toFaDigits } from "@/lib/format";

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
  title: "مجله سای‌جی",
  description:
    "راهنمای خرید هوشمند: تحلیل نوسان قیمت، تشخیص تخفیف واقعی و بهترین زمان خرید.",
  alternates: { canonical: "/mag" },
};

export default function MagPage() {
  return (
    <PageShell>
      <PageTitle
        title="مجله"
        subtitle="هرچیزی که کمک می‌کند بهتر و ارزان‌تر خرید کنی."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {articles.map((article) => (
          <Card
            key={article.slug}
            as="article"
            className="group flex flex-col gap-3 p-6 transition-colors hover:border-accent/40"
          >
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent">
                {article.tag}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-low nums-fa">
                <Clock className="size-3" strokeWidth={1.8} />
                {toFaDigits(article.readMinutes)} دقیقه مطالعه
              </span>
            </div>

            <h2 className="text-base leading-relaxed font-extrabold text-hi transition-colors group-hover:text-accent">
              {article.title}
            </h2>

            <p className="text-xs leading-relaxed text-mid">{article.excerpt}</p>

            <Link
              href={`/mag/${article.slug}`}
              className="mt-auto inline-flex items-center gap-1.5 pt-2 text-xs font-semibold text-accent"
            >
              ادامه مطلب
              <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-1" />
            </Link>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
