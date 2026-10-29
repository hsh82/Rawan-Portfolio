# Content model

`content/` is the source boundary for public owner data. JSON records use stable IDs. Journey references project and article IDs. Resume selection references existing IDs. Empty arrays are supported. The homepage composes profile, skills, experience, projects, journey, résumé, and contact models into anchored sections.

Profile media is authored only under `content/media/` and referenced with a content-relative path such as `media/profile/name.svg`. `npm run media:publish` creates the ignored `public/media/` mirror required by Astro’s static server. The mirror is generated output, not a second source of truth. Résumé generation reads the same canonical content file directly.

Project records use one publication state: `draft` or `published`. Older `publication` and `maturity` fields may remain for compatibility, but they do not control visibility or appear in Easy Content. A bilingual structured `caseStudy` is the sole source for project-detail routes. Related Journey, Skill, and Project IDs are validated. Public links are optional and must be verified; absence of source code is a normal state for internal work.

Blog articles remain MDX, but English and Persian are siblings of one logical entity rather than separate locale-first trees. Shared settings live in `entry.json`; localized bodies live beside it as `en.mdx` and `fa.mdx`. A project hub is `content/blog/projects/<project-id>/` itself: its `entry.json` supplies shared card/publication metadata and its sibling MDX files are the localized overview. Child articles use `content/blog/projects/<project-id>/articles/<article-slug>/`. The loader preserves the existing public `/overview/` route. Legacy layouts and the old project registry are migration input only, never runtime sources.
