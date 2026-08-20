import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
        <p className="text-7xl font-extrabold text-accent text-glow nums-fa">
          ۴۰۴
        </p>
        <h1 className="text-2xl font-extrabold text-hi">
          این صفحه پیدا نشد
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-mid">
          شاید محصول حذف شده یا آدرس را اشتباه وارد کرده‌ای. از فرصت‌های
          امروز شروع کن.
        </p>
        <div className="flex gap-3">
          <Link href="/deals">
            <Button>دیدن فرصت‌ها</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">صفحه اصلی</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
