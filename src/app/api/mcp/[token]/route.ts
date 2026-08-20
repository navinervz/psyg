import { authenticateToken } from "@/lib/mcp/auth";
import { handleMcpGet, handleMcpPost } from "@/lib/mcp/handler";

/**
 * اندپوینت MCP — توکن داخل مسیر.
 *
 *     https://psygstore.shop/api/mcp/<PSYG_MCP_TOKEN>
 *
 * چرا این مسیر وجود دارد؟
 * فرم «افزودن کانکتور» در کلاد فقط یک URL می‌گیرد و امکان تنظیم هدر
 * Authorization ندارد (فقط OAuth را پشتیبانی می‌کند). پس برای اتصال
 * از آنجا، توکن باید بخشی از خود آدرس باشد.
 *
 * ⚠️ تفاوت امنیتی با مسیر هدری:
 * توکن در URL ممکن است در لاگ‌های واسط (مثلاً کلادفلر) ثبت شود، در حالی
 * که هدر معمولاً لاگ نمی‌شود. این مصالحه آگاهانه است، چون:
 *
 *  ۱. همه‌ی ابزارها فقط-خواندنی‌اند — بدترین حالت این است که کسی
 *     داده‌ی عمومی محصولات را ببیند.
 *  ۲. تعویض توکن یک دستور است و بلافاصله نسخه‌ی قدیمی را باطل می‌کند.
 *  ۳. مسیر /api/ در robots.txt بسته و پاسخ‌ها noindex هستند.
 *
 * اگر کلاینتت امکان تنظیم هدر دارد، از /api/mcp استفاده کن نه این.
 */

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handleMcpPost(request, authenticateToken(token));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  return handleMcpGet(authenticateToken(token));
}
