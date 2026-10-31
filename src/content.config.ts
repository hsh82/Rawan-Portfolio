import { defineCollection, z } from 'astro:content';
import { bilingualBlogLoader } from './content/blog-loader.mjs';
import { ICON_IDS } from './utils/icon-registry.mjs';
import { isApprovedImageReference } from './utils/blog-media.mjs';

const blog = defineCollection({
  loader: bilingualBlogLoader(),
  schema: ({ image }) => z.object({
    kind: z.enum(['article', 'landing']).default('article'),
    title: z.string().min(1),
    description: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    locale: z.enum(['en', 'fa']),
    category: z.string().min(1),
    subcategory: z.string().optional(),
    tags: z.array(z.string()).default([]),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    cover: image().optional(),
    coverAlt: z.string().optional(),
    image: z.string().refine(isApprovedImageReference, 'image must be a local media path or HTTPS URL').optional(),
    imageAlt: z.string().optional(),
    icon: z.string().refine(value => ICON_IDS.includes(value), 'icon must be registered').optional(),
    author: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    translationId: z.string().min(1),
    toc: z.boolean().default(true),
  }),
});
export const collections = { blog };
