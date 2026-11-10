# راهنمای نصب آسان Rawan Portfolio با Docker

این مخزن دو توزیع Docker دارد:

- **Easy Content**: محیط ویرایش محلی در `http://localhost:4321`
- **Production**: سایت استاتیک و غیرقابل‌تغییر در `http://localhost:8080`

Docker برنامه را فراهم می‌کند و checkout محلی شما پوشهٔ version-controlled به نام `content/` را فراهم می‌کند. ویرایشگر هرگز commit، push یا اعتبار Git را دریافت نمی‌کند.

## پیش‌نیازها و شروع سریع

Docker Desktop 4.x در Windows یا macOS، یا Docker Engine به‌همراه Compose plugin در Linux نصب کنید. تصاویر رسمی فعلاً فقط برای `linux/amd64` اعتبارسنجی شده‌اند.

از ریشهٔ مخزن اجرا کنید:

```sh
docker compose -f setup/docker-compose.yml pull
docker compose -f setup/docker-compose.yml up -d
```

سپس `http://localhost:4321/fa/`، `http://localhost:4321/en/` یا `http://localhost:4321/dev/content/` را باز کنید.

```sh
docker compose -f setup/docker-compose.yml ps
docker compose -f setup/docker-compose.yml logs -f easy-content
docker compose -f setup/docker-compose.yml restart
docker compose -f setup/docker-compose.yml down
```

پوشهٔ `./content/` میزبان در `/app/content` متصل می‌شود. فایل‌های JSON و MDX، پروژه‌ها و mediaهای آپلودشده در checkout باقی می‌مانند و در `git status` دیده می‌شوند. اگر bind mount کاملاً خالی باشد، فقط یک‌بار از template بی‌طرف موجود در image مقداردهی می‌شود. پوشهٔ نیمه‌پر با خطای واضح متوقف می‌شود و فایل‌های پیش‌فرض با آن مخلوط نمی‌شوند.

## روش A — Docker Desktop در Windows

1. Docker Desktop را از [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) نصب و backend مربوط به WSL 2 را فعال کنید.
2. Docker Desktop را اجرا کنید و در **PowerShell** آماده‌بودن را بررسی کنید:

   ```powershell
   docker version
   docker compose version
   ```

3. مخزن و branch محتوایی را دریافت کنید:

   ```powershell
   git clone https://github.com/hsh82/Rawan-Portfolio.git
   Set-Location Rawan-Portfolio
   git switch content/hamed-sheikhan
   docker compose -f setup/docker-compose.yml pull
   docker compose -f setup/docker-compose.yml up -d
   Start-Process http://localhost:4321/dev/content/
   ```

4. فایل‌های ذخیره‌شده در پوشهٔ `content\` checkout هستند. بررسی Git روی میزبان انجام می‌شود:

   ```powershell
   docker compose -f setup/docker-compose.yml logs --tail 100 easy-content
   git status
   git diff -- content
   git add content
   git commit -m "content: update portfolio"
   git push origin HEAD
   ```

checkout را روی local drive، نه network share، نگه دارید و file sharing/WSL integration را برای همان drive فعال کنید.

## روش B — Docker در Linux یا macOS

در Linux، Docker Engine و Compose plugin و در macOS Docker Desktop را نصب کنید:

```sh
docker version
docker compose version
git switch content/hamed-sheikhan
docker compose -f setup/docker-compose.yml pull
docker compose -f setup/docker-compose.yml up -d
```

در macOS `open http://localhost:4321/dev/content/` و در Linux `xdg-open` را اجرا کنید. در Linux فایل‌های `content/` باید برای کاربر کانتینر قابل نوشتن باشند؛ کانتینر privileged اجرا نکنید.

## روش C — سایت استاتیک تولیدی

image تولیدی فقط HTML، CSS، JS، تصویر، PDF و Pagefind تولیدشده را دارد و Node، Easy Content و API نوشتن ندارد:

```sh
docker compose -f setup/docker-compose.production.yml pull
docker compose -f setup/docker-compose.production.yml up -d
```

سایت در `http://localhost:8080` است. برای توقف و به‌روزرسانی:

```sh
docker compose -f setup/docker-compose.production.yml down
docker compose -f setup/docker-compose.production.yml pull
docker compose -f setup/docker-compose.production.yml up -d
```

تغییر پورت میزبان: `PORT=9090 docker compose -f setup/docker-compose.production.yml up -d`. برای انتشار اینترنتی، کانتینر را پشت reverse proxy یا زیرساخت مدیریت‌شدهٔ HTTPS قرار دهید. اتصال `content/` به کانتینر تولیدی HTMLهای تولیدشده را تغییر نمی‌دهد؛ برای محتوای جدید باید image تازه build شود.

## روش D — نصب دستی بدون Docker

Node.js 22 LTS (حداقل 22.12) یا Node.js 24.13.1+ نصب کنید:

```sh
git clone https://github.com/hsh82/Rawan-Portfolio.git
cd Rawan-Portfolio
npm ci
npm run dev:content
```

برای توسعهٔ معمول `npm run dev` و برای بررسی source-backed `npm run preview:content` را اجرا کنید:

```sh
npm run content:validate
npm run content:check-links
npm run check
npm run build
npm run preview
```

در template بی‌طرف تولید résumé خاموش است. اگر فعال شد باید Chrome، Chromium یا Edge نصب و `CHROME_BIN` تنظیم شود؛ در صورت نبود browser، build با خطای واضح متوقف می‌شود.

## ساختار، Git و ساخت image

- `content/`: منبع اصلی JSON، MDX و media؛ تنها bind mount پایدار
- `src/`: برنامهٔ Astro و Easy Content
- `setup/`: Dockerfile، Compose، Nginx و راهنماها
- `.github/workflows/docker-publish.yml`: انتشار GHCR پس از موفقیت بررسی‌ها

```sh
git switch -c content/my-portfolio
docker compose -f setup/docker-compose.yml up -d
# ویرایش در http://localhost:4321/dev/content/
git status --short
git diff -- content
npm run content:validate
npm run content:check-links
git add content
git commit -m "content: update portfolio"
git push -u origin content/my-portfolio
```

اعتبار Git فقط روی میزبان می‌ماند و نباید SSH key یا GitHub token وارد image شود.

```sh
docker buildx build --target authoring -t rawan-easy-content:local -f setup/Dockerfile .
docker buildx build --target production -t rawan-portfolio:local -f setup/Dockerfile .
docker compose -f setup/docker-compose.yml config --quiet
docker compose -f setup/docker-compose.production.yml config --quiet
```

builder برای checkoutهایی که résumé فعال دارند Chromium را نصب می‌کند؛ Chromium وارد image سبک production نمی‌شود.

## رفع خطاهای رایج

- **پورت 4321 یا 8080 اشغال است:** با `EASY_CONTENT_PORT=1235` یا `PORT=8081` پورت میزبان را تغییر دهید. در PowerShell از `Get-NetTCPConnection -LocalPort 4321` استفاده کنید.
- **Docker Desktop/WSL آماده نیست:** Docker Desktop را اجرا کنید، `docker version` را بررسی و WSL 2 integration را فعال کنید.
- **محتوا خالی یا ناقص است:** `docker compose ... logs easy-content` و `ls -la content` را ببینید. فایل‌های موجود هرگز overwrite نمی‌شوند.
- **Permission denied:** مالکیت و دسترسی فایل‌های `content/` روی میزبان Linux را اصلاح کنید؛ `--privileged` استفاده نکنید.
- **Live preview تازه نمی‌شود:** checkout را روی local drive بگذارید و کانتینر را restart کنید؛ polling گسترده فعال نیست.
- **تصویر یا media نیست:** مسیر canonical در `content/media/` را بررسی و صفحه را reload کنید.
- **Chromium/PDF خطا دارد:** مسیر `CHROME_BIN` و خروجی build را بررسی کنید؛ Docker build از `/usr/bin/chromium` استفاده می‌کند.
- **GHCR pull denied:** visibility package و نام دقیق دو image را بررسی کنید.
- **کانتینر restart می‌شود:**

  ```sh
  docker compose -f setup/docker-compose.yml ps
  docker compose -f setup/docker-compose.yml logs --tail 200 easy-content
  docker inspect --format '{{json .State.Health}}' "$(docker compose -f setup/docker-compose.yml ps -q easy-content)"
  ```

- **Disk space کم است:** `docker system df` و با احتیاط `docker image prune` را اجرا کنید؛ volume و `content/` را حذف نکنید.
- **Production محتوای قدیمی دارد:** production immutable است؛ از branch صحیح image تازه بسازید و سپس `pull` و recreate کنید.

## امنیت، GHCR و محدودیت آزمایش

Easy Content همچنان session token، Host/Origin همسان، محدودیت body، safe path، symlink check، atomic write و revision check را اعمال می‌کند. Compose فقط روی `127.0.0.1` publish می‌کند و تنها gateway ثابت شبکهٔ اختصاصی Docker را trusted می‌کند؛ آدرس‌های دیگر رد می‌شوند. کانتینر authoring privileged نیست و Docker socket یا Git credentials ندارد. production قابلیت‌ها را حذف و filesystem را read-only می‌کند.

CI معمولی روی pull requestها تست‌های برنامه را اجرا می‌کند. بررسی و انتشار Docker پس از push به `main`، از جمله merge شدن یک pull request، یا برای tag نسخه‌ای `v*.*.*` اجرا می‌شود. اجرای موفق هر دو image را با `GITHUB_TOKEN`، SHA tag و OCI source metadata در GHCR منتشر می‌کند. فعلاً فقط `linux/amd64` هدف است.

CI اجرای Linux را validate می‌کند. اجرای Windows Docker Desktop با WSL 2 و macOS Docker Desktop باید دستی با دستورات بالا آزمایش و جداگانه ثبت شود؛ موفقیت CI لینوکس به‌تنهایی شواهد اجرای آن سیستم‌ها نیست.
