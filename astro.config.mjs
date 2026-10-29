import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { easyContentAstroIntegration, easyContentVitePlugin } from './src/dev/easy-content/integration/index.mjs';

const siteContent = JSON.parse(readFileSync(resolve('content/site.json'), 'utf8'));
// English is the safe default when content/site.json omits defaultLocale.
const configuredLocale = siteContent?.defaultLocale;
const defaultLocale = configuredLocale === 'fa' ? 'fa' : 'en';

export default defineConfig({
  site: process.env.SITE_URL || 'https://example.invalid/',
  output: 'static',
  trailingSlash: 'always',

  i18n: {
    defaultLocale,
    locales: ['en', 'fa'],
    routing: {
      prefixDefaultLocale: true,
      // The root route owns the immediate locale redirect so Astro does not
      // emit its visible two-second redirect document.
      redirectToDefaultLocale: false,
    },
  },

  // Integrations
  markdown: { remarkPlugins: [remarkGfm, remarkMath], rehypePlugins: [rehypeKatex], shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } } },
  integrations: [tailwind(), mdx(), easyContentAstroIntegration(), sitemap({
    filter: (page) => !/\/(?:en|fa)\/(?:contact|resume)\/$/.test(new URL(page).pathname)
  }), preact({
    compat: true
  })],

  // Built-in image optimization settings
  // Removed image service config as sharp is not a direct project dependency
  // image: {
  //   service: {
  //     entrypoint: 'astro/assets/services/sharp'
  //   }
  // },

  vite: {
    clearScreen: false,

    build: {
      cssCodeSplit: true
    },
    define: {
      'import.meta.env.EASY_CONTENT_MODE': JSON.stringify(process.env.EASY_CONTENT_MODE === 'true' ? 'true' : 'false'),
    },
    plugins: [easyContentVitePlugin()],
    ssr: {
      external: ['aos']
    }
  },

  // Add cache headers for static assets
  headers: {
    '/_astro/*': [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ],
    '/assets/*': [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ],
    '/*.css': [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ],
    '/*.js': [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ],
    '/*.webp': [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      }
    ]
  }
});
