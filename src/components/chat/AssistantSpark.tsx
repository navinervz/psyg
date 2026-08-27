"use client";

import { useId } from "react";

/**
 * نشان مشاور خرید — همان ماسکوت، در اندازه‌ی دکمه.
 *
 * ─────────────────────────────────────────────────────────────────────
 * سه نسخه، سه درس
 * ─────────────────────────────────────────────────────────────────────
 * ۱. **گوی جادویی** — برای دکمه‌ی شناور گوشه‌ی صفحه ساخته شده بود: باید
 *    توجه جلب می‌کرد بدون اینکه بگوید چیست. کنار ذره‌بین، انتزاعی و
 *    بی‌ربط به‌نظر می‌رسید.
 *
 * ۲. **خط‌نگاره‌ی ربات** — ربط داشت ولی تخت بود. دو خط و چند بیضی، در
 *    ۲۸ پیکسل شبیه آیکون‌های عمومی می‌شد نه شخصیت برند.
 *
 * ۳. این یکی. تفاوتش «واقعی بودن» است: همان گرادیان صورت، همان چشم‌های
 *    درخشان، و همان هاله‌ای که ماسکوت هیرو دارد. کاربر یک چیز را در دو
 *    اندازه می‌بیند، نه دو چیز شبیه هم.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا شناسه‌ها یکتا هستند
 * ─────────────────────────────────────────────────────────────────────
 * این نشان چند بار در یک صفحه رندر می‌شود — روی دکمه، کنار هر نمونه، و
 * در فوتر نتیجه‌ها. با شناسه‌ی ثابت، `url(#id)` به اولی اشاره می‌کند و
 * اگر آن اولی در زیردرختی پنهان باشد، بقیه بدون رنگ رندر می‌شوند.
 *
 * این دقیقاً همان باگی بود که ربات دسکتاپ را بی‌چشم کرد.
 */
export function AssistantSpark({ className }: { className?: string }) {
  const uid = useId();
  const faceId = `spark-face${uid}`;
  const eyeId = `spark-eye${uid}`;
  const glowId = `spark-glow${uid}`;

  return (
    <svg viewBox="0 0 44 44" className={className} aria-hidden>
      <defs>
        <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#26401a" />
          <stop offset="100%" stopColor="#0c1408" />
        </linearGradient>
        <radialGradient id={eyeId}>
          <stop offset="0%" stopColor="#eaffc4" />
          <stop offset="55%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#5f9a12" />
        </radialGradient>
        {/* هاله‌ی پشت سر — همان چیزی که به ماسکوت هیرو حجم می‌دهد */}
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="#a3e635" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="22" cy="23" r="21" fill={`url(#${glowId})`} />

      {/* آنتن‌ها */}
      <g stroke="#a3e635" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M15 13 L11 6" />
        <path d="M29 13 L33 6" />
      </g>
      <circle cx="11" cy="5" r="2.4" fill="#a3e635" />
      <circle cx="33" cy="5" r="2.4" fill="#a3e635" />

      {/* گوش‌ها */}
      <rect x="4" y="19" width="3.5" height="9" rx="1.75" fill="#4d7c0f" />
      <rect x="36.5" y="19" width="3.5" height="9" rx="1.75" fill="#4d7c0f" />

      {/* سر */}
      <rect
        x="8"
        y="12"
        width="28"
        height="23"
        rx="9"
        fill={`url(#${faceId})`}
        stroke="#a3e635"
        strokeWidth="1.8"
      />

      {/* چشم‌ها — پلک زدن در CSS تعریف شده تا هر نمونه هزینه‌ی JS نداشته باشد */}
      <g className="spark-eye">
        <ellipse cx="17" cy="23" rx="3.6" ry="4.4" fill={`url(#${eyeId})`} />
        <ellipse cx="27" cy="23" rx="3.6" ry="4.4" fill={`url(#${eyeId})`} />
      </g>

      {/* لبخند */}
      <path
        d="M18 29.5 Q22 32 26 29.5"
        stroke="#a3e635"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
    </svg>
  );
}
