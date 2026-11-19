import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import modern from '../src/_data/modern.js';
const out='src/assets/img/og';
await fs.mkdir(out,{recursive:true});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const wrap=(text,max=25)=>{const rows=[];let line='';for(const word of text.split(/\s+/)){if(line&&line.length+word.length+1>max){rows.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)rows.push(line);return rows;};
const done=new Set();
for(const p of modern.pages){
 const dest=p.og.replace('/assets/v1/','src/assets/');if(done.has(dest))continue;done.add(dest);
 const lang=p.lang,product=p.product||modern.products.find(x=>x.slug===p.update?.product);
 const title=product?product.title[lang]:p.view==='home'?modern.copy[lang].hero.replace('\n',' '):p.title.replace(/ — CizgiFikrim$/,'');
 const rows=wrap(title,product?24:30).slice(0,4);
 let photo='';

 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#101010"/><text x="58" y="90" font-family="Helvetica,Arial,sans-serif" font-size="32" font-weight="700" fill="#f4f5ef">CizgiFikrim</text>${product?`<text x="60" y="180" font-family="Helvetica,Arial,sans-serif" font-size="24" fill="#b0b2aa">${esc(product.name)}</text>`:''}${rows.map((r,i)=>`<text x="58" y="${product?260+i*68:230+i*76}" font-family="Helvetica,Arial,sans-serif" font-size="${product?55:62}" font-weight="400" letter-spacing="-2" fill="#f4f5ef">${esc(r)}</text>`).join('')}<text x="60" y="570" font-family="Helvetica,Arial,sans-serif" font-size="20" fill="#b0b2aa">cizgifikrim.net · ${lang.toUpperCase()}</text>${photo}</svg>`;
 await sharp(Buffer.from(svg)).png().toFile(dest);
}
console.log(`Sharing images: ${done.size} generated with text-only branding.`);
