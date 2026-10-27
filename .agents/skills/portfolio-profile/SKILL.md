---
name: portfolio-profile
description: Update verified public profile, identity, homepage copy, and links in content only.
---

# Portfolio profile

Read `content/profile.json`, `content/site.json`, `content/contact.json`, and `AGENTS.md`. Extract only facts the user supplied, preserve both locale variants that were not requested, and never edit `src/` for ordinary profile work. Validate with `npm run content:validate`. Report files changed and missing translations.
