"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * آشکارساز سرریز افقی — موقتی.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا روی خود سایت و نه در صفحه‌ی تشخیص
 * ─────────────────────────────────────────────────────────────────────
 * صفحه‌ی `/debug/viewport` گفت سرریز افقی ندارد — و راست می‌گفت، چون
 * خودش یک جدول ساده است. سؤال واقعی درباره‌ی صفحه‌ی اصلی است، با
 * کاروسل و نوار دسته‌بندی و مارکی و ربات.
 *
 * تشخیصی که روی صفحه‌ی دیگری اجرا شود، جواب سؤال دیگری را می‌دهد.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا پشت `?probe=1`
 * ─────────────────────────────────────────────────────────────────────
 * هیچ کاربری نباید این را ببیند و هیچ هزینه‌ای نباید روی بار عادی صفحه
 * بگذارد. بدون پارامتر، کامپوننت `null` برمی‌گرداند و هیچ افکتی اجرا
 * نمی‌شود.
 *
 * بعد از حل شدن باگ حذف می‌شود.
 */

type Wide = { tag: string; cls: string; left: number; right: number };

export function OverflowProbe() {
  const params = useSearchParams();
  const on = params.get("probe") === "1";

  const [info, setInfo] = useState<{
    innerWidth: number;
    clientWidth: number;
    scrollWidth: number;
    scale: string;
    wide: Wide[];
  } | null>(null);

  useEffect(() => {
    if (!on) return;

    const scan = () => {
      const doc = document.documentElement;
      const limit = doc.clientWidth;

      /*
        المان‌هایی که از لبه بیرون می‌زنند.

        هم سمت راست و هم سمت چپ سنجیده می‌شود: در چیدمان راست‌به‌چپ،
        سرریز معمولاً به چپ می‌رود و کسی که فقط `right` را نگاه کند
        هیچ‌وقت پیدایش نمی‌کند.

        المان‌های داخل والدِ `overflow: hidden` عمداً رد می‌شوند —
        آن‌ها بریده می‌شوند و صفحه را پهن نمی‌کنند. بدون این فیلتر،
        فهرست پر می‌شد از مارکی و نوارهای اسکرول که مشکلی ندارند.
      */
      const clipped = (el: Element): boolean => {
        let node = el.parentElement;
        while (node && node !== document.body) {
          const s = getComputedStyle(node);
          if (s.overflowX !== "visible") return true;
          node = node.parentElement;
        }
        return false;
      };

      const wide: Wide[] = [];
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        if (r.right <= limit + 1 && r.left >= -1) continue;
        if (clipped(el)) continue;

        wide.push({
          tag: el.tagName.toLowerCase(),
          cls: el.className.toString().slice(0, 44) || "(بدون کلاس)",
          left: Math.round(r.left),
          right: Math.round(r.right),
        });
      }

      setInfo({
        innerWidth: window.innerWidth,
        clientWidth: limit,
        scrollWidth: doc.scrollWidth,
        scale: window.visualViewport
          ? `${Math.round(window.visualViewport.scale * 100)}٪`
          : "—",
        // فقط بیرونی‌ترین‌ها؛ والد سرریز، همه‌ی فرزندانش را هم بیرون می‌برد
        wide: wide.slice(0, 6),
      });
    };

    // بعد از نشستن چیدمان و فونت‌ها، نه در همان لحظه‌ی مانت
    const timer = window.setTimeout(scan, 1200);
    window.addEventListener("resize", scan, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", scan);
    };
  }, [on]);

  if (!on || !info) return null;

  const overflow = info.scrollWidth > info.clientWidth + 1;

  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        insetInlineStart: 0,
        insetInlineEnd: 0,
        top: 0,
        zIndex: 2147483647,
        background: "#000",
        color: "#e8ece9",
        border: "2px solid #a3e635",
        padding: "8px 10px",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.7,
        maxHeight: "45vh",
        overflowY: "auto",
      }}
    >
      <div dir="ltr" style={{ textAlign: "left" }}>
        innerWidth={info.innerWidth} clientWidth={info.clientWidth}
        <br />
        scrollWidth={info.scrollWidth} scale={info.scale}
      </div>

      <div
        style={{
          color: overflow ? "#f87171" : "#a3e635",
          fontWeight: 700,
          margin: "4px 0",
        }}
      >
        {overflow
          ? `سرریز افقی: ${info.scrollWidth - info.clientWidth} پیکسل`
          : "سرریز افقی ندارد"}
      </div>

      {info.wide.length === 0 ? (
        <div style={{ opacity: 0.6 }}>هیچ المانی از لبه بیرون نزده</div>
      ) : (
        info.wide.map((w, i) => (
          <div key={i} dir="ltr" style={{ textAlign: "left", opacity: 0.9 }}>
            <span style={{ color: "#f87171" }}>
              {w.left}…{w.right}
            </span>{" "}
            {w.tag}.{w.cls}
          </div>
        ))
      )}
    </div>
  );
}
