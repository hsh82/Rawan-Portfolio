import { localizedValue, portfolio, publicItems, publicMediaPath } from './portfolio-content';
import { isFavoriteProject, selectHomepageProjects, sortProjects } from './project-selection.mjs';
import type { Locale } from './i18n';

export const publishedProjects = () => publicItems(portfolio().projects as any[])
  .filter(project => !['requires-review', 'planned-or-experimental'].includes(project.publication));

export const favoriteProjects = () => sortProjects(publishedProjects().filter(isFavoriteProject));

export const homepageProjects = (limit = 6) => selectHomepageProjects(publishedProjects(), limit);

export const projectById = (id: string) => publishedProjects().find(project => project.id === id);

export const projectUrl = (lang: Locale, project: { id: string }) => `/${lang}/blog/projects/${project.id}/overview/`;

export const projectPresentationUrl = (lang: Locale, project: { id: string }) => `/${lang}/projects/${project.id}/`;

export { localizedValue, publicMediaPath };
