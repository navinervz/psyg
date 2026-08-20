import { cookies } from "next/headers";
import type { Metadata } from "next";
import { ADMIN_COOKIE, isAdminEnabled, verifyTicket } from "@/lib/admin-auth";
import { readOverrides } from "@/lib/admin-store";
import { readCatalog } from "@/lib/catalog-store";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

/*
  پنل ادمین هرگز نباید ایندکس شود.

  `robots.ts` هم مسیر را می‌بندد، ولی این لایه‌ی دوم است: اگر روزی کسی
  فایل robots را عوض کرد، صفحه خودش هم می‌گوید ایندکس نشو.
*/
export const metadata: Metadata = {
  title: "پنل مدیریت",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!isAdminEnabled()) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-items-center px-6" dir="rtl">
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <h1 className="pb-2 text-lg font-bold text-hi">پنل فعال نیست</h1>
          <p className="text-sm leading-relaxed text-low">
            متغیر <code className="text-accent">PSYG_ADMIN_PASSWORD</code> روی سرور
            تنظیم نشده. تا وقتی رمزی وجود نداشته باشد، پنل عمداً بسته می‌ماند.
          </p>
        </div>
      </main>
    );
  }

  const store = await cookies();
  if (!verifyTicket(store.get(ADMIN_COOKIE)?.value)) {
    return <AdminLogin />;
  }

  /*
    کاتالوگ خام خوانده می‌شود، نه `products` از `data.ts`.

    فرقش مهم است: `products` محصولات پنهان‌شده را حذف کرده. ادمین باید
    آن‌ها را هم ببیند تا بتواند برشان گرداند — وگرنه محصولی که یک بار
    پنهان کرد برای همیشه از دسترسش خارج می‌شد.
  */
  const [catalog, overrides] = await Promise.all([readCatalog(), readOverrides()]);

  return (
    <AdminDashboard
      catalog={catalog.products}
      manual={overrides.manual}
      hidden={overrides.hidden}
      updatedAt={catalog.updatedAt}
    />
  );
}
