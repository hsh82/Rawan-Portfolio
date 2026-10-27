# System architecture

Astro renders static routes. `src/utils/portfolio-content.ts` validates and reads top-level `content/` JSON. Astro Content Collections load nested MDX from `content/blog`. Pagefind indexes published build output. Mermaid and Markmap are lazy-loaded only in articles. The localized portfolio is a single homepage; all article and category routes nest under the Blog area.
