import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { resourceSchemas } from '../src/utils/portfolio-schemas.mjs';

/** Deterministic owner-neutral data; tests never depend on or copy an owner's records. */
export async function writeStudioFixture(root) {
  const files = {
    'site.json': resourceSchemas.site.parse({locales:{en:{title:'Synthetic test',description:''},fa:{title:'نمونهٔ آزمایشی',description:''}}}),
    'profile.json': resourceSchemas.profile.parse({}),
    'home.json': resourceSchemas.home.parse({}),
    'contact.json': resourceSchemas.contact.parse({}),
    'resume/config.json': resourceSchemas.resume.parse({}),
    ...Object.fromEntries(['experience','education','certifications','skills','journey'].map(name=>[`${name}/entries.json`,[]])),
    'blog/landing/entry.json': {id:'landing',kind:'landing',slug:'blog',status:'draft',translationId:'blog-landing',category:'blog',pubDate:'2026-01-01',tags:[],featured:false,toc:false},
  };
  for(const [name,value]of Object.entries(files)) { const file=join(root,name);await mkdir(dirname(file),{recursive:true});await writeFile(file,JSON.stringify(value,null,2)+'\n'); }
  for(const locale of ['en','fa']) await writeFile(join(root,'blog/landing',locale+'.mdx'),`---\ntitle: "Synthetic landing"\ndescription: "Test fixture"\nslug: blog\nlocale: ${locale}\ncategory: blog\ntranslationId: blog-landing\npubDate: "2026-01-01"\ndraft: true\n---\n\nSynthetic test fixture.\n`);
}
