# Résumé

The résumé is generated from the canonical `content/` records. `content/resume/config.json` controls whether generation is enabled, the safe filename slug, portrait inclusion, locales, and selected project IDs. The generator reads the verified profile, contact, experience, skills, project, education, and certification records; it does not contain candidate-specific copy.

`npm run resume:generate` creates searchable A4 PDFs using embedded Vazirmatn fonts, a content-provided portrait with a graceful fallback, semantic headings, mixed-direction links, and a designed footer. The filename is derived from `filenameSlug`; stable locale aliases may be retained by an enabled deployment. The localized `/en/resume` and `/fa/resume` routes show a disabled-state message until résumé generation is enabled.

The header and contact panel use the configured slug for the preferred download filename. Résumé controls remain outside the homepage progress navigator. Blank contact fields and an empty `siteUrl` are intentionally omitted rather than replaced with invented data.
