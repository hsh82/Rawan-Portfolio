const labels = {
  en: {
    title: 'AI Writing Assistant',
    description: 'Generate professional, editor-ready content with your preferred AI assistant.',
    current: 'Current guide',
    expand: 'View complete prompt',
    collapse: 'Hide complete prompt',
    copy: 'Copy AI Prompt',
    copied: 'Copied!',
    copyHelp: 'Copy the prompt, paste it into ChatGPT, Claude, Codex, or another assistant, then review the result before placing it in Easy Content.',
    success: 'The complete prompt was copied to your clipboard.',
    failure: 'Copy is unavailable here. Select the prompt above and copy it manually.',
  },
  fa: {
    title: 'دستیار نویسندگی هوش مصنوعی',
    description: 'با دستیار هوش مصنوعی دلخواه خود محتوایی حرفه‌ای و آمادهٔ ویرایش تولید کنید.',
    current: 'راهنمای فعلی',
    expand: 'نمایش متن کامل راهنما',
    collapse: 'پنهان کردن متن کامل راهنما',
    copy: 'کپی راهنمای هوش مصنوعی',
    copied: 'کپی شد!',
    copyHelp: 'راهنما را کپی کنید، آن را در ChatGPT، Claude، Codex یا دستیار دیگری قرار دهید و سپس نتیجه را پیش از ورود به Easy Content بازبینی کنید.',
    success: 'متن کامل راهنما در کلیپ‌بورد کپی شد.',
    failure: 'کپی خودکار در دسترس نیست. متن بالا را انتخاب و به‌صورت دستی کپی کنید.',
  },
};

export const HOMEPAGE_SECTION_MAP = [
  {
    id: 'start',
    placement: 'First, full-height hero section',
    component: 'src/components/sections/Hero.astro',
    paths: [
      'content/home.json.locales.{en,fa}.greeting',
      'content/home.json.locales.{en,fa}.displayName',
      'content/home.json.locales.{en,fa}.title',
      'content/home.json.locales.{en,fa}.intro',
      'content/home.json.locales.{en,fa}.summary',
      'content/home.json.locales.{en,fa}.ctaExperience',
      'content/home.json.locales.{en,fa}.ctaProjects',
      'content/profile.json.image',
      'content/profile.json.imageAlt.{en,fa}',
    ],
    rules: 'The two CTA values link to #experience and #projects. The profile image is a repository media reference; do not invent a path.',
  },
  {
    id: 'about',
    placement: 'Immediately after the hero',
    component: 'src/components/sections/Values.astro',
    paths: [
      'content/home.json.about.{en,fa}.title',
      'content/home.json.about.{en,fa}.description',
      'content/home.json.about.{en,fa}.cards[0..2].title',
      'content/home.json.about.{en,fa}.cards[0..2].description',
    ],
    rules: 'The content uses plain text with paragraph breaks. The three cards are rendered in order. If absent, the section falls back to the profile description.',
  },
  {
    id: 'skills',
    placement: 'After About',
    component: 'src/components/sections/Skills.astro',
    paths: [
      'content/skills/entries.json[].id',
      'content/skills/entries.json[].visible',
      'content/skills/entries.json[].category',
      'content/skills/entries.json[].locales.{en,fa}.title',
      'content/skills/entries.json[].locales.{en,fa}.description',
      'content/skills/entries.json[].locales.{en,fa}.summary',
      'content/skills/entries.json[].technologies[]',
      'content/skills/entries.json[].priority',
    ],
    rules: 'category must be one of cicd, containers, infrastructure, network, scripting, or design. Visible entries are sorted by priority; technology names are used by the icon registry.',
  },
  {
    id: 'focus',
    placement: 'After Skills',
    component: 'src/components/sections/FocusAreas.astro',
    paths: [
      'content/home.json.focus.en[].title',
      'content/home.json.focus.en[].description',
      'content/home.json.focus.fa[].title',
      'content/home.json.focus.fa[].description',
    ],
    rules: 'Items render in array order. The first three positions use the repository’s registered focus icons; do not add icon fields.',
  },
  {
    id: 'experience',
    placement: 'After Professional focus',
    component: 'src/components/platform/ExperienceList.astro',
    paths: [
      'content/experience/entries.json[].id',
      'content/experience/entries.json[].visible',
      'content/experience/entries.json[].locales.{en,fa}.title',
      'content/experience/entries.json[].locales.{en,fa}.summary',
      'content/experience/entries.json[].locales.{en,fa}.description',
      'content/experience/entries.json[].organization',
      'content/experience/entries.json[].technologies[]',
      'content/experience/entries.json[].priority',
    ],
    rules: 'The homepage shows visible records, sorted by priority, with title, organization, summary/description, and technologies. Stable IDs must not change.',
  },
  {
    id: 'projects',
    placement: 'After Experience',
    component: 'src/components/platform/ProjectGrid.astro',
    paths: [
      'content/blog/projects/<project-id>/entry.json.id',
      'content/blog/projects/<project-id>/entry.json.status',
      'content/blog/projects/<project-id>/entry.json.category',
      'content/blog/projects/<project-id>/entry.json.secondaryCategories[]',
      'content/blog/projects/<project-id>/entry.json.role.{en,fa}',
      'content/blog/projects/<project-id>/entry.json.technologies[]',
      'content/blog/projects/<project-id>/entry.json.favorite/favoriteAt',
      'content/blog/projects/<project-id>/entry.json.priority',
      'content/blog/projects/<project-id>/en.mdx and fa.mdx frontmatter/body',
    ],
    rules: 'Only public, non-draft projects are eligible. Favorites sort first, then favorite/updated/published dates, priority, and ID; the homepage displays at most six. Keep project IDs, relationships, and publication metadata stable.',
  },
  {
    id: 'journey',
    placement: 'After Projects',
    component: 'src/components/platform/JourneyTimeline.astro',
    paths: [
      'content/journey/entries.json[].id',
      'content/journey/entries.json[].visible',
      'content/journey/entries.json[].type',
      'content/journey/entries.json[].startDate/endDate/current',
      'content/journey/entries.json[].locales.{en,fa}.title',
      'content/journey/entries.json[].locales.{en,fa}.description',
      'content/journey/entries.json[].organization/location',
      'content/journey/entries.json[].technologies[]',
      'content/journey/entries.json[].projectIds/articleIds/links[]',
      'content/journey/entries.json[].priority',
    ],
    rules: 'The homepage displays the first three visible entries after priority sorting. References must point to existing project or article IDs.',
  },
  {
    id: 'contact',
    placement: 'After Journey',
    component: 'src/components/platform/ContactPanel.astro',
    paths: [
      'content/contact.json.email',
      'content/contact.json.phone',
      'content/contact.json.location',
      'content/contact.json.socials[].label/url',
      'content/contact.json.locales.{en,fa}.title',
      'content/contact.json.locales.{en,fa}.intro',
      'content/resume/config.json.enabled/filenameSlug/locales',
    ],
    rules: 'Email, URLs, and phone values are real contact data and must not be invented. The résumé download card appears only when résumé output is enabled.',
  },
  {
    id: 'blog',
    placement: 'Final homepage call to action',
    component: 'src/components/sections/FooterCTA.astro',
    paths: [
      'content/site.json.locales.{en,fa}.footerCta.title',
      'content/site.json.locales.{en,fa}.footerCta.description',
      'content/site.json.locales.{en,fa}.footerCta.button',
    ],
    rules: 'The button links to the locale Blog landing page; do not add a custom URL field.',
  },
];

const BLOG_BLOCKS = [
  ['Callout', '<Callout type="tip" title="Note">Write a short note.</Callout>'],
  ['Code', '```bash\n# Add code\n```'],
  ['Image / Figure', '<Figure src="/media/projects/project/image.webp" alt="Describe the image" caption="Optional caption" />'],
  ['Table', '| Field | Value |\n| --- | --- |\n| Example | Add value |'],
  ['Mermaid', '<MermaidDiagram label="Diagram" chart={`flowchart LR\n  A[Start] --> B[Next]`} />'],
  ['Markmap', '<MindMap label="Map" content={`# Topic\n## Branch`} />'],
  ['Math', '$$\nE = mc^2\n$$'],
];

export const BLOG_BLOCK_EXAMPLES = BLOG_BLOCKS.map(([name, example]) => `${name}:\n${example}`).join('\n\n');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function homepageMap() {
  return HOMEPAGE_SECTION_MAP.map((section, index) => [
    `${index + 1}. ${section.id} — ${section.placement}`,
    `   Component: ${section.component}`,
    `   Editable paths: ${section.paths.join('; ')}`,
    `   Rules: ${section.rules}`,
  ].join('\n')).join('\n');
}

function currentBlogContext(context = {}, entity = {}) {
  const type = context.type === 'blog' ? 'Blog landing' : context.type === 'project' ? 'Project overview / project hub' : 'Technical article';
  const project = context.project || entity.project || 'not specified';
  const slug = context.type === 'blog' ? 'blog' : context.slug || entity.slug || 'not specified';
  const location = context.type === 'blog'
    ? 'content/blog/landing/en.mdx and content/blog/landing/fa.mdx'
    : context.type === 'project'
      ? `content/blog/projects/${project}/en.mdx and fa.mdx, plus content/blog/projects/${project}/entry.json`
      : `content/blog/projects/${project}/articles/${slug}/en.mdx and fa.mdx, plus its optional entry.json`;
  return { type, project, slug, location };
}

export function buildHomepagePrompt({ resource = 'home', locale = 'en' } = {}) {
  const language = locale === 'fa' ? 'Persian' : 'English';
  return [
    'ROLE',
    'You are a senior portfolio content strategist, UX copywriter, technical editor, and information architect.',
    'Improve the existing bilingual engineering and software-development portfolio without inventing facts.',
    '',
    'CURRENT EDITOR CONTEXT',
    `The Easy Content Studio is editing the Homepage source resource: ${resource}. The working UI language is ${language}.`,
    'The homepage is composed by src/components/platform/HomeSurface.astro. Its stable visual section IDs and order are authoritative:',
    homepageMap(),
    '',
    'CONTENT RULES',
    '- Produce equivalent English and Persian values for localized fields. Preserve technical names, identifiers, URLs, and code exactly when they are evidence-backed.',
    '- Use the exact JSON/property paths above. Return field values or small targeted JSON fragments, not a replacement repository or invented schema.',
    '- Preserve stable IDs, array relationships, publication state, media references, and existing verified contact data.',
    '- Respect the existing Zod validation: localized text is string-based; arrays remain arrays; dates remain valid dates; URLs must be valid URLs; category and type enums must remain in their registered values.',
    '- Do not invent employers, education outcomes, certifications, projects, metrics, skills, contact data, images, icons, or achievements.',
    '- Do not add pixel coordinates. Use the real section IDs and component locations above.',
    '',
    'WRITING STYLE',
    'Use concise, confident engineering language for technical recruiters, engineering managers, clients, and collaborators. Emphasize real capabilities, decisions, constraints, and value. Avoid clichés, exaggerated marketing, unsupported claims, diary-style writing, and excessive first-person language.',
    '',
    'REQUIRED WORKFLOW',
    'Work ONE HOMEPAGE SECTION AT A TIME. Start with section 1, start. For each section: identify its ID and placement; identify exact editable paths; explain its purpose; analyze supplied existing values; produce improved English values; produce semantically equivalent Persian values; respect field formats and array order; explain exactly where each value should be pasted; then stop and wait for approval before moving to the next section.',
    '',
    'OUTPUT FORMAT FOR EACH SECTION',
    'Section name:\nSection ID:\nHomepage placement:\nEditable field paths:\nPurpose:\nEnglish values:\nPersian values:\nRecommended improvements:\nPaste instructions:',
    'Return values in the exact format accepted by the active Studio resource. Do not return all homepage JSON when only one field or section is being reviewed.',
    '',
    'Start by repeating the verified homepage section map above, then work only on the first section.',
  ].join('\n');
}

export function buildBlogPrompt({ context = {}, entity = {}, locale = 'en' } = {}) {
  const current = currentBlogContext(context, entity);
  const language = locale === 'fa' ? 'Persian' : 'English';
  const articleFormat = context.type === 'blog'
    ? 'Blog landing: edit the localized introduction in content/blog/landing/en.mdx and fa.mdx. Keep kind: landing and slug: blog.'
    : context.type === 'project'
      ? `Project overview: edit the localized overview sources at ${current.location}. Keep the project identity, kind: article, slug: overview, category: projects, subcategory: ${current.project}, and shared entry metadata stable. Do not create or nest a project property inside itself.`
      : `Technical article: edit the localized article sources at ${current.location}. Keep the stable project relationship, article slug ${current.slug}, translationId, locale, category, and subcategory stable.`;
  return [
    'ROLE',
    'You are a senior software architect, technical editor, engineering case-study writer, and bilingual MDX publishing specialist.',
    'Transform supplied technical reports, project histories, design decisions, and implementation documentation into precise, publishable portfolio content. Use the source report as evidence.',
    '',
    'CURRENT EDITOR CONTEXT',
    `Entity: ${current.type}. Project: ${current.project}. Slug: ${current.slug}. Working UI language: ${language}.`,
    articleFormat,
    '',
    'PUBLISHING FORMAT',
    '- In the Easy Content Source editor, complete MDX must begin immediately at byte zero with the opening delimiter ---; do not put a blank line, BOM, Markdown fence, explanation, or other character before it.',
    '- Complete MDX must contain valid frontmatter, close it with ---, and then contain the body. When a user explicitly asks for body-only content, return only the body and no frontmatter.',
    '- English and Persian are separate localized values/files. Produce both versions separately, semantically equivalent, with natural professional Persian and preserved technical identifiers.',
    '- Preserve stable id, slug, translationId, locale, category, subcategory, publication state, relationships, and existing metadata. Never add shared.project.project or any nested project copy.',
    '- Do not add unsupported YAML properties, private company data, credentials, internal endpoints, or unverified claims. Do not rewrite entry.json and both MDX files into one document.',
    '',
    'AVAILABLE BLOG BLOCKS',
    BLOG_BLOCK_EXAMPLES,
    'Use a block only when it explains the engineering story. For Mermaid and MindMap, keep the template literal attribute syntax exactly as shown. Figure paths must refer to real repository media and include meaningful alt text. Tables must use valid Markdown table syntax. Code must be fenced and labeled when useful.',
    '',
    'EDITORIAL STANDARD',
    'Cover the actual problem, context, requirements, constraints, architectural decisions, alternatives, implementation, challenges, solutions, trade-offs, evidence, limitations, and future work where relevant. Do not force every heading into a short piece. Make the technical story interesting through real decisions and consequences, not generic technology descriptions.',
    '',
    'FACTUAL ACCURACY',
    'Clearly distinguish implemented features, verified results, experiments, proposals, and future work. Never invent performance numbers, security guarantees, benchmarks, project outcomes, or production readiness. Flag missing evidence instead of filling it in.',
    '',
    'REQUIRED WORKFLOW',
    'Analyze the supplied report; choose Blog landing, Project overview, or Technical article; identify the strongest technical story; choose a suitable structure; select only useful supported blocks; write polished English; write the equivalent Persian version; verify frontmatter and stable metadata; list factual verification notes and unsupported claims separately.',
    '',
    'OUTPUT',
    'Recommended title:\nConcise description:\nTags:\nTarget entity and exact editor context:\nEnglish editor-ready content:\nPersian editor-ready content:\nRelevant visual elements:\nFactual verification notes:\nMissing evidence or claims to review:',
    '',
    `The current target is ${current.location}. Return the exact format accepted by this editor and do not modify save state, shared metadata, or unrelated content.`,
  ].join('\n');
}

export function guideForContext({ surface = 'blog', context = {}, entity = {}, resource = 'home', locale = 'en' } = {}) {
  const prompt = surface === 'home'
    ? buildHomepagePrompt({ resource, locale })
    : buildBlogPrompt({ context, entity, locale });
  const label = surface === 'home'
    ? `Homepage · ${resource}`
    : currentBlogContext(context, entity).type;
  return { prompt, label };
}

export async function copyPrompt(prompt, { navigatorRef = globalThis.navigator, documentRef = globalThis.document } = {}) {
  try {
    if (navigatorRef?.clipboard?.writeText) {
      await navigatorRef.clipboard.writeText(prompt);
      return true;
    }
  } catch {
    // Fall through to the legacy copy path.
  }
  try {
    const textarea = documentRef?.createElement?.('textarea');
    if (!textarea || !documentRef.body) return false;
    textarea.value = prompt;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    documentRef.body.append(textarea);
    textarea.select();
    const legacyCopy = Reflect.get(documentRef, 'execCommand');
    const copied = Boolean(typeof legacyCopy === 'function' && legacyCopy.call(documentRef, 'copy'));
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function renderAiWritingGuide(container, { prompt, label, locale = 'en' } = {}) {
  if (!container || !prompt) return;
  const ui = labels[locale === 'fa' ? 'fa' : 'en'];
  container.classList.add('ai-guide');
  container.innerHTML = `<h2 class="panel-title" id="ai-writing-guide-title">${escapeHtml(ui.title)}</h2><p class="empty">${escapeHtml(ui.description)}</p><p class="ai-guide__context"><strong>${escapeHtml(ui.current)}:</strong> ${escapeHtml(label)}</p><details class="ai-guide__details"><summary>${escapeHtml(ui.expand)}</summary><textarea class="ai-guide__prompt" readonly aria-label="${escapeHtml(ui.title)}" spellcheck="false"></textarea></details><button class="button primary ai-guide__copy" type="button">${escapeHtml(ui.copy)}</button><p class="ai-guide__help">${escapeHtml(ui.copyHelp)}</p><p class="ai-guide__status" aria-live="polite"></p>`;
  const textarea = container.querySelector('.ai-guide__prompt');
  const button = container.querySelector('.ai-guide__copy');
  const status = container.querySelector('.ai-guide__status');
  textarea.value = prompt;
  button.addEventListener('click', async () => {
    button.disabled = true;
    const copied = await copyPrompt(prompt);
    button.disabled = false;
    if (copied) {
      button.textContent = ui.copied;
      status.textContent = ui.success;
      window.setTimeout(() => { button.textContent = ui.copy; }, 1800);
    } else {
      status.textContent = ui.failure;
      textarea.focus();
      textarea.select();
    }
  });
}
