/* V7 döngü video (Frontend-2): [data-dongu] sessiz döngü videolar. Görünüme girince yüklenir ve oynar, çıkınca durur.
   prefers-reduced-motion: otomatik oynatma YOK; afiş + oynat düğmesi. Köşedeki düğme duraklat/oynat (WCAG 2.2.2); kullanıcı durdurduysa kendiliğinden yeniden başlamaz. */
(()=>{
const vids=[...document.querySelectorAll('video[data-dongu]')];if(!vids.length)return;
const azalt=matchMedia('(prefers-reduced-motion: reduce)');
const durum=(v,b)=>{const oy=!v.paused;b.setAttribute('aria-label',oy?'Videoyu duraklat':'Videoyu oynat');b.classList.toggle('v2-dongu__btn--oyna',!oy);};
const oynat=(v)=>{v.preload='auto';const p=v.play();if(p&&p.catch)p.catch(()=>{});};
const gozcu='IntersectionObserver' in window?new IntersectionObserver((g)=>{for(const k of g){const v=k.target;
  if(k.isIntersecting){if(!azalt.matches&&!v.dataset.kullaniciDurdu)oynat(v);}else if(!v.paused)v.pause();}},{threshold:.15}):null;
for(const v of vids){
  const b=v.parentElement.querySelector('[data-dongu-btn]');
  if(b){b.hidden=false;durum(v,b);
    b.addEventListener('click',()=>{if(v.paused){delete v.dataset.kullaniciDurdu;oynat(v);}else{v.dataset.kullaniciDurdu='1';v.pause();}});
    v.addEventListener('play',()=>durum(v,b));v.addEventListener('pause',()=>durum(v,b));}
  if(gozcu)gozcu.observe(v);else if(!azalt.matches)oynat(v);
}
})();
