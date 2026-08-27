import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { OverflowProbe } from "@/components/debug/OverflowProbe";
import { Analytics } from "@/components/layout/Analytics";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "سای‌جی — بهترین فرصت خرید رو پیدا کن",
    template: "%s | سای‌جی",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "مقایسه قیمت",
    "تخفیف",
    "رصد قیمت",
    "هشدار قیمت",
    "خرید هوشمند",
    "دیجی‌کالا",
  ],
  alternates: { canonical: "/" },

  /*
    ─────────────────────────────────────────────────────────────────
    آیکون‌ها
    ─────────────────────────────────────────────────────────────────
    خود فایل‌ها اینجا اعلام نمی‌شوند: Next آن‌ها را از روی نامشان در
    `src/app/` پیدا می‌کند و تگ‌هایش را می‌سازد —
    `favicon.ico`، `icon.png` و `apple-icon.png`.

    تا امروز هیچ‌کدام وجود نداشتند و نتیجه‌اش در نتایج گوگل دیده
    می‌شد: کنار psygstore.shop یک کره‌ی خاکستری خالی می‌نشست، در حالی
    که رقیب بغل‌دستی لوگوی خودش را داشت.

    نکته‌ای که فقط با نگاه کردن معلوم شد: تصویر اصلی لوگو حاشیه‌ی
    مشکی بزرگی داشت و اگر مستقیم کوچک می‌شد، در ۱۶ پیکسل به یک نقطه‌ی
    محو تبدیل می‌شد. برش تا خودِ لوگو لازم بود، نه فقط تغییر اندازه.
  */
  manifest: "/site.webmanifest",

  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "سای‌جی — بهترین فرصت خرید رو پیدا کن",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "سای‌جی — بهترین فرصت خرید رو پیدا کن",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  /*
    تأیید مالکیت در گوگل سرچ کنسول.

    گوگل چند راه برای اثبات مالکیت می‌دهد؛ این یکی یک تگ `meta` در
    `<head>` می‌گذارد. راه جایگزین رکورد DNS است که پایدارتر است ولی
    نیاز به دسترسی به پنل دامنه دارد.

    اگر متغیر ست نشده باشد، `undefined` می‌ماند و Next اصلاً تگ را
    رندر نمی‌کند — یعنی نبودش هیچ اثری روی صفحه ندارد.

    ⚠️ این مقدار در زمان بیلد خوانده می‌شود، نه اجرا. بعد از تنظیمش
    باید دوباره بیلد شود وگرنه تگ ظاهر نمی‌شود و تأیید گوگل شکست
    می‌خورد — با پیامی که علتش را نمی‌گوید.
  */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  themeColor: "#08090A",
  colorScheme: "dark",

  /*
    ─────────────────────────────────────────────────────────────────────
    چرا مقیاس قفل شده
    ─────────────────────────────────────────────────────────────────────
    نسخه‌ی قبلی فقط `width=device-width, initial-scale=1` داشت (پیش‌فرض
    Next). روی گوشی کاربر، سافاری صفحه را با مقیاس ۰٫۷۵ رندر می‌کرد و
    نوار پایین از جایش درمی‌رفت.

    شواهد از خود دستگاه، دو اسکرین‌شات از همان صفحه:

      مقیاس ۱۰۰٪ → عرض ۳۲۰، بدون سرریز، نوار پایین **درست**
      مقیاس  ۷۵٪ → عرض ۴۲۷، بدون سرریز، نوار پایین خراب

    یعنی سایت سالم بود و زوم علت بود. زیر زوم، سافاری iOS المان‌های
    `position: fixed` را به viewport چیدمانی می‌چسباند ولی کاربر ناحیه‌ی
    بزرگ‌تری می‌بیند — و هیچ ترفند CSS داخل آن المان به آن ناحیه
    نمی‌رسد، چون با خودش بریده می‌شود.

    `minimumScale` مهم‌تر از `maximumScale` است: مشکل زوم *به بیرون* بود،
    نه به داخل. دیجی‌کالا هم `maximum-scale=1.0` می‌گذارد.

    ─────────────────────────────────────────────────────────────────────
    هزینه‌ای که می‌پذیریم
    ─────────────────────────────────────────────────────────────────────
    قفل کردن زوم برای کسی که کم‌بینا است و روی متن زوم می‌کند، بد است.
    دو چیز این را قابل قبول می‌کند: سافاری iOS زوم با دو انگشت را از
    نسخه‌ی ۱۰ به بعد به هر حال اجازه می‌دهد و این مقادیر را برای آن
    نادیده می‌گیرد، و تنظیم Page Zoom مرورگر هم سر جایش می‌ماند. چیزی
    که این خط جلویش را می‌گیرد، رندر شدنِ *اولیه* در مقیاس غیر یک است.
  */
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
      `reveal-armed` روی خود سرور رندر می‌شود، نه با جاوااسکریپت.
      اگر اسکریپت اینلاین آن را اضافه می‌کرد، HTML سرور با کلاینت فرق
      می‌کرد و React خطای hydration mismatch می‌داد.

      حالت بدون جاوااسکریپت با تگ <noscript> پایین پوشش داده شده.
    */
    <html lang="fa" dir="rtl" className="reveal-armed">
      <head>
        {/*
          ══════════════════════════════════════════════════════════════
          پیش‌بارگذاری فونت‌ها
          ══════════════════════════════════════════════════════════════
          اندازه‌گیری روی سایت زنده: دانلود فونت‌ها در میلی‌ثانیه‌ی ۱۱۹۲
          شروع می‌شد و ۱۷۸۸ تمام می‌شد. یعنی کاربر نزدیک دو ثانیه متن را
          با فونت پیش‌فرض سیستم می‌دید و بعد کل صفحه با آمدن فونت جابه‌جا
          می‌شد.

          دلیلش زنجیره‌ی کشف است: مرورگر اول HTML را می‌گیرد، بعد CSS را
          دانلود و تجزیه می‌کند، بعد می‌فهمد کدام `@font-face` واقعاً
          استفاده شده، و تازه آن‌وقت سراغ فونت می‌رود. سه رفت‌وبرگشت پشت
          سر هم.

          `preload` این زنجیره را دور می‌زند: مرورگر همان لحظه‌ای که HTML
          را می‌خواند دانلود را شروع می‌کند، هم‌زمان با CSS.

          `crossorigin` اجباری است حتی برای فونت خودمیزبان. بدون آن
          مرورگر دو بار دانلود می‌کند — یک بار برای preload و یک بار
          برای خود فونت — چون درخواست فونت همیشه در حالت CORS است و با
          درخواست غیر-CORS یکی شمرده نمی‌شود.
        */}
        <link
          rel="preload"
          href="/fonts/BYekan.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/AGhasem.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/*
          تصویر همه‌ی محصولات از CDN دیجی‌کالا می‌آید. `preconnect` یعنی
          DNS و دست‌دادن TLS همین حالا انجام شود، نه وقتی اولین تصویر
          لازم شد — چون آن تصویرها `lazy` هستند و دیر شروع می‌شوند.
        */}
        <link rel="preconnect" href="https://dkstatics-public.digikala.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://dkstatics-public.digikala.com" />
      </head>
      {/*
        `pb-[64px]` فقط برای حالت دسکتاپ‌مانند باقی مانده.

        روی موبایل دیگر لازم نیست: محتوا داخل `.psyg-scroller` است و
        نوار پایین بیرونش، پس چیزی زیر نوار نمی‌رود که پنهان شود. آن
        قاعده در `globals.css` خنثی می‌شود.
      */}
      <body className="grain bg-night pb-[64px] text-hi antialiased lg:pb-0">
        {/* بدون جاوااسکریپت، انیمیشنی در کار نیست پس محتوا باید دیده شود */}
        <noscript>
          <style>{`html.reveal-armed .will-reveal{opacity:1 !important}`}</style>
        </noscript>

        {/*
          تور نجات نهایی.

          اگر انیمیشن ورود به هر دلیلی شلیک نکرد — تداخل کتابخانه‌ها، خطای
          زمان اجرا، یا کامپوننتی که یادمان رفته هوک انیمیشن را صدا بزند —
          محتوا نباید برای همیشه نامرئی بماند. بعد از چهار ثانیه هرچه هنوز
          پنهان است نمایش داده می‌شود.

          این دقیقاً همان چیزی است که نبودش باعث می‌شد کلیک روی فیلتر
          دسته‌بندی صفحه را خالی کند و صفحه‌های علاقه‌مندی خالی به نظر
          برسند.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "setTimeout(function(){document.documentElement.classList.remove('reveal-armed');" +
              "document.querySelectorAll('.will-reveal').forEach(function(el){" +
              "if(getComputedStyle(el).opacity==='0'){el.style.opacity='1';el.style.transform='none';}});},4000)",
          }}
        />

        {/* داده‌ی ساختاریافته‌ی سایت + جستجوی داخلی برای گوگل */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_NAME,
              url: SITE_URL,
              description: SITE_DESCRIPTION,
              inLanguage: "fa-IR",
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_URL}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />

        {/*
          ─────────────────────────────────────────────────────────────
          چرا محتوا داخل یک ظرف اسکرول جداست
          ─────────────────────────────────────────────────────────────
          روی موبایل، این ظرف اسکرول می‌کند و خود سند بی‌حرکت می‌ماند.
          نوار پایین بیرون از آن است و دیگر `position: fixed` نیست.

          دلیلش را با اندازه‌گیری فهمیدیم، بعد از سه اصلاح ناموفق:
          لایه‌ی هم‌رنگ زیر نوار روی سرور زنده کاملاً درست بود
          (`323.5px | rgb(15, 17, 16) | top: 100%`) و باز روی گوشی چیزی
          نمی‌کشید. یعنی زیر زوم، سافاری iOS رسمِ المان ثابت را به
          viewport چیدمانی می‌برد و هیچ چیزی *داخل* آن به ناحیه‌ی
          دیده‌شده نمی‌رسد.

          راه‌حل پوشاندن آن ناحیه نبود؛ این بود که آنجا محتوایی نباشد.

          فقط زیر `lg` اعمال می‌شود — همان‌جا که نوار پایین وجود دارد و
          Lenis خاموش است. روی دسکتاپ سند مثل قبل اسکرول می‌کند.
        */}
        <div className="psyg-scroller">
          <LenisProvider>{children}</LenisProvider>
        </div>

        {/*
          نوار پایین موبایل — بیرون از ظرف اسکرول، وگرنه با محتوا بالا و
          پایین می‌رود.
        */}
        <MobileTabBar />

        {/*
          آشکارساز سرریز افقی — موقتی، فقط با `?probe=1`.

          `useSearchParams` نیاز به مرز Suspense دارد وگرنه Next کل
          صفحه را از رندر ایستا خارج می‌کند. اینجا مهم نیست چون این
          صفحه‌ها از قبل پویا هستند، ولی مرز را می‌گذاریم تا اگر روزی
          صفحه‌ای ایستا شد، این کامپوننت بی‌صدا خرابش نکند.

          بعد از حل شدن باگ نوار پایین حذف می‌شود.
        */}
        <Suspense fallback={null}>
          <OverflowProbe />
        </Suspense>

        {/*
          آنالیتیکس آخر از همه.

          `next/script` با `afterInteractive` خودش زمان‌بندی را مدیریت
          می‌کند، ولی جای فیزیکی‌اش در انتهای بدنه یعنی حتی اگر روزی
          استراتژی عوض شد، باز هم بعد از محتوا می‌آید.
        */}
        <Analytics />
      </body>
    </html>
  );
}
