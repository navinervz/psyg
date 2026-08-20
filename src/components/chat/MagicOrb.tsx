/**
 * گوی جادویی دستیار خرید.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا آیکون ربات را کنار گذاشتیم
 * ─────────────────────────────────────────────────────────────────────
 * دکمه‌ی گرد با آیکون ربات در گوشه‌ی صفحه، همان چیزی است که تقریباً هر
 * سایتی برای «چت پشتیبانی» می‌گذارد. کاربر بدون خواندن هیچ متنی همان
 * انتظار را پیدا می‌کند: جایی برای شکایت و پیگیری سفارش.
 *
 * ولی این دستیار کار دیگری می‌کند — مثل فروشنده‌ی باتجربه‌ای که می‌پرسد
 * چه می‌خواهی و از بین محصولات موجود انتخاب می‌کند. شکلش باید همان را
 * بگوید.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا SVG و نه Three.js
 * ─────────────────────────────────────────────────────────────────────
 * حس سه‌بعدی از سه چیز می‌آید: گرادیان شعاعی که منبع نور را بالا-چپ
 * می‌گذارد، یک های‌لایت روشن روی همان نقطه، و حلقه‌ی مداری که پشت و جلوی
 * گوی رد می‌شود.
 *
 * همین کافی است. اضافه کردن Three.js برای یک دکمه‌ی ۵۶ پیکسلی، صدها
 * کیلوبایت به باندل **هر صفحه** اضافه می‌کرد — چون دستیار در لایوت است
 * و همه‌جا رندر می‌شود.
 */
export function MagicOrb({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        {/* منبع نور بالا-چپ؛ همین یک چیز بیشترین سهم را در حس حجم دارد */}
        <radialGradient id="orbBody" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f7ffe0" />
          <stop offset="35%" stopColor="#d9f99d" />
          <stop offset="70%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#4d7c0f" />
        </radialGradient>

        <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="#a3e635" stopOpacity="0" />
          <stop offset="100%" stopColor="#a3e635" stopOpacity="0.55" />
        </radialGradient>

        <linearGradient id="bagFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2a12" />
          <stop offset="100%" stopColor="#0b1207" />
        </linearGradient>
      </defs>

      {/* هاله‌ی بیرونی */}
      <circle cx="32" cy="32" r="30" fill="url(#orbGlow)" />

      <g className="magic-orb">
        {/* بدنه‌ی گوی */}
        <circle cx="32" cy="32" r="21" fill="url(#orbBody)" />

        {/*
          های‌لایت.

          بیضی کج‌شده و نه دایره — بازتاب روی سطح کروی هرگز گرد نیست و
          همین جزئیات کوچک تفاوت بین «دایره‌ی سبز» و «گوی» است.
        */}
        <ellipse
          cx="25"
          cy="24"
          rx="7"
          ry="4.5"
          fill="#ffffff"
          opacity="0.55"
          transform="rotate(-28 25 24)"
        />

        {/* سایه‌ی پایین برای بستن حجم */}
        <path
          d="M13 38a21 21 0 0 0 38 0 21 21 0 0 1-38 0z"
          fill="#1a2a12"
          opacity="0.35"
        />

        {/* نماد خرید داخل گوی — کیف با جرقه */}
        <g transform="translate(32 33)">
          <path
            d="M-7.5 -3h15l-1.6 12.5a2 2 0 0 1-2 1.7h-7.8a2 2 0 0 1-2-1.7z"
            fill="url(#bagFace)"
            stroke="#0b1207"
            strokeWidth="0.8"
          />
          {/* دسته‌ی کیف */}
          <path
            d="M-4 -3v-2.2a4 4 0 0 1 8 0V-3"
            fill="none"
            stroke="#0b1207"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* جرقه‌ی روی کیف — همان چیزی که «هوشمند» را می‌رساند */}
          <path
            d="M0 1.5 1 4.3 3.8 5.3 1 6.3 0 9.1 -1 6.3 -3.8 5.3 -1 4.3z"
            fill="#a3e635"
          />
        </g>
      </g>

      {/*
        حلقه‌ی مداری.

        بیضی است نه دایره، و کج — یعنی مدار در فضا دیده می‌شود نه روی
        صفحه. ذره‌ها که رویش می‌چرخند، جلو و پشت گوی رد می‌شوند و همین
        عمق را قطعی می‌کند.
      */}
      <g className="magic-orb__ring" style={{ transformOrigin: "32px 32px" }}>
        <ellipse
          cx="32"
          cy="32"
          rx="28"
          ry="10"
          fill="none"
          stroke="#d9f99d"
          strokeWidth="1"
          opacity="0.35"
          transform="rotate(-22 32 32)"
        />
        <circle cx="60" cy="32" r="2.4" fill="#f7ffe0" transform="rotate(-22 32 32)" />
        <circle cx="4" cy="32" r="1.8" fill="#a3e635" transform="rotate(-22 32 32)" />
      </g>

      {/* جرقه‌های پراکنده که نوبتی چشمک می‌زنند */}
      <g fill="#f7ffe0">
        <path className="magic-orb__spark" d="M52 12l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9z" />
        <path className="magic-orb__spark" d="M11 16l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
        <path className="magic-orb__spark" d="M50 50l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7z" />
      </g>
    </svg>
  );
}
