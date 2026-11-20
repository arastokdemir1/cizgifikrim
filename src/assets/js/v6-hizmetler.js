/* V6.7 hizmet döngüsü (Frontend-1): 3 kart, öndeki büyük; otomatik 4,5 sn; hover/odak/sekme arka planda iken durur; ok, klavye, kaydırma, nokta, arkadaki karta tık. Yalnız transform/opacity. */
(function(){
  var kok=document.querySelector('[data-ort]'); if(!kok) return;
  var sahne=kok.querySelector('[data-sahne]'), kartlar=[].slice.call(sahne.querySelectorAll('.v6h-kart')), noktalar=[].slice.call(kok.querySelectorAll('.v6h-nokta')), btnDur=kok.querySelector('[data-durdur]');
  var n=kartlar.length, aktif=0, zamanlayici=null, sureMs=4500;
  var azHareket=window.matchMedia('(prefers-reduced-motion: reduce)'), kullaniciDurdurdu=false, imlecIcinde=false, odakta=false, gizli=document.hidden;
  function konum(i){var d=(i-aktif+n)%n; return d===0?0:(d===1?1:-1)}
  function boyla(){var k=kartlar[aktif]; if(k) sahne.style.height=k.offsetHeight+'px'}
  function ciz(){
    kartlar.forEach(function(k,i){
      var p=konum(i); k.setAttribute('data-k',String(p));
      var on=p===0; k.setAttribute('aria-hidden',on?'false':'true');
      [].forEach.call(k.querySelectorAll('a'),function(a){a.tabIndex=on?0:-1});
    });
    noktalar.forEach(function(d,i){d.setAttribute('aria-current',i===aktif?'true':'false')});
    boyla();
  }
  function git(i){aktif=(i+n)%n; ciz()}
  function calisiyor(){return !azHareket.matches&&!kullaniciDurdurdu&&!imlecIcinde&&!odakta&&!gizli}
  function guncelle(){
    clearInterval(zamanlayici); zamanlayici=null;
    if(calisiyor()) zamanlayici=setInterval(function(){git(aktif+1)},sureMs);
    sahne.setAttribute('aria-live',calisiyor()?'off':'polite');
    if(btnDur){btnDur.hidden=azHareket.matches; btnDur.setAttribute('aria-pressed',kullaniciDurdurdu?'true':'false'); btnDur.setAttribute('aria-label',kullaniciDurdurdu?'Otomatik dönmeyi başlat':'Otomatik dönmeyi durdur'); btnDur.firstElementChild.textContent=kullaniciDurdurdu?'▶':'❚❚'}
  }
  kok.querySelector('[data-onceki]').addEventListener('click',function(){git(aktif-1);guncelle()});
  kok.querySelector('[data-sonraki]').addEventListener('click',function(){git(aktif+1);guncelle()});
  noktalar.forEach(function(d,i){d.addEventListener('click',function(){git(i);guncelle()})});
  if(btnDur) btnDur.addEventListener('click',function(){kullaniciDurdurdu=!kullaniciDurdurdu;guncelle()});
  kartlar.forEach(function(k,i){k.addEventListener('click',function(){if(konum(i)!==0){git(i);guncelle()}})});
  kok.addEventListener('mouseenter',function(){imlecIcinde=true;guncelle()});
  kok.addEventListener('mouseleave',function(){imlecIcinde=false;guncelle()});
  kok.addEventListener('focusin',function(){odakta=true;guncelle()});
  kok.addEventListener('focusout',function(e){if(!kok.contains(e.relatedTarget)){odakta=false;guncelle()}});
  kok.addEventListener('keydown',function(e){
    if(e.key==='ArrowLeft'){git(aktif-1);guncelle();e.preventDefault()}
    else if(e.key==='ArrowRight'){git(aktif+1);guncelle();e.preventDefault()}
  });
  document.addEventListener('visibilitychange',function(){gizli=document.hidden;guncelle()});
  if(azHareket.addEventListener) azHareket.addEventListener('change',guncelle);
  /* dokunmatik / işaretçi kaydırma */
  var bx=null,by=0;
  sahne.addEventListener('pointerdown',function(e){bx=e.clientX;by=e.clientY});
  sahne.addEventListener('pointerup',function(e){
    if(bx===null) return; var dx=e.clientX-bx, dy=e.clientY-by; bx=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){git(aktif+(dx<0?1:-1));guncelle()}
  });
  sahne.addEventListener('pointercancel',function(){bx=null});
  sahne.style.touchAction='pan-y';
  /* odak sırası: yalnız öndeki kartın bağlantısı sekmeye girer */
  kok.setAttribute('tabindex','-1'); kok.style.outline='none';
  if(window.ResizeObserver){var ro=new ResizeObserver(boyla); kartlar.forEach(function(k){ro.observe(k)})} else window.addEventListener('resize',boyla);
  ciz(); guncelle();
})();
