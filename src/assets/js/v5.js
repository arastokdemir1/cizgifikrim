/* ortak.js (Frontend-1): (1) önce/sonra ayracı: [data-kars] kapsayıcısı içindeki [role=slider]; fare + dokunma (pointer events) + klavye. Kendiliğinden hareket YOK. (2) Mobil menü: dışarı tıklayınca/Esc ile kapat (masaüstü Ürünler açılır menüsü yalnız CSS). */
(()=>{
document.querySelectorAll('[data-kars]').forEach((k)=>{const a=k.querySelector('[role="slider"]');if(!a)return;let s=false;
const yaz=(v)=>{v=Math.max(0,Math.min(100,v));k.style.setProperty('--p',v);a.setAttribute('aria-valuenow',String(Math.round(v)));a.setAttribute('aria-valuetext','Önce yüzde '+Math.round(v)+', sonra yüzde '+Math.round(100-v));};
const konum=(e)=>{const r=k.getBoundingClientRect();yaz((e.clientX-r.left)/r.width*100);};
k.addEventListener('pointerdown',(e)=>{if(e.button!==undefined&&e.button!==0)return;s=true;try{k.setPointerCapture(e.pointerId)}catch(_){}konum(e);a.focus({preventScroll:true});});
k.addEventListener('pointermove',(e)=>{if(s)konum(e);});
const bitir=(e)=>{s=false;try{k.releasePointerCapture(e.pointerId)}catch(_){}};
k.addEventListener('pointerup',bitir);k.addEventListener('pointercancel',bitir);
a.addEventListener('keydown',(e)=>{const v=Number(a.getAttribute('aria-valuenow'));let n=null;
if(e.key==='ArrowLeft'||e.key==='ArrowDown')n=v-(e.shiftKey?10:5);else if(e.key==='ArrowRight'||e.key==='ArrowUp')n=v+(e.shiftKey?10:5);
else if(e.key==='PageDown')n=v-10;else if(e.key==='PageUp')n=v+10;else if(e.key==='Home')n=0;else if(e.key==='End')n=100;
if(n!==null){e.preventDefault();yaz(n);}});
});
const menuler=()=>[...document.querySelectorAll('.nav details')];
document.addEventListener('click',(e)=>{menuler().forEach((d)=>{if(d.open&&!d.contains(e.target))d.open=false;});});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')menuler().forEach((d)=>{if(d.open){d.open=false;const s=d.querySelector('summary');s&&s.focus();}});});
})();

/* Ana sayfada eski #urunler/#vesira/#polishreel/#carlog bağlantılarını gerçek adrese yönlendirir (V5 tek sayfa sürümünden kalan paylaşılmış bağlantılar). */
(()=>{const H={urunler:'/tr/urunler/',vesira:'/tr/urunler/vesira/',polishreel:'/tr/urunler/polishreel/',carlog:'/tr/urunler/carlog/'};
const h=(location.hash||'').replace(/^#/,'');if(Object.prototype.hasOwnProperty.call(H,h)&&location.pathname==='/')location.replace(H[h]);})();
