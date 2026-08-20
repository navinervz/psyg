import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackdropGlow } from "@/components/layout/BackdropGlow";
import { AiSearchBar } from "@/components/hero/AiSearchBar";
import { HeroSection } from "@/components/hero/HeroSection";
import { BestDealsSection } from "@/components/deals/BestDealsSection";
import { FeatureStrip } from "@/components/marketing/FeatureStrip";
import { PartnerMarquee } from "@/components/marketing/PartnerMarquee";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { AffiliateNotice } from "@/components/product/AffiliateNotice";
import { alerts, newestProducts, suggestions } from "@/lib/data";

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
          className="shell flex flex-col gap-5 pt-4 pb-10 xl:flex-row xl:items-start"
        >
          <div dir="rtl" className="flex w-full flex-1 flex-col gap-5">
            <AiSearchBar />
            <HeroSection suggestions={suggestions} />
            <BestDealsSection />
            <FeatureStrip />
            <PartnerMarquee />
            <AffiliateNotice />
          </div>

          <Sidebar alerts={alerts} newest={newestProducts(3)} />
        </main>

        <Footer />
      </div>
    </>
  );
}
