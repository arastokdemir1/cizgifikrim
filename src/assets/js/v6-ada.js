/* V7 "Dynamic Island" üst menü davranışı (Frontend-1).
   (1) Kaydırınca kompakt ada: ~48/80px eşiği + yön algısı + histerezis (eşikte titreme yok).
   (2) Ürünler (masaüstü): üzerine gelince / odakla / tıklayınca ada aşağı genişler; mobilde Menü düğmesi tüm menüyü açar.
   (3) Erişilebilirlik: aria-expanded, Esc, dışarı tıklama, mobil menüde odak tuzağı, kapalıyken panel inert. reduced-motion CSS'te. */
(function(){
  var nav=document.querySelector('[data-ada]'); if(!nav) return;
  var kutu=nav.querySelector('.nav__in'), urun=nav.querySelector('[data-ada-urun]'), menu=nav.querySelector('[data-ada-menu]'), panel=nav.querySelector('[data-ada-panel]');
  if(!kutu||!urun||!menu||!panel) return;
  var mq=window.matchMedia('(min-width:861px)'); var acik=''; var t=null; var geriOdak=false, odakAcildi=false;
  function masaustu(){return mq.matches}
  function ayarla(k,odakla){
    clearTimeout(t); acik=k||'';
    if(acik) nav.setAttribute('data-acik',acik); else nav.removeAttribute('data-acik');
    urun.setAttribute('aria-expanded',acik==='urunler'?'true':'false');
    menu.setAttribute('aria-expanded',acik==='menu'?'true':'false');
    if(acik) panel.removeAttribute('inert'); else panel.setAttribute('inert','');
    if(acik&&odakla){var ilk=(acik==='menu'?panel.querySelector('.nav__mobil a'):null)||panel.querySelector('.nav__izgara a'); if(ilk) setTimeout(function(){ilk.focus()},30)}
  }
  function kapat(geri){var onceki=acik; ayarla(''); odakAcildi=false; if(geri){geriOdak=true;(onceki==='menu'?menu:urun).focus()}}
  /* --- kompakt / geniş (kaydırma) --- */
  var sonY=window.pageYOffset, birik=0, kucuk=false, bekle=false;
  function kaydir(){
    bekle=false; var y=window.pageYOffset, dy=y-sonY; sonY=y;
    if(y<48){ if(kucuk){kucuk=false;nav.setAttribute('data-durum','ust')} birik=0; return }
    if(dy>0){ birik=Math.max(birik,0)+dy; if(!kucuk&&y>80&&birik>12){kucuk=true;birik=0;nav.setAttribute('data-durum','kucuk')} }
    else if(dy<0){ birik=Math.min(birik,0)+dy; if(kucuk&&birik<-14){kucuk=false;birik=0;nav.setAttribute('data-durum','ust')} }
  }
  window.addEventListener('scroll',function(){if(!bekle){bekle=true;requestAnimationFrame(kaydir)}},{passive:true});
  kaydir();
  /* --- Ürünler (masaüstü) --- */
  urun.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse'&&masaustu()){clearTimeout(t);t=setTimeout(function(){ayarla('urunler')},70)}});
  kutu.addEventListener('pointerenter',function(e){if(e.pointerType==='mouse')clearTimeout(t)});
  kutu.addEventListener('pointerleave',function(e){if(e.pointerType==='mouse'&&acik==='urunler'){clearTimeout(t);t=setTimeout(function(){ayarla('')},220)}});
  function panele(){ayarla('urunler',true)}
  urun.addEventListener('click',function(e){
    if(!masaustu()) return;
    e.preventDefault();
    if(acik==='urunler'){ if(odakAcildi){odakAcildi=false;panele()} else kapat() }
    else {odakAcildi=false;ayarla('urunler',e.detail===0)}
  });
  urun.addEventListener('keydown',function(e){
    if(!masaustu()) return;
    if(e.key==='ArrowDown'||e.key===' '||(e.key==='Enter'&&acik==='urunler'&&odakAcildi)){
      e.preventDefault(); odakAcildi=false; panele(); return;
    }
    if(e.key!=='Escape'&&e.key!=='Tab') geriOdak=false;
  });
  urun.addEventListener('blur',function(){geriOdak=false});
  urun.addEventListener('focus',function(){if(geriOdak){return} if(masaustu()&&!acik&&urun.matches(':focus-visible')){ayarla('urunler');odakAcildi=true}});
  kutu.addEventListener('focusin',function(e){ if(acik==='urunler'&&!panel.contains(e.target)&&e.target!==urun&&e.target.matches(':focus-visible')) ayarla('') }); /* yalnız klavye odağı kapatır: fareyle basınca ada oynamaz, düğme kaçmaz */
  kutu.addEventListener('focusout',function(e){if(acik&&e.relatedTarget&&!kutu.contains(e.relatedTarget))ayarla('')});
  /* --- Menü (mobil) --- */
  menu.addEventListener('click',function(){ if(acik==='menu') kapat(true); else ayarla('menu',false) });
  /* --- ortak: Esc, dışarı tıklama, odak tuzağı, boyut değişimi --- */
  document.addEventListener('keydown',function(e){
    if(!acik) return;
    if(e.key==='Escape'){kapat(true);return}
    if(e.key==='Tab'&&acik==='menu'){
      var o=[].slice.call(kutu.querySelectorAll('a[href],button:not([disabled])')).filter(function(x){return x.offsetParent!==null});
      if(!o.length) return; var ilk=o[0], son=o[o.length-1];
      if(e.shiftKey&&document.activeElement===ilk){e.preventDefault();son.focus()}
      else if(!e.shiftKey&&document.activeElement===son){e.preventDefault();ilk.focus()}
    }
  });
  document.addEventListener('pointerdown',function(e){if(acik&&!kutu.contains(e.target))ayarla('')});
  var degis=function(){if(acik==='menu'&&masaustu())ayarla('');if(acik==='urunler'&&!masaustu())ayarla('')};
  if(mq.addEventListener) mq.addEventListener('change',degis); else window.addEventListener('resize',degis);
  panel.addEventListener('click',function(e){if(e.target.closest('a'))ayarla('')});
})();
