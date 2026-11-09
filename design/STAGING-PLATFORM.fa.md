# راه‌اندازی آزمایشی در سیستم‌عامل‌های مختلف

از Node.js شاخهٔ LTS 22 با حداقل نسخهٔ 22.12 یا شاخهٔ 24 با حداقل نسخهٔ 24.13.1 استفاده کنید. فایل `.nvmrc` شاخهٔ 22 را انتخاب می‌کند و `.npmrc` نسخه‌های ناسازگار را هنگام نصب رد می‌کند. نسخهٔ قدیمی 24.0.1 در ویندوز برای پاک‌کردن مسیرهای دارای نویسه‌های غیرلاتین مشکل شناخته‌شده دارد.

این دستورها در PowerShell، CMD، لینوکس و macOS یکسان هستند:

```text
npm ci
npm start
npm run dev:content
npm run build
npm run preview
npm run preview:content
```

برای نصب معمولی می‌توانید از `npm install` نیز استفاده کنید؛ برای نصب تکرارپذیر، `npm ci` و فایل قفل مخزن را نگه دارید. پیش‌نمایش عادی فقط خروجی `dist/` را نمایش می‌دهد. دستور `preview:content` یک سرور محلیِ نگارش از روی فایل‌های منبع اجرا می‌کند؛ پیش‌نمایش تغییرات ذخیره‌نشده به همین دلیل امکان‌پذیر است. آن را عمومی نکنید. نصب npm مرورگر دانلود نمی‌کند.

اگر رزومه غیرفعال باشد، تولید PDF به مرورگر نیاز ندارد و خروجی‌های قدیمی پاک می‌شوند. اگر فعال باشد، Chrome، Chromium یا Edge لازم است. مرورگر در PATH و مسیرهای معمول ویندوز و macOS جست‌وجو می‌شود. برای تعیین مسیر دلخواه، متغیر `CHROME_BIN` باید فقط مسیر فایل اجرایی باشد؛ علامت نقل‌قول نباید بخشی از مقدار آن باشد.

PowerShell:

```powershell
$env:CHROME_BIN = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
npm run resume:generate
```

CMD:

```bat
set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe"
npm run resume:generate
```

macOS یا لینوکس، با مسیر واقعی مرورگر نصب‌شده:

```sh
export CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
npm run resume:generate
```

نبود مرورگر، فونت یا اطلاعات عمومیِ ضروری باید باعث خطای روشن شود. برای رفع خطا، اطلاعات شخصی را نسازید یا تغییر ندهید. گزینهٔ `CHROME_NO_SANDBOX=1` فقط برای محیط لینوکسی محدود و با انتخاب آگاهانه است. خروجی‌های تولیدی در `public/resume/` قرار می‌گیرند و وارد Git نمی‌شوند. تنظیم `RESUME_KEEP_HTML=1` فایل‌های چاپ را برای بررسی محلی در `.astro/resume-print/` نگه می‌دارد.

پیش از پذیرش مرحلهٔ آزمایشی اجرا کنید:

```text
npm run content:validate
npm run content:check-links
npm run check
npm run test:platform
npm run build
npm test
npm run test:smoke
npm run test:pdf
```

آزمون PDF حالت غیرفعال، دو زبان، پرتره، نام‌های خروجی، پاک‌سازی فایل‌های قدیمی و مسیرهای دارای فاصله و نویسه‌های غیرلاتین را بررسی می‌کند. فونت جاسازی‌شده، جست‌وجوی متن، ترتیب راست‌به‌چپ، برش صفحه و پرتره را در PDF واقعی نیز بازبینی کنید. نتیجهٔ CI هر سیستم‌عامل را جداگانه ثبت کنید؛ تعریف workflow به‌تنهایی نتیجهٔ موفق نیست. جزئیات فنی و محدودیت‌ها در [گزارش پلتفرم](reports/2026-11-09-platform-staging.md) آمده است.
