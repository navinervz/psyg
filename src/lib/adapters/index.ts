import type { StoreAdapter } from "@/lib/adapters/types";
import { mockAdapter } from "@/lib/adapters/mock";

/**
 * رجیستری آداپتورها.
 * برای افزودن فروشگاه جدید فقط اینجا ثبتش کنید.
 */
const registry: Record<string, StoreAdapter> = {
  digikala: mockAdapter,
};

export function getAdapter(storeId: string): StoreAdapter {
  return registry[storeId] ?? mockAdapter;
}

export { mockAdapter };
export type { StoreAdapter };
