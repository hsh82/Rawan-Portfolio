import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Locale } from './i18n';

const root = resolve(process.cwd(), 'content');
const localizedText = z.object({ title: z.string().default(''), displayName: z.string().default(''), description: z.string().default(''), intro: z.string().default(''), summary: z.string().default(''), greeting: z.string().default(''), ctaExperience: z.string().default(''), ctaProjects: z.string().default(''), bullets: z.array(z.string()).default([]) }).partial();
const localized = z.object({ en: localizedText.default({}), fa: localizedText.default({}) });
const link = z.object({ label: z.string().min(1), url: z.string().url() });

const siteSchema = z.object({ siteUrl: z.string().url().or(z.literal('')).default(''), defaultLocale: z.enum(['en', 'fa']).default('en'), locales: z.object({ en: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('Portfolio'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }), fa: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('کارنامه'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }) }) });
const profileSchema = z.object({ visible: z.boolean().default(false), name: z.string().default(''), image: z.string().optional(), resumeImage: z.string().optional(), imageAlt: z.object({ en: z.string().min(1), fa: z.string().min(1) }).optional(), focus: z.object({ en: z.array(z.object({ title: z.string(), description: z.string() })), fa: z.array(z.object({ title: z.string(), description: z.string() })) }).optional(), about: z.object({ en: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }), fa: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }) }).optional(), locales: localized.default({ en: {}, fa: {} }) });
const contactSchema = z.object({ email: z.string().email().or(z.literal('')).default(''), phone: z.string().default(''), location: z.string().default(''), socials: z.array(link).default([]), locales: localized.default({ en: {}, fa: {} }) });
const projectCategorySchema = z.enum(['devops-delivery', 'infrastructure-automation', 'networking-security', 'software-open-source', 'design-creative']);
const localizedLabelSchema = z.object({ en: z.string().min(1), fa: z.string().min(1) });
const projectCaseStudyCopySchema = z.object({
  intro: z.string().min(1),
  context: z.string().min(1),
  contribution: z.array(z.string().min(1)).min(1),
  approach: z.array(z.object({ title: z.string().min(1), description: z.string().min(1) })).min(1),
  outcome: z.string().min(1),
  limitations: z.string().min(1),
  evidence: z.string().min(1),
  lessons: z.array(z.string().min(1)).default([]),
});
const projectDiagramCopySchema = z.object({ title: z.string().min(1), steps: z.array(z.string().min(1)).min(2).max(6) });
const projectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  translationId: z.string().min(1),
  publication: z.enum(['public-ready', 'public-sanitized', 'requires-review', 'planned-or-experimental']).default('public-sanitized'),
  maturity: z.enum(['organizational', 'internal-pilot', 'internal-utility', 'academic-mvp', 'experimental-open-source', 'sample-repository', 'creative-collection', 'under-development']).default('organizational'),
  category: projectCategorySchema,
  secondaryCategories: z.array(projectCategorySchema).default([]),
  role: localizedLabelSchema,
  locales: localized,
  technologies: z.array(z.string()).default([]),
  image: z.string().optional(),
  imageAlt: localizedLabelSchema.optional(),
  icon: z.string().regex(/^[a-z0-9-]+$/).optional(),
  publishedAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  favorite: z.boolean().default(false),
  favoriteAt: z.coerce.date().optional(),
  repository: z.string().url().optional(),
  externalUrl: z.string().url().optional(),
  journeyIds: z.array(z.string()).default([]),
  relatedSkillIds: z.array(z.string()).default([]),
  relatedProjectIds: z.array(z.string()).default([]),
  articleIds: z.array(z.string()).default([]),
  caseStudy: z.object({ en: projectCaseStudyCopySchema, fa: projectCaseStudyCopySchema }).optional(),
  diagram: z.object({ en: projectDiagramCopySchema, fa: projectDiagramCopySchema }).optional(),
  priority: z.number().int().default(0),
});
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
  site: read('site.json', siteSchema, { siteUrl: '', defaultLocale: 'en', locales: { en: { title: 'Rawan Portfolio', description: 'A reusable bilingual portfolio.', homeLabel: 'Portfolio' }, fa: { title: 'پورتفولیوی راوان', description: 'پورتفولیویی دوزبانه برای آثار حرفه‌ای.', homeLabel: 'کارنامه' } } }),
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
export const publicMediaPath = (value?: string) => value?.startsWith('media/') ? `/${value}` : value || '';
export const publicItems = <T extends { visible: boolean; priority: number }>(items: T[]) => items.filter(item => item.visible).sort((a, b) => b.priority - a.priority);
export function validatePortfolioContent() {
  const data = portfolio();
  const ids = new Set(data.projects.map(item => item.id));
  const journeyIds = new Set(data.journey.map(item => item.id));
  const skillIds = new Set(data.skills.map(item => item.id));
  const duplicates = data.projects.length !== ids.size;
  if (duplicates) throw new Error('Duplicate project IDs in content/projects/entries.json');
  for (const item of data.projects) {
    if (item.featured && !item.visible) throw new Error(`Featured project ${item.id} must be visible`);
    if (item.visible && ['requires-review', 'planned-or-experimental'].includes(item.publication)) throw new Error(`Private project ${item.id} cannot be visible`);
    for (const journeyId of item.journeyIds) if (!journeyIds.has(journeyId)) throw new Error(`Project ${item.id} references missing journey ${journeyId}`);
    for (const skillId of item.relatedSkillIds) if (!skillIds.has(skillId)) throw new Error(`Project ${item.id} references missing skill ${skillId}`);
    for (const projectId of item.relatedProjectIds) if (!ids.has(projectId)) throw new Error(`Project ${item.id} references missing related project ${projectId}`);
  }
  for (const item of data.journey) for (const projectId of item.projectIds) if (!ids.has(projectId)) throw new Error(`Journey ${item.id} references missing project ${projectId}`);
  return data;
}
