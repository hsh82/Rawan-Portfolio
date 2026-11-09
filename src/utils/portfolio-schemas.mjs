import { z } from 'zod';
import { isApprovedImageReference } from './blog-media.mjs';
import { ICON_IDS } from './icon-registry.mjs';
const localizedText = z.object({ title: z.string().default(''), displayName: z.string().default(''), description: z.string().default(''), intro: z.string().default(''), summary: z.string().default(''), greeting: z.string().default(''), ctaExperience: z.string().default(''), ctaProjects: z.string().default(''), bullets: z.array(z.string()).default([]) }).partial();
const localized = z.object({ en: localizedText.default({}), fa: localizedText.default({}) });
const link = z.object({ label: z.string().min(1), url: z.string().url() });

export const siteSchema = z.object({ siteUrl: z.string().url().or(z.literal('')).default(''), defaultLocale: z.enum(['en', 'fa']).default('en'), locales: z.object({ en: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('Portfolio'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }), fa: z.object({ title: z.string(), description: z.string(), homeLabel: z.string().default('کارنامه'), footerCta: z.object({ title: z.string(), description: z.string(), button: z.string() }).optional() }) }) });
export const profileSchema = z.object({ visible: z.boolean().default(false), name: z.string().default(''), image: z.string().optional(), resumeImage: z.string().optional(), imageAlt: z.object({ en: z.string().min(1), fa: z.string().min(1) }).optional() });
export const defaultFocusHeading = { en: { eyebrow: 'Professional focus', title: 'What I focus on' }, fa: { eyebrow: 'تمرکز حرفه‌ای', title: 'چیزهایی که روی آن‌ها کار می‌کنم' } };
export const focusSchema = z.object({ en: z.array(z.object({ title: z.string(), description: z.string() })), fa: z.array(z.object({ title: z.string(), description: z.string() })), heading: z.object({ en: z.object({ eyebrow: z.string(), title: z.string() }), fa: z.object({ eyebrow: z.string(), title: z.string() }) }).optional() });
export const homeSchema = z.object({ focus: focusSchema.optional(), about: z.object({ en: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }), fa: z.object({ title: z.string(), description: z.string(), cards: z.array(z.object({ title: z.string(), description: z.string() })) }) }).optional(), locales: localized.default({ en: {}, fa: {} }) });
export const contactSchema = z.object({ email: z.string().email().or(z.literal('')).default(''), phone: z.string().default(''), location: z.string().default(''), socials: z.array(link).default([]), locales: localized.default({ en: {}, fa: {} }) });
const projectCategorySchema = z.enum(['devops-delivery', 'infrastructure-automation', 'networking-security', 'software-open-source', 'design-creative']);
const localizedLabelSchema = z.object({ en: z.string().min(1), fa: z.string().min(1) });
const localizedImageAltSchema = z.object({ en: z.string().min(1).optional(), fa: z.string().min(1).optional() }).refine(value => value.en || value.fa, 'imageAlt must contain at least one localized description');
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
  imageAlt: localizedImageAltSchema.optional(),
  icon: z.string().refine(value => ICON_IDS.includes(value), 'icon must be registered').optional(),
  // Project card media is canonical in the hub entry; overview MDX mirrors it.
  image: z.string().refine(isApprovedImageReference, 'image must be a local media path or HTTPS URL').optional(),
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
export const journeySchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), visible: z.boolean().default(true), type: z.enum(['employment', 'milestone', 'education', 'certification', 'achievement', 'project', 'training', 'open-source', 'other']), startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), current: z.boolean().default(false), locales: localized, organization: z.string().default(''), location: z.string().default(''), technologies: z.array(z.string()).default([]), image: z.string().optional(), documents: z.array(link).default([]), projectIds: z.array(z.string()).default([]), articleIds: z.array(z.string()).default([]), links: z.array(link).default([]), priority: z.number().int().default(0) });
export const recordSchema = z.object({ id: z.string().regex(/^[a-z0-9-]+$/), visible: z.boolean().default(true), locales: localized, startDate: z.coerce.date().optional(), endDate: z.coerce.date().optional(), organization: z.string().default(''), technologies: z.array(z.string()).default([]), priority: z.number().int().default(0) });
export const skillSchema = recordSchema.extend({ category: z.enum(['cicd', 'containers', 'infrastructure', 'network', 'scripting', 'design']) });
export const resumeSchema = z.object({ enabled: z.boolean().default(false), filenameSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).default('resume'), portrait: z.boolean().default(true), locales: z.array(z.enum(['en', 'fa'])).default(['en', 'fa']), include: z.object({ experience: z.boolean().default(true), education: z.boolean().default(true), certifications: z.boolean().default(true), skills: z.boolean().default(true), projects: z.boolean().default(true), journey: z.boolean().default(false) }).default({}), projectLimit: z.number().int().min(1).max(6).default(4), projectIds: z.array(z.string()).default([]), journeyIds: z.array(z.string()).default([]) });


export const resourceSchemas = {site:siteSchema, profile:profileSchema, home:homeSchema, contact:contactSchema, resume:resumeSchema, experience:recordSchema, education:recordSchema, certifications:recordSchema, skills:skillSchema, journey:journeySchema};
