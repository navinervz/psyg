"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Eye, EyeOff, LogOut, Plus, Search, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { categories } from "@/lib/reference";
import { cn } from "@/lib/cn";
import type { CategoryId, Product, StoreId } from "@/lib/types";

/**
 * داشبورد مدیریت محصولات.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا محصولات پنهان‌شده هم نمایش داده می‌شوند
 * ─────────────────────────────────────────────────────────────────────
 * اگر پنهان کردن یعنی ناپدید شدن از این لیست، ادمین دیگر راهی برای
 * برگرداندنش نداشت. پس اینجا همه دیده می‌شوند و پنهان‌ها فقط کم‌رنگ و
 * نشان‌دار می‌شوند.
 */

type Props = {
  catalog: Product[];
  manual: Product[];
  hidden: string[];
  updatedAt: string;
};

const STORES: { id: StoreId; label: string }[] = [
  { id: "digikala", label: "دیجی‌کالا" },
  { id: "snappshop", label: "اسنپ‌شاپ" },
];

export function AdminDashboard({ catalog, manual, hidden, updatedAt }: Props) {
  const [hiddenSet, setHiddenSet] = useState(new Set(hidden));
  const [manualList, setManualList] = useState(manual);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"all" | "hidden" | "manual">("all");

  const all = useMemo(() => {
    const manualIds = new Set(manualList.map((p) => p.id));
    return [...manualList, ...catalog.filter((p) => !manualIds.has(p.id))];
  }, [catalog, manualList]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byQuery = q
      ? all.filter((p) => p.title.toLowerCase().includes(q))
      : all;

    /*
      فیلتر نما.

      بدون این، محصول پنهان‌شده بین ۸۰ کارت گم می‌شد و ادمین برای
      برگرداندنش باید کل فهرست را می‌گشت. حالا می‌تواند فقط پنهان‌ها را
      ببیند.
    */
    if (view === "hidden") return byQuery.filter((p) => hiddenSet.has(p.id));
    if (view === "manual") return byQuery.filter((p) => p.id.startsWith("m-"));
    return byQuery;
  }, [all, query, view, hiddenSet]);

  const visibleCount = all.length - hiddenSet.size;

  async function toggleHidden(product: Product) {
    const nextHidden = !hiddenSet.has(product.id);
    setBusy(product.id);

    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, hidden: nextHidden }),
      });
      if (!response.ok) throw new Error();

      /*
        وضعیت فقط بعد از تأیید سرور عوض می‌شود.

        به‌روزرسانی خوش‌بینانه اینجا اشتباه بود: ادمین می‌دید محصول پنهان
        شد، ولی اگر درخواست شکست خورده بود روی سایت هنوز بود.
      */
      setHiddenSet((set) => {
        const next = new Set(set);
        if (nextHidden) next.add(product.id);
        else next.delete(product.id);
        return next;
      });
    } catch {
      alert("تغییر ذخیره نشد. دوباره تلاش کن.");
    } finally {
      setBusy(null);
    }
  }

  async function removeManual(product: Product) {
    if (!confirm(`«${product.title}» کاملاً حذف شود؟`)) return;
    setBusy(product.id);

    try {
      const response = await fetch(
        `/api/admin/products?id=${encodeURIComponent(product.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) throw new Error();
      setManualList((list) => list.filter((p) => p.id !== product.id));
    } catch {
      alert("حذف نشد. دوباره تلاش کن.");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <main dir="rtl" className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-3 pb-6">
        <div className="min-w-0">
          <h1 className="text-xl font-extrabold text-hi">پنل مدیریت</h1>
          {updatedAt && (
            <p className="pt-1 text-xs text-low">
              آخرین همگام‌سازی{" "}
              <span className="nums-fa">
                {new Date(updatedAt).toLocaleString("fa-IR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-night"
          >
            <Plus className="size-4" strokeWidth={2.4} />
            افزودن دستی
          </button>
          {/*
            راه برگشت به سایت.

            بدون این، ادمین بعد از پنهان کردن یک محصول باید آدرس را دستی
            تایپ می‌کرد تا نتیجه را ببیند — و بررسی نکردنِ نتیجه دقیقاً
            همان جایی است که اشتباه‌ها پنهان می‌مانند.
          */}
          <a
            href="/deals"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-xs text-mid transition-colors hover:border-accent/45 hover:text-accent"
          >
            <ExternalLink className="size-4" strokeWidth={2.1} />
            دیدن سایت
          </a>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3.5 py-2 text-xs text-mid transition-colors hover:text-hi"
          >
            <LogOut className="size-4" strokeWidth={2.1} />
            خروج
          </button>
        </div>
      </header>

      {/* فیلتر نما — هم شمارنده است هم دکمه */}
      <div className="flex flex-wrap gap-2 pb-4">
        {(
          [
            { id: "all", label: "روی سایت", count: visibleCount },
            { id: "hidden", label: "پنهان", count: hiddenSet.size },
            { id: "manual", label: "دستی", count: manualList.length },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            aria-pressed={view === tab.id}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition-colors",
              view === tab.id
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-line text-mid hover:text-hi",
            )}
          >
            {tab.label}
            <span className="nums-fa font-bold">{tab.count}</span>
          </button>
        ))}
      </div>

      {adding && (
        <AddProductForm
          onAdded={(product) => {
            setManualList((list) => [product, ...list]);
            setAdding(false);
          }}
        />
      )}

      <div className="relative pb-4">
        <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-[70%] text-low" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجو در محصولات…"
          className="w-full rounded-xl border border-line bg-surface py-2.5 pe-10 ps-4 text-[16px] text-hi outline-none placeholder:text-low focus:border-accent/50 sm:text-sm"
        />
      </div>

      <ul className="space-y-2">
        {shown.map((product) => {
          const isHidden = hiddenSet.has(product.id);
          const isManual = product.id.startsWith("m-");

          return (
            <li
              key={product.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border border-line bg-surface p-3",
                isHidden && "opacity-45",
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-night">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt=""
                  loading="lazy"
                  className="size-full object-contain p-1"
                />
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-hi">{product.title}</p>
                <p className="flex flex-wrap items-center gap-x-2 pt-0.5 text-[11px] text-low">
                  <span className="nums-fa">{formatPrice(product.currentPrice)}</span>
                  <span>·</span>
                  <span>{categories.find((c) => c.id === product.category)?.label}</span>
                  {isManual && <span className="text-accent">· دستی</span>}
                  {isHidden && <span className="text-danger">· پنهان</span>}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleHidden(product)}
                disabled={busy === product.id}
                aria-label={isHidden ? "نمایش روی سایت" : "پنهان کردن"}
                title={isHidden ? "نمایش روی سایت" : "پنهان کردن"}
                className="grid size-9 shrink-0 place-items-center rounded-lg text-low transition-colors hover:bg-line hover:text-hi disabled:opacity-40"
              >
                {isHidden ? (
                  <EyeOff className="size-4.5" strokeWidth={2.1} />
                ) : (
                  <Eye className="size-4.5" strokeWidth={2.1} />
                )}
              </button>

              {isManual && (
                <button
                  type="button"
                  onClick={() => removeManual(product)}
                  disabled={busy === product.id}
                  aria-label="حذف کامل"
                  title="حذف کامل"
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-low transition-colors hover:bg-danger/15 hover:text-danger disabled:opacity-40"
                >
                  <Trash2 className="size-4.5" strokeWidth={2.1} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && (
        <p className="py-10 text-center text-sm text-low">
          {view === "hidden"
            ? "هیچ محصولی پنهان نشده"
            : view === "manual"
              ? "هنوز محصولی دستی اضافه نکرده‌ای"
              : "محصولی پیدا نشد"}
        </p>
      )}
    </main>
  );
}

/**
 * فرم افزودن دستی.
 *
 * چرا فرم و نه «لینک بده تا خودم بخوانم»: تست شد که `cdn.snappshop.ir` به
 * آی‌پی سرور ما ۴۰۳ می‌دهد — با هر Referer و هر User-Agent. یعنی سرور
 * اصلاً نمی‌تواند صفحه‌ی محصول را ببیند و خواندن خودکار همیشه شکست
 * می‌خورد. فرم کندتر است ولی کار می‌کند.
 */
function AddProductForm({ onAdded }: { onAdded: (product: Product) => void }) {
  const [form, setForm] = useState({
    title: "",
    image: "",
    affiliateUrl: "",
    currentPrice: "",
    category: "mobile" as CategoryId,
    store: "digikala" as StoreId,
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, currentPrice: Number(form.currentPrice) }),
      });
      const data = await response.json();

      if (data.ok) onAdded(data.product);
      else setError(data.message ?? "ثبت نشد");
    } catch {
      setError("ارتباط برقرار نشد");
    } finally {
      setPending(false);
    }
  }

  const field =
    "w-full rounded-xl border border-line bg-night px-3.5 py-2.5 text-[16px] text-hi outline-none placeholder:text-low focus:border-accent/50 sm:text-sm";

  return (
    <form
      onSubmit={submit}
      className="mb-4 grid gap-3 rounded-2xl border border-accent/25 bg-surface p-4 sm:grid-cols-2"
    >
      <input
        className={cn(field, "sm:col-span-2")}
        placeholder="عنوان محصول"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <input
        className={cn(field, "sm:col-span-2")}
        placeholder="آدرس تصویر (https://…)"
        dir="ltr"
        value={form.image}
        onChange={(e) => setForm({ ...form, image: e.target.value })}
      />
      <input
        className={cn(field, "sm:col-span-2")}
        placeholder="لینک افیلیت (https://aflo.ir/…)"
        dir="ltr"
        value={form.affiliateUrl}
        onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })}
      />
      <input
        className={field}
        placeholder="قیمت به تومان"
        inputMode="numeric"
        value={form.currentPrice}
        onChange={(e) =>
          setForm({ ...form, currentPrice: e.target.value.replace(/\D/g, "") })
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          className={field}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value as CategoryId })}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          className={field}
          value={form.store}
          onChange={(e) => setForm({ ...form, store: e.target.value as StoreId })}
        >
          {STORES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-danger sm:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-accent py-2.5 text-xs font-bold text-night transition-opacity disabled:opacity-40 sm:col-span-2"
      >
        {pending ? "…" : "ثبت محصول"}
      </button>
    </form>
  );
}
