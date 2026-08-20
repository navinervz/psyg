/**
 * اجرای تست‌های e2e روی بیلد پروداکشن.
 *
 * سرور را بالا می‌آورد، منتظر آماده شدنش می‌ماند، تست‌ها را اجرا می‌کند
 * و در پایان سرور را می‌بندد — حتی اگر تست‌ها شکست بخورند.
 *
 * اجرا:  npm run test:e2e   (بعد از npm run build)
 */

import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const PORT = process.env.PORT ?? "3000";
const BASE = `http://localhost:${PORT}`;
const READY_TIMEOUT_MS = 60_000;

/**
 * CLI خود Next را با همان node جاری اجرا می‌کنیم، نه با `npx`.
 *
 * روی ویندوز `npx` یک فایل .cmd است و spawn بدون shell پیدایش نمی‌کند
 * (خطای spawn npx ENOENT). اجرای مستقیم فایل جاوااسکریپت CLI هم این را
 * حل می‌کند، هم از باز شدن یک shell واسط جلوگیری می‌کند — یعنی kill در
 * پایان دقیقاً همان پروسه‌ی سرور را می‌بندد، نه پوسته‌ی والدش را.
 */
const NEXT_BIN = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

function startServer() {
  if (!existsSync(NEXT_BIN)) {
    console.error(`✖ CLI نکست پیدا نشد: ${NEXT_BIN}`);
    console.error("  اول npm install را اجرا کنید.");
    process.exit(1);
  }

  const server = spawn(process.execPath, [NEXT_BIN, "start", "-p", PORT], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "production" },
  });

  server.on("error", (error) => {
    console.error("✖ اجرای سرور شکست خورد:", error.message);
  });

  server.stdout.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) console.log(`[server] ${text}`);
  });
  server.stderr.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) console.error(`[server] ${text}`);
  });

  return server;
}

async function waitForServer() {
  const deadline = Date.now() + READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return true;
    } catch {
      // هنوز بالا نیامده
    }
    await sleep(500);
  }
  return false;
}

function runTests() {
  return new Promise((resolve) => {
    const tests = spawn(
      process.execPath,
      [
        // فایل‌های .ts زیر src/ در پکیج بدون type:module هستند؛ Node هشدار
        // می‌دهد که دارد ESM بازتجزیه می‌کند. به package.json اصلی دست
        // نمی‌زنیم تا پیکربندی Next دست‌نخورده بماند، پس فقط هشدار را
        // خاموش می‌کنیم.
        "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
        "--import",
        "./tests/register.mjs",
        "--test",
        "--test-reporter=spec",
        "--test-concurrency=4",
        "tests/e2e/crawl.test.ts",
      ],
      {
        stdio: "inherit",
        env: { ...process.env, TEST_BASE_URL: BASE },
      },
    );
    tests.on("exit", (code) => resolve(code ?? 1));
  });
}

const server = startServer();
let exitCode = 1;

try {
  console.log("⏳ منتظر بالا آمدن سرور…");
  const ready = await waitForServer();

  if (!ready) {
    console.error("✖ سرور در زمان مقرر بالا نیامد");
  } else {
    console.log(`✓ سرور آماده است روی ${BASE}\n`);
    exitCode = await runTests();
  }
} finally {
  // ویندوز SIGTERM ندارد؛ kill() آنجا خودش TerminateProcess صدا می‌زند.
  server.kill();
  await sleep(400);
  if (!server.killed) server.kill("SIGKILL");
}

process.exit(exitCode);
