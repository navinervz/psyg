# دیپلوی با Cloudflare Tunnel (تانل نام‌دار)

این راهنما مخصوص وضعیت واقعی سرور توست.

---

## مشکل فعلی

تانلی که الان داری با این دستور اجرا شده:

```
tunnel --url http://127.0.0.1:5678
```

این **Quick Tunnel** است — همان چیزی که کلادفلر برای تست موقت ساخته:

| ویژگی | Quick Tunnel | تانل نام‌دار |
|---|---|---|
| آدرس | تصادفی روی `trycloudflare.com` | دامنه‌ی خودت |
| پایداری آدرس | با هر ری‌استارت عوض می‌شود | ثابت |
| چند هاست‌نیم | فقط یکی | نامحدود |
| مناسب پروداکشن | ❌ کلادفلر صریحاً می‌گوید نه | ✓ |

به همین دلیل `n8n.psygstore.shop` کار نمی‌کند: رکورد A به IP سرور اشاره
می‌کند، کلادفلر سراغ پورت ۸۰ می‌رود، و آنجا نه چیزی گوش می‌دهد نه فایروال
اجازه می‌دهد. نتیجه: خطای ۵۲۲.

**راه‌حل یکی است و هر دو مشکل را حل می‌کند:** یک تانل نام‌دار بساز که هم
n8n را روی دامنه‌ی درست سرو کند، هم سایت را.

---

## مرحله ۱ — سایت را بالا بیاور

این مرحله کاملاً مستقل است و به n8n دست نمی‌زند.

### ۱.۱ کد را بیاور

**⚠️ با `scp -r` روی خود پوشه نفرست.** آن دستور `node_modules` را هم
می‌برد — ۲۸۱ پکیج و ده‌ها هزار فایل. هم ساعت‌ها طول می‌کشد، هم ممکن است
سیستم را هنگ کند، هم بی‌فایده است چون پکیج‌های ویندوزی روی لینوکس اجرا
نمی‌شوند و سرور خودش موقع بیلد نصبشان می‌کند.

پروژه‌ی واقعی ۱۳۴ فایل و کمتر از یک مگابایت است.

#### راه ۱ — بسته‌ی فشرده (سریع، بدون نیاز به گیت)

در PowerShell روی ویندوز:

```powershell
cd C:\Users\NAVIX\OneDrive\Desktop\psyg
powershell -ExecutionPolicy Bypass -File scripts\package-for-server.ps1
```

فایل `psyg-deploy.zip` روی دسکتاپت ساخته می‌شود. بفرستش:

```powershell
scp -P 9011 "$env:USERPROFILE\Desktop\psyg-deploy.zip" root@2.58.172.224:/opt/
```

روی سرور بازش کن:

```bash
apt install -y unzip
cd /opt
rm -rf psyg
mkdir psyg && cd psyg
unzip -q /opt/psyg-deploy.zip
ls -la
```

باید `src`، `docs`، `deploy`، `tests`، `Dockerfile` و
`docker-compose.yml` را ببینی.

#### راه ۲ — گیت (بهتر برای بلندمدت)

اگر گیت‌هاب را راه انداختی، این تمیزتر است چون به‌روزرسانی‌های بعدی
فقط یک `git pull` می‌شوند:

```bash
cd /opt && git clone https://github.com/YOUR_USERNAME/digipsyg.git psyg
```

### ۱.۲ متغیرهای محیطی

```bash
cd /opt/psyg
cp .env.example .env
openssl rand -hex 32
```

خروجی آن دستور را کپی کن، بعد:

```bash
nano .env
```

پر کن:

```
NEXT_PUBLIC_SITE_URL=https://psygstore.shop
NEXT_PUBLIC_DIGIKALA_AFFILIATE_ID=
N8N_SUBSCRIBE_WEBHOOK_URL=
PSYG_MCP_TOKEN=<همان رشته‌ی ۶۴ کاراکتری>
```

ذخیره: `Ctrl+O` ← `Enter` ← `Ctrl+X`

### ۱.۳ بیلد و اجرا

```bash
docker compose up -d --build
```

بار اول چند دقیقه طول می‌کشد.

### ۱.۴ بررسی

```bash
docker compose ps
curl -I http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/ | grep -o "<title>[^<]*" | head -1
docker ps --format "{{.Names}} | {{.Status}}"
```

باید `200` بگیری و هر چهار کانتینر `Up` باشند.

---

## مرحله ۲ — ساخت تانل نام‌دار

### ۲.۱ در داشبورد کلادفلر

۱. برو به [one.dash.cloudflare.com](https://one.dash.cloudflare.com)
۲. از منوی کناری: **Networks** ← **Tunnels**
۳. **Create a tunnel** ← نوع **Cloudflared** را انتخاب کن
۴. اسم بگذار: `psyg-server`
۵. **Save tunnel**

حالا صفحه‌ای می‌آید با دستورهای نصب برای سیستم‌عامل‌های مختلف. تب
**Docker** را بزن. دستوری می‌بینی شبیه این:

```
docker run cloudflare/cloudflared:latest tunnel --no-autoupdate run --token eyJhIjoi...
```

آن رشته‌ی بلند بعد از `--token` را کپی کن.

> ⚠️ **این توکن مثل رمز عبور است.** هرکس آن را داشته باشد می‌تواند به
> شبکه‌ی داخلی سرورت وصل شود. در چت یا اسکرین‌شات نگذارش.

### ۲.۲ روی سرور: جایگزینی کانتینر

```bash
# تانل قدیمی را نگه دار ولی متوقف کن — اگر لازم شد برمی‌گردانیمش
docker stop cf-tunnel
docker rename cf-tunnel cf-tunnel-old

# تانل جدید
docker run -d \
  --name cf-tunnel \
  --restart unless-stopped \
  --network host \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token PASTE_YOUR_TOKEN_HERE
```

> `--network host` یعنی کانتینر تانل مستقیم به `127.0.0.1` سرور دسترسی
> دارد — همان تنظیمی که تانل قبلی‌ات هم داشت. برای همین می‌توانیم به
> `127.0.0.1:3000` و `127.0.0.1:5678` اشاره کنیم.

بررسی کن وصل شد:

```bash
docker logs cf-tunnel --tail 20 | grep -i "registered\|error"
```

باید `Registered tunnel connection` ببینی.

### ۲.۳ اضافه کردن هاست‌نیم‌ها

برگرد به داشبورد، تانل `psyg-server` ← **Configure** ← تب
**Public Hostnames** ← **Add a public hostname**.

سه مورد اضافه کن:

| # | Subdomain | Domain | Type | URL |
|---|---|---|---|---|
| ۱ | (خالی) | `psygstore.shop` | HTTP | `localhost:3000` |
| ۲ | `www` | `psygstore.shop` | HTTP | `localhost:3000` |
| ۳ | `n8n` | `psygstore.shop` | HTTP | `localhost:5678` |

بعد از هر کدام **Save hostname** بزن.

### ۲.۴ پاک کردن رکوردهای A دستی

کلادفلر برای هر هاست‌نیم خودش یک رکورد CNAME می‌سازد. رکوردهای A دستی
تداخل ایجاد می‌کنند.

در **DNS** ← **Records**، این سه رکورد A را حذف کن:

```
psygstore.shop      A   2.58.172.224
www.psygstore.shop  A   2.58.172.224
n8n.psygstore.shop  A   2.58.172.224
```

بعد از حذف، باید سه رکورد **CNAME** ببینی که به
`<tunnel-id>.cfargotunnel.com` اشاره می‌کنند و نارنجی‌اند. اگر کلادفلر
خودش نساخت، دستی بساز:

| Type | Name | Target | Proxy |
|---|---|---|---|
| CNAME | `@` | `<TUNNEL_ID>.cfargotunnel.com` | نارنجی |
| CNAME | `www` | `<TUNNEL_ID>.cfargotunnel.com` | نارنجی |
| CNAME | `n8n` | `<TUNNEL_ID>.cfargotunnel.com` | نارنجی |

`TUNNEL_ID` را در صفحه‌ی تانل می‌بینی.

---

## مرحله ۳ — تست نهایی

از مرورگر خودت:

```
https://psygstore.shop/              → صفحه اصلی سایت
https://psygstore.shop/deals         → فرصت‌ها
https://psygstore.shop/robots.txt    → باید Sitemap داشته باشد
https://www.psygstore.shop/          → باید به بدون www برود
https://n8n.psygstore.shop/          → n8n، حالا روی دامنه‌ی درست
```

از سرور:

```bash
curl -sI https://psygstore.shop | grep -iE "^HTTP|x-frame|referrer"
curl -s -o /dev/null -w "MCP: %{http_code}\n" https://psygstore.shop/api/mcp
# انتظار: 401 — یعنی اندپوینت هست ولی بسته است
```

اگر همه‌چیز درست بود، کانتینر قدیمی را پاک کن:

```bash
docker rm cf-tunnel-old
```

---

## مرحله ۴ — سفت کردن فایروال

حالا که n8n از تانل سرو می‌شود، دیگر لازم نیست پورت ۵۶۷۸ روی اینترنت باز
باشد:

```bash
ufw delete allow 5678/tcp
ufw status
```

فقط SSH باید بماند. این یعنی هیچ‌کس نمی‌تواند مستقیم به n8n وصل شود و
همه‌ی ترافیک از کلادفلر عبور می‌کند.

> اگر بعد از این n8n از دامنه باز نشد، تانل درست کانفیگ نشده. با
> `ufw allow 5678/tcp` برگردان و لاگ تانل را ببین.

---

## درباره‌ی تنظیم SSL/TLS

با تانل نام‌دار، ترافیک بین کلادفلر و سرورت از خود تانل عبور می‌کند که
رمزنگاری‌شده است. حالت `Flexible` که الان تنظیم است برای این مسیر مشکلی
ایجاد نمی‌کند.

وقتی همه‌چیز پایدار شد، می‌توانی به **Full (strict)** ببری — با تانل این
تغییر بی‌خطر است چون گواهی روی origin اصلاً موضوعیت ندارد.

---

## اگر چیزی خراب شد

برگشت به حالت قبل:

```bash
docker stop cf-tunnel && docker rm cf-tunnel
docker rename cf-tunnel-old cf-tunnel
docker start cf-tunnel
```

و سایت را بردار بدون اینکه به n8n دست بخورد:

```bash
cd /opt/psyg && docker compose down
```

---

## چک‌لیست

```
[ ] کد در /opt/psyg
[ ] .env پر شد (SITE_URL و MCP_TOKEN)
[ ] docker compose up -d --build موفق
[ ] curl 127.0.0.1:3000 کد ۲۰۰ داد
[ ] تانل نام‌دار در داشبورد ساخته شد
[ ] کانتینر cf-tunnel با توکن جدید اجرا شد
[ ] لاگ: Registered tunnel connection
[ ] سه public hostname اضافه شد
[ ] رکوردهای A دستی حذف شدند
[ ] هر سه آدرس از مرورگر باز شدند
[ ] n8n روی دامنه کار می‌کند
[ ] /api/mcp کد ۴۰۱ می‌دهد
[ ] پورت ۵۶۷۸ از فایروال بسته شد
[ ] cf-tunnel-old پاک شد
```
