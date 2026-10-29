# Résumé

The résumé is a generated view of the canonical `content/` records. `content/resume/config.json` controls generation, the safe filename slug, portrait inclusion, locales, section flags, the project limit, and an optional explicit project-ID override. The renderer contains no owner-specific copy.

Profile presentation is merged from `content/profile.json` and `content/home.json` using the same relationship as the website. Contact values come from `content/contact.json` and `content/site.json`. Blank phone, website, and other optional fields are omitted rather than replaced with invented data.

Projects are read only from root Blog hubs at `content/blog/projects/<id>/`. The résumé uses the same published/favorite ordering as the homepage, selects favorites first, fills to the configured limit from published non-favorites when necessary, and never promotes nested `articles/` into project cards. The project appendix starts on a dedicated page and uses the localized hub title and description shown on homepage cards.

`npm run resume:generate` creates searchable A4 PDFs using embedded Vazirmatn fonts, the configured résumé portrait with a fallback to the site portrait, semantic headings, mixed-direction links, and a compact contact section immediately before the selected-project appendix. The renderer uses normal-flow content only; it does not use a fixed footer or page counter because those can overlap paginated Chromium output. The filename is derived from `filenameSlug`; stable locale aliases remain available. The localized `/en/resume` and `/fa/resume` routes show a disabled-state message until résumé generation is enabled.

The current document layout is intentionally simple: page one presents identity and experience, page two presents capabilities, education, and contact, and page three presents a single-column list of selected root projects. Profile, contact, experience, skills, education, and project values come from the shared normalized content source used by the website. The renderer may cap existing bullets for readability, but it must not add résumé-only owner copy.

When generation is enabled, both locales must have a display name, professional title, concise introduction or summary, and at least one usable contact method. Missing required public data fails with an actionable error instead of producing an incomplete PDF.
