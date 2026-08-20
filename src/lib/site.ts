/** آدرس کانونی سایت — در تولید حتماً از متغیر محیطی خوانده شود */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/**
 * نام برند به فارسی نوشته می‌شود چون مخاطب سایت فارسی‌زبان است و همین را
 * جستجو می‌کند. شکل لاتین فقط در دامنه (`psygstore.shop`) باقی می‌ماند.
 */
export const SITE_NAME = "سای‌جی";

/**
 * ایمیل تماس رسمی.
 *
 * از دامنه‌ی خود سایت ساخته می‌شود، نه هاردکد. قبلاً در صفحه‌ی تماس
 * `info@psyg.ir` نوشته شده بود در حالی که دامنه `psygstore.shop` است —
 * یعنی آدرسی که وجود خارجی نداشت. برای صفحه‌ای که کارشناس دیجی‌کالا
 * موقع بررسی مالکیت دامنه می‌بیند، این یعنی رد شدن.
 */
const PRODUCTION_DOMAIN = "psygstore.shop";

/**
 * دامنه‌ی سایت از `NEXT_PUBLIC_SITE_URL` می‌آید، ولی در محیط توسعه آن
 * متغیر ست نیست و آدرس `localhost:3000` می‌شود. نمایش `info@localhost:3000`
 * روی صفحه هم بی‌معنا است هم اگر متغیر در سرور فراموش شود، روی سایت زنده
 * دیده می‌شود. پس هر دامنه‌ی محلی به دامنه‌ی واقعی برمی‌گردد.
 */
function contactDomain(): string {
  const host = SITE_URL.replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];

  if (!host || /^localhost(:\d+)?$/.test(host) || /^127\.|^0\.0\.0\.0/.test(host)) {
    return PRODUCTION_DOMAIN;
  }
  return host;
}

export const CONTACT_EMAIL = `info@${contactDomain()}`;

export const SITE_DESCRIPTION =
  "سای‌جی قیمت محصولات را در فروشگاه‌های مختلف رصد می‌کند، افت قیمت‌ها را نشان می‌دهد و بهترین لحظه‌ی خرید را به تو خبر می‌دهد.";
