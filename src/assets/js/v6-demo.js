/* V6.1 canlı demo (Frontend-2): [data-demo] bölümünde, geniş ekranda (≥900px) ve veri tasarrufu istenmiyorsa afişin yerine aynı çerçevede ölçekli iframe koyar.
   Telefon: 390×844 içerik ekran genişliğine ölçeklenir; yatay: 1024×640 (16:10). Dar ekranda/JS yoksa afiş + "Canlı demoyu aç" bağlantısı kalır. */
(()=>{
const genis=matchMedia('(min-width:900px)');
const tasarruf=matchMedia('(prefers-reduced-data: reduce)');
const kutular=[...document.querySelectorAll('[data-demo]')];
if(!kutular.length||!('ResizeObserver' in window))return;
const olc=new ResizeObserver((g)=>{for(const k of g){const e=k.target,f=e.querySelector('iframe');if(!f)continue;e.style.setProperty('--olcek',String(e.clientWidth/Number(f.getAttribute('width'))));}});
const kur=(k)=>{
  if(k.dataset.kuruldu)return;const ekran=k.querySelector('.v6-demo__ekran');if(!ekran)return;
  const yatay=k.classList.contains('v6-demo--yatay');const w=yatay?1024:390,h=yatay?640:844;
  const f=document.createElement('iframe');f.src=k.dataset.demo;f.title=k.dataset.baslik||'Canlı demo';f.loading='lazy';f.width=String(w);f.height=String(h);
  f.setAttribute('referrerpolicy','same-origin');
  ekran.classList.add('v6-demo__ekran--canli');ekran.style.setProperty('--oran',w+'/'+h);ekran.appendChild(f);k.dataset.kuruldu='1';k.classList.add('v6-demo--canli');olc.observe(ekran);
};
const sok=(k)=>{if(!k.dataset.kuruldu)return;const ekran=k.querySelector('.v6-demo__ekran');const f=ekran&&ekran.querySelector('iframe');if(f){olc.unobserve(ekran);f.remove();}ekran&&ekran.classList.remove('v6-demo__ekran--canli');delete k.dataset.kuruldu;k.classList.remove('v6-demo--canli');};
const uygula=()=>kutular.forEach((k)=>(genis.matches&&!tasarruf.matches?kur(k):sok(k)));
uygula();genis.addEventListener('change',uygula);
})();
