const dateValue = (project, field) => {
  const value = project?.[field];
  if (!value) return 0;
  const timestamp = Date.parse(value instanceof Date ? value.toISOString() : String(value));
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

export const isFavoriteProject = (project) => Boolean(project?.favorite ?? project?.featured ?? false);

const projectDate = (project, favorite = false) => {
  if (favorite) return dateValue(project, 'favoriteAt') || dateValue(project, 'updatedAt') || dateValue(project, 'publishedAt');
  return dateValue(project, 'updatedAt') || dateValue(project, 'publishedAt');
};

const compareProjects = (a, b) => {
  const aFavorite = isFavoriteProject(a);
  const bFavorite = isFavoriteProject(b);
  if (aFavorite !== bFavorite) return bFavorite - aFavorite;
  const dateDifference = projectDate(b, bFavorite) - projectDate(a, aFavorite);
  if (dateDifference) return dateDifference;
  const priorityDifference = Number(b?.priority || 0) - Number(a?.priority || 0);
  if (priorityDifference) return priorityDifference;
  return String(a?.id || '').localeCompare(String(b?.id || ''));
};

export const selectHomepageProjects = (projects, limit = 6) => projects
  .filter(project => project?.visible !== false && !['requires-review', 'planned-or-experimental'].includes(project?.publication))
  .sort(compareProjects)
  .slice(0, Math.max(0, limit));

export const sortProjects = (projects) => [...projects].sort(compareProjects);
