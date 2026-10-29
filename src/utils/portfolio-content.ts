import { resolve } from 'node:path';
import { z } from 'zod';
import type { Locale } from './i18n';
import { readPortfolioSource } from './portfolio-source.mjs';

const root = resolve(process.cwd(), 'content');
const localizedText = z.object({ title: z.string().default(''), displayName: z.string().default(''), description: z.string().default(''), intro: z.string().default(''), summary: z.string().default(''), greeting: z.string().default(''), ctaExperience: z.string().default(''), ctaProjects: z.string().default(''), bullets: z.array(z.string()).default([]) }).partial();
const localized = z.object({ en: localizedText.default({}), fa: localizedText.default({}) });
const link = z.object({ label: z.string().min(1), url: z.string().url() });

const siteSchema = z.object({ siteUrl: z.string().url().or(z.literal('')).default(''), defaultLocale: z.enum(['en', 'fa']).default('en'), locales: z.object({ en: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('Portfolio'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }), fa: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('کارنامه'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }) }) });
const profileSchema = z.object({ visible: z.boolean().default(false), name: z.string().default(''), image: z.string().optional(), resumeImage: z.string().optional(), imageAlt: z.object({ en: z.string().min(1), fa: z.string().min(1) }).optional() });
const homeSchema = z.object({ focus: z.object({ en: z.array(z.object({ title: z.string(), description: z.string() })), fa: z.array(z.object({ title: z.string(), description: z.string() })) }).optional(), about: z.object({ en: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }), fa: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }) }).optional(), locales: localized.default({ en: {}, fa: {} }) });
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
export const projectSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  status: z.enum(['draft', 'published']).default('draft'),
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
const resumeSchema = z.object({ enabled: z.boolean().default(false), filenameSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).default('resume'), portrait: z.boolean().default(true), locales: z.array(z.enum(['en', 'fa'])).default(['en', 'fa']), include: z.object({ experience: z.boolean().default(true), education: z.boolean().default(true), certifications: z.boolean().default(true), skills: z.boolean().default(true), projects: z.boolean().default(true), journey: z.boolean().default(false) }).default({}), projectLimit: z.number().int().min(1).max(6).default(4), projectIds: z.array(z.string()).default([]), journeyIds: z.array(z.string()).default([]) });

const source = () => readPortfolioSource(root);

function projectHubs(raw: ReturnType<typeof readPortfolioSource>) {
  return raw.projects.map(shared => projectSchema.parse({
    ...shared,
    // Publication is represented once in shared metadata. `visible` is
    // retained only as a normalized runtime compatibility property.
    visible: shared.status === 'published',
  }));
}

export const portfolio = () => {
  const raw = source();
  return {
    site: siteSchema.parse(raw.site),
    profile: { ...profileSchema.parse(raw.profile), ...homeSchema.parse(raw.profile) },
    contact: contactSchema.parse(raw.contact),
    projects: projectHubs(raw),
    journey: raw.journey.map((item: any) => journeySchema.parse(item)),
    experience: raw.experience.map((item: any) => recordSchema.parse(item)),
    education: raw.education.map((item: any) => recordSchema.parse(item)),
    certifications: raw.certifications.map((item: any) => recordSchema.parse(item)),
    skills: raw.skills.map((item: any) => skillSchema.parse(item)),
    resume: resumeSchema.parse(raw.resume),
  };
};

export const localizedValue = (value: { en?: Record<string, any>; fa?: Record<string, any> } | undefined, lang: Locale) => value?.[lang] || value?.en || {};
export const publicMediaPath = (value?: string) => value?.startsWith('media/') ? `/${value}` : value || '';
export const publicItems = <T extends { visible: boolean; priority: number }>(items: T[]) => items.filter(item => item.visible).sort((a, b) => b.priority - a.priority);
export function validatePortfolioContent() {
  const data = portfolio();
  const ids = new Set(data.projects.map(item => item.id));
  const journeyIds = new Set(data.journey.map((item: any) => item.id));
  const skillIds = new Set(data.skills.map((item: any) => item.id));
  const duplicates = data.projects.length !== ids.size;
  if (duplicates) throw new Error('Duplicate project IDs in content/blog/projects');
  for (const item of data.projects) {
    if (item.featured && !item.visible) throw new Error(`Featured project ${item.id} must be visible`);
    if (item.visible !== (item.status === 'published')) throw new Error(`Project ${item.id} visibility must match its draft/published status`);
    for (const journeyId of item.journeyIds) if (!journeyIds.has(journeyId)) throw new Error(`Project ${item.id} references missing journey ${journeyId}`);
    for (const skillId of item.relatedSkillIds) if (!skillIds.has(skillId)) throw new Error(`Project ${item.id} references missing skill ${skillId}`);
    for (const projectId of item.relatedProjectIds) if (!ids.has(projectId)) throw new Error(`Project ${item.id} references missing related project ${projectId}`);
  }
  for (const item of data.journey) for (const projectId of item.projectIds) if (!ids.has(projectId)) throw new Error(`Journey ${item.id} references missing project ${projectId}`);
  return data;
}
