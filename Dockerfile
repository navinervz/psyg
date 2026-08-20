# syntax=docker/dockerfile:1

# ============================================================================
#  PsyG — ایمیج پروداکشن
#
#  سه مرحله‌ای است تا ایمیج نهایی فقط شامل چیزی باشد که برای اجرا لازم است:
#  نه سورس تایپ‌اسکریپت، نه devDependencies، نه کش بیلد.
#
#  نکته برای ایران: اگر دسترسی به registry.npmjs.org کند یا مسدود بود،
#  در سرور یک رجیستری آینه ست کنید:
#    npm config set registry https://registry.npmmirror.com
#  یا از --build-arg NPM_REGISTRY استفاده کنید (پایین‌تر).
# ============================================================================

# ─────────────────────────  ۱. نصب وابستگی‌ها  ─────────────────────────
FROM node:22-alpine AS deps

# کتابخانه‌ی سازگاری که برخی پکیج‌های native روی alpine لازم دارند
RUN apk add --no-cache libc6-compat

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmjs.org
RUN npm config set registry "$NPM_REGISTRY"

# فقط این دو فایل کپی می‌شوند تا وقتی کد عوض می‌شود، لایه‌ی نصب از کش بیاید
COPY package.json package-lock.json* ./
RUN npm ci


# ────────────────────────────  ۲. بیلد  ────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# آدرس سایت باید در زمان بیلد موجود باشد چون NEXT_PUBLIC_* در باندل
# جاسازی می‌شود و در sitemap و canonical استفاده می‌شود
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# همان قاعده برای تأیید سرچ کنسول و شناسه‌ی آنالیتیکس.
#
# هر دو `NEXT_PUBLIC_*` هستند، یعنی در زمان بیلد داخل باندل نوشته
# می‌شوند. گذاشتنشان فقط در `environment` فایل کامپوز کافی نیست —
# آنجا زمان اجراست و تا آن موقع مقدارشان دیگر خوانده نمی‌شود.
#
# نتیجه‌ی نادیده گرفتن این نکته: تگ تأیید هرگز در صفحه ظاهر نمی‌شود و
# گوگل می‌گوید «مالکیت تأیید نشد» بدون اینکه بگوید چرا.
ARG NEXT_PUBLIC_GOOGLE_VERIFICATION
ENV NEXT_PUBLIC_GOOGLE_VERIFICATION=$NEXT_PUBLIC_GOOGLE_VERIFICATION

ARG NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# ───────────────────────────  ۳. اجرا  ───────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# اجرا با کاربر غیرروت — اگر روزی در اپ آسیب‌پذیری‌ای پیدا شد،
# مهاجم دسترسی root داخل کانتینر نخواهد داشت
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# خروجی standalone: سرور مستقل + فقط وابستگی‌های واقعاً لازم
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# پوشه‌ی داده‌ی پایدار (کاتالوگ و تاریخچه‌ی قیمت).
#
# مالکیتش همین‌جا به کاربر غیرروت داده می‌شود. وقتی داکر یک volume نام‌دار
# را برای اولین بار مانت می‌کند، محتوا و مالکیت همین مسیر از ایمیج را
# داخلش کپی می‌کند — پس اپ بعداً اجازه‌ی نوشتن دارد. بدون این خط، volume
# مال root می‌شد و اپ که با کاربر nextjs اجرا می‌شود نمی‌توانست بنویسد.
RUN mkdir -p /data && chown nextjs:nodejs /data

USER nextjs
EXPOSE 3000

# healthcheck تا داکر بفهمد کانتینر واقعاً جواب می‌دهد، نه فقط بالا است
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
