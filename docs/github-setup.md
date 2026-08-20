# آپلود پروژه به گیت‌هاب

هدف: مخزنی به نام `digipsyg` که هم نسخه‌پشتیبان کدت باشد، هم دیپلوی روی
سرور را به یک دستور `git pull` تبدیل کند.

---

## چرا این کار مهم است

الان تنها نسخه‌ی کد روی لپ‌تاپ توست. اگر لپ‌تاپ خراب شود یا فایلی را
اشتباهی پاک کنی، همه‌چیز از دست می‌رود.

از این مهم‌تر: بدون گیت، هر بار که چیزی روی سرور عوض شود باید کل پوشه را
دوباره `scp` کنی. با گیت، به‌روزرسانی می‌شود `git pull && docker compose up -d --build`.

---

## مرحله ۱ — نصب گیت روی ویندوز

۱. برو به [git-scm.com/download/win](https://git-scm.com/download/win)
۲. نسخه‌ی ۶۴ بیتی را دانلود و اجرا کن.
۳. در تمام مراحل نصب **Next** بزن. تنظیمات پیش‌فرض درست‌اند.

> در صفحه‌ای که درباره‌ی «line ending» می‌پرسد، گزینه‌ی پیش‌فرض
> (`Checkout Windows-style, commit Unix-style`) را نگه دار. فایل
> `.gitattributes` پروژه هم این را کنترل می‌کند.

۴. بعد از نصب، **CMD را ببند و دوباره باز کن** (وگرنه دستور `git` را
   پیدا نمی‌کند).

۵. تست:

```cmd
git --version
```

باید چیزی مثل `git version 2.47.0.windows.1` بدهد.

---

## مرحله ۲ — معرفی خودت به گیت

```cmd
git config --global user.name "Nervz Xore"
git config --global user.email "areszamani@outlook.com"
git config --global init.defaultBranch main
```

نام و ایمیل روی هر کامیت ثبت می‌شوند.

---

## مرحله ۳ — ساخت مخزن روی گیت‌هاب

۱. وارد [github.com](https://github.com) شو (اگر حساب نداری بساز).
۲. بالا سمت راست، روی **+** بزن ← **New repository**.
۳. پر کن:

| فیلد | مقدار |
|---|---|
| Repository name | `digipsyg` |
| Description | سایت رصد قیمت و افیلیت مارکتینگ |
| Public / Private | **Private** (پیشنهاد من) |
| Add a README | ❌ تیک نزن |
| Add .gitignore | ❌ تیک نزن |
| Add a license | ❌ تیک نزن |

> چرا Private؟ چون کدت شامل منطق کسب‌وکار و ساختار لینک‌های افیلیت است.
> بعداً هر وقت خواستی می‌توانی عمومی‌اش کنی. هیچ سه گزینه‌ی آخر را تیک
> نزن — پروژه از قبل این فایل‌ها را دارد و تیک زدن باعث تداخل می‌شود.

۴. **Create repository** را بزن. صفحه‌ای می‌آید با دستورات — نادیده بگیر،
   دستورات دقیق‌تر پایین آمده.

---

## مرحله ۴ — آماده‌سازی پوشه

CMD را باز کن:

```cmd
cd C:\Users\NAVIX\OneDrive\Desktop\psyg
git init
git add .
```

حالا **قبل از کامیت** بررسی کن چه چیزی قرار است آپلود شود:

```cmd
git status --short
```

### ⚠️ این را حتماً چک کن

در خروجی نباید هیچ‌کدام از این‌ها باشد:

- `.env` (فایل واقعی، نه `.env.example`)
- `node_modules/`
- `.next/`

اگر `.env` را دیدی، فوراً متوقف شو:

```cmd
git rm --cached .env
```

**چرا این‌قدر مهم است:** اگر فایلی که توکن دارد یک بار کامیت شود، حتی
بعد از حذف هم **در تاریخچه‌ی گیت باقی می‌ماند** و هرکس به مخزن دسترسی
داشته باشد می‌تواند از تاریخچه بیرونش بکشد. پاک کردنش از تاریخچه کار
دردسرسازی است.

تعداد فایل‌ها را ببین:

```cmd
git status --short | find /c /v ""
```

عدد باید حدود ۱۲۰ باشد. اگر هزاران فایل بود یعنی `node_modules` وارد شده
و `.gitignore` خوانده نشده.

---

## مرحله ۵ — اولین کامیت و پوش

```cmd
git commit -m "PsyG: فاز اول کامل — فرانت‌اند، تست، دیپلوی و MCP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/digipsyg.git
git push -u origin main
```

`YOUR_USERNAME` را با نام کاربری گیت‌هابت عوض کن.

### احراز هویت

اولین بار که `push` بزنی، پنجره‌ای باز می‌شود و از تو می‌خواهد وارد
گیت‌هاب شوی. روی **Sign in with your browser** بزن و اجازه بده.

> اگر پنجره باز نشد و رمز خواست: گیت‌هاب دیگر رمز عبور معمولی را قبول
> نمی‌کند. باید Personal Access Token بسازی:
> Settings ← Developer settings ← Personal access tokens ← Tokens (classic)
> ← Generate new token ← دسترسی `repo` را تیک بزن. توکن ساخته‌شده را
> به‌جای رمز وارد کن.

---

## مرحله ۶ — بررسی

برو به `https://github.com/YOUR_USERNAME/digipsyg` و ببین:

- [ ] پوشه‌های `src`، `docs`، `deploy`، `tests` هستند
- [ ] `README.md` نمایش داده می‌شود
- [ ] فایل `.env` **نیست**
- [ ] پوشه‌ی `node_modules` **نیست**

---

## مرحله ۷ — استفاده در سرور

حالا روی سرور به‌جای `scp`:

```bash
cd /opt
git clone https://github.com/YOUR_USERNAME/digipsyg.git psyg
cd psyg
```

اگر مخزن خصوصی است، گیت‌هاب نام کاربری و توکن می‌خواهد. همان Personal
Access Token را وارد کن.

### به‌روزرسانی سایت از این به بعد

روی لپ‌تاپ:

```cmd
cd C:\Users\NAVIX\OneDrive\Desktop\psyg
git add .
git commit -m "توضیح تغییر"
git push
```

روی سرور:

```bash
cd /opt/psyg
git pull
docker compose up -d --build
```

---

## دستورهای روزمره

| کار | دستور |
|---|---|
| دیدن تغییرات | `git status` |
| دیدن جزئیات تغییر | `git diff` |
| ثبت تغییرات | `git add . && git commit -m "توضیح"` |
| فرستادن | `git push` |
| گرفتن آخرین نسخه | `git pull` |
| تاریخچه | `git log --oneline` |
| برگرداندن یک فایل | `git checkout -- filename` |

---

## اگر توکنی اشتباهی آپلود شد

فوراً این کارها را انجام بده، به همین ترتیب:

۱. **توکن را باطل کن** — این مهم‌تر از پاک کردن فایل است. توکن لو رفته
   را نمی‌شود «پس گرفت»؛ فقط می‌شود بی‌اثرش کرد.
   - توکن MCP: مقدار جدید در `.env` سرور و `docker compose up -d`
   - توکن گیت‌هاب: از Settings باطلش کن
۲. مخزن را موقتاً Private کن.
۳. بعد فایل را از تاریخچه پاک کن (یا اگر تازه شروع کرده‌ای، ساده‌تر است
   مخزن را حذف و از نو بسازی).

---

## چک‌لیست

```
[ ] گیت نصب شد و git --version جواب داد
[ ] user.name و user.email تنظیم شدند
[ ] مخزن digipsyg روی گیت‌هاب ساخته شد (Private، بدون فایل اولیه)
[ ] git status چک شد — .env و node_modules نبودند
[ ] کامیت و پوش موفق بود
[ ] در گیت‌هاب فایل‌ها دیده می‌شوند و .env نیست
```
