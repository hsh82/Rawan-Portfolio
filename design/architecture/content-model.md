# Content model

`content/` is the source boundary for public owner data. JSON records use stable IDs. Journey references project and article IDs. Resume selection references existing IDs. Empty arrays are supported. The homepage composes profile, skills, experience, projects, journey, résumé, and contact models into anchored sections.

Profile media is authored only under `content/media/` and referenced with a content-relative path such as `media/profile/name.svg`. `npm run media:publish` creates the ignored `public/media/` mirror required by Astro’s static server. The mirror is generated output, not a second source of truth. Résumé generation reads the same canonical content file directly.

Project records separate publication state from maturity. `public-ready` and sanitized `public-sanitized` records may be visible; `requires-review` and `planned-or-experimental` records must remain hidden. A bilingual structured `caseStudy` is the sole source for project-detail routes. Related Journey, Skill, and Project IDs are validated. Public links are optional and must be verified; absence of source code is a normal state for internal work.

Blog articles remain MDX, but English and Persian are now siblings of one logical entity rather than separate locale-first trees. Shared settings live in `entry.json`; localized bodies live beside it as `en.mdx` and `fa.mdx`. Project overviews use `content/blog/projects/<project-id>/overview/`; child articles use `content/blog/projects/<project-id>/articles/<article-slug>/`. The loader normalizes these paths to the existing public IDs and routes. The migration script retains the legacy layout as an input format only.
