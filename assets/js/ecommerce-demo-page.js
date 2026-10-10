(function () {
  const mount = document.getElementById('demo-widget-mount');
  if (!mount) return;

  fetch('/demo/e-ticaret/shared/widget.html?v=3')
    .then((response) => {
      if (!response.ok) throw new Error('Demo bileşeni yüklenemedi.');
      return response.text();
    })
    .then((markup) => {
      mount.innerHTML = markup;
      const frag = mount.querySelector('h1[data-fragment-h1]');   // sayfanın kendi h1'i var: parça başlığı h2 olur
      if (frag) { const h2 = document.createElement('h2'); h2.id = frag.id; h2.className = frag.className; h2.textContent = frag.textContent; frag.replaceWith(h2); }
      mount.classList.add('is-ready');

      const simulator = document.createElement('script');
      simulator.src = '/assets/js/demo.js?v=6';
      simulator.onload = () => mount.setAttribute('data-state', 'ready');
      simulator.onerror = () => {
        mount.innerHTML = '<p class="demo-load-error" role="alert">Etkileşimli örnek şu anda yüklenemedi. Lütfen biraz sonra yeniden deneyin.</p>';
      };
      document.body.appendChild(simulator);
    })
    .catch(() => {
      mount.innerHTML = '<p class="demo-load-error" role="alert">Etkileşimli örnek şu anda yüklenemedi. Lütfen biraz sonra yeniden deneyin.</p>';
    });
})();
