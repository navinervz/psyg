import { NextResponse } from "next/server";
import { products } from "@/lib/data";
import { getAdapter } from "@/lib/adapters";
import { SITE_URL } from "@/lib/site";

/**
 * پویا بودن صریح اعلام می‌شود، نه استنتاج.
 *
 * این مسیر به‌خاطر `searchParams` یا پارامتر مسیر، عملاً پویا بود و
 * Next خودش تشخیص می‌داد. ولی همان اتکای ضمنی جای دیگر باگ ساخت:
 * صفحه‌ی اصلی چون هیچ نشانه‌ی پویایی نداشت، در زمان بیلد پیش‌رندر شد و
 * ماه‌ها می‌توانست محصولات نمونه را به‌جای واقعی نشان دهد.
 *
 * وقتی صفحه‌ای داده‌ی زنده می‌خواند، این تضمین باید نوشته شود نه حدس
 * زده — تا یک تغییر بی‌ربط در آینده نتواند بی‌صدا برش گرداند.
 */
export const dynamic = "force-dynamic";

/**
 * پل خروج به فروشگاه (out-link).
 *
 * چرا واسطه؟
 * ۱. لینک افیلیت در یک نقطه ساخته می‌شود، نه در ده‌ها کامپوننت.
 * ۲. کلیک‌ها قابل شمارش‌اند (فاز ۲: ارسال به n8n / دیتابیس).
 * ۳. اگر ساختار لینک دیجی‌کالا عوض شد، فقط آداپتور تغییر می‌کند.
 * ۴. لینک خروجی از ایندکس گوگل خارج می‌ماند (robots + rel=nofollow sponsored).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const product = products.find((p) => p.id === id || p.slug === id);
  if (!product) {
    return NextResponse.redirect(new URL("/deals", SITE_URL), { status: 302 });
  }

  /*
    ترتیب اولویت مقصد:

    ۱. `affiliateUrl` — لینک واقعی ساخته‌شده در پنل افیلیو. این تنها
       چیزی است که کمیسیون می‌آورد، چون `affid` داخلش یکتاست و فقط
       سیستم افیلیو می‌تواند تولیدش کند.
    ۲. آداپتور فروشگاه — فالبک برای محصولاتی که هنوز لینک افیلیت ندارند.
       کاربر به محصول می‌رسد ولی خریدش به نام ما ثبت نمی‌شود.
  */
  const adapter = getAdapter(product.store);
  const target = product.affiliateUrl ?? adapter.toAffiliateUrl(product.sourceUrl);

  /**
   * ثبت کلیک.
   *
   * در پروداکشن لاگ نمی‌کنیم: هر کلیک روی هر دکمه‌ی خرید یک خط لاگ
   * تولید می‌کرد و لاگ سرور را پر می‌کرد — که هم بی‌فایده است هم باعث
   * می‌شود خطاهای واقعی گم شوند.
   *
   * فاز ۲: به‌جای این، کلیک به وبهوک n8n فرستاده می‌شود تا آمار واقعی
   * کلیک و نرخ تبدیل داشته باشیم.
   */
  if (process.env.NODE_ENV !== "production") {
    console.info("[out-link]", { productId: product.id, store: product.store });
  }

  // 302 نه 301 — چون مقصد ممکن است در آینده تغییر کند و نباید کش دائمی شود
  return NextResponse.redirect(target, { status: 302 });
}
