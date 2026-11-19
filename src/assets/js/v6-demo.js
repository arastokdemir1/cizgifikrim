/* V6.1 canlı demo (Frontend-2): [data-demo] bölümünde, geniş ekranda (≥900px) ve veri tasarrufu istenmiyorsa afişin üstüne aynı çerçevede ölçekli iframe koyar.
   Telefon: 390×844 içerik ekran genişliğine ölçeklenir; yatay: 1024×640 (16:10).
   Boş kare yok: iframe bölüm görünüme yaklaşınca oluşturulur, görünmez başlar; yalnız `load` + içerik çizildikten sonra afişin yerine geçer.
   SURE ms içinde yüklenmezse iframe kaldırılır, afiş + "Canlı demoyu aç" kalır. Dar ekranda/JS yoksa yalnız afiş + bağlantı. */
(()=>{
const SURE=10000;
const genis=matchMedia('(min-width:900px)');
const tasarruf=matchMedia('(prefers-reduced-data: reduce)');
const kutular=[...document.querySelectorAll('[data-demo]')];
if(!kutular.length||!('ResizeObserver' in window)||!('IntersectionObserver' in window))return;
const olc=new ResizeObserver((g)=>{for(const k of g){const e=k.target,f=e.querySelector('iframe');if(f)e.style.setProperty('--olcek',String(e.clientWidth/Number(f.getAttribute('width'))));}});
const ciz=(f)=>{try{const d=f.contentDocument;return !d||(d.body&&d.body.childElementCount>0);}catch(_){return true;}}; // aynı köken: gövde boşsa bekle; okunamıyorsa yüklendi say
const sok=(k)=>{const e=k.querySelector('.v6-demo__ekran');const f=e&&e.querySelector('iframe');if(f){olc.unobserve(e);f.remove();}
  if(e)e.classList.remove('v6-demo__ekran--canli');clearTimeout(k._sure);delete k.dataset.kuruldu;k.classList.remove('v6-demo--canli','v6-demo--hazir');};
const kur=(k)=>{
  if(k.dataset.kuruldu)return;const e=k.querySelector('.v6-demo__ekran');if(!e)return;
  const yatay=k.classList.contains('v6-demo--yatay');const w=yatay?1024:390,h=yatay?640:844;
  const f=document.createElement('iframe');f.title=k.dataset.baslik||'Canlı demo';f.width=String(w);f.height=String(h);f.setAttribute('referrerpolicy','same-origin');
  f.addEventListener('load',()=>{let n=0;const bak=()=>{if(!f.isConnected)return;if(ciz(f)||n++>20){requestAnimationFrame(()=>requestAnimationFrame(()=>{clearTimeout(k._sure);k.classList.add('v6-demo--hazir');}));}else setTimeout(bak,150);};bak();});
  e.style.setProperty('--oran',w+'/'+h);e.classList.add('v6-demo__ekran--canli');f.src=k.dataset.demo;e.appendChild(f);olc.observe(e);
  k.dataset.kuruldu='1';k.classList.add('v6-demo--canli');
  k._sure=setTimeout(()=>{if(!k.classList.contains('v6-demo--hazir'))sok(k);},SURE);
};
const yakin=new IntersectionObserver((g)=>{for(const x of g){if(x.isIntersecting&&genis.matches&&!tasarruf.matches){kur(x.target);yakin.unobserve(x.target);}}},{rootMargin:'400px 0px'});
const uygula=()=>kutular.forEach((k)=>{if(genis.matches&&!tasarruf.matches){if(!k.dataset.kuruldu)yakin.observe(k);}else{yakin.unobserve(k);sok(k);}});
uygula();genis.addEventListener('change',uygula);
})();
