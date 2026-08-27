"use client";

import { useEffect, useState } from "react";

/**
 * اعداد واقعی viewport روی خود دستگاه.
 *
 * عمداً بدون هیچ وابستگی به بقیه‌ی سیستم طراحی نوشته شده — استایل‌ها
 * inline‌اند تا اگر مشکل از خود CSS سایت باشد، این صفحه هم گرفتارش نشود.
 */

type Row = { label: string; value: string; flag?: "good" | "bad" };

export function ViewportProbe() {
  const [rows, setRows] = useState<Row[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const read = () => {
      const vv = window.visualViewport;
      const doc = document.documentElement;

      /*
        نوار واقعی را اندازه می‌گیریم، نه کپی‌اش.

        اگر نوار اصلاً در DOM نباشد (مثلاً چون این صفحه در عرض دسکتاپ
        باز شده) همین را می‌گوییم به‌جای اینکه صفر گزارش کنیم.
      */
      const bar = document.querySelector(".psyg-tabbar");
      const barRect = bar?.getBoundingClientRect();

      /*
        مقدار واقعی safe-area را از یک المان آزمایشی می‌خوانیم.
        `getComputedStyle` روی خود متغیر جواب نمی‌دهد.
      */
      const probe = document.createElement("div");
      probe.style.cssText =
        "position:fixed;visibility:hidden;height:env(safe-area-inset-bottom)";
      document.body.appendChild(probe);
      const safeArea = getComputedStyle(probe).height;
      probe.remove();

      const vvBottom = getComputedStyle(doc)
        .getPropertyValue("--vv-bottom")
        .trim();

      /*
        ─────────────────────────────────────────────────────────────
        مهم‌ترین عدد این صفحه
        ─────────────────────────────────────────────────────────────
        وقتی کاربر با دو انگشت زوم کرده باشد، viewport چیدمانی و
        دیداری از هم جدا می‌شوند. `position: fixed` به اولی می‌چسبد
        ولی کاربر دومی را می‌بیند — و اختلافشان می‌شود نواری از محتوا
        که زیر نوار پایین دیده می‌شود.

        هیچ‌کدام از سه اصلاح قبلی این را درست نمی‌کرد، چون هیچ‌کدام
        باگ نبودند: سایت در مقیاس ۱ درست کار می‌کند.

        `user-scalable=no` عمداً استفاده نمی‌شود — زوم یک ابزار
        دسترس‌پذیری است و گرفتنش از کاربر، درمانِ بدتر از درد است.
        (سافاری iOS هم مدت‌هاست نادیده‌اش می‌گیرد.)
      */
      const zoomed = vv ? Math.abs(vv.scale - 1) > 0.01 : false;

      const next: Row[] = [
        {
          label: "زوم صفحه",
          value: vv ? `${Math.round(vv.scale * 100)}٪` : "—",
          flag: zoomed ? "bad" : "good",
        },
        { label: "window.innerWidth", value: `${window.innerWidth}` },
        { label: "documentElement.clientWidth", value: `${doc.clientWidth}` },
        { label: "scrollWidth (سرریز افقی؟)", value: `${doc.scrollWidth}`,
          flag: doc.scrollWidth > doc.clientWidth + 1 ? "bad" : "good" },
        { label: "window.innerHeight", value: `${window.innerHeight}` },
        { label: "documentElement.clientHeight", value: `${doc.clientHeight}` },
        { label: "visualViewport.height", value: vv ? `${Math.round(vv.height)}` : "—" },
        { label: "visualViewport.offsetTop", value: vv ? `${Math.round(vv.offsetTop)}` : "—" },
        { label: "visualViewport.pageTop", value: vv ? `${Math.round(vv.pageTop)}` : "—" },
        { label: "visualViewport.scale", value: vv ? vv.scale.toFixed(2) : "—" },
        { label: "screen.height", value: `${window.screen.height}` },
        { label: "devicePixelRatio", value: `${window.devicePixelRatio}` },
        { label: "env(safe-area-bottom)", value: safeArea },
        { label: "--vv-bottom", value: vvBottom || "(تنظیم نشده)" },
        {
          label: "standalone؟",
          value: window.matchMedia("(display-mode: standalone)").matches
            ? "بله"
            : "خیر",
        },
      ];

      if (barRect) {
        /*
          این مهم‌ترین سطر است.

          اگر نوار واقعاً به ته چیزی که کاربر می‌بیند چسبیده باشد،
          `bar.bottom` باید برابر `visualViewport.height` باشد. اختلاف
          این دو، دقیقاً همان شکافی است که در اسکرین‌شات دیده می‌شود —
          و علامتش می‌گوید نوار بالاست یا پایین.
        */
        const visible = vv ? vv.height : window.innerHeight;
        const gap = Math.round(visible - barRect.bottom);

        /*
          شکاف را نسبت به viewport چیدمانی هم می‌سنجیم.

          نسخه‌ی اول این صفحه فقط نسبت به viewport دیداری می‌سنجید و
          «۰» گزارش کرد، در حالی که کاربر شکاف را با چشم می‌دید. آن
          «۰» غلط نبود — فقط جواب سؤالی بود که نپرسیده بودیم.

          وقتی این دو عدد با هم فرق دارند، یعنی صفحه زوم شده و همان
          اختلاف است که روی صفحه دیده می‌شود.
        */
        const layoutGap = Math.round(doc.clientHeight - barRect.bottom);

        next.push(
          { label: "bar.bottom", value: `${Math.round(barRect.bottom)}` },
          { label: "bar.height", value: `${Math.round(barRect.height)}` },
          {
            label: "شکاف تا viewport دیداری",
            value: `${gap}`,
            flag: Math.abs(gap) <= 1 ? "good" : "bad",
          },
          {
            label: "شکاف تا viewport چیدمانی",
            value: `${layoutGap}`,
            flag: Math.abs(layoutGap) <= 1 ? "good" : "bad",
          },
        );
      } else {
        next.push({ label: "نوار پایین", value: "در DOM نیست", flag: "bad" });
      }

      setRows(next);
    };

    read();

    const onChange = () => {
      read();
      setTick((t) => t + 1);
    };

    window.addEventListener("resize", onChange, { passive: true });
    window.addEventListener("scroll", onChange, { passive: true });
    window.visualViewport?.addEventListener("resize", onChange, { passive: true });
    window.visualViewport?.addEventListener("scroll", onChange, { passive: true });

    return () => {
      window.removeEventListener("resize", onChange);
      window.removeEventListener("scroll", onChange);
      window.visualViewport?.removeEventListener("resize", onChange);
      window.visualViewport?.removeEventListener("scroll", onChange);
    };
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "200vh",
        background: "#0b0d0c",
        color: "#e8ece9",
        padding: "16px 12px 140px",
        fontFamily: "monospace",
        fontSize: 15,
        lineHeight: 1.9,
      }}
    >
      {/* هر صفحه یک h1 دارد — تست e2e همین را الزام می‌کند */}
      <h1 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>
        تشخیص viewport
      </h1>

      <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>
        صفحه را کمی اسکرول کن تا نوار مرورگر جمع شود، بعد اسکرین‌شات بگیر.
        اعداد زنده‌اند.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "4px 0", opacity: 0.75 }}>{row.label}</td>
              <td
                dir="ltr"
                style={{
                  padding: "4px 0",
                  textAlign: "left",
                  fontWeight: 700,
                  color:
                    row.flag === "bad"
                      ? "#f87171"
                      : row.flag === "good"
                        ? "#a3e635"
                        : "#e8ece9",
                }}
              >
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* نشان می‌دهد اعداد واقعاً به‌روز می‌شوند و صفحه یخ نزده */}
      <p style={{ fontSize: 12, opacity: 0.5, marginTop: 12 }}>
        به‌روزرسانی: {tick}
      </p>
    </div>
  );
}
