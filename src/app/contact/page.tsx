import type { Metadata } from "next";
import { Mail, MessageSquare, Store } from "lucide-react";
import { PageShell, PageTitle } from "@/components/layout/PageShell";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/components/contact/ContactForm";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "تماس با ما",
  description: "پیشنهاد، گزارش قیمت اشتباه یا درخواست همکاری.",
  alternates: { canonical: "/contact" },
};

const CHANNELS = [
  {
    icon: Mail,
    title: "ایمیل",
    // از دامنه‌ی واقعی سایت ساخته می‌شود تا با آدرس ثبت‌شده یکی بماند
    text: `برای هر موضوعی: ${CONTACT_EMAIL}`,
    hint: "معمولاً ظرف یک روز کاری جواب می‌دهیم.",
  },
  {
    icon: Store,
    title: "همکاری فروشگاه‌ها",
    text: "اگر فروشگاه داری و می‌خواهی محصولاتت رصد شود، بنویس.",
    hint: "اضافه شدن فروشگاه رایگان است.",
  },
  {
    icon: MessageSquare,
    title: "گزارش قیمت اشتباه",
    text: "اگر قیمتی در سایت با فروشگاه نمی‌خواند، خبرمان کن.",
    hint: "لینک محصول را هم بفرست.",
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <PageTitle
        title="تماس با ما"
        subtitle="هر پیشنهاد یا ایرادی که دیدی، بگو. سایت با همین بازخوردها بهتر می‌شود."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {CHANNELS.map(({ icon: Icon, title, text, hint }) => (
          <Card key={title} className="flex flex-col gap-3 p-6">
            <span className="grid size-12 place-items-center rounded-2xl bg-accent/8 text-accent">
              <Icon className="size-6" strokeWidth={1.6} />
            </span>
            <h2 className="text-base font-extrabold text-hi">{title}</h2>
            <p className="text-xs leading-relaxed text-mid">{text}</p>
            <p className="text-[11px] text-low">{hint}</p>
          </Card>
        ))}
      </div>

      {/*
        فرم بعد از کارت‌ها می‌آید، نه قبلشان.

        کارت‌ها به کاربر می‌گویند *چه چیزی* بنویسد؛ فرم جای نوشتنش است.
        برعکسش یعنی کاربر اول با یک کادر خالی روبه‌رو شود.
      */}
      <div className="pt-2">
        <ContactForm />
      </div>
    </PageShell>
  );
}
