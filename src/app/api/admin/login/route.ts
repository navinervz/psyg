import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  COOKIE_OPTIONS,
  checkPassword,
  isAdminEnabled,
  issueTicket,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/** ورود به پنل ادمین */
export async function POST(request: Request) {
  if (!isAdminEnabled()) {
    return NextResponse.json(
      { ok: false, message: "پنل ادمین پیکربندی نشده است" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "درخواست نامعتبر" }, { status: 400 });
  }

  const { password } = (body ?? {}) as { password?: unknown };

  if (!checkPassword(password)) {
    /*
      عمداً نمی‌گوییم «رمز اشتباه است» در برابر «کاربر وجود ندارد» —
      اینجا فقط یک حساب هست، پس تنها چیزی که می‌شود لو داد همین است.

      تأخیر مصنوعی هم نمی‌گذاریم چون میان‌افزار نرخ درخواست را محدود
      می‌کند و تأخیر فقط سرور را در حمله‌ی حجمی زودتر زمین می‌زند.
    */
    return NextResponse.json({ ok: false, message: "رمز نادرست است" }, { status: 401 });
  }

  const ticket = issueTicket();
  if (!ticket) {
    return NextResponse.json({ ok: false, message: "خطای پیکربندی" }, { status: 503 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, ticket, COOKIE_OPTIONS);
  return response;
}

/** خروج */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
