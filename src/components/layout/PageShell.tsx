import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackdropGlow } from "@/components/layout/BackdropGlow";
import { alerts } from "@/lib/data";

/**
 * پوسته‌ی مشترک صفحه‌های داخلی (همه‌جز صفحه اصلی که سایدبار دارد).
 * کامپوننت سروری است، پس خواندن کاتالوگ اینجا هزینه‌ای برای مرورگر ندارد.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackdropGlow />
      <div className="relative z-10">
        <Header alerts={alerts} />
        <main dir="rtl" className="shell flex flex-col gap-6 pt-4 pb-10">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}

/** تیتر بزرگ بالای صفحه‌های داخلی */
export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-2 pt-6 pb-2">
      <h1 className="text-3xl font-extrabold text-hi sm:text-4xl">{title}</h1>
      {subtitle && (
        <p className="max-w-2xl text-sm leading-relaxed text-mid">{subtitle}</p>
      )}
    </div>
  );
}
