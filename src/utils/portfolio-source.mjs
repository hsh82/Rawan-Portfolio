import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { readProjectHubs } from './project-source.mjs';

const readJson = (contentRoot, relativePath, fallback) => {
  const file = resolve(contentRoot, relativePath);
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
};

const readList = (contentRoot, relativePath) => readJson(contentRoot, relativePath, []);

/**
 * Raw, neutral content source shared by the website loader and the résumé
 * generator. Validation and presentation remain consumers' responsibilities.
 */
export function readPortfolioSource(contentRoot = resolve(process.cwd(), 'content')) {
  const profile = readJson(contentRoot, 'profile.json', { visible: false, name: '' });
  const home = readJson(contentRoot, 'home.json', { locales: { en: {}, fa: {} } });

  return {
    site: readJson(contentRoot, 'site.json', {}),
    profile,
    home,
    contact: readJson(contentRoot, 'contact.json', { email: '', phone: '', location: '', socials: [], locales: { en: {}, fa: {} } }),
    projects: readProjectHubs(contentRoot),
    journey: readList(contentRoot, 'journey/entries.json'),
    experience: readList(contentRoot, 'experience/entries.json'),
    education: readList(contentRoot, 'education/entries.json'),
    certifications: readList(contentRoot, 'certifications/entries.json'),
    skills: readList(contentRoot, 'skills/entries.json'),
    resume: readJson(contentRoot, 'resume/config.json', { enabled: false, filenameSlug: 'resume', portrait: true, locales: ['en', 'fa'], include: {}, projectIds: [], journeyIds: [] }),
  };
}

export { readJson };
