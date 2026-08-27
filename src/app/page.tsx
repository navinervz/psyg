import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackdropGlow } from "@/components/layout/BackdropGlow";
import { AiSearchBar } from "@/components/hero/AiSearchBar";
import { HeroSection } from "@/components/hero/HeroSection";
import { BestDealsSection } from "@/components/deals/BestDealsSection";
import { FeatureStrip } from "@/components/marketing/FeatureStrip";
import { PartnerMarquee } from "@/components/marketing/PartnerMarquee";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { MobileHero } from "@/components/mobile/MobileHero";
import { MobileCategoryRail } from "@/components/mobile/MobileCategoryRail";
import { MobileTopDrop } from "@/components/mobile/MobileTopDrop";
import { activeCategoryIds, alerts, newestProducts, products } from "@/lib/data";
import { HERO_HEADLINE_TEXT } from "@/lib/site";

/**
 * رندر در زمان درخواست — چون این صفحه از کاتالوگ زنده می‌خواند.
 *
 * ⚠️ نبودِ این خط یک باگ واقعی و بی‌صدا ساخت.
 *
 * کاتالوگ در زمان اجرا از `/data/catalog.json` خوانده می‌شود، ولی آن
 * فایل روی یک والیوم داکر است که فقط موقع اجرا مانت می‌شود — نه موقع
 * بیلد. پس وقتی Next این صفحه را در زمان بیلد پیش‌رندر می‌کرد، فایل
 * وجود نداشت و `data.ts` به داده‌ی نمونه برمی‌گشت.
 *
 * نتیجه: صفحه‌ی اصلی سایت ماه‌ها می‌توانست محصولاتی مثل «AirPods Pro 2»
 * را نشان دهد که اصلاً وجود ندارند، در حالی که `/deals` — که
 * force-dynamic داشت — محصولات واقعی را نشان می‌داد. هیچ خطایی هم
 * جایی ثبت نمی‌شد.
 *
 * تست `static-data.test.ts` این قاعده را خودکار بررسی می‌کند.
 */
export const dynamic = "force-dynamic";

export default function HomePage() {
  /*
    فقط دسته‌هایی که محصول دارند به چیپ‌ها و نوار موبایل می‌روند.

    اینجا حساب می‌شود چون هر دو کامپوننت کلاینتی‌اند و به کاتالوگ دسترسی
    ندارند. صفحه سروری است و `products` را می‌بیند.
  */
  const liveCategories = activeCategoryIds();

  return (
    <>
      <BackdropGlow />

      <div className="relative z-10">
        <Header alerts={alerts} />

        {/*
          مطابق psyg.jpg چیدمان ستون‌ها LTR است: محتوای اصلی چپ، سایدبار راست.
          پس روی خود <main> جهت را ltr می‌کنیم و داخل هر ستون به rtl برمی‌گردیم
          تا متن‌ها و ترتیب عناصر داخلی فارسی بمانند.
        */}
        {/*
          چرا xl و نه lg: در ۱۰۲۴ پیکسل، سایدبار ۳۴۰ پیکسلی ستون اصلی را به
          ~۶۳۰ پیکسل می‌رساند و گرید شش‌ستونه کارت‌های ۸۴ پیکسلی می‌ساخت که
          قیمت و دکمه‌ی خرید در آن‌ها جا نمی‌شد. تا ۱۲۸۰ سایدبار زیر محتوا
          می‌نشیند و ستون اصلی تمام‌عرض می‌ماند.
        */}
        <main
          dir="ltr"
          className="shell flex flex-col gap-3 pt-3 pb-10 sm:gap-5 sm:pt-4 xl:flex-row xl:items-start"
        >
          {/*
            فاصله‌ی بخش‌ها روی موبایل کمتر است.

            `gap-5` روی صفحه‌ی ۳۶۰ پیکسلی زیادی بود: بین هیرو و اولین
            محصول یک نوار خالی می‌ماند که کاربر باید بی‌دلیل از رویش
            رد شود. روی دسکتاپ که ستون پهن‌تر است و کنارش سایدبار
            هست، همان فاصله درست به‌نظر می‌رسد.
          */}
          <div dir="rtl" className="flex w-full flex-1 flex-col gap-3 sm:gap-5">
            {/*
              تنها `<h1>` صفحه.

              دیده نمی‌شود چون هر دو هیرو خودشان همین متن را بزرگ نشان
              می‌دهند — ولی در درخت دسترس‌پذیری و برای گوگل هست، و
              چون یکی است دیگر ابهامی نمی‌سازد.
            */}
            <h1 className="sr-only">{HERO_HEADLINE_TEXT}</h1>

            <AiSearchBar />

            {/*
              ─────────────────────────────────────────────────────────
              دو هیرو، نه یک هیروی ریسپانسیو
              ─────────────────────────────────────────────────────────
              نسخه‌ی قبلی یک `HeroSection` بود که سعی می‌کرد هر دو کار
              را بکند. روی گوشی نتیجه‌اش کارتی شد که کل صفحه‌ی اول را
              می‌گرفت: تیتر، ربات بزرگ، چیپ‌های دسته‌بندی و پنل
              پیشنهادها همه زیر هم. کاربر باید تا ته اسکرول می‌کرد تا
              اولین محصول را ببیند.

              این دو چیدمان واقعاً متفاوت‌اند، نه یک چیدمان در دو
              اندازه. جدا کردنشان از تلنبار کردن کلاس ریسپانسیو روی هم
              صادق‌تر است — و هرکدام می‌تواند بدون شکستن دیگری عوض شود.

              بخش‌های زیرش هم فقط موبایلی‌اند: نوار دسته‌بندی جای
              چیپ‌ها را می‌گیرد و کارت افقی یک محصول را برجسته می‌کند.
              روی دسکتاپ چیپ‌ها و سایدبار همان کار را می‌کنند.
            */}
            <MobileHero className="lg:hidden" />
            <HeroSection className="hidden lg:block" categoryIds={liveCategories} />

            <MobileCategoryRail ids={liveCategories} />
            <MobileTopDrop products={products} />

            <BestDealsSection />
            <FeatureStrip />
            <PartnerMarquee />
          </div>

          <Sidebar alerts={alerts} newest={newestProducts(3)} />
        </main>

        <Footer />
      </div>
    </>
  );
}
