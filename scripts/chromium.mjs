import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { win32, posix, isAbsolute, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export function browserCandidates(platform = process.platform, env = process.env) {
  const { join, delimiter } = platform === 'win32' ? win32 : posix;
  if (env.CHROME_BIN) return [env.CHROME_BIN];
  const names = platform === 'win32' ? ['chrome.exe', 'msedge.exe', 'chromium.exe'] : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  const common = platform === 'win32'
    ? [env.PROGRAMFILES, env['PROGRAMFILES(X86)'], env.LOCALAPPDATA].filter(Boolean).flatMap(base => [join(base, 'Google/Chrome/Application/chrome.exe'), join(base, 'Microsoft/Edge/Application/msedge.exe'), join(base, 'Chromium/Application/chrome.exe')])
    : platform === 'darwin' ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'] : [];
  return [...common, ...(env.PATH || '').split(platform === 'win32' ? ';' : delimiter).filter(Boolean).flatMap(base => names.map(name => join(base, name)))];
}

export function findChromium({ platform = process.platform, env = process.env, probe = file => {
  try { accessSync(file, constants.X_OK); return true; } catch { return false; }
} } = {}) {
  const { join, delimiter } = platform === 'win32' ? win32 : posix;
  const candidates = browserCandidates(platform, env).flatMap(file => {
    if (isAbsolute(file) || file.includes('/') || file.includes('\\')) return [resolve(file)];
    return (env.PATH || '').split(platform === 'win32' ? ';' : delimiter).filter(Boolean).map(base => join(base, file));
  });
  for (const file of candidates) if (probe(file)) return file;
  throw new Error(`${env.CHROME_BIN ? `CHROME_BIN=${env.CHROME_BIN} is unavailable.` : 'No Chrome/Chromium browser was found.'} Install Chrome, Chromium, or Edge and set CHROME_BIN to its executable path (without surrounding quotes). Résumé generation is enabled; it cannot be skipped.`);
}

export function printPdf(browser, args, output) {
  const result = spawnSync(browser, args, { encoding: 'utf8', windowsHide: true, timeout: 90_000 });
  if (result.error || result.status !== 0) throw new Error(`Chromium PDF launch failed: ${result.error?.message || result.stderr || `exit ${result.status}, signal ${result.signal}`}`);
  if (!existsSync(output) || readFileSync(output).subarray(0, 5).toString() !== '%PDF-') throw new Error(`Chromium did not produce a valid PDF: ${output}`);
}
