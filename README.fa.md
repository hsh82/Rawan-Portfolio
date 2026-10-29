# پورتفولیوی راوان

**قالبی دوزبانه و قابل نگهداری با کمک هوش مصنوعی برای ساخت کارنامهٔ حرفه‌ای، بر پایهٔ Astro.**

[![مجوز MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.md) [![ساخته‌شده با Astro](https://img.shields.io/badge/Made%20with-Astro-ff5d01?logo=astro&logoColor=white)](https://astro.build/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

[![پیش‌نمایش پورتفولیو](public/images/portfolio-preview.jpg)](public/images/portfolio-preview.jpg)

<a href="README.md"><strong>English README →</strong></a>

این پروژه یک چارچوب قابل استفادهٔ مجدد برای ساخت وب‌سایت شخصی توسعه‌دهندگان، مهندسان، طراحان و تیم‌های فنی است. سایت از مسیرهای انگلیسی و فارسی، چیدمان راست‌به‌چپ و چپ‌به‌راست، حالت روشن و تاریک، وبلاگ MDX و محتوای متمرکز در پوشهٔ `content/` پشتیبانی می‌کند.

این پروژه بر پایهٔ [Astro Multilingual Portfolio Template](https://github.com/nicremo/astro-multilingual-portfolio-template) اثر Fabian Bitzer شکل گرفته است. طراحی اولیه، ساختار واکنش‌گرا، تغییر پوسته، ناوبری چندزبانه و مجوز MIT پروژهٔ مادر حفظ شده و قابلیت‌های محتوایی، انتشار فنی، اعتبارسنجی، رزومه و مهارت‌های Agent به آن افزوده شده‌اند.

تصویر پیش‌نمایش ابتدای این README نسخهٔ مرجع این انتشار است و در مسیر `public/images/portfolio-preview.jpg` نگهداری می‌شود تا GitHub و نسخهٔ محلی مخزن از یک تصویر استفاده کنند.

English documentation: [README.md](README.md)

## امکانات

- مسیرهای انگلیسی `/en/` و فارسی `/fa/` با پشتیبانی کامل از RTL و LTR
- طراحی واکنش‌گرا برای موبایل، تبلت و دسکتاپ
- پوستهٔ روشن و تاریک با تشخیص تنظیمات سیستم و تغییر دستی
- نوار ناوبری چسبان و نوار پیشرفت بخش‌های صفحهٔ اصلی
- بخش‌های Hero، درباره، تمرکز حرفه‌ای، مهارت‌ها و ابزارها، تجربه، مسیر حرفه‌ای، پروژه‌ها و ارتباط
- حالت‌های خالی و راهنمای قابل فهم برای یک قالب تازه و بدون مالک مشخص
- وبلاگ چندزبانه با Markdown/MDX، پوشه‌بندی موضوعی، دسته‌بندی، برچسب و مقالهٔ پیش‌نویس
- نمایش Mermaid، Markmap، فرمول‌های KaTeX و فایل‌های PDF پیوست
- جست‌وجوی تولیدی با Pagefind و فید RSS برای هر زبان
- تولید اختیاری رزومهٔ PDF فارسی و انگلیسی با دادهٔ مرکزی و فونت Vazirmatn
- ابزارهای Agent محلی برای ویرایش امن محتوا و بررسی ساختار
- گردش‌کار CI و استقرار Vercel

## فناوری‌ها

- Astro 5، TypeScript و خروجی استاتیک
- Tailwind CSS و `@astrojs/tailwind`
- Astro Content Collections و `@astrojs/mdx`
- Preact برای بخش‌های تعاملی
- Vazirmatn، Lucide، Mermaid، Markmap و KaTeX
- Pagefind برای جست‌وجوی تولیدی
- npm و فایل قفل `package-lock.json`

## شروع سریع

```sh
git clone <your-repository-url>
cd portfolio
npm ci
npm run dev
```

سپس `http://localhost:4321/en/` یا `http://localhost:4321/fa/` را باز کنید. برای بررسی و ساخت نسخهٔ تولیدی:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
npm run preview
```

## حالت Easy Content

Easy Content ابزار محلی ویرایش محتوای JSON و پروژه‌های دوزبانه است. این قابلیت به‌صورت پیش‌فرض خاموش است و هیچ‌وقت در build تولیدی فعال نمی‌شود.

### شروع سایت قابل ویرایش

```sh
npm run dev:content
```

سپس `http://localhost:4321/fa/` یا `/en/` را باز کنید. نوار ویرایش سایت بر اساس زبانی که از آن وارد شده‌اید، لینک‌های فارسی یا انگلیسی نشان می‌دهد.

### پیش‌نمایش همراه با ویرایش

```sh
npm run build
npm run preview:content
```

برای پیش‌نمایش فقط‌خواندنی از `npm run preview` استفاده کنید. مقدار `EASY_CONTENT_MODE=true` را روی سرور عمومی یا deployment فعال نکنید، چون Easy Content در working tree محلی فایل می‌نویسد.

### روند پیشنهادی نویسندگی

1. `npm run dev:content` را اجرا کنید یا ابتدا build بگیرید و سپس `npm run preview:content` را اجرا کنید.
2. سایت را به زبان فارسی یا انگلیسی باز کنید.
3. از نوار ویرایش، **محتوای صفحهٔ اصلی**، **پروفایل و پرتره** یا **ویرایش وبلاگ** را انتخاب کنید.
4. متن صفحهٔ اصلی در `content/home.json` قرار دارد. هویت و تصویر پروفایل در `content/profile.json` است. تصویر را از ویرایشگر پروفایل وارد کنید تا در `content/media/` ذخیره و مسیر آن خودکار ثبت شود.
5. از ویرایش وبلاگ یک هاب پروژه بسازید. هر پروژه یک پوشه با `entry.json` و فایل‌های هم‌سطح `en.mdx` و `fa.mdx` است. مقاله‌های فرزند را داخل همان پوشه اضافه کنید.
6. هنگام کار، پروژه را به‌صورت پیش‌نویس ذخیره کنید. دکمهٔ **انتشار** هر دو زبان را اعتبارسنجی، ذخیره و منتشر می‌کند.
7. پیش‌نمایش واقعی را در هر دو زبان بررسی کنید و سپس آزمون‌های اعتبارسنجی و build را اجرا کنید.
8. در پایان تغییرات را بررسی، commit و push کنید:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
git status
git add content/ public/images/ README.md README.fa.md
git commit -m "content: update portfolio"
git push origin HEAD
```

ویرایشگر خودش commit، push یا deploy نمی‌کند. پیش از commit حتماً diff را بررسی کنید. محتوای draft تا زمان انتشار صریح در مسیر عمومی قرار نمی‌گیرد.

### تصاویر راهنما

<a href="public/images/Home%20page%20edit%20helper.JPG"><img src="public/images/Home%20page%20edit%20helper.JPG" alt="ویرایش JSON صفحهٔ اصلی در Easy Content" width="720"></a>

<a href="public/images/Article%20edit%20helper.JPG"><img src="public/images/Article%20edit%20helper.JPG" alt="ویرایش مقالهٔ دوزبانه در Easy Content" width="720"></a>

راهنمای انگلیسی: [README.md](README.md)

## ساختار مخزن

```text
src/                 صفحات، layoutها، کامپوننت‌ها، استایل‌ها و ابزارها
content/             اطلاعات مالک سایت، مقاله‌ها، رسانه و تنظیمات رزومه
.agents/skills/      راهنمای محلی برای نگهداری محتوا
design/              مستندات معماری و تصمیم‌های مهندسی
scripts/             ابزارهای اعتبارسنجی، لینک، رزومه و بررسی خروجی
.github/workflows/   گردش‌کار CI و استقرار Vercel
tests/fixtures/      نمونه‌های ساختگی ایزوله برای آزمون
```

## شخصی‌سازی محتوا

اطلاعات عمومی مالک سایت فقط باید در `content/` قرار بگیرد:

1. عنوان، توضیح و آدرس سایت را در `content/site.json` تنظیم کنید.
2. در `content/profile.json` مقدار `visible` و اطلاعات هویتی و تصویر را تنظیم کنید.
3. سلام، نام نمایشی، عنوان، معرفی، خلاصه و دکمه‌های صفحهٔ اصلی را در `content/home.json` بنویسید.
4. ایمیل، تلفن، مکان و لینک‌های اجتماعی تأییدشده را در `content/contact.json` وارد کنید.
5. تصویر را در `content/media/` قرار دهید یا از ویرایشگر پروفایل وارد کنید و مسیر `profile.image` را مانند `media/profile/profile.svg` تنظیم کنید. در صورت نیاز `resumeImage` را جداگانه اضافه کنید.
6. مهارت‌ها را در `content/skills/entries.json` و سوابق را در فایل‌های `experience`، `education` و `certifications` اضافه کنید.
7. نقاط عطف مهم را در `content/journey/entries.json` و پروژه‌ها را به‌صورت هاب در `content/blog/projects/<project-id>/` ثبت کنید.
8. مقاله‌های دوزبانه را داخل همان هاب پروژه یا مسیرهای موضوعی وبلاگ قرار دهید.
9. پس از بررسی واقعی اطلاعات، رزومه را در `content/resume/config.json` فعال کنید.

شناسه‌ها باید پایدار باشند، رکوردهای عمومی ترجمهٔ `en` و `fa` داشته باشند و هیچ ادعای تأییدنشده، عدد ساختگی، سابقهٔ جعلی یا اطلاعات تماس فرضی اضافه نشود.

## مهارت‌ها و ابزارها

دسته‌های پیش‌فرض مهارت شامل `cicd`، `containers`، `infrastructure`، `network`، `scripting` و `design` است. هر رکورد عنوان، توضیح، اولویت، وضعیت نمایش و آرایهٔ `technologies` دارد. شناسهٔ فناوری‌ها در `src/utils/skill-icons.ts` به آیکون Lucide متصل می‌شود؛ برای فناوری جدید فقط در صورت نیاز نگاشت آیکون را به‌روزرسانی کنید.

## مسیر حرفه‌ای و پروژه‌ها

رویدادهای Journey می‌توانند از نوع استخدام، نقطهٔ عطف، تحصیل، گواهی، دستاورد، پروژه، آموزش، متن‌باز یا سایر موارد باشند. این بخش برای نقاط عطف مهم حرفه‌ای است، نه گزارش کارهای روزمره.

پروژه‌ها با یک منبع اصلی در وبلاگ تعریف می‌شوند و صفحهٔ اصلی نیز همان منبع را می‌خواند. `content/projects/entries.json` منبع اجرای پروژه‌ها نیست. هر پروژه می‌تواند چند مقاله داشته باشد:

```text
content/blog/projects/<project-id>/
├── entry.json
├── en.mdx
├── fa.mdx
└── articles/<article-slug>/{en.mdx,fa.mdx}
```

## وبلاگ و MDX

ساختار پوشه، ساختار URL را مشخص می‌کند:

```text
content/blog/fa/devops/docker/networking.mdx
→ /fa/blog/devops/docker/networking/
```

حداقل frontmatter معتبر:

```mdx
---
title: مبانی شبکهٔ Docker
description: معرفی کوتاه شبکه در کانتینرها.
slug: docker-networking
locale: fa
category: devops
subcategory: docker
tags: [docker, networking]
pubDate: 2026-01-15
translationId: docker-networking
draft: true
featured: false
toc: true
---

## بخش نخست

مقاله را با توضیح روشن شروع کنید.
```

برای ترجمه، همان مسیر نسبی را زیر `en/` بسازید و `translationId` را حفظ کنید. مقاله‌های دارای `draft: true` در سایت، نقشهٔ سایت و جست‌وجو منتشر نمی‌شوند. Mermaid، Markmap، ریاضی، تصویر، لینک داخلی و فایل PDF پیوست پشتیبانی می‌شوند.

## چندزبانه‌سازی

رابط مشترک در `src/i18n/en.json` و `src/i18n/fa.json` قرار دارد. اطلاعات اختصاصی مالک باید در `content/` بماند. Layout مشترک مقدار `lang`، جهت سند، canonical و لینک زبان دیگر را تنظیم می‌کند. برای ترجمهٔ یک رکورد یا مقاله، دادهٔ فارسی متناظر را اضافه کنید و کامپوننت را کپی نکنید.

## تولید رزومه

رزومه از `profile.json`، `site.json`، `contact.json` و رکوردهای تجربه، تحصیل، گواهی، مهارت و پروژه خوانده می‌شود. در `content/resume/config.json` می‌توانید فعال‌بودن، نام فایل، زبان‌ها، تصویر و رکوردهای انتخابی را تنظیم کنید.

```sh
npm run resume:generate
```

برای تولید PDF به Chromium سازگار نیاز است. خروجی با فونت Vazirmatn، متن قابل جست‌وجو، چینش دوزبانه و URLهای جداشده از متن تولید می‌شود. فایل‌های تولیدی PDF در حالت پیش‌فرض commit نمی‌شوند؛ دادهٔ منبع، تنظیمات و generator باید در مخزن بمانند.

## Agent Skills

مهارت‌های محلی در `.agents/skills/` قرار دارند و به Codex کمک می‌کنند تغییرات را در مسیر درست انجام دهد:

- `portfolio-profile`
- `portfolio-project`
- `portfolio-blog`
- `portfolio-journey`
- `portfolio-resume`
- `portfolio-assets`
- `portfolio-review`

نمونهٔ درخواست‌ها:

```text
یک پروژهٔ جدید Kubernetes اضافه کن.
یک مقالهٔ فارسی دربارهٔ شبکهٔ Docker بنویس.
سابقهٔ حرفه‌ای من را به‌روزرسانی کن.
Terraform را به مهارت‌های زیرساخت اضافه کن.
رزومهٔ جدیدم را تولید کن.
این مقاله را به انگلیسی ترجمه کن.
```

ادعاهای تولیدشده با هوش مصنوعی باید توسط مالک بررسی شوند. قبل از build، اعتبارسنجی محتوا و بررسی لینک‌ها را اجرا کنید.

## استقرار با Vercel

می‌توانید مخزن را مستقیماً به Vercel متصل کنید یا از دو گردش‌کار دستی GitHub Actions استفاده کنید. از تب Actions، یکی از `Vercel Preview` یا `Vercel Production` را انتخاب و سپس شاخهٔ `main` یا هر شاخهٔ `content/*` را وارد کنید؛ هیچ pushای به‌صورت خودکار deploy نمی‌شود. متغیرهای `VERCEL_TOKEN`، `VERCEL_ORG_ID` و `VERCEL_PROJECT_ID` را به‌صورت Secret تنظیم کنید و برای مقصد production محیط GitHub را محافظت کنید. اگر این گردش‌کارها مسیر استقرار هستند، استقرار خودکار Git در Vercel را خاموش کنید.

## مجوز و اعتباردهی

این پروژه مجوز MIT و اطلاعیهٔ حق‌نشر قالب مادر را در [LICENSE.md](LICENSE.md) حفظ می‌کند. برای جزئیات مرجع طراحی و تغییرات این مخزن، [README انگلیسی](README.md) و پوشهٔ `design/` را ببینید.

## رفع اشکال

- خطای اعتبارسنجی: فیلدهای لازم و وجود هر دو زبان را با `src/utils/portfolio-content.ts` مقایسه کنید.
- لینک مقاله خراب: مسیر داخلی را بررسی و `npm run content:check-links` را اجرا کنید.
- تصویر نمایش داده نمی‌شود: فایل مالک باید زیر `content/media/` باشد، مسیر با `media/` شروع شود و `npm run media:publish` اجرا شده باشد. تصویر پیش‌نمایش README عمداً در `public/images/` قرار دارد تا GitHub آن را مستقیم نمایش دهد.
- رزومه تولید نمی‌شود: پروفایل را قابل نمایش و résumé را فعال کنید و نصب Chromium را بررسی کنید.
- مشکل RTL: صفحهٔ فارسی را جداگانه بررسی کنید و URL و code span را LTR نگه دارید.
- خطای Vercel: ابتدا `npm ci` و `npm run build` را محلی اجرا و Secretها را بررسی کنید.
