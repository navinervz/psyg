import { NewArrivalsCard } from "@/components/sidebar/NewArrivalsCard";
import { NotifyMeWidget } from "@/components/sidebar/NotifyMeWidget";
import { RecentAlertsCard } from "@/components/sidebar/RecentAlertsCard";
import { RevealColumn } from "@/components/layout/RevealColumn";
import type { PriceAlert, Product } from "@/lib/types";

/**
 * سایدبار — کامپوننت سروری.
 *
 * انیمیشن ورود داخل `RevealColumn` (کلاینتی) است تا `RecentAlertsCard`
 * سروری بماند. قبلاً خودِ Sidebar کلاینتی بود و همین باعث می‌شد کاتالوگ
 * محصولات وارد باندل مرورگر شود.
 */
export function Sidebar({
  alerts,
  newest,
}: {
  alerts: PriceAlert[];
  /*
    محصولات به‌صورت prop می‌آیند نه ایمپورت مستقیم.

    `NewArrivalsCard` کلاینتی است و اگر خودش از `@/lib/data` می‌خواند،
    کل کاتالوگ وارد باندل مرورگر می‌شد — همان چیزی که تست
    `routes.test.ts` ممنوعش کرده.
  */
  newest: Product[];
}) {
  return (
    <aside dir="rtl" className="w-full shrink-0 xl:w-[340px]">
      <RevealColumn className="flex flex-col gap-5">
        {/*
          اینجا قبلاً `ProfileCard` بود — نوار امتیاز و عنوان «تازه‌وارد».
          برای بازدیدکننده‌ی جدید همیشه صفر بود، یعنی گران‌ترین جای صفحه
          به چیزی می‌رفت که هیچ کاری برای کاربر نمی‌کرد.

          کارت پروفایل حذف نشده و در `/account/settings` هنوز معنا دارد؛
          فقط از صفحه‌ی اصلی برداشته شد.
        */}
        <NewArrivalsCard products={newest} />
        <NotifyMeWidget />
        <RecentAlertsCard alerts={alerts} />
      </RevealColumn>
    </aside>
  );
}
