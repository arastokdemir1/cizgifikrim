// Fixture sayfaları yalnız ELEVENTY_FIXTURE=1 iken üretilir; her şablon kendi çıktı yolunu `fixtureUrl` ile verir.
export default { permalink: (veri) => (process.env.ELEVENTY_FIXTURE === '1' ? veri.fixtureUrl : false) };
