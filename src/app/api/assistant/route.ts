import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { priceDelta } from "@/lib/format";
import type { Product } from "@/lib/types";

/**
 * دستیار خرید سای‌جی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا کاتالوگ از اینجا فرستاده می‌شود و n8n خودش نمی‌خواند
 * ─────────────────────────────────────────────────────────────────────
 * سایت منبع حقیقت است. اگر n8n جداگانه از افیلیو می‌خواند، دو کاتالوگ
 * داشتیم که می‌توانستند از هم جدا بیفتند — و نتیجه‌اش این می‌شد که دستیار
 * محصولی را پیشنهاد دهد که روی سایت وجود ندارد. کاربر روی پیشنهاد کلیک
 * می‌کرد و به صفحه‌ی ۴۰۴ می‌رسید.
 *
 * با این مسیر، هرچه دستیار می‌گوید دقیقاً از همان `catalog.json` می‌آید که
 * کارت‌های صفحه‌ی اصلی از آن ساخته می‌شوند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا مدل فقط `slug` برمی‌گرداند
 * ─────────────────────────────────────────────────────────────────────
 * مدل هیچ‌وقت قیمت یا اسم محصول را برای کاربر نمی‌نویسد. فقط شناسه انتخاب
 * می‌کند و بقیه‌ی اطلاعات را همین‌جا از داده‌ی واقعی پر می‌کنیم.
 *
 * دلیلش ساده است: مدل‌های زبانی عدد را اشتباه بازنویسی می‌کنند. اگر اجازه
 * می‌دادیم خودش قیمت بنویسد، دیر یا زود قیمتی نشان می‌داد که با صفحه‌ی
 * محصول نمی‌خواند — و کل ادعای «قیمت واقعی» سایت زیر سؤال می‌رفت.
 */

export const dynamic = "force-dynamic";

/** بیشتر از این، هم پرامپت گران می‌شود هم دقت مدل پایین می‌آید */
const MAX_CATALOG = 60;
const MAX_MESSAGE_LENGTH = 500;

type Pick = { slug: string; why: string };

type AssistantReply = {
  reply: string;
  picks: Pick[];
};

/** خروجی‌ای که به کلاینت می‌رسد — محصول کامل، نه فقط شناسه */
type HydratedPick = {
  why: string;
  /** برای ثبت کلیک خروجی لازم است — `slug` کافی نیست */
  id: string;
  slug: string;
  title: string;
  image: string;
  store: Product["store"];
  currentPrice: number;
  previousPrice: number;
  delta: number;
  href: string;
};

/**
 * انتخاب زیرمجموعه‌ای از کاتالوگ که به پرامپت می‌رود.
 *
 * همه‌ی ۸۰ محصول را نمی‌فرستیم چون پرامپت بی‌دلیل بزرگ می‌شود. اولویت با
 * محصولاتی است که قیمتشان افت کرده — همان چیزی که کاربر برای دیدنش آمده.
 */
function catalogForPrompt(): Product[] {
  return [...products]
    .sort((a, b) => {
      const da = priceDelta(a.previousPrice, a.currentPrice);
      const db = priceDelta(b.previousPrice, b.currentPrice);
      return da - db;
    })
    .slice(0, MAX_CATALOG);
}

function hydrate(pick: Pick): HydratedPick | null {
  const product = products.find((p) => p.slug === pick.slug);
  if (!product) return null;

  return {
    why: pick.why,
    id: product.id,
    slug: product.slug,
    title: product.title,
    image: product.image,
    store: product.store,
    currentPrice: product.currentPrice,
    previousPrice: product.previousPrice,
    delta: priceDelta(product.previousPrice, product.currentPrice),
    href: `/product/${product.slug}`,
  };
}

export async function POST(request: Request) {
  const webhook = process.env.N8N_ASSISTANT_WEBHOOK_URL;

  if (!webhook) {
    /*
      ۵۰۳ و نه پاسخ ساختگی.

      وسوسه‌ی برگرداندن یک جواب از پیش نوشته وقتی دستیار در دسترس نیست
      زیاد است، ولی کاربر فرقش را نمی‌فهمد و فکر می‌کند با هوش مصنوعی حرف
      می‌زند. بهتر است صریح بگوییم الان در دسترس نیست.
    */
    return NextResponse.json(
      { ok: false, message: "دستیار فعلاً در دسترس نیست" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "درخواست نامعتبر است" },
      { status: 400 },
    );
  }

  const { message, history } = (body ?? {}) as {
    message?: unknown;
    history?: unknown;
  };

  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { ok: false, message: "پیام خالی است" },
      { status: 422 },
    );
  }

  const catalog = catalogForPrompt();

  let payload: AssistantReply;

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: message.trim().slice(0, MAX_MESSAGE_LENGTH),
        history: Array.isArray(history) ? history.slice(-6) : [],
        products: catalog.map((p) => ({
          slug: p.slug,
          title: p.title,
          currentPrice: p.currentPrice,
          category: p.category,
          store: p.store,
          delta: priceDelta(p.previousPrice, p.currentPrice),
        })),
      }),
      // اگر n8n کند بود، کاربر پشت یک اسپینر بی‌پایان نماند
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) throw new Error(`n8n ${response.status}`);
    payload = (await response.json()) as AssistantReply;
  } catch {
    return NextResponse.json(
      { ok: false, message: "دستیار الان جواب نمی‌دهد، کمی بعد دوباره امتحان کن" },
      { status: 502 },
    );
  }

  /*
    دروازه‌ی دوم اعتبارسنجی.

    n8n هم `slug`ها را چک می‌کند، ولی این بررسی اینجا هم تکرار می‌شود چون
    سایت مسئول چیزی است که نشان می‌دهد. اگر روزی ورک‌فلو عوض شد یا کسی آن
    فیلتر را برداشت، اینجا هنوز جلوی نمایش محصول ناموجود را می‌گیرد.
  */
  const picks = (Array.isArray(payload?.picks) ? payload.picks : [])
    .map(hydrate)
    .filter((p): p is HydratedPick => p !== null)
    .slice(0, 4);

  return NextResponse.json({
    ok: true,
    reply: String(payload?.reply ?? "").slice(0, 900),
    picks,
  });
}
