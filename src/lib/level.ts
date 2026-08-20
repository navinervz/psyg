/**
 * سطح کاربر بر پایه‌ی فعالیت واقعی.
 *
 * قبلاً «تریدر حرفه‌ای» با ۱۵۰۰ امتیاز به همه نشان داده می‌شد — حتی به
 * کسی که تازه وارد سایت شده بود. عددی که هیچ پشتوانه‌ای ندارد به کاربر
 * می‌گوید بقیه‌ی اعداد سایت هم ممکن است ساختگی باشند، و برای سایتی که
 * کل ارزشش دقت قیمت است این گران تمام می‌شود.
 *
 * حالا امتیاز از کاری می‌آید که کاربر واقعاً کرده است.
 */

export const XP_PER_FAVORITE = 25;
export const XP_PER_TRACKED = 40;

type Level = {
  title: string;
  /** حداقل امتیاز لازم برای رسیدن به این سطح */
  min: number;
};

const LEVELS: Level[] = [
  { title: "تازه‌وارد", min: 0 },
  { title: "کنجکاو", min: 100 },
  { title: "شکارچی تخفیف", min: 300 },
  { title: "خریدار هوشمند", min: 700 },
  { title: "تریدر حرفه‌ای", min: 1500 },
];

export type LevelState = {
  xp: number;
  title: string;
  /** امتیاز لازم برای سطح بعد؛ اگر آخرین سطح باشد برابر xp فعلی */
  nextLevelXp: number;
  isMaxLevel: boolean;
};

export function calculateLevel(
  favoritesCount: number,
  trackedCount: number,
): LevelState {
  const xp =
    favoritesCount * XP_PER_FAVORITE + trackedCount * XP_PER_TRACKED;

  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].min) index = i;
  }

  const isMaxLevel = index === LEVELS.length - 1;

  return {
    xp,
    title: LEVELS[index].title,
    nextLevelXp: isMaxLevel ? LEVELS[index].min : LEVELS[index + 1].min,
    isMaxLevel,
  };
}
