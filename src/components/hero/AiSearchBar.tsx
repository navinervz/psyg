"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Sparkle } from "@/components/ui/Sparkle";
import { Input } from "@/components/ui/Input";
import { gsap, useGSAP } from "@/animations/gsap";
import { formatPrice, formatPercent, priceTrend } from "@/lib/format";
import { cn } from "@/lib/cn";

type Suggestion = {
  slug: string;
  title: string;
  store: string;
  category: string;
  currentPrice: number;
  delta: number;
};

/** فاصله‌ی بین آخرین کلید و ارسال درخواست */
const DEBOUNCE_MS = 220;

/**
 * سرچ‌بار AI بالای صفحه، با پیشنهاد لحظه‌ای.
 *
 * نتیجه‌ها از `/api/search` می‌آیند نه از کاتالوگ داخل مرورگر — کاتالوگ
 * حدود ۹۷ کیلوبایت است و ایمپورت کردنش در یک کامپوننت کلاینتی، آن حجم را
 * به همه‌ی صفحه‌ها اضافه می‌کرد.
 */
export function AiSearchBar() {
  const scope = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  /** ایندکس آیتم انتخاب‌شده با کیبورد؛ -۱ یعنی هیچ‌کدام */
  const [active, setActive] = useState(-1);

  useGSAP(
    () => {
      gsap.from(scope.current, {
        y: 32,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        delay: 0.1,
      });

      gsap.to(".search-cta-glow", {
        opacity: 0.75,
        scale: 1.18,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope },
  );

  /*
    هر بار که کاربر تایپ می‌کند درخواست نمی‌فرستیم؛ بعد از یک مکث کوتاه.
    `AbortController` پاسخ درخواست‌های قدیمی‌تر را دور می‌ریزد — وگرنه اگر
    پاسخ «لپ» دیرتر از «لپ‌تاپ» برسد، نتیجه‌ی اشتباه روی صفحه می‌نشیند.
  */
  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(String(response.status));
        const data = (await response.json()) as { results: Suggestion[] };
        setResults(data.results);
        setActive(-1);
      } catch (error) {
        // لغو عمدی خطا نیست
        if ((error as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  // کلیک بیرون، پنل را می‌بندد
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!scope.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const go = (slug: string) => {
    setOpen(false);
    router.push(`/product/${slug}`);
  };

  const submit = () => {
    const term = query.trim();
    if (!term) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      go(results[active].slug);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <form
      ref={scope}
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      role="search"
      /* مطابق دیزاین: ذره‌بین چپ، دکمه درخشش راست → جهت ltr و ورودی rtl */
      dir="ltr"
      className={cn(
        "card-surface relative flex items-center gap-3 p-2.5 ps-5 transition-all duration-500",
        focused
          ? "border-accent/45 shadow-[0_0_50px_rgba(163,230,53,0.16)]"
          : "shadow-none",
        /*
          بدون این، پنل پیشنهادها زیر کارت هیرو پنهان می‌شد. `z-50` روی
          خود پنل کافی نبود چون سرچ‌بار کانتکست انباشت نداشت و کارت هیرو
          که در DOM بعد از آن می‌آید، رویش نقاشی می‌شد.
        */
        showPanel && "z-50",
      )}
    >
      {loading ? (
        <Loader2 className="size-5 shrink-0 animate-spin text-accent" strokeWidth={1.8} />
      ) : (
        <Search
          className={cn(
            "size-5 shrink-0 transition-colors duration-300",
            focused ? "text-accent" : "text-low",
          )}
          strokeWidth={1.8}
        />
      )}

      <Input
        ref={inputRef}
        dir="rtl"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setFocused(true);
          setOpen(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        placeholder="دنبال چه محصولی هستی؟ قیمتش رو برات پیدا می‌کنم..."
        aria-label="جستجوی محصول"
        aria-autocomplete="list"
        aria-expanded={showPanel}
        aria-controls="search-suggestions"
        role="combobox"
        autoComplete="off"
        className="h-12 text-base sm:text-sm"
      />

      <button
        type="submit"
        aria-label="جستجو با هوش مصنوعی"
        className="btn-accent relative grid size-12 shrink-0 cursor-pointer place-items-center rounded-2xl text-night hover:scale-105 active:scale-95"
      >
        <span className="search-cta-glow absolute inset-0 rounded-2xl bg-accent opacity-40 blur-lg" />
        <Sparkle className="relative size-6" />
      </button>

      {showPanel && (
        <div
          id="search-suggestions"
          dir="rtl"
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        >
          {results.length === 0 ? (
            <p className="px-4 py-5 text-center text-xs text-low">
              {loading ? "در حال جستجو…" : "محصولی با این عبارت پیدا نشد"}
            </p>
          ) : (
            <>
              {results.map((item, index) => {
                const trend = priceTrend(item.delta);
                return (
                  <Link
                    key={item.slug}
                    href={`/product/${item.slug}`}
                    role="option"
                    aria-selected={index === active}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActive(index)}
                    className={cn(
                      "flex items-center justify-between gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0",
                      index === active ? "bg-elevated" : "hover:bg-elevated",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-bold text-hi">
                        {item.title}
                      </span>
                      <span className="block text-[10px] text-low nums-fa">
                        {formatPrice(item.currentPrice)} تومان
                      </span>
                    </span>

                    {item.delta !== 0 && (
                      <span
                        className={cn(
                          "flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold nums-fa",
                          trend === "drop"
                            ? "bg-accent/12 text-accent"
                            : "bg-danger/12 text-danger",
                        )}
                      >
                        {trend === "drop" ? (
                          <TrendingDown className="size-3" />
                        ) : (
                          <TrendingUp className="size-3" />
                        )}
                        {formatPercent(item.delta)}
                      </span>
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={submit}
                className="block w-full cursor-pointer px-4 py-3 text-center text-xs font-semibold text-accent transition-colors hover:bg-elevated"
              >
                دیدن همه‌ی نتیجه‌ها برای «{query.trim()}»
              </button>
            </>
          )}
        </div>
      )}
    </form>
  );
}
