import { PageShell } from "@/components/layout/PageShell";
import { AccountTabs } from "@/components/account/AccountTabs";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell>
      <div className="flex flex-col gap-5 pt-6">
        {/* روی موبایل ۳xl خیلی بزرگ است و دو خط می‌شود */}
        <h1 className="text-2xl font-extrabold text-hi sm:text-3xl">حساب کاربری</h1>
        <AccountTabs />
      </div>
      {children}
    </PageShell>
  );
}
