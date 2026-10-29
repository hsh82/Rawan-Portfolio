import { defineCollection, z } from 'astro:content';
import { bilingualBlogLoader } from './content/blog-loader.mjs';

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
    author: z.string().optional(),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    translationId: z.string().min(1),
    toc: z.boolean().default(true),
  }),
});
export const collections = { blog };
