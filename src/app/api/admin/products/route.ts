import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyTicket } from "@/lib/admin-auth";
import { readOverrides, writeOverrides } from "@/lib/admin-store";
import type { CategoryId, Product, StoreId } from "@/lib/types";

export const dynamic = "force-dynamic";

const CATEGORIES: CategoryId[] = [
  "mobile",
  "laptop",
  "headphone",
  "wearable",
  "console",
  "tablet",
  "accessory",
];

const STORES: StoreId[] = ["digikala", "snappshop"];

async function authorized(): Promise<boolean> {
  const store = await cookies();
  return verifyTicket(store.get(ADMIN_COOKIE)?.value);
}

function unauthorized() {
  return NextResponse.json({ ok: false, message: "وارد نشده‌اید" }, { status: 401 });
}

/**
 * پنهان کردن یا برگرداندن یک محصول.
 *
 * چرا «پنهان» و نه حذف: اجرای بعدی همگام‌سازی محصول را دوباره از افیلیو
 * می‌آورد. پس باید شناسه‌اش را نگه داریم و هر بار کنارش بگذاریم.
 */
export async function PATCH(request: Request) {
  if (!(await authorized())) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const { id, hidden } = (body ?? {}) as { id?: unknown; hidden?: unknown };

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, message: "شناسه لازم است" }, { status: 422 });
  }

  const overrides = await readOverrides();
  const set = new Set(overrides.hidden);

  if (hidden === false) set.delete(id);
  else set.add(id);

  await writeOverrides({ ...overrides, hidden: [...set] });

  return NextResponse.json({ ok: true, hidden: hidden !== false });
}

/**
 * افزودن محصول دستی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا فرم و نه «لینک بده تا خودم بخوانم»
 * ─────────────────────────────────────────────────────────────────────
 * ایده‌ی اول این بود که ادمین لینک افیلیت بدهد و سرور خودش عنوان و قیمت
 * و عکس را از صفحه‌ی فروشگاه بخواند. تست شد و کار نمی‌کند: `cdn.snappshop.ir`
 * به آی‌پی سرور ما ۴۰۳ می‌دهد (با هر Referer و هر User-Agent). یعنی
 * سرور اصلاً نمی‌تواند صفحه‌ی محصول را ببیند.
 *
 * ساختن چنین قابلیتی یعنی دکمه‌ای که همیشه شکست می‌خورد. به‌جایش فرم
 * صریح است: ادمین چیزی را وارد می‌کند که خودش روی صفحه‌ی فروشگاه می‌بیند.
 * کندتر است ولی همیشه کار می‌کند.
 */
export async function POST(request: Request) {
  if (!(await authorized())) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const input = (body ?? {}) as Record<string, unknown>;

  const title = String(input.title ?? "").trim();
  const image = String(input.image ?? "").trim();
  const affiliateUrl = String(input.affiliateUrl ?? "").trim();
  const currentPrice = Number(input.currentPrice);
  const category = String(input.category ?? "") as CategoryId;
  const store = String(input.store ?? "") as StoreId;

  const problems: string[] = [];

  if (title.length < 3) problems.push("عنوان خیلی کوتاه است");
  if (!/^https:\/\//.test(image)) problems.push("آدرس تصویر باید با https شروع شود");
  if (!/^https:\/\//.test(affiliateUrl)) problems.push("لینک افیلیت باید با https شروع شود");
  if (!Number.isFinite(currentPrice) || currentPrice <= 0) problems.push("قیمت نامعتبر است");
  if (!CATEGORIES.includes(category)) problems.push("دسته‌بندی نامعتبر است");
  if (!STORES.includes(store)) problems.push("فروشگاه نامعتبر است");

  if (problems.length) {
    return NextResponse.json({ ok: false, message: problems[0], problems }, { status: 422 });
  }

  const overrides = await readOverrides();

  /*
    شناسه‌ی محصول دستی پیشوند `m-` می‌گیرد.

    بدون این، ممکن بود با `uid` افیلیو تصادم کند و همگام‌سازی بعدی
    محصول دستی را بی‌صدا با نسخه‌ی افیلیو عوض کند.
  */
  const id = `m-${Date.now().toString(36)}`;
  const today = new Date().toISOString().slice(0, 10);

  const product: Product = {
    id,
    slug: id,
    title,
    image,
    store,
    category,
    brand: title.match(/[A-Za-z][A-Za-z0-9+]{2,}/)?.[0] ?? store,
    sourceUrl: affiliateUrl,
    affiliateUrl,
    currentPrice,
    // تخفیف ساختگی نمی‌سازیم؛ تاریخچه از همین امروز شروع می‌شود
    previousPrice: currentPrice,
    history: [{ t: today, price: currentPrice }],
  };

  await writeOverrides({ ...overrides, manual: [...overrides.manual, product] });

  return NextResponse.json({ ok: true, product });
}

/** حذف کامل یک محصول دستی (برخلاف پنهان کردن، این واقعاً پاکش می‌کند) */
export async function DELETE(request: Request) {
  if (!(await authorized())) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "شناسه لازم است" }, { status: 422 });
  }

  const overrides = await readOverrides();
  await writeOverrides({
    ...overrides,
    manual: overrides.manual.filter((p) => p.id !== id),
    hidden: overrides.hidden.filter((h) => h !== id),
  });

  return NextResponse.json({ ok: true });
}
