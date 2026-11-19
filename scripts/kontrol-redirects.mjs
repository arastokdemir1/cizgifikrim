// Approved bilingual migration: explicit aliases, real targets, no chains and no
// interception of product-owned URLs. Verify both GH stubs and CF redirects.
import fs from 'node:fs';
import path from 'node:path';
import {KORUNAN_KLASORLER,KORUNAN_DOSYALAR} from '../.eleventy.js';
import rules from '../src/_data/yonlendirmeler.js';
import modern from '../src/_data/modern.js';
import {agacDosyalari,arg,Rapor} from './ortak.mjs';
const site=arg('site','_site'),r=new Rapor(`Bilingual redirects (${site})`);
const actual=new Set(modern.pages.map(p=>p.url));
const sources=new Set();
const noHash=p=>p.split('#')[0];
const output=p=>{p=noHash(p);return path.join(site,p.endsWith('/')?p+'index.html':p)};
const protectedPaths=[...KORUNAN_KLASORLER.map(k=>`/${k}/`),...KORUNAN_DOSYALAR.map(k=>`/${k}`)];
for(const {from,to,status} of rules){
 if(sources.has(from))r.hata(`Duplicate alias: ${from}`);sources.add(from);
 if(from.includes('*')||!from.startsWith('/'))r.hata(`Non-explicit alias: ${from}`);
 if(actual.has(from))r.hata(`Alias overrides a real page: ${from}`);
 if(protectedPaths.some(k=>from===k||from.startsWith(k)))r.hata(`Protected path redirected: ${from}`);
 if(status!==301)r.hata(`Expected 301: ${from}`);
 {const t=output(to);if(noHash(to)!=='/piyasa/'&&fs.existsSync(t)&&/<meta http-equiv="refresh"/.test(fs.readFileSync(t,'utf8')))r.hata(`Destination is itself a redirect: ${from} -> ${to}`);}
 if(!fs.existsSync(output(to)))r.hata(`Missing target: ${to}`);
}
for(const {from,to} of rules)if(sources.has(noHash(to)))r.hata(`Chain/loop: ${from} -> ${to}`);
const historical=agacDosyalari(arg('base','origin/main'),['tr']).map(x=>'/'+x.yol).filter(p=>p.endsWith('.html'));
for(const p of historical)if(!sources.has(p)&&p!=='/tr/index.html')r.hata(`Historical URL missing: ${p}`);
const required={'/tr/projeler.html':'/tr/urunler/','/tr/projects/carlog.html':'/tr/urunler/carlog/','/tr/randevu.html':'/tr/iletisim/','/en/products/vesira/':'/tr/urunler/vesira/','/hakkinda/':'/tr/hakkimizda/','/hizmetler/':'/tr/hizmetler/','/en/':'/','/calismalar/vesira/':'/tr/urunler/vesira/','/gizlilik/':'/tr/gizlilik/'};
for(const [from,to]of Object.entries(required))if(!rules.some(r=>r.from===from&&r.to===to))r.hata(`Required migration missing: ${from} -> ${to}`);
const cf=fs.existsSync(path.join(site,'_redirects'));
if(cf){const contents=fs.readFileSync(path.join(site,'_redirects'),'utf8');for(const {from,to}of rules)if(!contents.includes(`${from} ${to} 301`))r.hata(`Missing CF rule: ${from}`);}
else for(const {from,to}of rules){const f=output(from);if(!fs.existsSync(f)){r.hata(`Missing stub: ${from}`);continue;}const html=fs.readFileSync(f,'utf8');if(!html.includes(`<meta http-equiv="refresh" content="0; url=${to}">`)||!html.includes('content="noindex"'))r.hata(`Invalid stub: ${from}`);}
r.not(`${historical.length} historical URLs covered; ${rules.length} aliases, ${cf?'Cloudflare':'GitHub Pages'} mode`);r.bitir();
