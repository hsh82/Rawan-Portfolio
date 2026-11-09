# Platform staging

Use Node 22 LTS, at least 22.12, or Node 24 LTS. The .nvmrc selects Node 22; .npmrc enforces package engines. Windows CMD, PowerShell, Linux and macOS use the same commands: npm ci (or npm install), npm start / npm run dev, npm run dev:content, npm run build, npm run preview and npm run preview:content. No POSIX environment assignment is needed.

Standard preview always serves read-only dist. preview:content explicitly starts the loopback source-backed authoring server; it does not preview an immutable artifact. Both authoring launchers default to 127.0.0.1. Do not expose them publicly.

R?sum?-disabled builds need no browser. Enabled generation discovers Chrome, Chromium or Edge on PATH and in common Windows/macOS locations. Override with CHROME_BIN, set to the executable path without embedded quotes. PowerShell: $env:CHROME_BIN = 'C:/Program Files/Google/Chrome/Application/chrome.exe'; then npm run resume:generate. CMD: set "CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe". POSIX: export CHROME_BIN='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'.

Missing browser, missing required public content, missing fonts and failed printing fail the command. CHROME_NO_SANDBOX=1 is an explicit opt-in for constrained Linux containers only. Generated output lives under public/resume and is excluded from Git. Disable r?sum? generation to remove previously generated output. Never change verified records merely to pass printing.

Before staging run npm ci, npm run content:validate, npm run content:check-links, npm run check, npm run test:platform, npm run build, npm test, npm run test:smoke and npm run test:pdf. The last command exercises disabled generation and enabled synthetic English/Persian PDFs without changing canonical content. Review real PDFs for font embedding, text search, portraits, page breaks and RTL. CI runs the same checks on Ubuntu, Windows and macOS. A workflow definition is not proof that remote jobs passed.
