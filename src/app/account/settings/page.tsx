import type { Metadata } from "next";
import { SettingsPanel } from "@/components/account/SettingsPanel";

export const metadata: Metadata = {
  title: "تنظیمات حساب",
  robots: { index: false, follow: false },
};

export default function SettingsPage() {
  return <SettingsPanel />;
}
