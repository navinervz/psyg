import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Article, ArticleBlock } from "@/lib/types";

/**
 * ذخیره‌ی مقاله‌های تولیدشده.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا این از کاتالوگ و لایه‌ی ادمین جداست
 * ─────────────────────────────────────────────────────────────────────
 * سه نویسنده‌ی مستقل داریم و هرکدام باید فایل خودش را داشته باشد، وگرنه
 * یکی کار دیگری را پاک می‌کند:
 *
 *     catalog.json   ← ورک‌فلوی همگام‌سازی، هر بار کامل بازنویسی
 *     admin.json     ← ادمین از پنل
 *     articles.json  ← ورک‌فلوی تولید محتوا، فقط اضافه می‌کند
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا اعتبارسنجی اینجا این‌قدر سخت‌گیرانه است
 * ─────────────────────────────────────────────────────────────────────
 * برخلاف `ingest` که هیچ بدنه‌ای نمی‌پذیرد و خودش از افیلیو می‌خواند،
 * محتوا ناچار از بیرون می‌آید — چون مدل زبانی آن را می‌نویسد. یعنی
 * توکن لو رفته اینجا معنایش این است که کسی می‌تواند روی سایت ما مطلب
 * منتشر کند.
 *
 * پس هر بلوک از نظر شکل بررسی می‌شود و هرچه در قالب نگنجد دور ریخته
 * می‌شود، نه اینکه «تا حد امکان» پذیرفته شود. مقاله‌ی ناقص بهتر از
 * مقاله‌ای است که HTML دلخواه کسی را رندر کند.
 */

const DATA_DIR = process.env.PSYG_DATA_DIR ?? "/data";
const ARTICLES_FILE = join(DATA_DIR, "articles.json");

/** سقف نگهداری؛ بیشتر از این، فهرست مجله بی‌معنا و صفحه سنگین می‌شود */
const MAX_ARTICLES = 60;

const MAX_TEXT = 1200;
const MAX_BLOCKS = 40;
const MAX_LIST_ITEMS = 12;

export type StoredArticles = {
  updatedAt: string;
  articles: Article[];
};

const EMPTY: StoredArticles = { updatedAt: "", articles: [] };

export async function readArticles(): Promise<StoredArticles> {
  try {
    const raw = await readFile(ARTICLES_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredArticles;
    if (!Array.isArray(parsed?.articles)) return EMPTY;
    return parsed;
  } catch {
    return EMPTY;
  }
}

export async function writeArticles(data: StoredArticles): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });

  const payload: StoredArticles = {
    updatedAt: new Date().toISOString(),
    articles: data.articles.slice(-MAX_ARTICLES),
  };

  const temp = `${ARTICLES_FILE}.${process.pid}.tmp`;
  await writeFile(temp, JSON.stringify(payload), "utf8");
  await rename(temp, ARTICLES_FILE);
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_TEXT) return null;

  /*
    هیچ تگی اجازه‌ی عبور ندارد.

    بدنه‌ی مقاله به‌صورت متن ساده رندر می‌شود، پس تگ اینجا کاری نمی‌کند
    جز اینکه زشت دیده شود. ولی اگر روزی کسی رندر را به `dangerouslySetInnerHTML`
    تغییر داد، این خط تنها چیزی است که بین ما و تزریق اسکریپت می‌ماند.
  */
  if (/[<>]/.test(trimmed)) return null;

  return trimmed;
}

/** بلوک نامعتبر دور ریخته می‌شود، نه اینکه تعمیر شود */
function block(raw: unknown): ArticleBlock | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;

  switch (input.type) {
    case "p":
    case "h2":
    case "quote": {
      const value = text(input.text);
      return value ? ({ type: input.type, text: value } as ArticleBlock) : null;
    }

    case "list": {
      if (!Array.isArray(input.items)) return null;
      const items = input.items
        .map(text)
        .filter((x): x is string => x !== null)
        .slice(0, MAX_LIST_ITEMS);
      return items.length ? { type: "list", items } : null;
    }

    /*
      جدول عمداً پذیرفته نمی‌شود.

      مدل‌های زبانی جدول قیمت می‌سازند و عددها را از خودشان درمی‌آورند.
      روی سایتی که کل ادعایش دقت قیمت است، یک جدول با قیمت اشتباه از
      نبودِ جدول به‌مراتب بدتر است. قیمت فقط از کاتالوگ می‌آید.
    */
    default:
      return null;
  }
}

/**
 * پاک‌سازی یک مقاله‌ی ورودی.
 *
 * `validSlugs` فهرست محصولات واقعی است. مقاله‌ای که به محصول ناموجود
 * ارجاع دهد پذیرفته نمی‌شود — چون کاربر روی لینکش کلیک می‌کند و به ۴۰۴
 * می‌رسد، و این دقیقاً همان چیزی است که اعتماد را از بین می‌برد.
 */
export function sanitizeArticle(
  raw: unknown,
  validSlugs: Set<string>,
): { article: Article } | { error: string } {
  if (!raw || typeof raw !== "object") return { error: "بدنه نامعتبر است" };
  const input = raw as Record<string, unknown>;

  const title = text(input.title);
  if (!title || title.length < 10) return { error: "عنوان خیلی کوتاه است" };

  const excerpt = text(input.excerpt);
  if (!excerpt || excerpt.length < 30) return { error: "خلاصه خیلی کوتاه است" };

  const tag = text(input.tag);
  if (!tag) return { error: "برچسب لازم است" };

  if (!Array.isArray(input.body)) return { error: "بدنه‌ی مقاله لازم است" };

  const body = input.body
    .map(block)
    .filter((b): b is ArticleBlock => b !== null)
    .slice(0, MAX_BLOCKS);

  const words = body.reduce((sum, b) => {
    if (b.type === "list") return sum + b.items.join(" ").split(/\s+/).length;
    // جدول هرگز از `block()` بیرون نمی‌آید، ولی نوع `ArticleBlock` آن را
    // شامل می‌شود و بدون این شاخه، تایپ‌اسکریپت `text` را نمی‌پذیرد
    if (b.type === "table") return sum;
    return sum + b.text.split(/\s+/).length;
  }, 0);

  /*
    سیصد کلمه همان سقفی است که تست `articles.test.ts` برای مقاله‌های
    دستی هم الزام می‌کند. مطلب کوتاه‌تر از این نه به کاربر کمک می‌کند نه
    به سئو — فقط صفحه‌ی خالی می‌سازد.
  */
  if (words < 300) return { error: `مقاله خیلی کوتاه است (${words} کلمه)` };

  const productSlugs = Array.isArray(input.productSlugs)
    ? input.productSlugs.filter(
        (s): s is string => typeof s === "string" && validSlugs.has(s),
      )
    : [];

  const slugSource = text(input.slug);
  const slug = slugSource && /^[a-z0-9-]{4,60}$/.test(slugSource)
    ? slugSource
    : `auto-${Date.now().toString(36)}`;

  if (productSlugs.length === 0) {
    /*
      مقاله بدون محصول واقعی پذیرفته نمی‌شود.

      کل هدف تولید خودکار محتوا این است که از محصولات موجود سایت بنویسد.
      مقاله‌ای که به هیچ محصولی وصل نیست یعنی مدل موضوع را از خودش ساخته
      — همان محتوای بی‌ارزشی که سئو را خراب می‌کند نه بهتر.
    */
    return { error: "مقاله به هیچ محصول واقعی ارجاع نمی‌دهد" };
  }

  return {
    article: {
      slug,
      productSlugs,
      title,
      excerpt,
      date: new Date().toISOString().slice(0, 10),
      /*
        صفر گذاشته می‌شود چون `data.ts` خودش از روی متن حسابش می‌کند.
        اگر از ورودی می‌آمد، مدل می‌توانست «۲ دقیقه» بنویسد روی مقاله‌ای
        که ده دقیقه است — و تست `articles.test.ts` هم دقیقاً همین را
        ممنوع کرده.
      */
      readMinutes: 0,
      tag,
      body,
    },
  };
}
