import type { Metadata, Viewport } from "next";
import { LenisProvider } from "@/components/providers/LenisProvider";
import { Assistant } from "@/components/chat/Assistant";
import { Analytics } from "@/components/layout/Analytics";
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
      <body className="grain bg-night text-hi antialiased">
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
        <LenisProvider>{children}</LenisProvider>

        {/*
          دستیار بیرون از LenisProvider است.

          داخلش که بود، اسکرول نرم Lenis اسکرول داخلی پنل گفتگو را هم
          می‌دزدید و لیست پیام‌ها روی موبایل قفل می‌شد.
        */}
        <Assistant />

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
