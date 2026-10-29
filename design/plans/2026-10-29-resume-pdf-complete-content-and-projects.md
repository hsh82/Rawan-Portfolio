# Résumé PDF V2 — complete content, contact-first layout, and selected-project appendix

Date: 2026-10-29  
Status: implemented on `dev` and `content/hamed-sheikhan-v2`  
Target branches: `dev`, `content/hamed-sheikhan-v2`

## 1. Outcome

Create a professional bilingual A4 résumé PDF that derives its identity, contact information, professional profile, experience, capabilities, skills, education, certifications, and selected projects from the same canonical `content/` sources as the website.

The document must read naturally from top to bottom. Contact information must be immediately visible and usable on the first page. After the main résumé content finishes, a dedicated Projects appendix must begin on a new page and show at most four main project hubs. Child articles must never be treated as résumé projects.

This remains a generic renderer. No person-specific name, role, contact value, biography, project title, or achievement may be hardcoded in `scripts/` or `src/`.

## 2. Repository findings

The current generator is functional but does not yet satisfy this goal:

1. `scripts/resume-generate.mjs` reads `profile.json` directly and expects localized copy there. The runtime website merges `profile.json` with `home.json`. As a result, the current PDF has a name but a blank professional title, introduction, and summary.
2. The generator reads the retired `content/projects/entries.json`. Canonical projects now live in `content/blog/projects/<id>/`, so no projects can currently enter the PDF.
3. `content/resume/config.json` currently has `include.projects: false`.
4. Contact output omits location and displays social labels rather than useful printed handles/URLs.
5. The first page has no dedicated, visually clear contact area.
6. Projects are rendered inline with normal résumé sections; there is no forced Projects appendix page.
7. The old project selection uses `featured` or manual IDs and caps output at three. It does not use the centralized favorites-first selector.
8. The current PDF is searchable, tagged, bilingual, uses embedded Vazirmatn, supports a résumé-specific portrait, and keeps stable `/resume/en.pdf` and `/resume/fa.pdf` aliases. These behaviors must be preserved.
9. Some canonical records contain editorial explanations such as “pending confirmation.” These notes are useful during authoring but should not appear in the final résumé. Their removal must not be replaced by invented dates, graduation claims, or employment status.
10. The working tree contains ongoing project consolidation plus unrelated `.gitignore` and staged design-plan deletions. Implementation must preserve all of them and must not commit, push, or deploy without a separate instruction.

## 3. Content and selection contract

| PDF area | Canonical source | Rendering rule |
| --- | --- | --- |
| Name and portrait | `content/profile.json` | Use `resumeImage`, falling back to `image`; omit portrait cleanly when disabled or unavailable. |
| Localized role and introduction | `content/home.json` merged with profile | Use localized `displayName`, `title`, `intro`, and `summary`; do not parse SEO titles to recover missing identity copy. |
| About/profile summary | `content/home.json` | Use one concise public professional profile; do not duplicate the same paragraph in the header and body. |
| Contact | `content/contact.json` and `content/site.json` | Show only real values: email, location, phone when present, website when present, and verified social links. |
| Experience | `content/experience/entries.json` | Preserve visible records, priority order, localized titles, organizations, summaries, and verified bullets. |
| Capabilities and skills | `content/skills/entries.json`, optionally `home.focus` when present | Use localized category labels and real technologies; avoid ratings and repeated marketing copy. |
| Education | `content/education/entries.json` | State only the verified master’s-level study; never imply graduation or dates. |
| Certifications | `content/certifications/entries.json` | Omit the section when empty. |
| Projects | Root hubs under `content/blog/projects/<id>/` | Read only published hub `entry.json` plus sibling localized overview MDX title/description. Never read `articles/` as project cards. |
| Project order | `favorite`, `favoriteAt`, dates, and priority | Use the same centralized selector as the homepage. |

### Required identity readiness

When résumé generation is enabled, validation must require for both `en` and `fa`:

- a localized display name;
- a localized professional title;
- at least one concise localized introduction or summary;
- at least one usable contact method;
- a valid portrait asset when portrait output is enabled.

Missing optional fields must be omitted without blank labels or separators. Missing required identity copy must produce an actionable validation error instead of a visually broken PDF.

### Editorial-note policy

Public résumé copy must be publication-ready. Review commentary must not be filtered by fragile keyword replacement inside the renderer. Instead:

- use concise public-facing fields already appropriate for résumé display;
- polish canonical public summaries where they currently contain editorial workflow notes;
- preserve uncertainty by omitting unverified dates or status, not by asserting a replacement fact;
- leave private review notes in private source dossiers rather than generated output.

## 4. PDF information architecture

### Part I — résumé

The main résumé flows continuously from top to bottom:

1. **Identity header** — portrait, localized name, role, and one short positioning sentence.
2. **Contact panel** — a clearly labeled, high-contrast block directly below the identity area.
3. **Professional profile** — one concise About/Profile paragraph, without repeating header copy.
4. **Professional experience** — visible records in priority order with organizations and verified bullets.
5. **Technical capabilities** — compact skill groups with readable technology lists.
6. **Education** — verified study only.
7. **Certifications** — rendered only when records exist.
8. **Optional Journey** — remains disabled by default because it duplicates career chronology; it may be enabled through existing configuration later.

Sections continue naturally across pages. No section should be forced into a compressed single page. Headings must stay with at least the first content block, entries must avoid splitting where practical, and long content must flow rather than clip.

### Contact panel

The contact area is a first-page feature, not tiny metadata:

- localized heading: `Contact` / `راه‌های ارتباطی`;
- email shown as readable text and a clickable `mailto:` link;
- location shown as text, without inventing an address;
- GitHub and LinkedIn shown as compact readable handles/paths derived from their verified URLs, while retaining full clickable targets;
- phone and website rendered only when non-empty;
- two-column layout where space allows, with one-column fallback for long Persian or URL content;
- LTR isolation for email, phone, handles, and URLs inside the Persian document;
- no QR code, icon font, shortened redirect, or new external dependency;
- a compact email or website reference may repeat in the footer, but the full contact panel appears only once.

### Part II — selected projects appendix

After all main résumé sections, insert `break-before: page` and start a dedicated appendix:

- English heading: `Selected Projects`;
- Persian heading: `پروژه‌های منتخب`;
- a short neutral introduction explaining that these are selected project summaries;
- two-column card layout when copy fits, with safe one-column fallback when localization or pagination requires it;
- project cards must use the same localized title and description shown by the homepage card;
- include the project role/maturity label and up to five technologies when useful;
- include repository or live-demo links only when already verified and public;
- include a website project-overview link only when `site.siteUrl` is configured;
- do not include case-study internals, diagrams, child-article summaries, confidential evidence, or unpublished projects.

The appendix may continue onto an additional page if content requires it. The implementation must prioritize readable cards over forcing four cards onto one crowded page.

## 5. Project selection algorithm

The default project appendix uses the same published-hub source and ordering semantics as the homepage:

1. Read only root project hubs with `status: published`.
2. Sort favorites first using `favoriteAt`, then update/publication date, then priority and stable ID.
3. Select favorite projects first.
4. If fewer than four favorites exist, fill the remaining positions with the highest-ranked published non-favorites.
5. Cap the result at four.
6. If fewer than four published hubs exist, render only those available; never add placeholders.
7. Never traverse or select `content/blog/projects/<id>/articles/`.

With the current content, the expected automatic selection is:

1. `rahban-access-gateway` — favorite;
2. `infrastructure-as-code-vmware` — favorite;
3. `camran-cashback-mvp` — favorite;
4. `cicd-release-platform` — highest-ranked fallback.

`config.projectIds`, when non-empty, remains a backward-compatible explicit override for reusable template users. IDs must still resolve to published root hubs and output remains capped at four. The Hamed configuration will use automatic favorites-first selection.

## 6. Technical design

### 6.1 One project source for website and PDF

Extract the filesystem project-hub reader currently embedded in `src/utils/portfolio-content.ts` into a small shared server-side module, for example `src/utils/project-source.mjs`.

The shared reader will:

- scan only direct children of `content/blog/projects/`;
- require `entry.json`, `en.mdx`, and `fa.mdx` for each hub;
- derive localized card title/description from overview MDX frontmatter;
- return normalized root project records;
- ignore nested `articles/` as independent projects.

`portfolio-content.ts` will validate those raw records with the existing Zod schema. `resume-generate.mjs` will consume the same raw hub records and existing `project-selection.mjs` logic. This removes the legacy project registry dependency without creating a second project loader.

### 6.2 Résumé view model

Refactor `scripts/resume-generate.mjs` into clear stages:

1. load canonical content;
2. merge profile and home presentation data;
3. normalize/validate localized résumé data;
4. select published projects;
5. render semantic HTML;
6. print EN and FA PDFs;
7. copy stable locale aliases;
8. clean temporary files.

Rendering helpers should receive a locale-specific view model rather than reading global files while building HTML. This keeps inclusion rules, selection, and presentation testable.

### 6.3 Configuration

Update `content/resume/config.json` and its schema:

- set `include.projects` to `true`;
- add `projectLimit: 4`, constrained to a small safe range;
- leave `projectIds: []` for automatic favorites-first selection;
- preserve existing locale, portrait, filename, and section inclusion controls.

Do not add layout knobs for ordinary content authors. The visual system remains an application concern.

### 6.4 Print design

Preserve A4 output, embedded Vazirmatn, searchable text, tagged structure, and browser PDF links. Improve the CSS with:

- minimum comfortable body size around 9.5–10 pt;
- strong hierarchy for name, role, sections, and project appendix;
- contact-panel contrast that remains clear in grayscale;
- consistent vertical rhythm instead of compressing all content;
- `break-inside: avoid` for contact rows, experience entries, skill groups, and project cards;
- `break-after: avoid` for section headings;
- a real page break before Projects;
- logical RTL layout with isolated LTR technical strings;
- a non-overlapping footer containing identity plus a reliable page indicator when Chrome rendering supports it;
- no browser print header/footer, local file paths, or temporary-source URLs.

## 7. Expected implementation paths

Application/generator changes:

- `scripts/resume-generate.mjs`
- `src/utils/project-source.mjs` — new shared root-hub reader
- `src/utils/portfolio-content.ts`
- `src/utils/project-selection.mjs` only if a reusable capped selection helper is needed

Configuration/content readiness:

- `content/resume/config.json`
- `content/home.json` only to restore missing verified localized identity/profile copy required by both the site and PDF
- any canonical public summary that currently exposes editorial workflow wording, without adding unverified facts

Documentation/tests:

- `design/components/resume.md`
- `design/architecture/content-model.md` if the shared loader boundary changes
- focused project-selection and résumé-data tests under the existing script-test pattern
- one final dated implementation report after verification

No child project article, project case study, Blog body, or private draft should be rewritten for this work.

## 8. Implementation phases

### Phase A — protect and baseline

- Recheck branch and working-tree state.
- Preserve the current project consolidation, `.gitignore`, archived drafts, and staged plan deletions.
- Generate and inspect the current EN/FA PDFs as a before-state.
- Record current page counts and missing fields.

### Phase B — canonical data adapter

- Extract the root project-hub loader.
- Make website project loading use the extracted reader with existing schema validation.
- Make the résumé generator read the same hub records.
- Remove the résumé generator’s runtime dependency on `content/projects/entries.json`.
- Add tests proving nested child articles are excluded.

### Phase C — résumé view model and readiness

- Merge `profile.json` and `home.json` consistently with the website.
- Add localized required-field checks when the résumé is enabled.
- Normalize contacts and social display values.
- Apply existing inclusion flags to nonempty canonical sections.
- Enable automatic favorites-first project selection with a limit of four.

### Phase D — contact-first document redesign

- Rebuild the identity and contact header.
- Render professional profile, experience, skills, education, and certifications in natural order.
- Improve print typography, RTL handling, page breaks, and footer behavior.
- Keep the résumé portrait/fallback behavior unchanged.

### Phase E — dedicated project appendix

- Force a new page after the main résumé.
- Render the localized Selected Projects heading and project cards.
- Use only root overview title/description plus shared metadata.
- Verify the expected three favorites plus DevOps fallback.
- Confirm no child-article title or body appears in either PDF.

### Phase F — documentation and verification

- Update résumé/content-model documentation to match the implementation.
- Run all content, type, build, route, and PDF checks.
- Create one final report only after the generated artifacts pass inspection.

## 9. Verification matrix

Run:

```bash
npm run content:validate
npm run content:check-links
npm run test:content-api
npm run resume:generate
npm run check
npm run build
npm run test:static
git diff --check HEAD
```

Inspect both generated identity filenames and stable aliases:

- `public/resume/hamed-sheikhan-en.pdf`
- `public/resume/hamed-sheikhan-fa.pdf`
- `public/resume/en.pdf`
- `public/resume/fa.pdf`

Use Poppler tools where available:

```bash
pdfinfo public/resume/hamed-sheikhan-en.pdf
pdfinfo public/resume/hamed-sheikhan-fa.pdf
pdftotext -layout public/resume/hamed-sheikhan-en.pdf -
pdftotext -layout public/resume/hamed-sheikhan-fa.pdf -
pdftoppm -png -r 130 public/resume/hamed-sheikhan-en.pdf /tmp/resume-en
pdftoppm -png -r 130 public/resume/hamed-sheikhan-fa.pdf /tmp/resume-fa
```

Visually inspect every page for:

- contact visibility and clickable targets;
- portrait presence and crop;
- English and Persian hierarchy;
- correct RTL order and isolated technical terms;
- section order and natural pagination;
- Projects starting on a fresh page;
- exactly the expected maximum of four root projects;
- no child articles;
- no clipped cards, split headings, footer overlap, blank labels, file paths, or editorial notes;
- selectable/searchable text and embedded Vazirmatn fonts.

## 10. Acceptance criteria

- [ ] Both PDFs derive from the same canonical records used by the site.
- [ ] Name, role, introduction, and summary are populated in both locales.
- [ ] Contact is prominent on page one and every displayed value is usable and verified.
- [ ] Empty phone/site fields create no blank UI or separators.
- [ ] The main résumé reads top to bottom without forced compression or clipping.
- [ ] Experience, skills, education, and certifications obey configuration and omit empty sections.
- [ ] Projects begin on a dedicated new page after the main résumé.
- [ ] Project cards use root-hub overview summaries matching the homepage source.
- [ ] Favorites are selected first; published non-favorites fill to a maximum of four.
- [ ] The current expected selection is Rahban, IaC, Camran, and DevOps.
- [ ] Child articles and draft projects never enter the PDF.
- [ ] No unverified dates, graduation status, phone, domain, metrics, or private implementation details are introduced.
- [ ] No editorial review notes appear in the final PDFs.
- [ ] EN and FA PDFs remain searchable, properly directed, and visually inspected page by page.
- [ ] Stable aliases and identity-based filenames continue to work.
- [ ] Content validation, link checks, typecheck, build, static tests, and diff checks pass.
- [ ] Existing unrelated work remains untouched; no commit, push, or deployment occurs without authorization.

