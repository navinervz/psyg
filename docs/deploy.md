# راهنمای دیپلوی PsyG

از یک سرور خالی تا سایت زنده با SSL.

## چرا سرور ایرانی و نه Vercel؟

Vercel ساده‌ترین راه است ولی دسترسی به آن از داخل ایران پایدار نیست — یعنی
ممکن است کاربر ایرانی سایتت را اصلاً باز نکند. برای رسانه‌ای که مخاطبش
ایرانی است و قرار است کارشناس دیجی‌کالا هم بازش کند، این ریسک قابل قبول
نیست.

اگر با سرور راحت نیستی، هاست ابری ایرانی با پشتیبانی Node.js هم گزینه است؛
ولی مسیر زیر (VPS + Docker) کنترل کامل می‌دهد.

---

## پیش‌نیازها

- یک VPS اوبونتو ۲۲.۰۴ یا جدیدتر (حداقل ۱ گیگ رم؛ ۸ گیگ که داری خیلی راحت است)
- دامنه‌ای که رکورد `A` آن به IP سرور اشاره کند
- دسترسی SSH

---

## ⚠️ درباره‌ی انقضای سرور — این را جدی بگیر

گفتی سرور فعلی به‌زودی منقضی می‌شود. این نکته‌ی کوچکی نیست:

**دیجی‌کالا بررسی رسانه را روی سایت زنده انجام می‌دهد.** اگر وسط بررسی
(۲۴ تا ۴۸ ساعت، گاهی بیشتر) سرور خاموش شود، کارشناس سایت را بالا نمی‌بیند
و درخواستت رد می‌شود. بعدش باید از نو ثبت کنی.

پس قبل از اینکه ثبت رسانه بزنی، یکی از این دو را انجام بده:

۱. **سرور را تمدید کن** تا حداقل یک ماه دیگر مهلت داشته باشی، یا
۲. **اول سرور بلندمدت (ایرانی) را بگیر** و مستقیم روی همان دیپلوی کن.

سرور فعلی برای **تست کردن** عالی است — بالا بیاور، مطمئن شو همه‌چیز کار
می‌کند، MCP را وصل کن، ممیزی امنیتی بگیر. ولی **ثبت رسانه را روی سروری
انجام بده که می‌دانی چند ماه پابرجاست.**

خبر خوب: چون همه‌چیز داکر است، انتقال به سرور جدید تکرار همین مراحل است
و حدود بیست دقیقه طول می‌کشد.

---

> **اگر روی سرورت سرویس دیگری (مثل n8n) در حال کار است، اول
> `docs/deploy-step0-diagnose.md` را بخوان.** نصب مستقیم Nginx می‌تواند
> آن سرویس را از کار بیندازد.

## مرحله ۱ — DNS در کلادفلر

در داشبورد کلادفلر (چون DNS دامنه آنجاست) دو رکورد بساز:

| نوع | نام | مقدار | Proxy |
|---|---|---|---|
| A | `@` | IP سرور اروپا | ⚠️ فعلاً **DNS only** (ابر خاکستری) |
| A | `www` | IP سرور اروپا | فعلاً **DNS only** |

رکورد `n8n` که از قبل داری دست نخورد.

### ⚠️ مهم‌ترین تله‌ی کل این راهنما

**تا وقتی گواهی SSL نگرفته‌ای، پروکسی کلادفلر (ابر نارنجی) را روشن نکن.**

اگر روشن باشد، certbot با روش HTTP-01 نمی‌تواند گواهی بگیرد — چون درخواست
تاییدیه به کلادفلر می‌رسد نه به سرور تو. علامتش این خطاست:

```
Timeout during connect (likely firewall problem)
```

ترتیب درست: ابر خاکستری → گواهی بگیر → بعد ابر نارنجی روشن کن.

### پروکسی کلادفلر — فعلاً روشن نکن

وسوسه‌انگیز است که ابر را نارنجی کنی (IP پنهان می‌شود، محافظت در برابر
حمله). ولی روشن کردنش دو پیش‌شرط دارد:

۱. گواهی SSL روی سرور نصب شده باشد
۲. تنظیم **SSL/TLS** کلادفلر روی **Full (strict)** باشد

و شرط دوم گیر دارد: **این تنظیم روی کل دامنه اعمال می‌شود، نه هر زیردامنه
جدا.** اگر زیردامنه‌ی دیگری (مثل `n8n`) داری که با Flexible کار می‌کند،
تغییر این تنظیم آن را می‌شکند.

**ترکیبی که حتماً باید از آن پرهیز کنی:** ابر نارنجی + حالت Flexible.
کانفیگ Nginx ما پورت ۸۰ را به HTTPS ریدایرکت می‌کند، و نتیجه‌اش حلقه‌ی
بی‌نهایت ریدایرکت است. خود کلادفلر هم همین را هشدار می‌دهد:
«Will cause errors if your origin forces HTTPS.»

**پس:** با ابر خاکستری شروع کن. سایت با گواهی واقعی Let's Encrypt و HTTPS
کامل بالا می‌آید. وقتی همه‌چیز پایدار بود و بقیه‌ی زیردامنه‌ها هم گواهی
معتبر داشتند، آن‌وقت با هم به Full (strict) و ابر نارنجی می‌رویم.

### بررسی

```bash
dig +short psygstore.shop
```

با ابر خاکستری باید IP سرورت را بدهد. بعد از روشن کردن پروکسی، IP کلادفلر
را می‌دهد — این طبیعی است.

---

## مرحله ۲ — آماده‌سازی سرور

```bash
ssh root@YOUR_SERVER_IP

apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git nginx

# داکر
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version
```

### فایروال

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

> پورت ۳۰۰۰ را باز **نکن**. اپ فقط روی `127.0.0.1` گوش می‌دهد و همه‌ی
> ترافیک باید از Nginx رد شود.

---

## مرحله ۳ — آوردن کد

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/YOUR_USER/psyg.git
cd psyg
```

اگر گیت نداری، با `scp` از ویندوز بفرست:

```powershell
scp -r C:\Users\NAVIX\OneDrive\Desktop\psyg root@YOUR_SERVER_IP:/opt/psyg
```

> `node_modules` و `.next` را نفرست؛ داکر خودش می‌سازد.

---

## مرحله ۴ — متغیرهای محیطی

```bash
cd /opt/psyg
cp .env.example .env
nano .env
```

پر کن:

```
NEXT_PUBLIC_SITE_URL=https://psygstore.shop
NEXT_PUBLIC_DIGIKALA_AFFILIATE_ID=
N8N_SUBSCRIBE_WEBHOOK_URL=https://n8n.psygstore.shop/webhook/psyg-subscribe
PSYG_MCP_TOKEN=
```

برای توکن MCP:

```bash
openssl rand -hex 32
```

خروجی را در `PSYG_MCP_TOKEN` بگذار. اگر خالی بماند، اندپوینت MCP کاملاً
غیرفعال است — که تا وقتی سایت را تست نکرده‌ای اشکالی ندارد.

**دو نکته که فرق مهمی دارند:**

| متغیر | کِی خوانده می‌شود | برای تغییر چه باید کرد |
|---|---|---|
| `NEXT_PUBLIC_*` | زمان **بیلد** | `docker compose up -d --build` |
| بقیه | زمان **اجرا** | `docker compose up -d` (بدون build) |

اگر `NEXT_PUBLIC_SITE_URL` را عوض کنی و فقط ری‌استارت بزنی، لینک‌های
canonical و sitemap همچنان آدرس قدیمی را دارند و سئو خراب می‌شود.

شناسه‌ی افیلیت را فعلاً خالی بگذار؛ بعد از تایید رسانه پر می‌شود.
آدرس وبهوک n8n هم تا وقتی ورک‌فلو را نساخته‌ای بی‌اثر است (ایمیل‌ها فقط
لاگ می‌شوند).

---

## مرحله ۵ — بالا آوردن اپ

```bash
docker compose up -d --build
```

بار اول چند دقیقه طول می‌کشد. بعد:

```bash
docker compose ps          # باید healthy باشد
docker compose logs -f web # لاگ زنده
curl -I http://127.0.0.1:3000/   # باید 200 بدهد
```

اگر `curl` جواب داد، اپ سالم است و فقط Nginx مانده.

---

## مرحله ۶ — Nginx

```bash
cd /opt/psyg

mkdir -p /etc/nginx/snippets
cp deploy/nginx/psyg-proxy.conf /etc/nginx/snippets/
cp deploy/nginx/psyg.conf /etc/nginx/sites-available/

ln -sf /etc/nginx/sites-available/psyg.conf /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

> کانفیگ از قبل روی `psygstore.shop` تنظیم شده. اگر روزی دامنه عوض شد:
> `sed -i 's/psygstore\.shop/NEWDOMAIN/g' /etc/nginx/sites-available/psyg.conf`

فعلاً بلوک‌های HTTPS به گواهی‌ای اشاره می‌کنند که هنوز وجود ندارد، پس
`nginx -t` خطا می‌دهد. اول گواهی بگیر.

---

## مرحله ۷ — گواهی SSL

```bash
apt install -y certbot python3-certbot-nginx
mkdir -p /var/www/certbot

certbot --nginx -d psygstore.shop -d www.psygstore.shop --agree-tos -m info@psygstore.shop --redirect
```

بعد:

```bash
nginx -t && systemctl reload nginx
```

تمدید خودکار را تست کن:

```bash
certbot renew --dry-run
```

---

## مرحله ۸ — بررسی نهایی

از مرورگر خودت (نه سرور) این‌ها را چک کن:

```
https://psygstore.shop/              → صفحه اصلی
https://psygstore.shop/deals         → فرصت‌ها
https://psygstore.shop/robots.txt    → باید Sitemap داشته باشد
https://psygstore.shop/sitemap.xml   → باید محصولات را داشته باشد
http://psygstore.shop/               → باید به https ریدایرکت شود
https://www.psygstore.shop/          → باید به بدون www ریدایرکت شود
```

از سرور:

```bash
curl -I https://psygstore.shop | grep -i "strict-transport\|x-frame\|referrer"
```

---

## به‌روزرسانی سایت

```bash
cd /opt/psyg
git pull
docker compose up -d --build
docker image prune -f     # پاک کردن ایمیج‌های قدیمی
```

بدون داون‌تایم محسوس است چون کانتینر جدید قبل از قطع قدیمی بالا می‌آید.

---

## عیب‌یابی

| نشانه | علت محتمل | راه‌حل |
|---|---|---|
| `502 Bad Gateway` | کانتینر بالا نیست | `docker compose logs web` |
| قیمت‌ها به‌روز نمی‌شوند | داده هنوز mock است | فاز ۲ و n8n |
| لینک‌های canonical اشتباه | `NEXT_PUBLIC_SITE_URL` غلط | اصلاح `.env` و بیلد دوباره |
| فونت لود نمی‌شود | فایل‌های woff2 نیستند | `public/fonts/README.md` |
| SSL تمدید نمی‌شود | پورت ۸۰ بسته | `ufw allow 'Nginx Full'` |
| `Error: Internal: NoFallbackError` در لاگ | طبیعی است، یعنی ۴۰۴ | `docs/testing.md` |

### مصرف حافظه

```bash
docker stats psyg-web
```

سقف ۵۱۲ مگابایت در `docker-compose.yml` تنظیم شده. اگر مدام به سقف
می‌خورد، بالاترش ببر.

---

## مرحله ۹ — روشن کردن MCP و ممیزی امنیتی

بعد از اینکه سایت زنده شد:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://psygstore.shop/api/mcp
# انتظار: 401  (یعنی اندپوینت هست ولی بسته است — درست)
```

سپس آدرس و توکن را به من بده تا با ابزار `security_audit` وضعیت واقعی
سایت زنده را بررسی کنم. راهنمای اتصال: `docs/mcp.md`

---

## انتقال از سرور اروپا به سرور ایران

وقتی مطمئن شدی همه‌چیز درست کار می‌کند:

۱. سرور ایرانی را بگیر و **مرحله‌های ۲ تا ۷ را عیناً روی آن تکرار کن.**
   داکر یعنی محیط دقیقاً یکسان می‌شود.
۲. سایت را روی سرور جدید بالا بیاور و با IP مستقیم تست کن:
   ```bash
   curl -H "Host: psygstore.shop" http://NEW_SERVER_IP/
   ```
۳. تازه بعد از اینکه مطمئن شدی، در کلادفلر رکورد `A` را به IP جدید تغییر بده.
۴. سرور اروپا را یکی دو روز نگه دار تا مطمئن شوی DNS همه‌جا پخش شده.
۵. `certbot` روی سرور جدید گواهی جدید می‌گیرد — گواهی قدیمی قابل انتقال
   نیست و لازم هم نیست.

چون کلادفلر جلوی سایت است، تغییر IP برای کاربر تقریباً بی‌وقفه اتفاق می‌افتد.

**نکته‌ی مهم:** رکورد `n8n.psygstore.shop` را جدا نگه دار. لازم نیست n8n و
سایت روی یک سرور باشند؛ اتفاقاً بهتر است نباشند تا اگر یکی سنگین شد
دیگری را نخواباند.

---

## بعد از اینکه سایت زنده شد

۱. سایت را چند روز بالا نگه دار و مطمئن شو پایدار است.
۲. ایمیل `info@psygstore.shop` را بساز — **شرط احراز مالکیت در دیجی‌کالا**.
۳. ایمیل صفحه‌ی «تماس با ما» را به همان تغییر بده.
۴. برو سراغ ثبت رسانه: `docs/digikala-affiliate-guide.md`

---

## چک‌لیست فشرده

```
[ ] قدم صفر: سرور بررسی شد (اگر سرویس دیگری روی آن هست)
[ ] رکوردهای A در کلادفلر، ابر خاکستری (DNS only)
[ ] داکر و Nginx نصب شد
[ ] فایروال: فقط SSH و Nginx
[ ] .env پر شد (NEXT_PUBLIC_SITE_URL حتماً)
[ ] docker compose up -d --build → healthy
[ ] کانفیگ Nginx کپی و لینک شد
[ ] certbot گواهی گرفت
[ ] هر شش آدرس مرحله ۸ درست جواب دادند
[ ] certbot renew --dry-run موفق بود
[ ] PSYG_MCP_TOKEN ست شد و /api/mcp کد ۴۰۱ می‌دهد
[ ] ممیزی امنیتی گرفته شد

بعداً (اختیاری، وقتی همه‌ی زیردامنه‌ها گواهی دارند):
[ ] SSL/TLS روی Full (strict)
[ ] ابر کلادفلر نارنجی
```
