// Koşullu permalink: yalnız PLATFORM=cf iken _redirects üretilir (aksi halde gerçek boolean false: çıktı yok).
export default { permalink: () => ((process.env.PLATFORM || 'gh').toLowerCase() === 'cf' ? '/_redirects' : false) };
