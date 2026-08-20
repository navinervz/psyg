/**
 * هوک‌های ماژول برای تست‌رانر داخلی Node.
 *
 * دو کار می‌کنند:
 *  ۱. مسیر `@/...` را مثل tsconfig به `src/...` نگاشت می‌کنند و پسوند
 *     نداشته‌ی ایمپورت‌ها را (.ts / .tsx / index) خودشان پیدا می‌کنند.
 *  ۲. فایل‌های JSON را به یک ماژول با `export default` تبدیل می‌کنند تا
 *     بدون import attribute قابل ایمپورت باشند (مثل رفتار bundler).
 *
 * دلیل وجود این فایل: رجیستری npm در این محیط بسته است و نمی‌توان
 * vitest/jest نصب کرد؛ پس از `node --test` استفاده می‌کنیم.
 */

import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve as resolvePath } from "node:path";

const ROOT = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

const CANDIDATE_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".mjs",
  ".js",
  ".json",
  "/index.ts",
  "/index.tsx",
];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function findFile(basePath) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = basePath + suffix;
    if (suffix === "" && candidate.endsWith("/")) continue;
    if (await exists(candidate)) {
      // پوشه‌ی خالی را به‌عنوان فایل قبول نکن
      if (suffix === "" && !/\.[a-z]+$/.test(candidate)) continue;
      return candidate;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const basePath = join(SRC, specifier.slice(2));
    const file = await findFile(basePath);
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  // ایمپورت نسبی بدون پسوند (رایج در کد TypeScript)
  if (specifier.startsWith(".") && !/\.[a-z]+$/.test(specifier)) {
    const parentPath = dirname(fileURLToPath(context.parentURL));
    const file = await findFile(resolvePath(parentPath, specifier));
    if (file) return { url: pathToFileURL(file).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return {
      format: "module",
      source: `export default ${source};`,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
