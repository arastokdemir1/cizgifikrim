/* V6.1 canlı demo (Frontend-2): [data-demo] bölümünde, geniş ekranda (≥900px) ve veri tasarrufu istenmiyorsa afişin üstüne aynı çerçevede ölçekli iframe koyar.
   Telefon: 390×844 içerik ekran genişliğine ölçeklenir; yatay: 1024×640 (16:10).
   Boş kare yok: iframe bölüm görünüme yaklaşınca oluşturulur, görünmez başlar; yalnız `load` + içerik çizildikten sonra afişin yerine geçer.
   Tekerlek tuzağı yok: iframe pasif başlar (pointer-events:none); üstteki <button> "Demoyu etkinleştir" tıklanınca etkin olur, odak iframe'e geçer;
   çerçeveden çıkınca, dışarı dokununca, odak başka yere gidince ya da Esc ile yeniden pasif olur.
   SURE ms içinde yüklenmezse iframe kaldırılır, afiş + "Canlı demoyu aç" kalır. Dar ekranda/JS yoksa yalnız afiş + bağlantı. */
(()=>{
const SURE=10000;
const genis=matchMedia('(min-width:900px)');
const tasarruf=matchMedia('(prefers-reduced-data: reduce)');
const kutular=[...document.querySelectorAll('[data-demo]')];
if(!kutular.length||!('ResizeObserver' in window)||!('IntersectionObserver' in window))return;
const olc=new ResizeObserver((g)=>{for(const k of g){const e=k.target,f=e.querySelector('iframe');if(f)e.style.setProperty('--olcek',String(e.clientWidth/Number(f.getAttribute('width'))));}});
const ciz=(f)=>{try{const d=f.contentDocument;return !d||(d.body&&d.body.childElementCount>0);}catch(_){return true;}}; // aynı köken: gövde boşsa bekle; okunamıyorsa yüklendi say
const pasif=(k)=>{if(!k.classList.contains('v6-demo--aktif'))return;k.classList.remove('v6-demo--aktif');const f=k.querySelector('iframe');if(f)f.tabIndex=-1;};
const aktif=(k)=>{const f=k.querySelector('iframe');if(!f)return;k.classList.add('v6-demo--aktif');f.tabIndex=0;try{f.focus({preventScroll:true});f.contentWindow.focus();}catch(_){}};
document.addEventListener('pointerdown',(e)=>{for(const k of kutular)if(!k.querySelector('.v6-demo__ekran').contains(e.target))pasif(k);});
document.addEventListener('focusin',(e)=>{for(const k of kutular)if(!k.contains(e.target))pasif(k);});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')for(const k of kutular)if(k.classList.contains('v6-demo--aktif')){pasif(k);const b=k.querySelector('.v6-demo__etkin');b&&b.focus({preventScroll:true});}});
const sok=(k)=>{const e=k.querySelector('.v6-demo__ekran');const f=e&&e.querySelector('iframe');if(f){olc.unobserve(e);f.remove();}const bt=e&&e.querySelector('.v6-demo__etkin');if(bt)bt.remove();k.classList.remove('v6-demo--aktif');
  if(e)e.classList.remove('v6-demo__ekran--canli');clearTimeout(k._sure);delete k.dataset.kuruldu;k.classList.remove('v6-demo--canli','v6-demo--hazir');};
const kur=(k)=>{
  if(k.dataset.kuruldu)return;const e=k.querySelector('.v6-demo__ekran');if(!e)return;
  const yatay=k.classList.contains('v6-demo--yatay');const w=yatay?1024:390,h=yatay?640:844;
  const f=document.createElement('iframe');f.title=k.dataset.baslik||'Canlı demo';f.width=String(w);f.height=String(h);f.setAttribute('referrerpolicy','same-origin');
  f.addEventListener('load',()=>{let n=0;const bak=()=>{if(!f.isConnected)return;if(ciz(f)||n++>20){requestAnimationFrame(()=>requestAnimationFrame(()=>{clearTimeout(k._sure);k.classList.add('v6-demo--hazir');}));}else setTimeout(bak,150);};bak();});
  f.tabIndex=-1;
  f.addEventListener('load',()=>{try{f.contentWindow.addEventListener('keydown',(ev)=>{if(ev.key==='Escape'){pasif(k);const b=k.querySelector('.v6-demo__etkin');b&&b.focus({preventScroll:true});}});}catch(_){}});
  const bt=document.createElement('button');bt.type='button';bt.className='v6-demo__etkin';bt.setAttribute('aria-label','Demoyu etkinleştir');
  bt.innerHTML='<span class="v6-demo__ipucu" aria-hidden="true">Denemek için tıkla</span>';bt.addEventListener('click',()=>aktif(k));
  e.addEventListener('mouseleave',()=>pasif(k));
  e.style.setProperty('--oran',w+'/'+h);e.classList.add('v6-demo__ekran--canli');f.src=k.dataset.demo;e.appendChild(f);e.appendChild(bt);olc.observe(e);
  k.dataset.kuruldu='1';k.classList.add('v6-demo--canli');
  k._sure=setTimeout(()=>{if(!k.classList.contains('v6-demo--hazir'))sok(k);},SURE);
};
const yakin=new IntersectionObserver((g)=>{for(const x of g){if(x.isIntersecting&&genis.matches&&!tasarruf.matches){kur(x.target);yakin.unobserve(x.target);}}},{rootMargin:'400px 0px'});
const uygula=()=>kutular.forEach((k)=>{if(genis.matches&&!tasarruf.matches){if(!k.dataset.kuruldu)yakin.observe(k);}else{yakin.unobserve(k);sok(k);}});
uygula();genis.addEventListener('change',uygula);
})();
