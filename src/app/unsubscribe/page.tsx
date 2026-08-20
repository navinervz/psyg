import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { unsubscribe } from "@/lib/subscriber-store";

/**
 * صفحه‌ی لغو اشتراک.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا با توکن و نه با ایمیل
 * ─────────────────────────────────────────────────────────────────────
 * اگر آدرس این شکلی بود `?email=someone@example.com`، هر کسی می‌توانست
 * با حدس زدن نشانی دیگران اشتراکشان را لغو کند. ضمناً نشانی ایمیل در
 * لاگ سرورها و هدر ارجاع‌دهنده پخش می‌شد.
 *
 * توکن تصادفی هیچ‌کدام از این دو مشکل را ندارد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا بدون دکمه‌ی تأیید
 * ─────────────────────────────────────────────────────────────────────
 * قانون اینجا ساده است: لغو اشتراک باید از ثبت‌نام آسان‌تر باشد. هر
 * مرحله‌ی اضافه فقط کسی را که تصمیمش را گرفته عصبانی می‌کند و احتمال
 * علامت خوردن نامه‌های ما به‌عنوان اسپم را بالا می‌برد — که به رساندن
 * نامه به بقیه هم آسیب می‌زند.
 */

export const metadata: Metadata = {
  title: "لغو اشتراک خبرنامه",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const done = token ? await unsubscribe(token) : false;

  return (
    <main
      dir="rtl"
      className="mx-auto grid min-h-dvh max-w-md place-items-center px-6"
    >
      <div className="w-full rounded-2xl border border-line bg-surface p-6 text-center">
        {done ? (
          <>
            <CheckCircle2
              className="mx-auto size-10 text-accent"
              strokeWidth={1.8}
            />
            <h1 className="pt-3 pb-2 text-lg font-bold text-hi">
              اشتراکت لغو شد
            </h1>
            <p className="text-sm leading-relaxed text-low">
              دیگر ایمیلی از ما نمی‌گیری. هر وقت خواستی برگردی، از ویجت
              «خبرم کن» دوباره ثبت‌نام کن.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-10 text-low" strokeWidth={1.8} />
            <h1 className="pt-3 pb-2 text-lg font-bold text-hi">
              این لینک کار نکرد
            </h1>
            {/*
              عمداً نمی‌گوییم «توکن نامعتبر است».

              دو حالت ممکن است: لینک خراب باشد، یا اشتراک از قبل لغو
              شده باشد. برای کاربر نتیجه یکی است و توضیح فنی فقط
              نگرانش می‌کند.
            */}
            <p className="text-sm leading-relaxed text-low">
              یا این لینک قدیمی است یا اشتراکت از قبل لغو شده. اگر باز هم
              ایمیل گرفتی، به ما خبر بده تا دستی حذفش کنیم.
            </p>
          </>
        )}

        <Link
          href="/"
          className="mt-5 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-night"
        >
          برگشت به سای‌جی
        </Link>
      </div>
    </main>
  );
}
