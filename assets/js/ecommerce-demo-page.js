(function () {
  const mount = document.getElementById('demo-widget-mount');
  if (!mount) return;

  fetch('/demo/e-ticaret/shared/widget.html')
    .then((response) => {
      if (!response.ok) throw new Error('Demo bileşeni yüklenemedi.');
      return response.text();
    })
    .then((markup) => {
      mount.innerHTML = markup;
      mount.classList.add('is-ready');

      const simulator = document.createElement('script');
      simulator.src = '/assets/js/demo.js?v=5';
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
