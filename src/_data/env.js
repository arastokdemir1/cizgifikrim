// Derleme ortamı değişkenleri şablonlara açılır.
export default {
  platform: (process.env.PLATFORM || 'gh').toLowerCase(), // gh | cf
  onizleme: process.env.PREVIEW === '1',                  // pages.dev önizlemesi: X-Robots-Tag noindex
  fixture: process.env.ELEVENTY_FIXTURE === '1',          // yalnız altyapı testi için örnek sayfa
};
