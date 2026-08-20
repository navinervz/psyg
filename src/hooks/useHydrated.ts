"use client";

import { useEffect, useState } from "react";

/**
 * تا وقتی کلاینت هیدریت نشده، false برمی‌گرداند.
 *
 * هر کامپوننتی که از localStorage می‌خواند باید در رندر اول همان چیزی را
 * نشان دهد که سرور رندر کرده، وگرنه React خطای hydration mismatch می‌دهد.
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
