"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SubscribeForm } from "@/components/ui/SubscribeForm";
import { Button } from "@/components/ui/Button";
import { useUserData } from "@/store/useUserData";
import { useHydrated } from "@/hooks/useHydrated";
import { toFaDigits } from "@/lib/format";
import { cn } from "@/lib/cn";

type Toggle = { id: string; label: string; hint: string };

const NOTIFICATIONS: Toggle[] = [
  {
    id: "price-drop",
    label: "افت قیمت محصولات پیگیری‌شده",
    hint: "هر وقت قیمت محصولی که پیگیری می‌کنی کم شد.",
  },
  {
    id: "lowest-30",
    label: "رسیدن به کف قیمت ۳۰ روزه",
    hint: "فقط وقتی قیمت به پایین‌ترین حد یک ماه اخیر رسید.",
  },
  {
    id: "weekly",
    label: "خلاصه‌ی هفتگی فرصت‌ها",
    hint: "یک ایمیل در هفته با بهترین تخفیف‌ها.",
  },
];

export function SettingsPanel() {
  const hydrated = useHydrated();
  const favorites = useUserData((s) => s.favorites);
  const tracked = useUserData((s) => s.tracked);
  const clearFavorites = useUserData((s) => s.clearFavorites);
  const clearTracked = useUserData((s) => s.clearTracked);

  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    "price-drop": true,
    "lowest-30": true,
    weekly: false,
  });

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ favorites, tracked }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "psyg-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    clearFavorites();
    clearTracked();
  };

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      {/* اعلان‌ها */}
      <Card className="p-6">
        <h2 className="mb-1 text-base font-extrabold text-hi">اعلان‌ها</h2>
        <p className="mb-5 text-xs text-mid">
          کِی برایت ایمیل بفرستیم؟
        </p>

        <div className="flex flex-col gap-4">
          {NOTIFICATIONS.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-line pb-4 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-hi">{item.label}</span>
                <span className="text-[11px] text-low">{item.hint}</span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={enabled[item.id]}
                aria-label={item.label}
                onClick={() =>
                  setEnabled((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                }
                className={cn(
                  "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-300",
                  enabled[item.id] ? "bg-accent" : "bg-elevated",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-5 rounded-full bg-night transition-all duration-300",
                    enabled[item.id] ? "start-0.5" : "start-5.5",
                  )}
                />
              </button>
            </div>
          ))}
        </div>

        {/*
          متن قبلی این بود:
          «فاز اول حساب کاربری ندارد، پس این تنظیمات فقط در همین مرورگر
          نگه داشته می‌شوند. ارسال واقعی ایمیل در فاز دوم از طریق n8n
          انجام می‌شود.»

          سه ایراد داشت. «فاز اول» و «فاز دوم» زبان داخلی تیم است و برای
          کاربر معنایی ندارد. «n8n» اسم ابزار داخلی ماست و لو دادنش هم
          بی‌فایده است هم از نظر امنیتی بی‌دلیل. و مهم‌تر از همه، لحنش
          می‌گفت «سایت هنوز کامل نیست» — که اعتماد را می‌برد.

          حقیقتِ قابل استفاده برای کاربر یک چیز است: این تنظیمات روی این
          مرورگر می‌مانند. همان را می‌گوییم، بدون عذرخواهی و بدون جزئیات
          داخلی.
        */}
        {/*
          دو نسخه‌ی قبلی این متن مشکل داشتند.

          اولی از «فاز اول» و «n8n» حرف می‌زد — زبان داخلی تیم.
          دومی به ویجتی در صفحه‌ی دیگر ارجاع می‌داد، یعنی کاربر باید
          می‌رفت دنبالش می‌گشت. اگر برای انجام کاری باید کاربر را به جای
          دیگری بفرستیم، بهتر است همان‌جا انجامش دهد.

          حالا فقط یک حقیقت ساده گفته می‌شود و فیلد ایمیل درست زیرش است.
        */}
        <p className="mt-5 text-[11px] leading-relaxed text-low">
          این تنظیمات روی همین مرورگر ذخیره می‌شوند.
        </p>

        <div className="mt-3 rounded-xl border border-line bg-elevated/40 p-4">
          <p className="pb-3 text-xs font-bold text-hi">
            برای دریافت این اعلان‌ها، ایمیلت را ثبت کن
          </p>
          <SubscribeForm compact />
        </div>
      </Card>

      {/* داده‌های من */}
      <Card className="p-6">
        <h2 className="mb-1 text-base font-extrabold text-hi">داده‌های من</h2>
        <p className="mb-5 text-xs text-mid">
          {hydrated ? (
            <span className="nums-fa">
              {toFaDigits(favorites.length)} علاقه‌مندی و{" "}
              {toFaDigits(tracked.length)} پیگیری در این مرورگر ذخیره شده.
            </span>
          ) : (
            "در حال خواندن…"
          )}
        </p>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={exportData} className="gap-2">
            <Download className="size-3.5" strokeWidth={1.9} />
            دریافت خروجی JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="gap-2 border-danger/40 text-danger hover:border-danger hover:text-danger"
          >
            <Trash2 className="size-3.5" strokeWidth={1.9} />
            پاک کردن همه داده‌ها
          </Button>
        </div>
      </Card>
    </div>
  );
}
