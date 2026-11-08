/* poster-kart yüzme animasyonu yalnız kart görünürken çalışsın (sonsuz animasyon görünmezken durur). ~0.3 KB. JS yoksa yüzme olmaz, kart tam çalışır. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('is-gorunur', e.isIntersecting); });
  }, { threshold: 0.2 });
  document.querySelectorAll('.poster').forEach(function (p) { io.observe(p); });
})();
