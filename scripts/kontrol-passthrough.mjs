// Korunan yolların build çıktısı, baz ağaçtaki (varsayılan origin/main) dosyalarla bayt bayt (SHA-256) aynı mı?
// Kullanım: node scripts/kontrol-passthrough.mjs [--site _site] [--base origin/main] [--json rapor.json]
import fs from 'node:fs';
import path from 'node:path';
import { KORUNAN_KLASORLER, KORUNAN_DOSYALAR, ESKI_VARLIKLAR } from '../.eleventy.js';
import { agacDosyalari, arg, blobIcerikleri, dosyalar, Rapor, sha256 } from './ortak.mjs';

const site = arg('site', '_site'), baz = arg('base', 'origin/main');
const r = new Rapor(`Korunan yollar bayt eşitliği (${baz} ↔ ${site})`);
const istisna = JSON.parse(fs.readFileSync(new URL('./korunan-istisna.json', import.meta.url), 'utf8')).istisnalar.map((x) => x.path);
const istisnaMi = (p) => istisna.some((i) => (i.endsWith('/') ? p.startsWith(i) : p === i));

const yollar = [...KORUNAN_KLASORLER, ...KORUNAN_DOSYALAR, ESKI_VARLIKLAR];
const agac = agacDosyalari(baz, yollar);
if (!agac.length) { r.hata(`baz '${baz}' ağacında korunan yol bulunamadı`); r.bitir(); }
const icerik = blobIcerikleri(agac.map((a) => a.sha1));
const bazSet = new Set(agac.map((a) => a.yol));

const sayac = {}; const kanit = [];
for (const { yol, sha1 } of agac) {
  const kok = yollar.find((y) => yol === y || yol.startsWith(y + '/')) || yol;
  sayac[kok] ??= { toplam: 0, ayni: 0 };
  sayac[kok].toplam++;
  const beklenen = sha256(icerik.get(sha1));
  const hedef = path.join(site, yol);
  if (!fs.existsSync(hedef)) { if (!istisnaMi(yol)) r.hata(`EKSİK: ${yol}`); continue; }
  const gercek = sha256(fs.readFileSync(hedef));
  if (gercek === beklenen) { sayac[kok].ayni++; kanit.push({ yol, sha256: gercek }); }
  else if (istisnaMi(yol)) { sayac[kok].ayni++; r.not(`istisna (bilinçli fark): ${yol}`); }
  else r.hata(`FARKLI: ${yol}\n      baz  ${beklenen}\n      çıktı ${gercek}`);
}
// Ekstra dosya: korunan yolda baz ağaçta olmayan her şey (stub, enjeksiyon, .DS_Store, yeni dosya) hata
for (const k of yollar) {
  const hedef = path.join(site, k);
  const liste = fs.existsSync(hedef) ? (fs.statSync(hedef).isFile() ? [hedef] : dosyalar(hedef)) : [];
  for (const f of liste) {
    const goreli = path.relative(site, f).split(path.sep).join('/');
    if (goreli.startsWith('assets/v1/')) continue; // yeni vitrin varlıkları (src/assets), eski assets/ korumasının parçası değil
    if (!bazSet.has(goreli) && !istisnaMi(goreli)) r.hata(`EKSTRA (baz ağaçta yok): ${goreli}`);
  }
}
let toplam = 0, ayni = 0;
for (const [k, v] of Object.entries(sayac)) { toplam += v.toplam; ayni += v.ayni; r.not(`${k.padEnd(14)} ${v.ayni}/${v.toplam} dosya aynı`); }
r.not(`TOPLAM ${ayni}/${toplam} dosya SHA-256 eşit; baz: ${baz}`);
const json = arg('json');
if (json) fs.writeFileSync(json, JSON.stringify({ baz, site, toplam, ayni, dosyalar: kanit }, null, 1));
r.bitir();
