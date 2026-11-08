// Örnek sayfa yalnız ELEVENTY_FIXTURE=1 iken üretilir (altyapı testi). Normal derlemede çıktı yok.
export default { permalink: () => (process.env.ELEVENTY_FIXTURE === '1' ? '/altyapi-testi/index.html' : false) };
