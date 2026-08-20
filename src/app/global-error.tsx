"use client";

/**
 * آخرین تور نجات.
 *
 * ─────────────────────────────────────────────────────────────────────
 * تفاوتش با `error.tsx`
 * ─────────────────────────────────────────────────────────────────────
 * `error.tsx` وقتی کار می‌کند که خطا داخل یک صفحه رخ دهد — لایوت سالم
 * است و هدر و فوتر سرجایشان می‌مانند.
 *
 * ولی اگر خودِ لایوت ریشه بشکند، `error.tsx` هم رندر نمی‌شود چون داخل
 * همان لایوت است. آن‌وقت کاربر صفحه‌ی خام مرورگر می‌بیند: پس‌زمینه‌ی
 * سفید، متن انگلیسی، و هیچ راهی برای برگشتن.
 *
 * این فایل جای همان حالت را می‌گیرد. چون بیرون از لایوت است، باید
 * تگ‌های `html` و `body` خودش را داشته باشد و نمی‌تواند به فونت یا
 * استایل سایت تکیه کند — پس همه چیز اینلاین نوشته شده.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          backgroundColor: "#08090a",
          color: "#f2f5f0",
          fontFamily: "Tahoma, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: "420px", textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(163,230,53,0.12)",
              display: "grid",
              placeItems: "center",
              fontSize: "28px",
              color: "#a3e635",
            }}
            aria-hidden
          >
            !
          </div>

          <h1 style={{ margin: "0 0 10px", fontSize: "20px" }}>
            یک چیزی از دست ما در رفت
          </h1>

          {/*
            عمداً جزئیات فنی خطا نشان داده نمی‌شود.

            پیام خطای واقعی می‌تواند مسیر فایل‌های سرور یا ساختار داخلی
            را لو دهد، و برای کاربر هم هیچ کمکی نیست.
          */}
          <p
            style={{
              margin: "0 0 22px",
              fontSize: "14px",
              lineHeight: 2,
              color: "#a8b0a4",
            }}
          >
            صفحه بالا نیامد. معمولاً با یک بار تلاش دوباره درست می‌شود؛ اگر
            نشد، چند دقیقه بعد سر بزن.
          </p>

          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                cursor: "pointer",
                border: 0,
                borderRadius: "12px",
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 700,
                fontFamily: "inherit",
                backgroundColor: "#a3e635",
                color: "#08090a",
              }}
            >
              تلاش دوباره
            </button>

            {/*
              `<a>` ساده عمدی است، نه `next/link`.

              این صفحه فقط وقتی رندر می‌شود که لایوت ریشه شکسته باشد —
              یعنی همان لحظه‌ای که نمی‌شود به سالم بودن روتر سمت کلاینت
              اعتماد کرد. `Link` پیمایش را به روتر می‌سپارد؛ اگر روتر
              همان چیزی باشد که خراب شده، دکمه هیچ کاری نمی‌کند.

              `<a>` صفحه را کامل از نو بارگذاری می‌کند و همه چیز را از
              صفر می‌سازد. کندتر است ولی تنها راهی است که در این حالت
              قطعاً جواب می‌دهد.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                borderRadius: "12px",
                padding: "12px 22px",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid #2b322c",
                color: "#f2f5f0",
              }}
            >
              صفحه‌ی اصلی
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
