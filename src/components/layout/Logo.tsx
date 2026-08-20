import Link from "next/link";
import { Sparkle } from "@/components/ui/Sparkle";
import { Brand } from "@/components/ui/Brand";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex shrink-0 items-center gap-2"
      aria-label="سای‌جی — صفحه اصلی"
    >
      <Sparkle className="size-7 text-accent transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
      {/*
        از همان کامپوننت `Brand` استفاده می‌شود تا لوگو و هرجای دیگری که
        نام برند در متن می‌آید هیچ‌وقت از هم جدا نیفتند.
      */}
      <Brand className="text-xl tracking-tight sm:text-2xl" />
    </Link>
  );
}
