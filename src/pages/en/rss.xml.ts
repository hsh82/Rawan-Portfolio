import type { APIRoute } from 'astro';
import { rss } from '../../utils/rss';
export const GET: APIRoute = async ({ site }) => new Response(await rss('en', site || new URL('https://example.invalid/')), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
