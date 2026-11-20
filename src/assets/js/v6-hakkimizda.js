/* Hakkımızda ürün rafı (Frontend-1): üzerine gelince/odaklanınca ürünün adı + tek satırı alttaki yazıda görünür. JS yoksa ad zaten karonun altında. */
(function(){
  var liste=document.querySelector('[data-raf]'), yazi=document.querySelector('[data-raf-yazi]'); if(!liste||!yazi) return;
  var varsayilan=yazi.textContent;
  function goster(a){ yazi.textContent=''; var s=document.createElement('strong'); s.textContent=a.getAttribute('data-ad'); yazi.appendChild(s); yazi.appendChild(document.createTextNode(' — '+a.getAttribute('data-ne'))); }
  function sifirla(){ yazi.textContent=varsayilan; }
  [].forEach.call(liste.querySelectorAll('a'),function(a){
    a.addEventListener('mouseenter',function(){goster(a)});
    a.addEventListener('focus',function(){goster(a)});
    a.addEventListener('mouseleave',sifirla);
    a.addEventListener('blur',sifirla);
  });
})();
