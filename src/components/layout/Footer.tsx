import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { Brand } from "@/components/ui/Brand";
import { toFaDigits } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

const COLUMNS = [
  {
    title: "پلتفرم",
    links: [
      { label: "فرصت‌ها", href: "/deals" },
      { label: "فروشگاه‌ها", href: "/stores" },
      { label: "مجله", href: "/mag" },
    ],
  },
  {
    title: "حساب کاربری",
    links: [
      { label: "علاقه‌مندی‌ها", href: "/account/favorites" },
      { label: "هشدارهای قیمت", href: "/account/alerts" },
      { label: "تنظیمات", href: "/account/settings" },
    ],
  },
  {
    title: SITE_NAME,
    links: [
      { label: "درباره ما", href: "/about" },
      { label: "تماس با ما", href: "/contact" },
      { label: "قوانین و حریم خصوصی", href: "/privacy" },
    ],
  },
];

/**
 * ─────────────────────────────────────────────────────────────────────
 * چرا این جمله برعکس شد
 * ─────────────────────────────────────────────────────────────────────
 * نسخه‌ی قبلی با «محصولی نمی‌فروشد» شروع می‌شد و بلافاصله از کمیسیون
 * حرف می‌زد. یعنی اولین چیزی که کاربر درباره‌ی ما می‌خواند، این بود که
 * از او پول درمی‌آوریم — قبل از اینکه بداند اصلاً چه کاری برایش می‌کنیم.
 *
 * حالا ترتیب برعکس است: اول کاری که انجام می‌شود، بعد شفاف‌سازی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا اصلاً می‌ماند
 * ─────────────────────────────────────────────────────────────────────
 * حذفش وسوسه‌کننده بود ولی سه چیز را خراب می‌کرد:
 *
 * ۱. شرایط برنامه‌های همکاری در فروش (افیلیو و دیجی‌کالا) افشا را
 *    الزامی کرده‌اند. بسته شدن حساب یعنی درآمد سایت صفر، نه کم.
 * ۲. گوگل برای محتوای افیلیت افشا می‌خواهد؛ نبودش مصداق «محتوای افیلیت
 *    بدون ارزش افزوده» در راهنمای اسپم است.
 * ۳. همان چیزی است که بقیه‌ی ادعاهای سایت را باورپذیر می‌کند. سایتی که
 *    درباره‌ی درآمد خودش رک است، درباره‌ی قیمت‌ها هم باورپذیرتر است.
 *
 * پس جایش عوض شد نه محتوایش: از وسط صفحه‌ی اصلی به فوتر، با فونت ریز.
 * دیده می‌شود اگر کسی دنبالش بگردد، ولی پیام اول سایت نیست.
 */
const DISCLOSURE =
  "قیمت‌ها را هر روز رصد می‌کند و فرصت‌های واقعی را پیدا می‌کند — رایگان و بدون تبلیغات. خرید در خود فروشگاه انجام می‌شود؛ اگر از لینک ما بخری ممکن است کمیسیون بگیریم، بدون اینکه قیمت برای تو تغییر کند.";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line py-12">
      <div className="shell grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs text-xs leading-relaxed text-mid">
            <Brand glow={false} /> قیمت محصولات رو در فروشگاه‌های مختلف رصد می‌کنه
            و بهترین لحظه‌ی خرید رو بهت خبر می‌ده.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-hi">{column.title}</h3>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-mid transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="shell mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
        <p className="text-[11px] text-low nums-fa">
          © {toFaDigits(new Date().getFullYear())} <Brand glow={false} /> — تمام
          حقوق محفوظ است.
        </p>
        <p className="max-w-xl text-[11px] leading-relaxed text-low sm:text-end">
          <Brand glow={false} /> {DISCLOSURE} ملاک نهایی، قیمت درج‌شده در خود
          فروشگاه است.
        </p>
      </div>
    </footer>
  );
}
