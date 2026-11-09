import { resolve } from 'node:path';
import { siteSchema, profileSchema, homeSchema, contactSchema, projectSchema, journeySchema, recordSchema, skillSchema, resumeSchema } from './portfolio-schemas.mjs';
export { projectSchema } from './portfolio-schemas.mjs';
import type { Locale } from './i18n';
import { readPortfolioSource } from './portfolio-source.mjs';
import { isRegisteredIcon } from './icon-registry.mjs';

const root = resolve(process.cwd(), 'content');
const source = () => readPortfolioSource(root);

function projectHubs(raw: ReturnType<typeof readPortfolioSource>) {
  return raw.projects.map(shared => projectSchema.parse({
    ...shared,
    // Keep public rendering resilient while content:validate still reports invalid metadata.
    icon: isRegisteredIcon(shared.icon) ? shared.icon : undefined,
    // Publication is represented once in shared metadata. `visible` is
    // retained only as a normalized runtime compatibility property.
    visible: shared.status === 'published',
  }));
}

export const portfolio = () => parsePortfolioSource(source());
export const parsePortfolioSource = (raw: ReturnType<typeof readPortfolioSource>) => {
  const parsedProfile = profileSchema.parse(raw.profile);
  const parsedHome = homeSchema.parse(raw.home);
  return {
    site: siteSchema.parse(raw.site),
    profile: { ...parsedProfile, locales: { ...(raw.profile.locales || {}), ...(parsedHome.locales || {}) } },
    home: parsedHome,
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
