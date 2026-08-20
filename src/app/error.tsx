"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      dir="rtl"
      /* dvh نه vh — روی موبایل نوار آدرس را هم حساب می‌کند */
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-night px-6 text-center"
    >
      <h1 className="text-2xl font-extrabold text-hi">یک جای کار ایراد دارد</h1>
      <p className="max-w-md text-sm leading-relaxed text-mid">
        خطای غیرمنتظره‌ای رخ داد. یک‌بار دیگر تلاش کن؛ اگر باز هم تکرار شد
        خبرمان کن.
      </p>
      <Button onClick={reset}>تلاش دوباره</Button>
    </div>
  );
}
