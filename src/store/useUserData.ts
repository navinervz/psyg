"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/** یک بار رفتن از PsyG به صفحه‌ی محصول در فروشگاه */
export type PurchaseVisit = {
  productId: string;
  /** ISO — زمانی که کاربر روی «خرید» زد */
  at: string;
};

type UserDataState = {
  /** شناسه‌ی محصولاتی که کاربر پیگیری قیمتشان را روشن کرده */
  tracked: string[];
  /** شناسه‌ی محصولات علاقه‌مندی */
  favorites: string[];
  /**
   * محصولاتی که کاربر روی «خرید» آن‌ها زده و به فروشگاه رفته.
   *
   * این «سفارش» نیست و عمداً هم اسمش را سفارش نگذاشته‌ایم: سفارش، پرداخت
   * و ارسال در دیجی‌کالا انجام می‌شود و ما هیچ راهی برای دانستنش نداریم.
   * چیزی که واقعاً می‌دانیم این است که کاربر از اینجا به آنجا رفت — و
   * همین برای اینکه بعداً یادش بیاید چه چیزهایی را دنبال کرده کافی است.
   */
  purchases: PurchaseVisit[];
  /** برای جلوگیری از ناهماهنگی SSR — تا وقتی هیدریت نشده، لیست‌ها خالی فرض می‌شوند */
  hydrated: boolean;

  toggleTracked: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
  recordPurchase: (productId: string) => void;
  isTracked: (productId: string) => boolean;
  isFavorite: (productId: string) => boolean;
  clearTracked: () => void;
  clearFavorites: () => void;
  clearPurchases: () => void;
};

/**
 * وضعیت کاربر بدون بک‌اند.
 *
 * فاز ۱ حساب کاربری ندارد، پس علاقه‌مندی و پیگیری در localStorage می‌ماند.
 * در فاز ۲ فقط کافی است persist را با فراخوانی API جایگزین کنیم؛
 * امضای اکشن‌ها تغییری نمی‌کند و هیچ کامپوننتی دست نمی‌خورد.
 */
export const useUserData = create<UserDataState>()(
  persist(
    (set, get) => ({
      tracked: [],
      favorites: [],
      purchases: [],
      hydrated: false,

      toggleTracked: (productId) =>
        set((state) => ({
          tracked: state.tracked.includes(productId)
            ? state.tracked.filter((id) => id !== productId)
            : [...state.tracked, productId],
        })),

      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),

      /**
       * تازه‌ترین بازدید بالای لیست می‌نشیند و رکورد قبلی همان محصول حذف
       * می‌شود — وگرنه کسی که سه بار روی یک محصول کلیک کند، سه ردیف
       * تکراری می‌بیند. سقف ۵۰ تا هم گذاشته شده تا localStorage بی‌نهایت
       * رشد نکند.
       */
      recordPurchase: (productId) =>
        set((state) => ({
          purchases: [
            { productId, at: new Date().toISOString() },
            ...state.purchases.filter((p) => p.productId !== productId),
          ].slice(0, 50),
        })),

      isTracked: (productId) => get().tracked.includes(productId),
      isFavorite: (productId) => get().favorites.includes(productId),

      clearTracked: () => set({ tracked: [] }),
      clearFavorites: () => set({ favorites: [] }),
      clearPurchases: () => set({ purchases: [] }),
    }),
    {
      name: "psyg-user-data",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tracked: state.tracked,
        favorites: state.favorites,
        purchases: state.purchases,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);
