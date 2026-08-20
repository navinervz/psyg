import { Card } from "@/components/ui/Card";
import type { ArticleBlock } from "@/lib/types";

/**
 * رندر بدنه‌ی مقاله از بلوک‌های ساختاریافته.
 *
 * چرا JSON و نه Markdown یا MDX؟ چون در فاز دوم ورک‌فلوی n8n قرار است
 * مقاله تولید کند و ساختن JSON ساختاریافته برای یک ورک‌فلو خیلی
 * قابل‌اتکاتر از تولید Markdown تمیز است. ضمناً نیازی به کتابخانه‌ی
 * پارسر و ریسک HTML تزریقی نداریم.
 */
export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="flex flex-col gap-5">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={index}
                className="mt-4 text-xl leading-relaxed font-extrabold text-hi"
              >
                {block.text}
              </h2>
            );

          case "p":
            return (
              <p key={index} className="text-[15px] leading-loose text-mid">
                {block.text}
              </p>
            );

          case "list":
            return (
              <ul key={index} className="flex flex-col gap-2.5">
                {block.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-loose text-mid">
                    <span
                      aria-hidden
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            );

          case "quote":
            return (
              <blockquote
                key={index}
                className="border-e-2 border-accent bg-elevated/40 px-5 py-4 text-[15px] leading-loose font-medium text-hi"
              >
                {block.text}
              </blockquote>
            );

          case "table":
            return (
              <Card key={index} className="overflow-x-auto">
                <table className="w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-line">
                      {block.head.map((cell, i) => (
                        <th
                          key={i}
                          scope="col"
                          className="px-4 py-3 text-start text-xs font-bold text-hi"
                        >
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-4 py-3 text-xs leading-relaxed text-mid"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            );
        }
      })}
    </div>
  );
}
