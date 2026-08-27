import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { priceDelta } from "@/lib/format";
import type { CategoryId, Product } from "@/lib/types";

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

/**
 * سقف تعداد محصولی که به پرامپت می‌رود.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا از ۶۰ به ۲۰۰ رفت
 * ─────────────────────────────────────────────────────────────────────
 * روی سایت زنده، مشاور گفت «لپ‌تاپ مخصوص بازی نداریم» در حالی که سایت
 * دقیقاً همین را داشت:
 *
 *   «لپ تاپ ۱۵.۶ اینچ مخصوص بازی اچ پی مدل Victus 15 Core i5 13420H»
 *
 * کاتالوگ ۸۰ محصول داشت و ما ۶۰ تا می‌فرستادیم. مرتب‌سازی بر اساس افت
 * قیمت بود و چون هیچ محصولی افت ثبت‌شده نداشت، همه‌ی مقادیر صفر بودند —
 * یعنی ترتیب عملاً دلخواه شد و ۲۰ محصول تصادفی حذف شدند. یکی‌شان همان
 * لپ‌تاپ گیمینگ بود.
 *
 * نتیجه: مشاور با اطمینان چیزی را انکار کرد که وجود داشت. بدترین نوع
 * اشتباه برای سایتی که کارش گفتن حقیقت درباره‌ی محصولات است.
 *
 * هر رکورد حدود ۱۲۰ بایت است، پس ۲۰۰ محصول حدود ۲۴ کیلوبایت می‌شود —
 * برای یک پرامپت کاملاً قابل قبول.
 */
const MAX_CATALOG = 200;
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
  category: CategoryId;
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
  /*
    ─────────────────────────────────────────────────────────────────────
    چرا نوبتی بین دسته‌ها و نه صرفاً مرتب‌سازی
    ─────────────────────────────────────────────────────────────────────
    نسخه‌ی قبلی همه را بر اساس افت قیمت مرتب می‌کرد و ۶۰ تای اول را
    برمی‌داشت. وقتی هیچ محصولی افت ثبت‌شده ندارد — که هفته‌ها همین‌طور
    بود — همه‌ی مقادیر صفرند و برش عملاً تصادفی می‌شود.

    خطر واقعی‌اش این نیست که چند محصول کم شود؛ این است که یک *دسته‌ی
    کامل* حذف شود و مشاور با اطمینان بگوید «نداریم». دقیقاً همین اتفاق
    برای لپ‌تاپ گیمینگ افتاد.

    حالا اول از هر دسته یک محصول برداشته می‌شود، بعد دومی، و همین‌طور.
    یعنی تا وقتی سقف پر نشده، هیچ دسته‌ای صفر نمی‌ماند — حتی اگر روزی
    کاتالوگ چند برابر شود.
  */
  const byCategory = new Map<string, Product[]>();

  for (const product of products) {
    const list = byCategory.get(product.category) ?? [];
    list.push(product);
    byCategory.set(product.category, list);
  }

  // داخل هر دسته، محصولی که بیشتر افت کرده جلوتر است
  for (const list of byCategory.values()) {
    list.sort(
      (a, b) =>
        priceDelta(a.previousPrice, a.currentPrice) -
        priceDelta(b.previousPrice, b.currentPrice),
    );
  }

  const lists = [...byCategory.values()];
  const picked: Product[] = [];

  for (let round = 0; picked.length < MAX_CATALOG; round += 1) {
    let addedThisRound = false;

    for (const list of lists) {
      if (round >= list.length) continue;
      picked.push(list[round]);
      addedThisRound = true;
      if (picked.length >= MAX_CATALOG) break;
    }

    // همه‌ی دسته‌ها تمام شدند
    if (!addedThisRound) break;
  }

  return picked;
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
    /*
      دسته لازم است چون کارت گفتگو وقتی تصویر بارگذاری نشود، آیکون
      همان دسته را نشان می‌دهد — مثل بقیه‌ی سایت. بدون آن، کاربر
      آیکون شکسته‌ی مرورگر را می‌بیند.
    */
    category: product.category,
    store: product.store,
    currentPrice: product.currentPrice,
    previousPrice: product.previousPrice,
    delta: priceDelta(product.previousPrice, product.currentPrice),
    href: `/product/${product.slug}`,
  };
}

/**
 * شکل پاسخ n8n را یکدست می‌کند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * روی سایت زنده، کاربر این را دید:
 *
 *   { "reply": "این گوشی‌ها زیر ۲ میلیون تومان هستن…", "picks": [ {…} ] }
 *
 * یعنی کل JSON به‌صورت *رشته* داخل `reply` آمده بود و ما مستقیم چاپش
 * کردیم. کارت محصولی هم نیامد، چون `picks` در سطح بیرونی خالی بود.
 *
 * دقیقاً همان درسی که خبرنامه داد: خروجی یک مدل زبانی شکل ثابتی ندارد.
 * گاهی شیء می‌دهد، گاهی رشته‌ی JSON، گاهی داخل بلوک ```json، و n8n هم
 * گاهی همه را در یک آرایه یا زیر `output` می‌پیچد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * قاعده‌ی آخر مهم‌تر از بقیه است
 * ─────────────────────────────────────────────────────────────────────
 * اگر بعد از همه‌ی تلاش‌ها متن هنوز شبیه JSON بود، اصلاً نشانش نمی‌دهیم.
 * جمله‌ی صادقانه‌ی «نتونستم جواب بدم» از آکولاد و کوتیشن روی صفحه‌ی
 * کاربر بهتر است.
 */
function normalize(raw: unknown): AssistantReply {
  let node: unknown = raw;

  /*
    حداکثر سه لایه باز می‌شود.

    بدون سقف، یک پاسخ خودارجاع می‌توانست حلقه‌ی بی‌پایان بسازد — و این
    کد روی درخواست کاربر اجرا می‌شود، نه در پس‌زمینه.
  */
  for (let depth = 0; depth < 3; depth += 1) {
    // n8n معمولاً آیتم‌ها را در آرایه می‌پیچد
    if (Array.isArray(node)) {
      node = node[0];
      continue;
    }

    if (node && typeof node === "object") {
      const obj = node as Record<string, unknown>;

      // پوشش‌های رایج n8n
      if (!("reply" in obj) && (obj.output ?? obj.data ?? obj.json)) {
        node = obj.output ?? obj.data ?? obj.json;
        continue;
      }

      const reply = obj.reply;

      /*
        `reply` که خودش JSON است — همان چیزی که کاربر روی صفحه دید.
        باز می‌شود و از اول بررسی می‌شود.
      */
      if (typeof reply === "string" && looksLikeJson(reply)) {
        const parsed = tryParse(reply);
        if (parsed !== null) {
          node = parsed;
          continue;
        }
      }

      return obj as AssistantReply;
    }

    // رشته‌ی خام در سطح بالا
    if (typeof node === "string") {
      const parsed = tryParse(node);
      if (parsed !== null) {
        node = parsed;
        continue;
      }
      return { reply: node, picks: [] };
    }

    break;
  }

  return (node ?? {}) as AssistantReply;
}

/** بلوک کد مارک‌داون را برمی‌دارد و JSON.parse را امتحان می‌کند */
function tryParse(text: string): unknown | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function looksLikeJson(text: string): boolean {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").trim();
  return (
    (t.startsWith("{") && t.includes('"reply"')) ||
    (t.startsWith("[") && t.includes('"reply"'))
  );
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
    payload = normalize(await response.json());
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

  const reply = String(payload?.reply ?? "").trim();

  /*
    نگهبان آخر.

    اگر با وجود همه‌ی لایه‌بازکردن‌ها متن هنوز شبیه JSON است، یعنی شکل
    پاسخ چیزی است که پیش‌بینی نکرده‌ایم. نشان دادنش به کاربر — آکولاد و
    کوتیشن و اسم فیلد — بدترین حالت ممکن است: هم بی‌فایده، هم سایت را
    خراب نشان می‌دهد.

    این حالت در لاگ سرور ثبت می‌شود تا اگر تکرار شد، شکل تازه را به
    `normalize` اضافه کنیم. خودِ ورک‌فلو هم ممکن است لازم باشد عوض شود.
  */
  if (looksLikeJson(reply) || /^[[{]/.test(reply)) {
    console.error("[assistant] unparsed reply shape:", reply.slice(0, 200));
    return NextResponse.json({
      ok: true,
      reply: "الان نتونستم درست جواب بدم. یه بار دیگه بپرس.",
      picks,
    });
  }

  return NextResponse.json({
    ok: true,
    reply: reply.slice(0, 900),
    picks,
  });
}
