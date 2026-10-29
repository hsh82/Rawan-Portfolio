export function editorPath(context, mode = 'edit') {
  const locale = context.locale === 'fa' ? 'fa' : 'en';
  const query = `?locale=${locale}`;
  if (context.type === 'blog') return `/dev/content/edit/blog/${query}`;
  if (context.type === 'project') return mode === 'new'
    ? `/dev/content/new/project/${query}`
    : `/dev/content/edit/project/${context.projectId || context.id}/${query}`;
  if (context.type === 'article') return mode === 'new'
    ? `/dev/content/new/article/${context.projectId}/${query}`
    : `/dev/content/edit/article/${context.projectId}/${context.articleId || context.slug}/${query}`;
  return null;
}

export function contentActions(context) {
  if (!context || !['blog', 'project', 'article'].includes(context.type)) return [];
  if (context.type === 'blog') return [
    { id: 'edit-blog', label: { en: 'Edit Blog', fa: 'ویرایش وبلاگ' }, href: editorPath(context) },
    { id: 'new-project', label: { en: 'New Project', fa: 'پروژهٔ جدید' }, href: editorPath({ ...context, type: 'project' }, 'new') },
  ];
  const edit = { id: `edit-${context.type}`, label: { en: 'Edit', fa: 'ویرایش' }, href: editorPath(context) };
  const newArticle = { id: 'new-article', label: { en: 'New Article', fa: 'مقالهٔ جدید' }, href: editorPath({ type: 'article', locale: context.locale, projectId: context.projectId }, 'new') };
  return [edit, newArticle];
}

export function editorCapabilities(type) {
  if (type === 'blog') return { body: true, metadata: true, media: true, tree: true };
  if (type === 'project') return { body: true, metadata: true, media: true, favorite: true, articles: true, tree: true };
  if (type === 'article') return { body: true, metadata: true, media: true, tree: true };
  return null;
}
