import categoriesJson from "@/data/categories.json";
import storesJson from "@/data/stores.json";
import featuresJson from "@/data/features.json";

import type { Category, Feature, Store } from "@/lib/types";

/**
 * داده‌های مرجع سبک — دسته‌بندی‌ها، فروشگاه‌ها و ویژگی‌ها.
 *
 * چرا از `@/lib/data` جداست؟
 *
 * `lib/data` کاتالوگ کامل محصولات (۷۷ کیلوبایت JSON) و مقاله‌ها
 * (۲۰ کیلوبایت) را ایمپورت می‌کند و `alerts` را در سطح ماژول از روی
 * آن‌ها می‌سازد. این محاسبه‌ی سطح‌ماژول باعث می‌شود tree-shaking نتواند
 * محصولات را حذف کند — یعنی هر کامپوننت کلاینتی که فقط دنبال لیست
 * دسته‌بندی‌هاست، کل کاتالوگ را هم با خودش به مرورگر می‌برد.
 *
 * چون `HeaderActions` در همه‌ی صفحه‌ها هست، این یعنی ۹۷ کیلوبایت اضافه
 * روی هر صفحه.
 *
 * قاعده: کامپوننت‌های `"use client"` فقط از این فایل بخوانند. داده‌ی
 * سنگین باید از کامپوننت سروری به‌صورت prop پایین بیاید.
 */
export const categories = categoriesJson as unknown as Category[];
export const stores = storesJson as unknown as Store[];
export const features = featuresJson as unknown as Feature[];

/** فعلاً فقط دیجی‌کالا وصل است؛ بقیه در نوبت‌اند */
export const activeStores = stores.filter((store) => store.active);

export function getCategory(id: string): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function getStore(id: string): Store | undefined {
  return stores.find((store) => store.id === id);
}
