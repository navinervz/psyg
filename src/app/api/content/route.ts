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
