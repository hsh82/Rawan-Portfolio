export function editorPath(context, mode = 'edit') {
  if (context.type === 'blog') return '/dev/content/edit/blog/';
  if (context.type === 'project') return mode === 'new'
    ? '/dev/content/new/project/'
    : `/dev/content/edit/project/${context.projectId || context.id}/`;
  if (context.type === 'article') return mode === 'new'
    ? `/dev/content/new/article/${context.projectId}/`
    : `/dev/content/edit/article/${context.projectId}/${context.articleId || context.slug}/`;
  return null;
}

function localizedEditorPath(path, locale) {
  return `${path}${path.includes('?') ? '&' : '?'}locale=${locale}`;
}

export function contentActions(context) {
  if (!context || !['home', 'blog', 'project', 'article'].includes(context.type)) return [];
  if (context.type === 'home') return [
    { id: 'edit-home', label: { en: 'Edit Home content', fa: 'ویرایش محتوای خانه' }, href: localizedEditorPath('/dev/content/edit/resource/home/', context.locale) },
  ];
  if (context.type === 'blog') return [
    { id: 'edit-blog', label: { en: 'Edit Blog', fa: 'ویرایش وبلاگ' }, href: localizedEditorPath(editorPath(context), context.locale) },
    { id: 'new-project', label: { en: 'New Project', fa: 'پروژهٔ جدید' }, href: localizedEditorPath(editorPath({ ...context, type: 'project' }, 'new'), context.locale) },
  ];
  const edit = { id: `edit-${context.type}`, label: { en: 'Edit', fa: 'ویرایش' }, href: localizedEditorPath(editorPath(context), context.locale) };
  const newArticle = { id: 'new-article', label: { en: 'New Article', fa: 'مقالهٔ جدید' }, href: localizedEditorPath(editorPath({ type: 'article', locale: context.locale, projectId: context.projectId }, 'new'), context.locale) };
  return [edit, newArticle];
}

export function editorCapabilities(type) {
  if (type === 'blog') return { body: true, metadata: true, media: true, tree: true };
  if (type === 'project') return { body: true, metadata: true, media: true, favorite: true, articles: true, tree: true };
  if (type === 'article') return { body: true, metadata: true, media: true, tree: true };
  return null;
}
