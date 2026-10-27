import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Locale } from './i18n';

const root = resolve(process.cwd(), 'content');
const localizedText = z.object({ title: z.string().default(''), displayName: z.string().default(''), description: z.string().default(''), intro: z.string().default(''), summary: z.string().default(''), greeting: z.string().default(''), ctaExperience: z.string().default(''), ctaProjects: z.string().default(''), bullets: z.array(z.string()).default([]) }).partial();
const localized = z.object({ en: localizedText.default({}), fa: localizedText.default({}) });
const link = z.object({ label: z.string().min(1), url: z.string().url() });

const siteSchema = z.object({ siteUrl: z.string().url().or(z.literal('')).default(''), locales: z.object({ en: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('Portfolio'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }), fa: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('کارنامه'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }) }) });
const profileSchema = z.object({ visible: z.boolean().default(false), name: z.string().default(''), image: z.string().optional(), focus: z.object({ en: z.array(z.object({ title: z.string(), description: z.string() })), fa: z.array(z.object({ title: z.string(), description: z.string() })) }).optional(), about: z.object({ en: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }), fa: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }) }).optional(), locales: localized.default({ en: {}, fa: {} }) });
const contactSchema = z.object({ email: z.string().email().or(z.literal('')).default(''), phone: z.string().default(''), location: z.string().default(''), socials: z.array(link).default([]), locales: localized.default({ en: {}, fa: {} }) });
const projectSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), visible: z.boolean().default(true), featured: z.boolean().default(false), translationId: z.string().min(1), maturity: z.enum(['organizational', 'internal-pilot', 'academic-mvp', 'experimental-open-source']).default('experimental-open-source'), locales: localized, technologies: z.array(z.string()).default([]), image: z.string().optional(), repository: z.string().url().optional(), externalUrl: z.string().url().optional(), journeyIds: z.array(z.string()).default([]), articleIds: z.array(z.string()).default([]), priority: z.number().int().default(0) });
const journeySchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), visible: z.boolean().default(true), type: z.enum(['employment', 'milestone', 'education', 'certification', 'achievement', 'project', 'training', 'open-source', 'other']), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), current: z.boolean().default(false), locales: localized, organization: z.string().default(''), location: z.string().default(''), technologies: z.array(z.string()).default([]), image: z.string().optional(), documents: z.array(link).default([]), projectIds: z.array(z.string()).default([]), articleIds: z.array(z.string()).default([]), links: z.array(link).default([]), priority: z.number().int().default(0) });
const recordSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), visible: z.boolean().default(true), locales: localized, startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), organization: z.string().default(''), technologies: z.array(z.string()).default([]), priority: z.number().int().default(0) });
const skillSchema = recordSchema.extend({ category: z.enum(['cicd', 'containers', 'infrastructure', 'network', 'scripting', 'design']) });
const resumeSchema = z.object({ enabled: z.boolean().default(false), filenameSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).default('resume'), portrait: z.boolean().default(true), locales: z.array(z.enum(['en', 'fa'])).default(['en', 'fa']), include: z.object({ experience: z.boolean().default(true), education: z.boolean().default(true), certifications: z.boolean().default(true), skills: z.boolean().default(true), projects: z.boolean().default(true), journey: z.boolean().default(false) }).default({}), projectIds: z.array(z.string()).default([]), journeyIds: z.array(z.string()).default([]) });

function read<T>(path: string, schema: z.ZodType<T>, fallback: T): T {
  const file = resolve(root, path);
  if (!existsSync(file)) return fallback;
  return schema.parse(JSON.parse(readFileSync(file, 'utf8')));
}
function list(path: string, schema: z.ZodType<any>) { return read(path, z.array(schema), []); }

export const portfolio = () => ({
  site: read('site.json', siteSchema, { siteUrl: '', locales: { en: { title: 'Rawan Portfolio', description: 'A reusable bilingual portfolio.', homeLabel: 'Portfolio' }, fa: { title: 'پورتفولیوی راوان', description: 'پورتفولیویی دوزبانه برای آثار حرفه‌ای.', homeLabel: 'کارنامه' } } }),
  profile: read('profile.json', profileSchema, { visible: false, name: '', locales: { en: {}, fa: {} } }),
  contact: read('contact.json', contactSchema, { email: '', phone: '', location: '', socials: [], locales: { en: {}, fa: {} } }),
  projects: list('projects/entries.json', projectSchema),
  journey: list('journey/entries.json', journeySchema),
  experience: list('experience/entries.json', recordSchema),
  education: list('education/entries.json', recordSchema),
  certifications: list('certifications/entries.json', recordSchema),
  skills: list('skills/entries.json', skillSchema),
  resume: read('resume/config.json', resumeSchema, { enabled: false, filenameSlug: 'resume', portrait: true, locales: ['en', 'fa'], include: {}, projectIds: [], journeyIds: [] }),
});

export const localizedValue = (value: { en?: Record<string, any>; fa?: Record<string, any> } | undefined, lang: Locale) => value?.[lang] || value?.en || {};
export const publicItems = <T extends { visible: boolean; priority: number }>(items: T[]) => items.filter(item => item.visible).sort((a, b) => b.priority - a.priority);
export function validatePortfolioContent() {
  const data = portfolio();
  const ids = new Set(data.projects.map(item => item.id));
  const duplicates = data.projects.length !== ids.size;
  if (duplicates) throw new Error('Duplicate project IDs in content/projects/entries.json');
  for (const item of data.journey) for (const projectId of item.projectIds) if (!ids.has(projectId)) throw new Error(`Journey ${item.id} references missing project ${projectId}`);
  return data;
}
