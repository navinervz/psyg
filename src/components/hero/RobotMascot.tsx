"use client";

import { useId, useRef } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/animations/gsap";

/**
 * ماسکوت ربات PsyG — نسخه‌ی SVG.
 *
 * چشم‌ها موس را دنبال می‌کنند، آنتن‌ها می‌لرزند و کل بدنه شناور است.
 * در مرحله‌ی بعد می‌توان این کامپوننت را با نسخه‌ی Three.js (R3F + Bloom)
 * جایگزین کرد بدون تغییر در HeroSection — همین API را حفظ کنید.
 */
/** مرکز رادار در فضای `viewBox` — همان مرکز تقریبی ربات */
const CX = 130;
const CY = 118;

/**
 * یک دور کامل پرتو.
 *
 * از ۶ به ۸ ثانیه رفت. سرعت کمتر، حس «دقیق و آرام» می‌دهد به‌جای
 * «شتاب‌زده» — و چون بلیپ‌ها زمان‌بندی‌شان از همین عدد می‌آید، فاصله‌ی
 * بینشان هم بیشتر می‌شود و تصویر شلوغ نمی‌ماند.
 */
const SWEEP_SECONDS = 8;

/**
 * فرصت‌هایی که رادار پیدا می‌کند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا زاویه و شعاع، نه مختصات
 * ─────────────────────────────────────────────────────────────────────
 * نسخه‌ی اول مختصات دستی داشت و نتیجه‌اش روی سایت زنده این شد که یکی از
 * چیپ‌ها روی گوش ربات و یکی وسط بدنه‌اش نشست.
 *
 * با زاویه و شعاع، هر بلیپ تضمیناً بیرون از خود ربات می‌ماند (شعاع
 * حداقلی از نیم‌قطر ربات بزرگ‌تر است) و جابه‌جا کردن یکی، بقیه را خراب
 * نمی‌کند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا زاویه مهم‌تر از ظاهر است
 * ─────────────────────────────────────────────────────────────────────
 * زمان روشن شدن هر بلیپ از زاویه‌اش حساب می‌شود، نه دستی. برای همین
 * دقیقاً وقتی روشن می‌شود که پرتو از رویش رد شود.
 *
 * نسخه‌ی قبلی این هماهنگی را نداشت: حلقه می‌چرخید و چیپ‌ها جدا از آن
 * ظاهر می‌شدند. نتیجه‌اش «یک دایره‌ی متحرک و چند برچسب بی‌ربط» بود —
 * دقیقاً همان چیزی که در بازخورد گفته شد. رادار وقتی رادار می‌شود که
 * پرتو و بلیپ یک داستان بگویند.
 *
 * ─────────────────────────────────────────────────────────────────────
 * چرا درصد، نه قیمت
 * ─────────────────────────────────────────────────────────────────────
 * عددی که شبیه قیمت باشد و به هیچ محصولی وصل نباشد، یک ادعای قیمتی
 * جعلی است. درصد تغییر، شکلِ کار را نشان می‌دهد بدون اینکه درباره‌ی
 * کالای مشخصی حرفی بزند.
 */
const BLIPS: { angle: number; radius: number; label?: string }[] = [
  { angle: 22, radius: 142, label: "٪۱۲−" },
  { angle: 88, radius: 126 },
  { angle: 152, radius: 144, label: "٪۸−" },
  { angle: 205, radius: 128 },
  { angle: 268, radius: 140, label: "٪۵−" },
  { angle: 320, radius: 124 },
];

/** زاویه‌ی SVG: `y` رو به پایین است، پس چرخش با عقربه‌ی ساعت مثبت می‌شود */
function polar(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

export function RobotMascot() {
  const scope = useRef<HTMLDivElement>(null);

  /*
    ─────────────────────────────────────────────────────────────────────
    چرا شناسه‌ی گرادیان‌ها باید یکتا باشد
    ─────────────────────────────────────────────────────────────────────
    این شناسه‌ها قبلاً ثابت بودند: `botFace` و `eyeGlow`. تا وقتی یک ربات
    روی صفحه بود مشکلی نداشت.

    با اضافه شدن `MobileHero`، صفحه‌ی اصلی دو ربات دارد — یکی موبایلی و
    یکی دسکتاپی — و هرکدام با `lg:hidden` یا `hidden lg:block` پنهان
    می‌شود. ولی هر دو در DOM هستند.

    در HTML وقتی دو المان یک `id` دارند، `url(#id)` به **اولی** اشاره
    می‌کند. روی دسکتاپ اولی همان ربات موبایلی است که `display: none`
    دارد، و مرورگر گرادیانِ داخل زیردرخت پنهان را رنگ‌آمیزی نمی‌کند.

    نتیجه‌اش این شد که ربات دسکتاپ چشم و صورتش را از دست داد و فقط یک
    خط‌نگاره‌ی توخالی ماند. هیچ خطایی هم در کنسول نبود.

    `useId` برای هر نمونه شناسه‌ی جدا می‌سازد و در SSR و کلاینت یکی
    می‌ماند.
  */
  const uid = useId();
  const faceId = `botFace${uid}`;
  const eyeId = `eyeGlow${uid}`;
  const sweepId = `botSweep${uid}`;
  const vignetteId = `botVignette${uid}`;
  const pingId = `botPing${uid}`;

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      // ورود
      gsap.from(".robot-body", {
        scale: 0.82,
        opacity: 0,
        duration: 1.3,
        ease: "power3.out",
      });

      if (prefersReducedMotion()) {
        /*
          حرکت کمتر یعنی رادار نچرخد — نه اینکه خالی بماند.

          بلیپ‌ها در نشانه‌گذاری با `opacity="0"` شروع می‌شوند چون
          انیمیشن روشنشان می‌کند. بدون این خط، کاربری که حرکت کمتر
          خواسته یک صفحه‌ی رادار خالی می‌دید — همان اطلاعات را از دست
          می‌داد که بقیه می‌بینند.
        */
        gsap.set(".radar-blip", { opacity: 0.9 });
        return;
      }

      // شناور بودن
      gsap.to(".robot-float", {
        y: -14,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // تنفس هاله
      gsap.to(".robot-halo", {
        scale: 1.14,
        opacity: 0.85,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      /*
        فقط پرتو می‌چرخد. صفحه‌ی رادار ثابت است.

        `svgOrigin` و نه `transformOrigin`: مقدار درصدی در SVG نسبت به
        جعبه‌ی خودِ المان حساب می‌شود، و گوه دور نقطه‌ی اشتباهی می‌چرخید.
        `svgOrigin` مختصات را در فضای `viewBox` می‌خواند.
      */
      gsap.to(".radar-sweep", {
        rotation: 360,
        svgOrigin: `${CX} ${CY}`,
        duration: SWEEP_SECONDS,
        repeat: -1,
        ease: "none",
      });

      /*
        ─────────────────────────────────────────────────────────────
        هر بلیپ دقیقاً وقتی روشن می‌شود که پرتو از رویش رد شود
        ─────────────────────────────────────────────────────────────
        این تنها چیزی است که یک رادار را از «یک دایره‌ی متحرک و چند
        برچسب» جدا می‌کند. تأخیر از زاویه حساب می‌شود، نه دستی — پس
        جابه‌جا کردن هر بلیپ، زمان‌بندی‌اش را خودکار درست می‌کند.

        بلیپ روشن می‌ماند، بعد آرام محو می‌شود (مثل باقی‌مانده‌ی فسفر)،
        و تا دور بعدی پرتو خاموش است.
      */
      const FLASH = 0.3;
      const HOLD = 1.1;
      const FADE = 1.9;

      BLIPS.forEach((blip, i) => {
        const p = polar(blip.angle, blip.radius);

        gsap
          .timeline({
            repeat: -1,
            delay: (blip.angle / 360) * SWEEP_SECONDS,
            // بقیه‌ی دور، خاموش می‌ماند تا رسیدن دوباره‌ی پرتو
            repeatDelay: SWEEP_SECONDS - FLASH - HOLD - FADE,
          })
          .fromTo(
            `.radar-blip-${i}`,
            { opacity: 0, scale: 0.4, svgOrigin: `${p.x} ${p.y}` },
            { opacity: 1, scale: 1, duration: FLASH, ease: "back.out(2.4)" },
          )
          .to(`.radar-blip-${i}`, { opacity: 0, duration: FADE, ease: "power1.in" }, `+=${HOLD}`);

        /*
          پینگ با همان تأخیر بلیپ شروع می‌شود ولی چرخه‌ی خودش را دارد:
          یک بار سریع باز می‌شود و محو می‌شود، بعد تا دور بعد ساکت است.

          داخل همان تایم‌لاین نمی‌شود گذاشتش، چون آنجا `opacity` گروه
          والد انیمیت می‌شود و این حلقه باید مستقل از آن محو شود.
        */
        gsap.fromTo(
          `.radar-ping-${i}`,
          { scale: 0.3, opacity: 0.9, svgOrigin: `${p.x} ${p.y}` },
          {
            /*
              ۲.۰ و نه بیشتر: حلقه از بلیپِ شعاع ۱۴۴ شروع می‌شود، پس
              با شعاع پایه‌ی ۱۰ و مقیاس ۲، لبه‌اش به ۱۶۴ می‌رسد —
              درست داخل `viewBox`. عدد بزرگ‌تر یعنی حلقه در آخرین
              لحظه بریده شود.
            */
            scale: 2.0,
            opacity: 0,
            duration: 1.5,
            ease: "power2.out",
            delay: (blip.angle / 360) * SWEEP_SECONDS,
            repeat: -1,
            repeatDelay: SWEEP_SECONDS - 1.5,
          },
        );
      });

      // لرزش آنتن‌ها
      gsap.to(".robot-antenna", {
        rotate: 5,
        transformOrigin: "bottom center",
        duration: 1.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: { each: 0.25, from: "random" },
      });

      // پلک زدن
      const blink = () => {
        gsap.to(".robot-eye", {
          scaleY: 0.08,
          transformOrigin: "center",
          duration: 0.09,
          yoyo: true,
          repeat: 1,
          onComplete: () => gsap.delayedCall(gsap.utils.random(2.5, 6), blink),
        });
      };
      gsap.delayedCall(2.5, blink);

      // ردیابی موس با چشم‌ها
      const eyes = gsap.utils.toArray<SVGElement>(".robot-pupil", root);
      const quickX = eyes.map((el) => gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }));
      const quickY = eyes.map((el) => gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }));

      const onMove = (e: MouseEvent) => {
        const rect = root.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = gsap.utils.clamp(-7, 7, (e.clientX - cx) / 26);
        const dy = gsap.utils.clamp(-5, 5, (e.clientY - cy) / 30);
        quickX.forEach((fn) => fn(dx));
        quickY.forEach((fn) => fn(dy));
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      return () => window.removeEventListener("mousemove", onMove);
    },
    { scope },
  );

  return (
    <div
      ref={scope}
      className="relative grid w-full min-w-0 place-items-center"
      aria-hidden
    >
      {/* هاله‌ی پس‌زمینه — نسبت به ربات مقیاس می‌گیرد، نه اندازه‌ی ثابت */}
      <div className="robot-halo pointer-events-none absolute aspect-square w-[115%] max-w-[300px] rounded-full bg-accent/22 blur-[80px]" />

      <div className="robot-float relative w-full max-w-[260px]">
        {/*
          ─────────────────────────────────────────────────────────────
          چرا حلقه‌ی رصد داخل SVG است و نه یک لایه‌ی HTML روی آن
          ─────────────────────────────────────────────────────────────
          این ربات در دو اندازه‌ی خیلی متفاوت رندر می‌شود: ۱۰۴ پیکسل
          در بنر موبایل و تا ۲۶۰ پیکسل روی دسکتاپ.

          اگر حلقه و چیپ‌ها المان HTML بودند، باید اندازه‌شان را برای هر
          نقطه‌ی شکست جدا تنظیم می‌کردیم و روی گوشی از لبه‌ی کارت بیرون
          می‌زدند. داخل `viewBox`، همه‌چیز با خود ربات مقیاس می‌گیرد —
          یک بار نوشته می‌شود و همه‌جا درست است.

          `viewBox` از `0 0 260 240` بزرگ شد تا حلقه‌ی ۱۴۸ پیکسلی رادار و
          برچسب بلیپ‌ها جا شوند. ربات کمی کوچک‌تر دیده می‌شود ولی
          نسبت‌هایش دست‌نخورده است.
        */}
        <svg
          viewBox="-34 -46 328 328"
          className="robot-body w-full drop-shadow-[0_0_38px_rgba(163,230,53,0.35)]"
        >
          <defs>
            <linearGradient id={faceId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2a12" />
              <stop offset="100%" stopColor="#0b1207" />
            </linearGradient>
            <radialGradient id={eyeId}>
              <stop offset="0%" stopColor="#d9f99d" />
              <stop offset="60%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#65a30d" />
            </radialGradient>
            <linearGradient id={sweepId} x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.30" />
              <stop offset="45%" stopColor="#a3e635" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
            </linearGradient>

            {/*
              هاله‌ی مرکزی: پررنگ در مرکز، هیچ در لبه.

              بدون آن، حلقه‌ها یک‌دست‌اند و صفحه تخت به‌نظر می‌رسد. با
              آن، رادار عمق پیدا می‌کند و لبه‌اش در تاریکی گم می‌شود —
              همان حسی که خواسته شده بود.
            */}
            <radialGradient id={vignetteId}>
              <stop offset="0%" stopColor="#a3e635" stopOpacity="0.07" />
              <stop offset="55%" stopColor="#a3e635" stopOpacity="0.025" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0" />
            </radialGradient>

            {/* حلقه‌ی انفجاری بلیپ — پررنگ در لبه، توخالی در مرکز */}
            <radialGradient id={pingId}>
              <stop offset="55%" stopColor="#a3e635" stopOpacity="0" />
              <stop offset="100%" stopColor="#a3e635" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          {/*
            ─────────────────────────────────────────────────────────
            حلقه‌ی رصد
            ─────────────────────────────────────────────────────────
            پشت ربات کشیده می‌شود (قبل از بقیه در DOM) تا از جلوی
            صورتش رد نشود.

            چیزی که نشان می‌دهد واقعی است: این سایت هر روز قیمت‌ها را
            می‌خواند. حلقه همان کار را تصویر می‌کند، نه یک تزئین
            بی‌ربط.
          */}
          <g className="radar-grid">
            {/*
              ─────────────────────────────────────────────────────────
              صفحه‌ی رادار
              ─────────────────────────────────────────────────────────
              حلقه‌ها ثابت‌اند و نمی‌چرخند. در رادار واقعی صفحه ثابت است
              و فقط پرتو می‌گردد؛ چرخاندن صفحه نگاه را از پرتو می‌دزدد —
              همان چیزی که در نسخه‌ی قبلی «بی‌ربط» خوانده شد.

              کنتراست عمداً پایین است. یک رادار حرفه‌ای، صفحه‌اش تقریباً
              نامرئی است و فقط وقتی پرتو از رویش رد می‌شود خودش را نشان
              می‌دهد. حلقه‌های پررنگ، تصویر را شلوغ و اسباب‌بازی‌وار
              می‌کنند.
            */}

            {/* هاله‌ی مرکزی — عمق می‌دهد و لبه‌ی صفحه را محو می‌کند */}
            <circle cx={CX} cy={CY} r="152" fill={`url(#${vignetteId})`} />

            {[70, 100, 128, 152].map((r, i) => (
              <circle
                key={r}
                cx={CX}
                cy={CY}
                r={r}
                fill="none"
                stroke="#a3e635"
                strokeWidth={i === 3 ? 1 : 0.7}
                strokeOpacity={i === 3 ? 0.2 : 0.08}
              />
            ))}

            {/*
              درجه‌بندی روی حلقه‌ی بیرونی.

              همان چیزی است که یک دایره را «ابزار» نشان می‌دهد نه
              «تزئین». هر ۱۵ درجه یک خط کوتاه، و هر ۹۰ درجه بلندتر.
            */}
            {Array.from({ length: 24 }, (_, i) => i * 15).map((angle) => {
              const long = angle % 90 === 0;
              const outer = polar(angle, 152);
              const inner = polar(angle, long ? 141 : 147);
              return (
                <line
                  key={angle}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  stroke="#a3e635"
                  strokeWidth={long ? 1.1 : 0.7}
                  strokeOpacity={long ? 0.26 : 0.13}
                />
              );
            })}

            {/* تقاطع مرکزی — کوچک و کم‌رنگ، فقط برای اینکه مرکز معلوم باشد */}
            {[0, 90].map((angle) => {
              const a = polar(angle, 152);
              const b = polar(angle + 180, 152);
              return (
                <line
                  key={angle}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="#a3e635"
                  strokeWidth="0.6"
                  strokeOpacity="0.07"
                />
              );
            })}
          </g>

          {/*
            جاروی رادار — یک گوه‌ی محو که دور ربات می‌چرخد.

            گرادیان زاویه‌ای در SVG وجود ندارد، پس با یک گرادیان خطی
            روی مسیر گوه ساخته شده: از لبه‌ی جلو که روشن است تا انتها
            که ناپدید می‌شود.
          */}
          {/*
            پرتو — یک گوه‌ی ۶۰ درجه‌ای که لبه‌ی جلویش روشن است و دنباله‌اش
            محو می‌شود، مثل باقی‌مانده‌ی فسفر روی صفحه‌ی رادار.

            گرادیان زاویه‌ای در SVG وجود ندارد، پس دنباله با یک گرادیان
            خطی در جهت چرخش ساخته شده. دقیق نیست ولی از فاصله‌ای که این
            ربات دیده می‌شود، تفاوتش معلوم نمی‌شود.
          */}
          <g className="radar-sweep">
            <path
              d={`M ${CX} ${CY} L ${polar(-45, 148).x} ${polar(-45, 148).y} A 148 148 0 0 1 ${polar(0, 148).x} ${polar(0, 148).y} Z`}
              fill={`url(#${sweepId})`}
            />
            {/* لبه‌ی جلوی پرتو — روشن‌ترین خط، همان‌جا که «الان» را می‌خواند */}
            <line
              x1={CX}
              y1={CY}
              x2={polar(0, 148).x}
              y2={polar(0, 148).y}
              stroke="#a3e635"
              strokeWidth="1.4"
              strokeOpacity="0.5"
            />
          </g>

          {/*
            چیپ‌های داده — چیزی که ربات «می‌بیند».

            متن‌ها نمونه‌ی شکل داده‌اند نه قیمت واقعی محصولی؛ عمداً
            درصد و جهت‌اند، نه عددی که کسی بتواند آن را قیمت یک کالای
            مشخص بخواند. وگرنه یک تزئین، تبدیل به ادعای قیمتی می‌شد.
          */}
          {BLIPS.map((blip, i) => {
            const p = polar(blip.angle, blip.radius);

            return (
              <g key={i} className={`radar-blip radar-blip-${i}`} opacity="0">
                {/*
                  حلقه‌ی انفجاری — همان «پینگ» رادار.

                  جدا از بقیه‌ی بلیپ انیمیت می‌شود چون کارش فرق دارد:
                  بلیپ می‌ماند و محو می‌شود، ولی این یک بار باز می‌شود
                  و می‌رود. همین حرکتِ کوتاه است که لحظه‌ی «پیدا شد» را
                  می‌سازد.
                */}
                <circle
                  className={`radar-ping radar-ping-${i}`}
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill={`url(#${pingId})`}
                />
                <circle cx={p.x} cy={p.y} r="8" fill="#a3e635" opacity="0.14" />
                <circle cx={p.x} cy={p.y} r="2.8" fill="#d9f99d" />

                {blip.label && (
                  /*
                    ─────────────────────────────────────────────────
                    برچسب همیشه به سمت داخل صفحه می‌افتد
                    ─────────────────────────────────────────────────
                    نسخه‌ی اول برچسب را همیشه *بالای* بلیپ می‌گذاشت.
                    برای بلیپ نزدیک بالای صفحه (زاویه‌ی ۲۶۸) این یعنی
                    برچسب از لبه‌ی `viewBox` بیرون می‌زد و بریده
                    می‌شد — چیزی که در کد پیدا نمی‌شود و فقط روی صفحه
                    دیده می‌شود.

                    حالا جهت از موقعیت بلیپ می‌آید: بلیپ‌های بالایی
                    برچسبشان پایین می‌افتد و برعکس. یعنی هر بلیپ
                    جدیدی هم که اضافه شود، خودبه‌خود درست می‌نشیند.
                  */
                  (() => {
                    const below = p.y < CY;
                    const boxY = below ? p.y + 10 : p.y - 30;
                    return (
                      <>
                        <rect
                          x={p.x - 24}
                          y={boxY}
                          width="48"
                          height="20"
                          rx="10"
                          fill="#0f1a09"
                          stroke="#a3e635"
                          strokeWidth="1"
                          strokeOpacity="0.45"
                        />
                        <text
                          x={p.x}
                          y={boxY + 14}
                          textAnchor="middle"
                          fill="#a3e635"
                          fontSize="11"
                          fontWeight="700"
                        >
                          {blip.label}
                        </text>
                      </>
                    );
                  })()
                )}
              </g>
            );
          })}

          {/* آنتن‌ها */}
          <g stroke="#a3e635" strokeWidth="4" strokeLinecap="round" fill="none">
            <path className="robot-antenna" d="M86 74 C 72 46, 58 34, 44 26" />
            <path className="robot-antenna" d="M174 74 C 188 46, 202 34, 216 26" />
          </g>
          <circle className="robot-antenna" cx="44" cy="24" r="8" fill="#a3e635" />
          <circle className="robot-antenna" cx="216" cy="24" r="8" fill="#a3e635" />

          {/* سر */}
          <rect
            x="52"
            y="66"
            width="156"
            height="118"
            rx="42"
            fill={`url(#${faceId})`}
            stroke="#a3e635"
            strokeWidth="3"
          />

          {/* چشم‌ها */}
          <g className="robot-eye">
            <ellipse className="robot-pupil" cx="104" cy="126" rx="19" ry="23" fill={`url(#${eyeId})`} />
            <ellipse className="robot-pupil" cx="156" cy="126" rx="19" ry="23" fill={`url(#${eyeId})`} />
          </g>

          {/* لبخند */}
          <path
            d="M112 158 Q130 170 148 158"
            stroke="#a3e635"
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            opacity=".8"
          />

          {/* گوش‌ها */}
          <rect x="34" y="108" width="14" height="36" rx="7" fill="#4d7c0f" />
          <rect x="212" y="108" width="14" height="36" rx="7" fill="#4d7c0f" />

          {/* بدنه */}
          <rect x="92" y="188" width="76" height="30" rx="14" fill="#0f1a09" stroke="#4d7c0f" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
