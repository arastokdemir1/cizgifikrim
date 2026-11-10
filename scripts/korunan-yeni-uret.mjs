// Yeni korunan yol manifestini üretir (T7: istisna değil, YENİ korunan yol). Baz ağaçta (origin/main) olmayan, ama bundan sonra
// bayt bayt korunacak klasörler için her dosyanın SHA-256'sı scripts/korunan-yeni.json içine yazılır.
// Kullanım: node scripts/korunan-yeni-uret.mjs   (korunan yolda bilinçli bir değişiklikten sonra yeniden çalıştırılır ve commit'lenir)
import fs from 'node:fs';
import path from 'node:path';
import { dosyalar, sha256 } from './ortak.mjs';

const dosya = new URL('./korunan-yeni.json', import.meta.url);
const veri = JSON.parse(fs.readFileSync(dosya, 'utf8'));
for (const y of veri.yeni) {
  const kok = y.path.replace(/\/$/, '');
  y.dosyalar = {};
  for (const f of dosyalar(kok).sort()) {
    const goreli = f.split(path.sep).join('/');
    if (path.basename(goreli) === '.DS_Store') continue;
    y.dosyalar[goreli] = sha256(fs.readFileSync(f));
  }
  console.log(`${y.path}: ${Object.keys(y.dosyalar).length} dosya`);
}
fs.writeFileSync(dosya, JSON.stringify(veri, null, 1) + '\n');
