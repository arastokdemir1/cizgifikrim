// Site-level acceptance: every route, language counterpart, local asset, fragment,
// sharing image, form marker and protected demo link must resolve in the build.
import fs from 'node:fs';
import path from 'node:path';
import modern from '../src/_data/modern.js';
import {arg,Rapor} from './ortak.mjs';
const site=arg('site','_site'),r=new Rapor(`Product-site acceptance (${site})`);
const output=p=>path.join(site,p.endsWith('/')?p+'index.html':p);
let checked=0;
for(const p of modern.pages){
 const file=output(p.url);if(!fs.existsSync(file)){r.hata(`Missing page ${p.url}`);continue;}
 const html=fs.readFileSync(file,'utf8');checked++;
 if(!html.includes(`<html lang="${p.lang}">`))r.hata(`Wrong language ${p.url}`);
 if((html.match(/<h1[\s>]/g)||[]).length!==1)r.hata(`Expected one h1 ${p.url}`);
 if(p.alternate&&!p.noindex&&!html.includes(`hreflang="${p.lang==='en'?'tr':'en'}" href="https://cizgifikrim.net${p.alternate}"`))r.hata(`Missing language counterpart ${p.url}`);
 if(!fs.existsSync(output(p.og)))r.hata(`Sharing image missing ${p.url}: ${p.og}`);
 if(p.noindex&&!html.includes('content="noindex,follow"'))r.hata(`Noindex missing ${p.url}`);
 for(const [,attribute,raw]of html.matchAll(/\b(href|src|poster)="([^"<>]*)"/g)){
  const url=new URL(raw,'https://cizgifikrim.net'+p.url);
  if(url.origin!=='https://cizgifikrim.net')continue;
  if(!['http:','https:'].includes(url.protocol))continue;
  const asset=output(decodeURIComponent(url.pathname));
  if(!fs.existsSync(asset)){r.hata(`${p.url}: broken ${attribute} ${raw}`);continue;}
  if(url.hash&&asset.endsWith('.html')){const target=fs.readFileSync(asset,'utf8');if(!target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))r.hata(`${p.url}: missing fragment ${raw}`);}
 }
 if(p.view==='contact'){
  if(!/<form method="post" data-lead-form/.test(html)||!html.includes('data-lead-submit disabled'))r.hata(`${p.url}: form must fail closed without JavaScript`);
  for(const marker of ['data-lead','data-thanks','data-cal','name="consent"','name="email"','data-lead-summary','data-lead-status'])if(!html.includes(marker))r.hata(`${p.url}: missing contact marker ${marker}`);
  if(!html.includes('preload="none"')&&html.includes('<video'))r.hata(`${p.url}: eager video`);
 }
 if(p.view==='home')for(const slug of ['vesira','polishreel','carlog'])if(!html.includes(`${modern.links[p.lang].products}${slug}/`))r.hata(`${p.url}: flagship missing ${slug}`);
 if(/<img\b[^>]*src="https?:\/\//.test(html))r.hata(`${p.url}: remote image dependency`);
}
const sitemap=fs.readFileSync(path.join(site,'sitemap.xml'),'utf8');
for(const p of modern.pages){const included=sitemap.includes(`<loc>https://cizgifikrim.net${p.url}</loc>`);if(included===Boolean(p.noindex))r.hata(`${p.url}: sitemap indexability mismatch`);}
const css=fs.readFileSync('src/assets/css/modern.css','utf8');
for(const marker of ['prefers-color-scheme:dark','prefers-reduced-motion:reduce',':focus-visible'])if(!css.includes(marker))r.hata(`Missing CSS accessibility contract ${marker}`);
const lead=fs.readFileSync('src/assets/js/lead-form.js','utf8');
if(!lead.includes("mock ? '?preview=1' : ''"))r.hata('Preview success must not imply a real submission');
r.not(`${checked} pages; reciprocal languages, resources, fragments, OG images, contact markers and sitemap verified`);r.bitir();
