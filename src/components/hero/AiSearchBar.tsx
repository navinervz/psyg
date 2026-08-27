"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Loader2,
  Search,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { Sparkle } from "@/components/ui/Sparkle";
import { Input } from "@/components/ui/Input";
import { ProductThumb } from "@/components/ui/ProductThumb";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useAssistantChat } from "@/components/chat/useAssistantChat";
import { formatPrice, formatPercent, priceTrend } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CategoryId } from "@/lib/types";

type Suggestion = {
  slug: string;
  title: string;
  store: string;
  category: CategoryId;
  image: string;
  currentPrice: number;
  delta: number;
};

/**
 * جست‌وجوهای اخیر.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا localStorage و نه حساب کاربری
 * ─────────────────────────────────────────────────────────────────────
 * این سایت حساب کاربری واقعی ندارد و نباید داشته باشد تا کاری که
 * می‌کند را بکند. جست‌وجوی اخیر هم چیزی نیست که ارزش ساختن حساب داشته
 * باشد — روی همان دستگاه می‌ماند و همان‌جا هم به درد می‌خورد.
 *
 * پنج تا، نه بیشتر: فهرست بلندتر همان فضایی را می‌گیرد که نمونه‌ها
 * باید بگیرند.
 */
const RECENT_KEY = "psyg:recent-searches";
const RECENT_MAX = 5;

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const parsed = JSON.parse(raw ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    // حالت خصوصی مرورگر یا مقدار خراب — نبودش خطا نیست
    return [];
  }
}

function pushRecent(term: string) {
  try {
    const next = [term, ...readRecent().filter((t) => t !== term)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // نوشتن ممکن نشد — قابلیت فرعی است و نباید چیزی را بشکند
  }
}

/** فاصله‌ی بین آخرین کلید و ارسال درخواست */
const DEBOUNCE_MS = 220;

/**
 * نمونه‌هایی که به کاربر نشان می‌دهند اینجا می‌شود مثل آدم حرف زد.
 *
 * «Redmi Note 15» یاد می‌دهد اسم دقیق تایپ کن — یعنی همان کاری که هر
 * فیلد جستجویی می‌کند و مشاور را بی‌مصرف می‌گذارد. این جمله‌ها چیز
 * دیگری یاد می‌دهند، و دقیقاً همان‌هایی‌اند که مشاور می‌تواند رویشان
 * سؤال بپرسد و به محصول برسد.
 */
const EXAMPLES = [
  "یه لپ‌تاپ گیمینگ می‌خوام",
  "یه کنسول PS5 می‌خوام",
  "گوشی زیر ۲۰ میلیون پیشنهاد بده",
  "هدفون برای ورزش می‌خوام",
  "بهترین تخفیف امروز چیه؟",
];

/**
 * جستجو و مشاور خرید.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا روی موبایل تمام‌صفحه می‌شود
 * ─────────────────────────────────────────────────────────────────────
 * دو نسخه‌ی قبلی هر دو شکست خوردند و هر کدام یک چیز یاد دادند:
 *
 * اول نمونه‌ها *روی* متن راهنما می‌چرخیدند — دو متن روی هم می‌افتاد.
 *
 * بعد شدند یک ردیف چیپ افقی زیر فیلد. روی گوشی نتیجه‌اش بدتر بود:
 * چیپ‌ها از دو طرف بریده می‌شدند، روی کارت هیرو می‌افتادند، و وقتی
 * کیبورد باز می‌شد همه‌چیز در چند سانتی‌متر باقی‌مانده فشرده می‌شد.
 *
 * ریشه‌ی هر دو یکی بود: تلاش برای جا دادن یک تجربه‌ی جستجو در نواری که
 * ۵۶ پیکسل ارتفاع دارد و وسط صفحه‌ای شلوغ نشسته.
 *
 * روی موبایل، جستجو یک *حالت* است نه یک ویجت. لمس فیلد، صفحه را
 * می‌گیرد: فیلد بالا، فهرست زیرش، همه‌ی عرض. همان کاری که هر اپ
 * جدی‌ای می‌کند. روی دسکتاپ که جا هست، همان دراپ‌داون زیر فیلد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * یک پنل، سه محتوا
 * ─────────────────────────────────────────────────────────────────────
 * گفتگو، نتیجه‌ی محصول، و نمونه‌ها همه در یک ظرف می‌نشینند. نسخه‌ی قبلی
 * سه لایه‌ی جدا با z-index جدا داشت و هرکدام یک بار روی دیگری افتاد.
 */
export function AiSearchBar() {
  const scope = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState(false);
  /** ایندکس آیتم انتخاب‌شده با کیبورد؛ -۱ یعنی هیچ‌کدام */
  const [active, setActive] = useState(-1);

  const [recent, setRecent] = useState<string[]>([]);

  const assistant = useAssistantChat();
  const term = query.trim();

  /*
    ⌘K و Ctrl+K.

    میان‌بری که کاربر حرفه‌ای انتظارش را دارد و کاربر عادی هیچ‌وقت
    نمی‌بیندش. هزینه‌اش یک شنونده است و سودش این که جستجو از هر جای
    صفحه یک کلید فاصله دارد.

    `/` عمداً نیست: در فارسی کاراکتر پرکاربردی نیست ولی در فیلدهای
    دیگر همان صفحه تایپ می‌شود و ربودنش آزاردهنده است.
  */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      setOpen(true);
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // فقط وقتی پنل باز می‌شود خوانده می‌شود — نه در هر رندر
  useEffect(() => {
    if (open) setRecent(readRecent());
  }, [open]);

  /*
    هر بار که کاربر تایپ می‌کند درخواست نمی‌فرستیم؛ بعد از یک مکث کوتاه.
    `AbortController` پاسخ درخواست‌های قدیمی‌تر را دور می‌ریزد — وگرنه اگر
    پاسخ «لپ» دیرتر از «لپ‌تاپ» برسد، نتیجه‌ی اشتباه روی صفحه می‌نشیند.

    در حالت گفتگو اصلاً جستجو نمی‌شود: آنجا هرچه تایپ می‌شود پیام است.
  */
  useEffect(() => {
    if (chat || term.length < 2) {
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
  }, [term, chat]);

  /*
    وقتی حالت جستجو باز است، صفحه‌ی پشتش نباید اسکرول شود.

    روی موبایل این پنل تمام‌صفحه است؛ بدون قفل کردن اسکرول، کشیدن انگشت
    روی فهرست، صفحه‌ی زیرین را هم می‌برد و کاربر بعد از بستن، جای
    دیگری از سایت است.
  */
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("search-open");
    return () => root.classList.remove("search-open");
  }, [open]);

  // کلیک بیرون فقط روی دسکتاپ معنا دارد؛ روی موبایل دکمه‌ی بستن هست
  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!scope.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close() {
    setOpen(false);
    setChat(false);
    setQuery("");
    assistant.reset();
    inputRef.current?.blur();
  }

  const go = (slug: string) => {
    if (term) pushRecent(term);
    close();
    router.push(`/product/${slug}`);
  };

  const ask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setChat(true);
    setOpen(true);
    setQuery("");
    assistant.send(trimmed);
    inputRef.current?.focus();
  };

  const submit = () => {
    if (!term) return;

    /*
      در حالت گفتگو، Enter یعنی «بفرست».

      بیرون از گفتگو هم اگر جمله بلند و محاوره‌ای باشد، فرستادنش به
      صفحه‌ی نتایج بی‌فایده است — جستجوی متنی روی «یه لپ‌تاپ گیمینگ
      می‌خوام» چیزی پیدا نمی‌کند. چنین جمله‌ای کارِ مشاور است.
    */
    if (chat || term.split(/\s+/).length >= 4) {
      const text = term;
      setQuery("");
      if (chat) assistant.send(text);
      else ask(text);
      return;
    }

    pushRecent(term);
    close();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (chat || results.length === 0) return;

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

  return (
    <>
      {/*
        پرده‌ی پشت پنل — فقط دسکتاپ.

        روی موبایل خودِ پنل تمام‌صفحه است و پرده کاری نمی‌کند. اینجا
        کمک می‌کند چشم بفهمد بقیه‌ی صفحه فعلاً غیرفعال است.
      */}
      {open && (
        <div
          aria-hidden
          onClick={close}
          className="fixed inset-0 z-[65] hidden bg-night/70 backdrop-blur-sm lg:block"
        />
      )}

      <div
        ref={scope}
        className={cn(
          "relative",
          open &&
            "max-lg:fixed max-lg:inset-0 max-lg:z-[80] max-lg:flex max-lg:flex-col max-lg:bg-night max-lg:p-3",
          open && "lg:z-[70]",
        )}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          role="search"
          /* مطابق دیزاین: ذره‌بین چپ، نشان مشاور راست → جهت ltr و ورودی rtl */
          dir="ltr"
          /*
            ─────────────────────────────────────────────────────────────
            چرا شعاع گوشه دیگر عوض نمی‌شود
            ─────────────────────────────────────────────────────────────
            قبلاً فیلد در حالت بسته روی دسکتاپ گوشه‌ی کارتی می‌گرفت و در
            حالت باز کاملاً گرد می‌شد. یعنی شکلش با هر کلیک می‌پرید.

            دلیل اصلی آن تصمیم این بود که گوشه‌ی گرد با پنل زیرش نجنگد —
            ولی پنل هشت پیکسل پایین‌تر و جدا از فیلد است، پس اصلاً
            برخوردی وجود نداشت. یک شکل ثابت، هیچ پرشی ندارد.

            ─────────────────────────────────────────────────────────────
            نوار نئون به‌جای هاله‌ی جعبه‌ای
            ─────────────────────────────────────────────────────────────
            `data-neon` حالت را از ری‌اکت به CSS می‌رساند: باز = چرخش
            آرام، در حال پاسخ = چرخش تند. همان زبان بصری کارت‌ها.
          */
          data-neon={assistant.pending ? "busy" : open ? "on" : "off"}
          className={cn(
            "card-surface neon-edge relative flex shrink-0 items-center gap-2 rounded-full p-1.5 ps-4",
            "transition-colors duration-300 sm:gap-3 sm:p-2.5 sm:ps-5",
            open ? "border-accent/45" : "border-line",
          )}
        >
          {loading ? (
            <Loader2
              className="size-5 shrink-0 animate-spin text-accent"
              strokeWidth={1.8}
            />
          ) : (
            <Search
              className={cn(
                "size-5 shrink-0 transition-colors duration-300",
                open ? "text-accent" : "text-low",
              )}
              strokeWidth={1.8}
            />
          )}

          <Input
            ref={inputRef}
            dir="rtl"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={chat ? "جوابت رو بنویس…" : "دنبال چه محصولی هستی؟"}
            aria-label={chat ? "پیام به مشاور خرید" : "جستجوی محصول"}
            autoComplete="off"
            /*
              ─────────────────────────────────────────────────────────
              چرا حلقه‌ی فوکوس این ورودی خاموش است
              ─────────────────────────────────────────────────────────
              قانون سراسری `:focus-visible` یک خط سبز دو پیکسلی با شعاع
              گوشه‌ی ۴ پیکسل می‌کشد. روی یک ورودی شفاف که داخل یک قرص
              کاملاً گرد نشسته، نتیجه‌اش یک مستطیل سبز وسط فیلد بود که
              با شکل خود فیلد هیچ نسبتی نداشت — همان چیزی که در عکس
              دیده می‌شد.

              دسترس‌پذیری از دست نمی‌رود: فوکوس گرفتن فیلد، `open` را
              روشن می‌کند و کل قرص نوار نئون می‌گیرد. یعنی نشانه‌ی فوکوس
              بزرگ‌تر و واضح‌تر از قبل است، نه کمتر.
            */
            className="h-12 min-w-0 flex-1 text-base focus-visible:outline-none sm:text-sm"
          />

          {/*
            پاک کردن سریع.

            بدون آن، کاربری که می‌خواهد عبارت دیگری بزند باید کل متن را
            انتخاب و حذف کند — روی گوشی کار دردناکی است.
          */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="پاک کردن"
              className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-low transition-colors hover:bg-elevated hover:text-hi"
            >
              <X className="size-4" strokeWidth={2.2} />
            </button>
          )}

          {open ? (
            <button
              type="button"
              onClick={close}
              aria-label="بستن"
              className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full text-low transition-colors hover:bg-elevated hover:text-hi sm:size-12"
            >
              <X className="size-5" strokeWidth={2} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                inputRef.current?.focus();
              }}
              aria-label="پرسیدن از مشاور خرید"
              /*
                دکمه تیره است نه سبزِ توپر.

                روی زمینه‌ی سبز، نشانِ سبز خوانده نمی‌شود و مجبور
                بودیم آن را تیره بکشیم — که تخت و بی‌عمق می‌شد. با
                سطح تیره و حلقه‌ی سبز، خودِ نشان می‌تواند همان
                گرادیان و درخشش ماسکوت هیرو را داشته باشد.
              */
              /*
                ─────────────────────────────────────────────────────
                چرا نشان برند و نه یک آیکون تازه
                ─────────────────────────────────────────────────────
                سه شکل امتحان شد و هر سه رد شد: گوی جادویی (انتزاعی و
                بی‌ربط کنار ذره‌بین)، خط‌نگاره‌ی ربات (تخت)، و ماسکوت
                کوچک‌شده (شلوغ در ۲۸ پیکسل).

                الگو روشن است: هر شکل *تازه‌ای* اینجا یک نشان چهارم به
                سایت اضافه می‌کند. سایت از قبل یک نشان دارد — همان که
                در هدر، در نتایج گوگل و روی صفحه‌ی خانه‌ی گوشی است.

                همان را می‌گذاریم. کاربر یک چیز را در سه جا می‌بیند و
                یاد می‌گیرد این دکمه یعنی «سای‌جی».

                هاله‌ی نبض‌دار پشتش می‌گوید زنده است.
              */
              className="glass relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border border-accent/45 transition-all hover:border-accent/80 hover:scale-105 active:scale-95 sm:size-12"
            >
              <span className="search-cta-glow pointer-events-none absolute inset-0 rounded-full bg-accent/25 blur-md" />
              <Image
                src="/icon-192.png"
                alt=""
                width={32}
                height={32}
                className="relative size-[72%] object-contain"
              />
            </button>
          )}
        </form>

        {open && (
          <div
            dir="rtl"
            className={cn(
              "flex flex-col overflow-hidden",
              // موبایل: بقیه‌ی صفحه را پر می‌کند
              "max-lg:mt-3 max-lg:min-h-0 max-lg:flex-1",
              // دسکتاپ: دراپ‌داون زیر فیلد
              "lg:absolute lg:inset-x-0 lg:top-full lg:z-10 lg:mt-2 lg:max-h-[min(70dvh,520px)] lg:rounded-2xl lg:border lg:border-line lg:bg-surface lg:shadow-2xl",
            )}
          >
            {chat ? (
              <ChatPanel
                messages={assistant.messages}
                pending={assistant.pending}
              />
            ) : term.length >= 2 ? (
              <ProductResults
                results={results}
                loading={loading}
                active={active}
                term={term}
                onHover={setActive}
                onPick={go}
                onAsk={() => ask(term)}
              />
            ) : (
              <EmptyState
                recent={recent}
                onAsk={ask}
                onRepeat={(t) => {
                  setQuery(t);
                  inputRef.current?.focus();
                }}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * حالت خالی — جست‌وجوهای اخیر و نمونه‌ها.
 *
 * ترتیب عمدی است: اگر کاربر قبلاً چیزی جسته، احتمال تکرارش بیشتر از
 * شروع یک گفتگوی تازه است. نمونه‌ها زیرشان می‌مانند برای کسی که بار
 * اول است یا چیز دیگری می‌خواهد.
 */
function EmptyState({
  recent,
  onAsk,
  onRepeat,
}: {
  recent: string[];
  onAsk: (text: string) => void;
  onRepeat: (text: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      {recent.length > 0 && (
        <>
          <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-low">
            جست‌وجوهای اخیر
          </p>
          {recent.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onRepeat(item)}
              className="flex cursor-pointer items-center gap-2.5 border-b border-line px-4 py-2.5 text-start text-[13px] text-mid transition-colors hover:bg-elevated hover:text-hi"
            >
              <Clock className="size-3.5 shrink-0 text-low" strokeWidth={2} />
              <span className="min-w-0 flex-1 truncate">{item}</span>
            </button>
          ))}
        </>
      )}

      <ExamplePrompts onPick={onAsk} />
    </div>
  );
}

/**
 * فهرست عمودی نمونه‌ها.
 *
 * عمودی و نه چیپ افقی: پنج جمله‌ی فارسی در یک ردیف افقی روی گوشی از دو
 * طرف بریده می‌شوند و کاربر باید بکشد تا ببیند چه هست. فهرست عمودی همه
 * را با هم نشان می‌دهد و هر ردیف یک هدف لمسی کامل است.
 */
function ExamplePrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col">
      <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold text-low">
        از مشاور خرید بپرس
      </p>

      {EXAMPLES.map((example) => (
        <button
          key={example}
          type="button"
          /*
            ─────────────────────────────────────────────────────────
            چرا `onClick` و نه `onMouseDown`
            ─────────────────────────────────────────────────────────
            نسخه‌ی قبلی `onMouseDown` بود و روی سایت زنده هیچ‌کاری
            نمی‌کرد. دلیلش ظریف است:

            `onMouseDown` بلافاصله `chat` را true می‌کرد و React همان
            لحظه پنل را عوض می‌کرد — یعنی همین دکمه از DOM حذف می‌شد.
            بعد شنونده‌ی `mousedown` سطح سند اجرا می‌شد و
            `scope.contains(target)` را می‌سنجید؛ ولی `target` دیگر
            به سند وصل نبود، پس `false` برمی‌گشت و `close()` صدا
            می‌شد. کلیک، خودش را خنثی می‌کرد.

            با `onClick` ترتیب درست است: `mousedown` می‌رسد و هدف
            هنوز داخل `scope` است (چیزی عوض نشده)، بعد `click` شلیک
            می‌شود و گفتگو باز می‌ماند.
          */
          onClick={() => onPick(example)}
          className="flex cursor-pointer items-center gap-2.5 border-b border-line px-4 py-3 text-start text-[13px] text-mid transition-colors last:border-b-0 hover:bg-elevated hover:text-hi"
        >
          <Sparkle className="size-4 shrink-0 text-accent" />
          <span className="min-w-0 flex-1">{example}</span>
          <ArrowRight className="size-3.5 shrink-0 text-low" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

function ProductResults({
  results,
  loading,
  active,
  term,
  onHover,
  onPick,
  onAsk,
}: {
  results: Suggestion[];
  loading: boolean;
  active: number;
  term: string;
  onHover: (index: number) => void;
  onPick: (slug: string) => void;
  onAsk: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-low">
            {loading ? "در حال جستجو…" : "محصولی با این عبارت پیدا نشد"}
          </p>
        ) : (
          results.map((item, index) => {
            const trend = priceTrend(item.delta);
            return (
              <Link
                key={item.slug}
                href={`/product/${item.slug}`}
                onClick={(event) => {
                  event.preventDefault();
                  onPick(item.slug);
                }}
                onMouseEnter={() => onHover(index)}
                className={cn(
                  "flex items-center justify-between gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0",
                  index === active ? "bg-elevated" : "hover:bg-elevated",
                )}
              >
                {/*
                  تصویر، نه فقط متن.

                  عنوان محصولات فارسی بلند است («گوشی موبایل سامسونگ
                  مدل Galaxy A37 دو سیم‌کارت ظرفیت ۲۵۶…») و در یک سطر
                  بریده می‌شود. تصویر همان تشخیصی را که کاربر می‌خواهد
                  در یک نگاه می‌دهد.
                */}
                <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-night">
                  <ProductThumb
                    src={item.image}
                    alt={item.title}
                    category={item.category}
                    className="size-full"
                    iconClassName="size-5"
                  />
                </span>

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
          })
        )}
      </div>

      {/*
        راه دوم به مشاور، دقیقاً جایی که کاربر نتیجه‌ها را دیده و راضی
        نشده. بیرون از ناحیه‌ی اسکرول است تا همیشه دیده شود.
      */}
      <button
        type="button"
        onClick={onAsk}
        className="flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border-t border-line bg-surface px-4 py-3 text-xs font-semibold text-accent transition-colors hover:bg-elevated"
      >
        <Sparkle className="size-4" />
        از مشاور بپرس: «{term}»
      </button>
    </div>
  );
}
