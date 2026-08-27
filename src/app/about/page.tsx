import type { Metadata } from "next";
import { Activity, BellRing, Heart, LineChart } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "درباره ما",
  description:
    "سای‌جی چیست، چطور کار می‌کند و درآمدش از کجاست — بدون ابهام.",
  alternates: { canonical: "/about" },
};

const STEPS = [
  {
    icon: Activity,
    title: "رصد می‌کنیم",
    text: "قیمت محصولات را در فروشگاه‌های همکار به‌صورت مداوم می‌خوانیم و تاریخچه‌اش را نگه می‌داریم.",
  },
  {
    icon: LineChart,
    title: "تحلیل می‌کنیم",
    text: "قیمت امروز را با کف، سقف و میانگین بازه‌ی اخیر می‌سنجیم تا بفهمی تخفیف واقعی است یا نه.",
  },
  {
    icon: BellRing,
    title: "خبرت می‌کنیم",
    text: "هر وقت قیمت محصول موردنظرت افتاد، قبل از اینکه فرصت تمام شود بهت اطلاع می‌دهیم.",
  },
  {
    icon: Heart,
    title: "تصمیم با توست",
    text: "ما نه چیزی می‌فروشیم و نه فروشگاهی را تبلیغ می‌کنیم. فقط عدد و تاریخچه را نشانت می‌دهیم.",
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageTitle
        title="درباره سای‌جی"
        subtitle="یک ابزار ساده برای یک سؤال ساده: الان بخرم یا صبر کنم؟"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex flex-col gap-3 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/8 text-accent">
              <Icon className="size-6" strokeWidth={1.6} />
            </span>
            <h2 className="text-base font-extrabold text-hi">{title}</h2>
            <p className="text-xs leading-relaxed text-mid">{text}</p>
          </Card>
        ))}
      </div>

      <Card glow className="mt-2 p-6">
        <h2 className="mb-3 text-lg font-extrabold text-hi">
          درآمد ما از کجاست؟
        </h2>
        <p className="text-sm leading-loose text-mid">
          وقتی از طریق لینک‌های سای‌جی خریدی انجام می‌دهی، فروشگاه بابت معرفی
          مشتری درصدی کمیسیون به ما می‌دهد. این کمیسیون از جیب فروشنده پرداخت
          می‌شود و قیمتی که تو می‌پردازی هیچ فرقی نمی‌کند. ما هیچ فروشگاهی را
          به‌خاطر کمیسیون بالاتر بالاتر نشان نمی‌دهیم — رتبه‌بندی فقط بر اساس
          قیمت و تاریخچه‌ی آن است.
        </p>
      </Card>

    </PageShell>
  );
}
