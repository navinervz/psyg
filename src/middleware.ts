import { NextResponse, type NextRequest } from "next/server";

/**
 * محدودیت نرخ روی مسیرهای `/api/`.
 *
 * چرا اینجا و نه در Nginx:
 * کانفیگ `deploy/nginx/psyg.conf` بلوک `limit_req` دارد، ولی سایت با
 * Cloudflare Tunnel منتشر می‌شود و Nginx اصلاً در مسیر درخواست نیست. یعنی
 * محدودیتی که در مستندات ادعا شده بود، در پروداکشن وجود نداشت و
 * `/api/subscribe` و `/api/mcp` بدون هیچ سقفی قابل کوبیدن بودند.
 *
 * پیاده‌سازی عمداً ساده است: پنجره‌ی لغزان در حافظه‌ی همان پروسه. چون فقط
 * یک کانتینر بالاست، این کافی است. اگر روزی چند اینستنس شد، این ماژول باید
 * به Redis منتقل شود — وگرنه سقف واقعی در تعداد اینستنس‌ها ضرب می‌شود.
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;

/** سقف هر مسیر در دقیقه */
const LIMITS: { prefix: string; max: number }[] = [
  /*
    پیشنهاد لحظه‌ای سرچ‌بار: با هر مکث تایپ یک درخواست می‌رود. سقف پایین
    اینجا یعنی کاربری که چند بار جستجو می‌کند بلاک می‌شود. پاسخ‌ها هم سبک
    و فقط-خواندنی‌اند، پس هزینه‌ی سوءاستفاده‌اش کم است.
  */
  { prefix: "/api/search", max: 120 },
  // کلاینت MCP در یک نشست چند ابزار پشت‌سرهم صدا می‌زند، پس سقفش بالاتر است
  { prefix: "/api/mcp", max: 40 },
  /*
    فهرست فرصت‌ها به‌صورت JSON.

    داده‌اش محرمانه نیست — همان چیزی است که در `/deals` دیده می‌شود — ولی
    برخلاف یک صفحه‌ی HTML، آماده و ساختاریافته تحویل می‌دهد و برای کپی
    کردن کاتالوگ وسوسه‌انگیز است.

    عدد ۳۰ با نگاه به مصرف‌کننده‌های واقعی انتخاب شده: خبرنامه هفته‌ای
    یک بار صدایش می‌زند و خود سایت اصلاً از آن استفاده نمی‌کند. پس این
    سقف برای هیچ استفاده‌ی درستی تنگ نیست.
  */
  { prefix: "/api/deals", max: 30 },

  /*
    فید کاتالوگ — عمومی و فقط‌خواندنی، ولی سنگین‌تر از بقیه است چون کل
    کاتالوگ را برمی‌گرداند. سقفش پایین‌تر از جستجوست تا کسی نتواند با
    فراخوانی پیاپی سرور را مشغول کند.
  */
  { prefix: "/api/feed", max: 20 },
  /*
    ثبت ایمیل: یک انسان واقعی بیش از چند بار در دقیقه این کار را نمی‌کند.
    عدد ۱۰ عمدی است نه دلبخواه — مجموعه‌ی e2e چهار درخواست پشت‌سرهم به این
    مسیر می‌زند و با سقف ۵ اگر تست دو بار در یک دقیقه اجرا می‌شد، قرمز
    می‌شد بدون اینکه چیزی خراب شده باشد.
  */
  { prefix: "/api/subscribe", max: 10 },
  /*
    فرم تماس: هر فراخوانی یک ایمیل واقعی می‌فرستد.

    سقف پایین‌تر از خبرنامه است چون هزینه‌اش بالاتر است — هم سهمیه‌ی
    Resend مصرف می‌شود هم صندوق ورودی ما پر. آدم واقعی در یک دقیقه
    بیش از سه بار فرم تماس پر نمی‌کند.
  */
  { prefix: "/api/contact", max: 3 },
  /*
    ورود داده از n8n: در حالت عادی هر چند ساعت یک بار اجرا می‌شود.
    سقف پایین یعنی اگر توکن لو رفت، مهاجم نتواند با فراخوانی پشت‌سرهم
    سرور را درگیر کند — هر فراخوانی هفت درخواست به افیلیو می‌فرستد.
  */
  { prefix: "/api/ingest", max: 6 },
  /*
    ورود به پنل ادمین: تنها مسیری که رمز را می‌سنجد، پس تنها مسیری که
    ارزش حمله‌ی حدس رمز دارد. سقف ۵ در دقیقه یعنی حتی با رمز ضعیف هم
    جستجوی فراگیر عملاً ناممکن می‌شود.

    ادمین واقعی در بدترین حالت دو سه بار اشتباه تایپ می‌کند.
  */
  { prefix: "/api/admin/login", max: 5 },
  /*
    دستیار خرید: هر فراخوانی یک درخواست واقعی به مدل زبانی است.

    بدون سقف اختصاصی به پیش‌فرض ۶۰ می‌افتاد — یعنی یک نفر می‌توانست
    دقیقه‌ای شصت بار مدل را صدا بزند و سهمیه‌ی کلیدها را بسوزاند. این
    تنها اندپوینت سایت است که هر درخواستش هزینه‌ی واقعی دارد.

    دوازده در دقیقه برای گفتگوی طبیعی زیاد هم هست: کسی که واقعاً دارد
    مشورت می‌گیرد، بین هر پیام چند ثانیه فکر می‌کند.
  */
  { prefix: "/api/assistant", max: 12 },
  /*
    فهرست مشترکان: خروجی‌اش نشانی ایمیل آدم‌های واقعی است.

    فقط ورک‌فلوی خبرنامه صدایش می‌زند، هفته‌ای یک بار. سقف پایین یعنی
    اگر توکن روزی لو رفت، مهاجم نتواند فهرست را با درخواست‌های پشت‌سرهم
    استخراج کند.
  */
  { prefix: "/api/subscribers", max: 4 },
  /*
    ورود محتوا از ورک‌فلوی تولید مقاله — هر دو روز یک بار اجرا می‌شود.
  */
  { prefix: "/api/content", max: 6 },
];

const DEFAULT_MAX = 60;

const buckets = new Map<string, Bucket>();

/** جلوگیری از رشد بی‌نهایت مپ وقتی ترافیک از IPهای زیاد می‌آید */
function sweep(now: number) {
  if (buckets.size < 5_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * پشت Cloudflare، `request.ip` آدرس خود کلادفلر است. آدرس واقعی کاربر در
 * `cf-connecting-ip` می‌آید. `x-forwarded-for` فقط فالبک است و چون قابل جعل
 * است هرگز به‌تنهایی ملاک نیست — اینجا فقط برای محیط بدون کلادفلر می‌ماند.
 */
function clientKey(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function limitFor(pathname: string): number {
  return LIMITS.find((l) => pathname.startsWith(l.prefix))?.max ?? DEFAULT_MAX;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const now = Date.now();

  sweep(now);

  const max = limitFor(pathname);

  /*
    کلید شامل خانواده‌ی مسیر است تا مصرف زیاد یک اندپوینت، اندپوینت دیگر را
    نبندد. فقط دو سطح اول گرفته می‌شود («/api/mcp») تا توکن‌های مختلف در
    `/api/mcp/<token>` سطل‌های جدا نسازند و سقف دور زده نشود.
  */
  const family = pathname.split("/").slice(0, 3).join("/");
  const key = `${clientKey(request)}:${family}`;

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  bucket.count += 1;

  if (bucket.count > max) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    // بدنه‌ی پاسخ عمداً چیزی درباره‌ی سقف یا وضعیت داخلی نمی‌گوید
    return new NextResponse(
      JSON.stringify({ ok: false, message: "درخواست‌های بیش از حد" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(retryAfter),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
