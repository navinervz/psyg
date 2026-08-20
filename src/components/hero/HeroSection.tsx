import { Card } from "@/components/ui/Card";
import { HeroCopy } from "@/components/hero/HeroCopy";
import { RobotMascot } from "@/components/hero/RobotMascot";
import { CategoryChips } from "@/components/hero/CategoryChips";
import { SuggestionsPanel } from "@/components/hero/SuggestionsPanel";
import type { Suggestion } from "@/lib/types";

export function HeroSection({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <Card glow as="section" className="p-4 sm:p-6 md:p-8">
      {/* پنل پیشنهادها از md کنار متن می‌آید؛ در xl که سایدبار برمی‌گردد
          ستون اصلی باریک‌تر می‌شود، پس عرض پنل هم کمی کم می‌شود. */}
      <div className="grid gap-6 md:grid-cols-[1fr_260px] md:gap-8 lg:grid-cols-[1fr_300px]">
        {/* ستون اصلی */}
        <div className="flex min-w-0 flex-col gap-7">
          {/* ستون ربات با کسر تعریف شده نه `auto`؛ با `auto` ربات ۲۶۰ پیکسلی
              عرض ثابت می‌گرفت و در ۷۶۸ پیکسل فقط ۹۶ پیکسل برای تیتر می‌ماند. */}
          <div className="grid min-w-0 items-center gap-6 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <HeroCopy />
            <RobotMascot />
          </div>

          {/*
            اینجا قبلاً `PromptInput` بود و حذف شد.

            دو دلیل داشت. اول اینکه صفحه دو فیلد شبیه به هم داشت —
            `AiSearchBar` بالای صفحه و این یکی — و کاربر نمی‌فهمید کدام
            چه‌کار می‌کند.

            دلیل دوم مهم‌تر بود: آن فیلد اصلاً کار نمی‌کرد.
            `onSubmit={(e) => e.preventDefault()}` یعنی هرچه کاربر تایپ
            می‌کرد و Enter می‌زد، هیچ اتفاقی نمی‌افتاد. یک وعده‌ی جستجوی
            هوشمند در وسط صفحه‌ی اصلی که هیچ‌وقت عمل نمی‌شد.

            جستجوی واقعی در `AiSearchBar` است و گفتگو در دستیار شناور.
          */}
          <CategoryChips />
        </div>

        {/* پنل پیشنهادها */}
        <SuggestionsPanel suggestions={suggestions} />
      </div>
    </Card>
  );
}
