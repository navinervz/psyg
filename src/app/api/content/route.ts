import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { readArticles, sanitizeArticle, writeArticles } from "@/lib/article-store";

/**
 * دریافت مقاله‌ی تولیدشده از ورک‌فلوی محتوا.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این خطرناک‌تر از `ingest` است و چه کرده‌ایم
 * ─────────────────────────────────────────────────────────────────────
 * `ingest` هیچ بدنه‌ای نمی‌پذیرد — خودش می‌رود از افیلیو می‌خواند. پس
 * توکن لو رفته آنجا فقط یعنی به‌روزرسانی زودهنگام.
 *
 * اینجا نمی‌شود همان کار را کرد: متن را مدل زبانی می‌نویسد و باید از
 * بیرون بیاید. یعنی توکن لو رفته یعنی کسی می‌تواند روی سایت ما مطلب
 * منتشر کند. چهار محدودیت این را مهار می‌کند:
 *
 * ۱. **توکن جدا از `ingest`.** لو رفتن یکی، دیگری را باز نمی‌کند.
 * ۲. **هیچ تگی عبور نمی‌کند** — متنی که `<` یا `>` دارد رد می‌شود.
 * ۳. **جدول پذیرفته نمی‌شود** — مدل‌ها جدول قیمت می‌سازند و عدد را از
 *    خودشان درمی‌آورند.
 * ۴. **مقاله باید به محصول واقعی ارجاع دهد**، وگرنه رد می‌شود. یعنی
 *    مهاجم نمی‌تواند مطلب بی‌ربط منتشر کند؛ فقط می‌تواند درباره‌ی
 *    محصولات خودمان بنویسد.
 *
 * این هنوز به امنیتِ `ingest` نیست. ولی کمترین سطح دسترسی‌ای است که
 * تولید خودکار محتوا اصلاً با آن ممکن می‌شود.
 */

export const dynamic = "force-dynamic";

const MIN_TOKEN_LENGTH = 32;

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function authorize(header: string | null): {
  ok: boolean;
  status?: 401 | 403 | 503;
  message?: string;
} {
  const secret = process.env.PSYG_CONTENT_TOKEN;

  if (!secret || secret.length < MIN_TOKEN_LENGTH) {
    return { ok: false, status: 503, message: "اندپوینت محتوا فعال نیست" };
  }

  const match = /^Bearer\s+(.+)$/i.exec((header ?? "").trim());
  if (!match) return { ok: false, status: 401, message: "توکن لازم است" };

  if (!timingSafeEqual(sha256(match[1]), sha256(secret))) {
    return { ok: false, status: 403, message: "توکن نامعتبر است" };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const auth = authorize(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "JSON نامعتبر" }, { status: 400 });
  }

  const validSlugs = new Set(products.map((p) => p.slug));
  const result = sanitizeArticle(body, validSlugs);

  if ("error" in result) {
    return NextResponse.json({ ok: false, message: result.error }, { status: 422 });
  }

  const stored = await readArticles();

  /*
    مقاله‌ی تکراری جایگزین می‌شود، نه اینکه دوباره اضافه شود.

    بدون این، اگر ورک‌فلو دو بار اجرا می‌شد، دو مقاله با یک `slug` داشتیم
    و `getArticle` همیشه اولی را برمی‌گرداند — یعنی نسخه‌ی تازه‌تر هرگز
    دیده نمی‌شد و کسی هم متوجه نمی‌شد چرا.
  */
  const others = stored.articles.filter((a) => a.slug !== result.article.slug);
  await writeArticles({ ...stored, articles: [...others, result.article] });

  return NextResponse.json({
    ok: true,
    slug: result.article.slug,
    total: others.length + 1,
  });
}

/**
 * حذف مقاله.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا لازم شد
 * ─────────────────────────────────────────────────────────────────────
 * ورک‌فلوی محتوا برای مدتی با `temperature: 0.8` کار می‌کرد و تیترهایی
 * ساخت که فارسی نبودند — «کدوم بخری تا اندازه‌ی معامله‌ات می‌دونه؟» و
 * «برای کسی که دیگه نمی‌خاره؟». پرامپت اصلاح شد ولی آن مقاله‌ها روی
 * سایت ماندند و گوگل ایندکسشان کرد.
 *
 * راهی برای حذفشان نبود: این اندپوینت فقط `POST` و `GET` داشت، و پنل
 * ادمین فقط محصول را پنهان می‌کند نه مقاله را. یعنی محتوای بد یک‌طرفه
 * بود — می‌شد اضافه کرد ولی نمی‌شد پس گرفت.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا `slug` در بدنه و نه در مسیر
 * ─────────────────────────────────────────────────────────────────────
 * مسیر `/api/content/[slug]` یعنی یک روت دیگر با احراز هویت جداگانه.
 * همان توکن، همان اندپوینت، فقط متد فرق می‌کند — کمترین سطح تازه‌ای که
 * لازم بود.
 */
export async function DELETE(request: Request) {
  const auth = authorize(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "JSON نامعتبر" }, { status: 400 });
  }

  const { slugs } = (body ?? {}) as { slugs?: unknown };

  if (!Array.isArray(slugs) || slugs.length === 0) {
    return NextResponse.json(
      { ok: false, message: "فهرست slug لازم است" },
      { status: 422 },
    );
  }

  const wanted = new Set(
    slugs.filter((s): s is string => typeof s === "string" && s.length > 0),
  );

  if (wanted.size === 0) {
    return NextResponse.json(
      { ok: false, message: "هیچ slug معتبری نبود" },
      { status: 422 },
    );
  }

  const stored = await readArticles();
  const kept = stored.articles.filter((a) => !wanted.has(a.slug));
  const removed = stored.articles.length - kept.length;

  /*
    اگر چیزی حذف نشد، فایل را دست نمی‌زنیم.

    نوشتن بی‌دلیل `updatedAt` را جلو می‌برد و بعداً کسی فکر می‌کند
    محتوایی عوض شده. تغییر نکردن هم یک واقعیت است و باید دیده شود.
  */
  if (removed > 0) {
    await writeArticles({ ...stored, articles: kept });
  }

  return NextResponse.json({
    ok: true,
    removed,
    remaining: kept.length,
    /* هرکدام که پیدا نشد، در گزارش می‌آید تا اشتباه تایپی پنهان نماند */
    notFound: [...wanted].filter(
      (s) => !stored.articles.some((a) => a.slug === s),
    ),
  });
}

/** فهرست مقاله‌های تولیدشده — تا ورک‌فلو بداند چه نوشته و تکرار نکند */
export async function GET(request: Request) {
  const auth = authorize(request.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, message: auth.message },
      { status: auth.status, headers: { "Cache-Control": "no-store" } },
    );
  }

  const stored = await readArticles();

  return NextResponse.json({
    ok: true,
    updatedAt: stored.updatedAt,
    articles: stored.articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      date: a.date,
      productSlugs: a.productSlugs ?? [],
    })),
  });
}
