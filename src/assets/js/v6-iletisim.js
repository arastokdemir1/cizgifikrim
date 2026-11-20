/* V6.8 satır içi Cal.com takvimi (Frontend-1; V6.9 düzen + e-posta kopyalama: Frontend-2): yalnız bu sayfada, görünüme yaklaşınca yüklenir. Resmi gömme kodunun harici dosyaya alınmış hali (CSP için satır içi betik yok).
   Yedek: 10 sn içinde hazır olmazsa, engelleyici/JS yoksa "Takvimi yeni sekmede aç" bağlantısı görünür kalır. */
(function(){
  var kutu=document.querySelector('[data-takvim]'); if(!kutu) return;
  var link=kutu.getAttribute('data-cal-link')||'cizgifikrim/30dk-telefon', basladi=false, zamanAsimi=null;
  function yedek(){ if(kutu.getAttribute('data-durum')==='yuklendi') return; kutu.setAttribute('data-durum','yedek'); var p=kutu.querySelector('.v6i-yedek p'); if(p) p.textContent='Takvim yüklenemedi.'; }
  function yukle(){
    if(basladi) return; basladi=true;
    kutu.setAttribute('data-durum','yukleniyor');
    zamanAsimi=setTimeout(yedek,10000);
    (function(C,A,L){var p=function(a,ar){a.q.push(ar)};var d=C.document;C.Cal=C.Cal||function(){var cal=C.Cal;var ar=arguments;if(!cal.loaded){cal.ns={};cal.q=cal.q||[];var s=d.createElement('script');s.src=A;s.async=true;s.onerror=yedek;d.head.appendChild(s);cal.loaded=true}
      if(ar[0]===L){var api=function(){p(api,arguments)};var ns=ar[1];api.q=api.q||[];if(typeof ns==='string'){cal.ns[ns]=cal.ns[ns]||api;p(cal.ns[ns],ar);p(cal,['initNamespace',ns])}else p(cal,ar);return}
      p(cal,ar)}})(window,'https://app.cal.com/embed/embed.js','init');
    var Cal=window.Cal;
    Cal('init',{origin:'https://app.cal.com'});
    Cal('inline',{elementOrSelector:'#cal-ic',calLink:link,layout:'month_view',config:{theme:'dark'}});
    Cal('ui',{theme:'dark',hideEventTypeDetails:true,layout:'month_view',cssVarsPerTheme:{light:{'cal-brand':'#f5f5f5','cal-bg':'transparent','cal-bg-muted':'transparent','cal-border-booker':'transparent'},dark:{'cal-brand':'#f5f5f5','cal-bg':'transparent','cal-bg-muted':'transparent','cal-border-booker':'transparent'}}});
    Cal('on',{action:'linkReady',callback:function(){clearTimeout(zamanAsimi);kutu.setAttribute('data-durum','yuklendi')}});
  }
  if('IntersectionObserver' in window){
    var g=new IntersectionObserver(function(k){if(k[0].isIntersecting){g.disconnect();yukle()}},{rootMargin:'400px 0px'});
    g.observe(kutu);
  } else yukle();
})();

/* V6.9 e-posta kopyalama: navigator.clipboard, yoksa gizli metin alanı + execCommand; kısa "Kopyalandı" geri bildirimi (aria-live). */
(function(){
  var d=document.querySelector('[data-kopyala]'); if(!d) return;
  var durum=document.getElementById('v6i-kopya-durum'), t=null;
  function bildir(m){ if(!durum) return; durum.textContent=m; clearTimeout(t); t=setTimeout(function(){durum.textContent=''},2200); }
  function eski(metin){ var a=document.createElement('textarea'); a.value=metin; a.setAttribute('readonly',''); a.style.position='fixed'; a.style.opacity='0'; a.style.top='0'; document.body.appendChild(a); a.select(); var ok=false; try{ ok=document.execCommand('copy'); }catch(e){} document.body.removeChild(a); return ok; }
  d.addEventListener('click',function(){
    var metin=d.getAttribute('data-kopyala');
    if(navigator.clipboard&&window.isSecureContext){ navigator.clipboard.writeText(metin).then(function(){bildir('Kopyalandı')},function(){bildir(eski(metin)?'Kopyalandı':'Kopyalanamadı; adresi seçip kopyalayın')}); }
    else bildir(eski(metin)?'Kopyalandı':'Kopyalanamadı; adresi seçip kopyalayın');
  });
})();
