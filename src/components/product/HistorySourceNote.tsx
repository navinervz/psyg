import { Info } from "lucide-react";
import { storesById } from "@/components/deals/StoreTag";
import type { StoreId } from "@/lib/types";

/**
 * «این تاریخچه در فروشگاه دیگری ثبت شده».
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این جمله لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * فید افیلیو ثابت نیست. همان گوشی که هفته‌ی پیش از دیجی‌کالا رصد می‌شد،
 * این هفته ممکن است فقط از اسنپ‌شاپ بیاید.
 *
 * قبلاً در این حالت تاریخچه دور ریخته می‌شد و نمودار از صفر شروع می‌کرد.
 * حالا حفظ می‌شود — که درست است، چون قیمت همان محصول است و روند واقعی
 * را نشان می‌دهد.
 *
 * ولی سکوت درباره‌اش یک ادعای ضمنی می‌ساخت: که همه‌ی نقطه‌های نمودار از
 * فروشگاه فعلی‌اند. برای سایتی که تنها سرمایه‌اش این است که قیمت‌هایش
 * قابل اتکا باشند، آن ادعای کوچک ارزش گفتن حقیقت را ندارد.
 */
export function HistorySourceNote({
  from,
  current,
}: {
  from?: StoreId;
  current: StoreId;
}) {
  // حالت عادی: تاریخچه از همان فروشگاهی است که محصول در آن است
  if (!from || from === current) return null;

  const fromName = storesById[from]?.displayName ?? from;
  const currentName = storesById[current]?.displayName ?? current;

  return (
    <p className="flex items-start gap-1.5 rounded-xl bg-elevated/60 px-2.5 py-2 text-[11px] leading-relaxed text-mid">
      <Info className="mt-0.5 size-3.5 shrink-0 text-low" strokeWidth={1.8} />
      <span>
        بخشی از این تاریخچه‌ی قیمت در <b className="text-hi">{fromName}</b> ثبت
        شده است. این محصول اکنون در <b className="text-hi">{currentName}</b>{" "}
        موجود است.
      </span>
    </p>
  );
}
