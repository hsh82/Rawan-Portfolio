import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'content');
const read = (file, fallback) => existsSync(resolve(root, file)) ? JSON.parse(readFileSync(resolve(root, file), 'utf8')) : fallback;
const entries = (file) => {
  const value = read(file, []);
  if (!Array.isArray(value)) throw new Error(`${file} must contain a JSON array`);
  return value;
};
const requiredLocales = (entry, source) => {
  if (!entry.locales?.en || !entry.locales?.fa) throw new Error(`${source}:${entry.id || 'entry'} needs en and fa locale values`);
};
const projects = entries('projects/entries.json');
const journey = entries('journey/entries.json');
const skills = entries('skills/entries.json');
const ids = new Set();
const journeyIds = new Set(journey.map(event => event.id));
const skillIds = new Set(skills.map(skill => skill.id));
const categories = new Set(['devops-delivery', 'infrastructure-automation', 'networking-security', 'software-open-source', 'design-creative']);
const publicationStates = new Set(['public-ready', 'public-sanitized', 'requires-review', 'planned-or-experimental']);
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.id || '')) throw new Error('Project IDs must use lowercase letters, numbers, and hyphens');
  if (ids.has(project.id)) throw new Error(`Duplicate project ID: ${project.id}`);
  ids.add(project.id); requiredLocales(project, 'projects');
  if (!categories.has(project.category)) throw new Error(`Project ${project.id} has an invalid category`);
  if (!publicationStates.has(project.publication)) throw new Error(`Project ${project.id} has an invalid publication state`);
  if (!project.role?.en || !project.role?.fa) throw new Error(`Project ${project.id} needs localized role labels`);
  if (project.featured && !project.visible) throw new Error(`Featured project ${project.id} must be visible`);
  if (project.visible && ['requires-review', 'planned-or-experimental'].includes(project.publication)) throw new Error(`Private project ${project.id} cannot be visible`);
  if (project.caseStudy && (!project.caseStudy.en || !project.caseStudy.fa)) throw new Error(`Project ${project.id} needs a bilingual case study`);
  if (project.image && !project.image.startsWith('media/')) throw new Error(`Project ${project.id} image must reference content/media/`);
  if (project.image && (!project.imageAlt?.en || !project.imageAlt?.fa)) throw new Error(`Project ${project.id} image needs English and Persian alt text`);
  if (project.image && !existsSync(resolve(root, project.image))) throw new Error(`Missing project image: content/${project.image}`);
  if (project.visible) {
    for (const locale of ['en', 'fa']) {
      const article = resolve(root, 'blog', locale, 'projects', project.id, 'overview.mdx');
      if (!existsSync(article)) throw new Error(`Visible project ${project.id} needs a ${locale} overview article`);
      const source = readFileSync(article, 'utf8');
      if (/^draft:\s*true\s*$/m.test(source)) throw new Error(`Visible project ${project.id} overview is still a draft: ${locale}`);
      if (!source.includes(`subcategory: ${project.id}`)) throw new Error(`Project overview category mismatch: ${locale}/${project.id}`);
    }
  }
  for (const id of project.journeyIds || []) if (!journeyIds.has(id)) throw new Error(`Project ${project.id} references missing journey ${id}`);
  for (const id of project.relatedSkillIds || []) if (!skillIds.has(id)) throw new Error(`Project ${project.id} references missing skill ${id}`);
}
for (const project of projects) for (const id of project.relatedProjectIds || []) if (!ids.has(id)) throw new Error(`Project ${project.id} references missing related project ${id}`);
for (const event of journey) {
  if (!/^[a-z0-9-]+$/.test(event.id || '')) throw new Error('Journey IDs must use lowercase letters, numbers, and hyphens');
  requiredLocales(event, 'journey');
  if (event.startDate && Number.isNaN(Date.parse(event.startDate))) throw new Error(`Journey ${event.id} needs a valid startDate`);
  for (const id of event.projectIds || []) if (!ids.has(id)) throw new Error(`Journey ${event.id} references missing project ${id}`);
}
const profile = read('profile.json', {});
const resume = read('resume/config.json', {});
if (profile.image) {
  if (profile.visible && !profile.image.startsWith('media/')) throw new Error('Visible profile.image must reference the canonical content/media/ tree');
  const imageFile = profile.image.startsWith('media/')
    ? resolve(root, profile.image)
    : resolve(process.cwd(), 'public', profile.image.replace(/^\//, ''));
  if (!existsSync(imageFile)) throw new Error(`Missing profile image: ${profile.image}`);
  if (profile.visible && (!profile.imageAlt?.en || !profile.imageAlt?.fa)) throw new Error('Visible profile image needs English and Persian alt text');
}
if (resume.portrait !== false && !profile.image) throw new Error('Résumé portrait is enabled but profile.image is missing');
for (const file of ['site.json', 'contact.json']) read(file, {});
console.log(`Content valid: ${projects.length} projects, ${journey.length} journey entries.`);
