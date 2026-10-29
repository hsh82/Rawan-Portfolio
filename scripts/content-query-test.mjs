import assert from 'node:assert/strict';
import { isFavoriteProject, selectHomepageProjects } from '../src/utils/project-selection.mjs';

const projects = [
  { id: 'normal-new', visible: true, publication: 'public-ready', updatedAt: '2026-10-28', priority: 1 },
  { id: 'favorite-old', visible: true, publication: 'public-ready', favorite: true, favoriteAt: '2026-10-20', priority: 1 },
  { id: 'favorite-new', visible: true, publication: 'public-ready', favorite: true, favoriteAt: '2026-10-29', priority: 1 },
  { id: 'normal-old', visible: true, publication: 'public-ready', updatedAt: '2026-10-12', priority: 1 },
  { id: 'hidden', visible: false, publication: 'public-ready', favorite: true, favoriteAt: '2026-10-30' },
  { id: 'draft', visible: true, publication: 'requires-review', favorite: true, favoriteAt: '2026-10-31' },
];

assert.equal(isFavoriteProject(projects[1]), true);
assert.deepEqual(selectHomepageProjects(projects, 4).map(project => project.id), [
  'favorite-new',
  'favorite-old',
  'normal-new',
  'normal-old',
]);
assert.equal(selectHomepageProjects(projects, 2).length, 2);
console.log('Project selection behavior passed.');
