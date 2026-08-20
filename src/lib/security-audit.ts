import { products } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { MIN_TOKEN_LENGTH } from "@/lib/mcp/auth";

/**
 * ممیزی امنیتی خودکار.
 *
 * هدف: کسی که سواد امنیتی ندارد بتواند با یک دستور بفهمد سایتش کجا
 * ضعف دارد و هر ضعف دقیقاً چه پیامدی دارد.
 *
 * هر یافته سه چیز دارد: چه چیزی غلط است، چرا مهم است، چطور درست شود.
 * توصیه‌ی بدون «چرا» باعث می‌شود آدم یا نادیده‌اش بگیرد یا کورکورانه
 * اجرا کند — هر دو بد است.
 */

export type Severity = "critical" | "high" | "medium" | "low" | "ok";

export type Finding = {
  id: string;
  severity: Severity;
  title: string;
  /** چرا این موضوع اهمیت دارد */
  why: string;
  /** چه کاری باید کرد */
  fix?: string;
};

export type AuditReport = {
  checkedAt: string;
  target: string;
  score: { passed: number; total: number };
  worstSeverity: Severity;
  findings: Finding[];
};

const SEVERITY_ORDER: Severity[] = ["ok", "low", "medium", "high", "critical"];

function worst(findings: Finding[]): Severity {
  return findings.reduce<Severity>((acc, finding) => {
    return SEVERITY_ORDER.indexOf(finding.severity) >
      SEVERITY_ORDER.indexOf(acc)
      ? finding.severity
      : acc;
  }, "ok");
}

/* ─────────────────  بررسی‌هایی که نیاز به شبکه ندارند  ───────────────── */

function auditEnvironment(): Finding[] {
  const findings: Finding[] = [];
  const token = process.env.PSYG_MCP_TOKEN;

  if (!token) {
    findings.push({
      id: "env.mcp-token-missing",
      severity: "ok",
      title: "اندپوینت MCP غیرفعال است",
      why: "بدون توکن، اندپوینت اصلاً پاسخ نمی‌دهد. این امن‌ترین حالت است.",
    });
  } else if (token.length < MIN_TOKEN_LENGTH) {
    findings.push({
      id: "env.mcp-token-weak",
      severity: "critical",
      title: "توکن MCP خیلی کوتاه است",
      why: `توکن زیر ${MIN_TOKEN_LENGTH} کاراکتر با حمله‌ی حدس زدن قابل شکستن است و دسترسی به داده‌های سایت را باز می‌کند.`,
      fix: "با `openssl rand -hex 32` یک توکن جدید بساز و در .env بگذار.",
    });
  } else if (/^(test|dev|secret|token|psyg|1234)/i.test(token)) {
    findings.push({
      id: "env.mcp-token-guessable",
      severity: "high",
      title: "توکن MCP الگوی قابل حدس دارد",
      why: "توکنی که با کلمه‌ی معنادار شروع شود، در حملات فرهنگ‌لغتی زودتر پیدا می‌شود.",
      fix: "توکن باید کاملاً تصادفی باشد: `openssl rand -hex 32`",
    });
  } else {
    findings.push({
      id: "env.mcp-token",
      severity: "ok",
      title: "توکن MCP به‌اندازه‌ی کافی قوی است",
      why: "طول و الگوی توکن قابل قبول است.",
    });
  }

  // متغیرهای NEXT_PUBLIC_ داخل جاوااسکریپت مرورگر جاسازی می‌شوند
  const leaked = Object.keys(process.env).filter(
    (key) =>
      key.startsWith("NEXT_PUBLIC_") &&
      /(SECRET|TOKEN|KEY|PASSWORD|PRIVATE)/i.test(key),
  );

  if (leaked.length > 0) {
    findings.push({
      id: "env.public-secret",
      severity: "critical",
      title: `متغیر محرمانه با پیشوند NEXT_PUBLIC_: ${leaked.join(", ")}`,
      why: "هر متغیری که با NEXT_PUBLIC_ شروع شود داخل جاوااسکریپت مرورگر قرار می‌گیرد و هر بازدیدکننده‌ای می‌تواند ببیندش.",
      fix: "پیشوند NEXT_PUBLIC_ را بردار تا فقط سمت سرور خوانده شود.",
    });
  } else {
    findings.push({
      id: "env.public-secret",
      severity: "ok",
      title: "هیچ متغیر محرمانه‌ای در سمت مرورگر نیست",
      why: "هیچ NEXT_PUBLIC_ حاوی کلمات حساس پیدا نشد.",
    });
  }

  if (!SITE_URL.startsWith("https://")) {
    findings.push({
      id: "env.site-url",
      severity: SITE_URL.includes("localhost") ? "low" : "high",
      title: "NEXT_PUBLIC_SITE_URL با https شروع نمی‌شود",
      why: "این آدرس در canonical و sitemap استفاده می‌شود. آدرس http باعث می‌شود گوگل نسخه‌ی ناامن را ایندکس کند.",
      fix: "در .env مقدار را به https://psygstore.shop تغییر بده و دوباره بیلد کن.",
    });
  } else {
    findings.push({
      id: "env.site-url",
      severity: "ok",
      title: "آدرس سایت روی https تنظیم شده",
      why: "canonical و sitemap آدرس امن تولید می‌کنند.",
    });
  }

  return findings;
}

/** لینک‌های افیلیت باید nofollow sponsored داشته باشند */
function auditAffiliateLinks(): Finding[] {
  const external = products.filter(
    (product) => !product.sourceUrl.startsWith("https://"),
  );

  if (external.length > 0) {
    return [
      {
        id: "affiliate.insecure-source",
        severity: "medium",
        title: `${external.length} محصول لینک مبدأ غیر https دارد`,
        why: "لینک http قابل دستکاری در مسیر است و مرورگر هم هشدار می‌دهد.",
        fix: "لینک‌های sourceUrl در src/data/products.json را به https تغییر بده.",
      },
    ];
  }

  return [
    {
      id: "affiliate.source-links",
      severity: "ok",
      title: "همه‌ی لینک‌های مبدأ امن‌اند",
      why: "هر محصول به یک آدرس https اشاره می‌کند.",
    },
  ];
}

/* ─────────────────────  بررسی‌هایی که شبکه لازم دارند  ───────────────────── */

const REQUIRED_HEADERS: {
  header: string;
  severity: Severity;
  why: string;
  fix: string;
}[] = [
  {
    header: "x-frame-options",
    severity: "medium",
    why: "بدون این هدر، سایت دیگری می‌تواند صفحه‌ی تو را داخل iframe نامرئی بگذارد و کاربر بدون اینکه بفهمد روی دکمه‌های تو کلیک کند (کلیک‌جکینگ).",
    fix: "در next.config.ts هدر X-Frame-Options: SAMEORIGIN تنظیم شود.",
  },
  {
    header: "x-content-type-options",
    severity: "low",
    why: "بدون این هدر مرورگر ممکن است نوع فایل را حدس بزند و فایلی را که متن است به‌عنوان اسکریپت اجرا کند.",
    fix: "هدر X-Content-Type-Options: nosniff اضافه شود.",
  },
  {
    header: "referrer-policy",
    severity: "medium",
    why: "بدون این هدر، آدرس کامل صفحه‌ی تو هنگام کلیک روی لینک خرید به فروشگاه مقصد فرستاده می‌شود — یعنی اطلاعات ناوبری کاربرت لو می‌رود.",
    fix: "هدر Referrer-Policy: strict-origin-when-cross-origin اضافه شود.",
  },
  {
    header: "strict-transport-security",
    severity: "high",
    why: "بدون HSTS، مهاجم در شبکه‌ی مشترک (مثل وای‌فای عمومی) می‌تواند کاربر را به نسخه‌ی http هدایت کند و ترافیکش را بخواند.",
    fix: "این هدر را Nginx می‌دهد؛ در deploy/nginx/psyg.conf فعال است. اگر نبود، یعنی Nginx کانفیگ نشده.",
  },
];

async function auditHeaders(baseUrl: string): Promise<Finding[]> {
  const findings: Finding[] = [];

  let response: Response;
  try {
    response = await fetch(baseUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
  } catch (error) {
    return [
      {
        id: "network.unreachable",
        severity: "high",
        title: "سایت از سمت سرور در دسترس نیست",
        why: `درخواست به ${baseUrl} شکست خورد: ${error instanceof Error ? error.message : "نامشخص"}`,
        fix: "بررسی کن سرویس بالا باشد و NEXT_PUBLIC_SITE_URL درست باشد.",
      },
    ];
  }

  for (const rule of REQUIRED_HEADERS) {
    const value = response.headers.get(rule.header);

    findings.push(
      value
        ? {
            id: `header.${rule.header}`,
            severity: "ok",
            title: `هدر ${rule.header} تنظیم شده`,
            why: `مقدار فعلی: ${value}`,
          }
        : {
            id: `header.${rule.header}`,
            severity: rule.severity,
            title: `هدر ${rule.header} وجود ندارد`,
            why: rule.why,
            fix: rule.fix,
          },
    );
  }

  if (response.headers.get("x-powered-by")) {
    findings.push({
      id: "header.x-powered-by",
      severity: "low",
      title: "هدر X-Powered-By نسخه‌ی فریم‌ورک را لو می‌دهد",
      why: "مهاجم با دانستن نسخه‌ی دقیق، سریع‌تر آسیب‌پذیری‌های شناخته‌شده‌ی همان نسخه را امتحان می‌کند.",
      fix: "در next.config.ts مقدار poweredByHeader: false تنظیم شود.",
    });
  }

  return findings;
}

async function auditRobots(baseUrl: string): Promise<Finding[]> {
  try {
    const response = await fetch(new URL("/robots.txt", baseUrl), {
      signal: AbortSignal.timeout(8000),
    });
    const text = await response.text();

    const mustBlock = ["/go/", "/api/", "/account/"];
    const missing = mustBlock.filter((path) => !text.includes(path));

    if (missing.length > 0) {
      return [
        {
          id: "seo.robots",
          severity: "medium",
          title: `robots.txt این مسیرها را نمی‌بندد: ${missing.join(", ")}`,
          why: "خزیدن گوگل روی لینک‌های افیلیت و صفحه‌های حساب، هم بودجه‌ی خزش را هدر می‌دهد هم می‌تواند به کیفیت دامنه آسیب بزند.",
          fix: "در src/app/robots.ts این مسیرها به disallow اضافه شوند.",
        },
      ];
    }

    return [
      {
        id: "seo.robots",
        severity: "ok",
        title: "robots.txt مسیرهای حساس را می‌بندد",
        why: "مسیرهای /go/ و /api/ و /account/ از خزش خارج‌اند.",
      },
    ];
  } catch {
    return [
      {
        id: "seo.robots",
        severity: "medium",
        title: "robots.txt خوانده نشد",
        why: "بدون robots.txt، خزنده‌ها همه‌جا می‌روند.",
        fix: "بررسی کن /robots.txt پاسخ ۲۰۰ بدهد.",
      },
    ];
  }
}

/* ────────────────────────────  اجرای ممیزی  ──────────────────────────── */

export async function runSecurityAudit(options?: {
  /** اگر false باشد فقط بررسی‌های محلی انجام می‌شود */
  includeNetwork?: boolean;
  baseUrl?: string;
}): Promise<AuditReport> {
  const includeNetwork = options?.includeNetwork ?? true;
  const baseUrl = options?.baseUrl ?? SITE_URL;

  const findings: Finding[] = [
    ...auditEnvironment(),
    ...auditAffiliateLinks(),
  ];

  if (includeNetwork) {
    const [headers, robots] = await Promise.all([
      auditHeaders(baseUrl),
      auditRobots(baseUrl),
    ]);
    findings.push(...headers, ...robots);
  }

  const passed = findings.filter((f) => f.severity === "ok").length;

  return {
    checkedAt: new Date().toISOString(),
    target: baseUrl,
    score: { passed, total: findings.length },
    worstSeverity: worst(findings),
    findings: findings.sort(
      (a, b) =>
        SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity),
    ),
  };
}
