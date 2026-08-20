"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { ACCOUNT_TABS } from "@/components/account/AccountTabs";
import { useUserData } from "@/store/useUserData";

export function ProfileMenu() {
  const router = useRouter();
  const clearFavorites = useUserData((s) => s.clearFavorites);
  const clearTracked = useUserData((s) => s.clearTracked);

  /**
   * فاز اول احراز هویت ندارد، پس «خروج» یعنی پاک کردن داده‌های
   * ذخیره‌شده در همین مرورگر — نه بستن یک نشست سمت سرور.
   */
  const handleSignOut = () => {
    clearFavorites();
    clearTracked();
    router.push("/");
  };

  return (
    <ul className="flex flex-col">
      {ACCOUNT_TABS.map(({ icon: Icon, label, href }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex items-center gap-3 border-t border-line px-5 py-3.5 transition-colors duration-300 hover:bg-elevated/60"
          >
            <Icon
              className="size-4 text-low transition-colors group-hover:text-accent"
              strokeWidth={1.8}
            />
            <span className="flex-1 text-xs font-medium text-mid transition-colors group-hover:text-hi">
              {label}
            </span>
            <ChevronLeft className="size-4 text-low transition-transform duration-300 group-hover:-translate-x-1" />
          </Link>
        </li>
      ))}

      <li>
        <button
          type="button"
          onClick={handleSignOut}
          title="داده‌های ذخیره‌شده در این مرورگر پاک می‌شود"
          className="group flex w-full cursor-pointer items-center gap-3 border-t border-line px-5 py-3.5 transition-colors duration-300 hover:bg-elevated/60"
        >
          <LogOut
            className="size-4 text-low transition-colors group-hover:text-danger"
            strokeWidth={1.8}
          />
          <span className="flex-1 text-start text-xs font-medium text-mid transition-colors group-hover:text-hi">
            خروج
          </span>
          <ChevronLeft className="size-4 text-low transition-transform duration-300 group-hover:-translate-x-1" />
        </button>
      </li>
    </ul>
  );
}
