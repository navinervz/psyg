import { authenticate } from "@/lib/mcp/auth";
import { handleMcpGet, handleMcpPost } from "@/lib/mcp/handler";

/**
 * اندپوینت MCP — احراز هویت با هدر.
 *
 *     Authorization: Bearer <PSYG_MCP_TOKEN>
 *
 * این روش امن‌تر است چون توکن در URL و لاگ‌ها ظاهر نمی‌شود. برای هر
 * کلاینتی که امکان تنظیم هدر دارد، از همین استفاده کنید.
 *
 * برای کلاینت‌هایی که فقط یک URL می‌گیرند، مسیر جایگزین:
 *     /api/mcp/<token>
 *
 * قواعد امنیتی:
 *  • بدون توکن معتبر هیچ پاسخی داده نمی‌شود (fail closed)
 *  • همه‌ی ابزارها فقط-خواندنی‌اند
 *  • ایمیل مشترکین و مقدار متغیرهای محرمانه هرگز برنمی‌گردد
 *  • /api/ در robots.txt بسته است
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleMcpPost(request, authenticate(request.headers.get("authorization")));
}

export async function GET(request: Request) {
  return handleMcpGet(authenticate(request.headers.get("authorization")));
}
