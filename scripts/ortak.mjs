// Kontrol betikleri için ortak yardımcılar (Node >= 20, bağımlılıksız).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const arg = (ad, varsayilan) => { const i = process.argv.indexOf(`--${ad}`); return i > -1 ? process.argv[i + 1] : varsayilan; };
export const bayrak = (ad) => process.argv.includes(`--${ad}`);
export const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
export const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

export function dosyalar(kok) {
  const out = [];
  if (!fs.existsSync(kok)) return out;
  (function yuru(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) yuru(p); else if (e.isFile()) out.push(p);
    }
  })(kok);
  return out;
}

// git ağacındaki (baz) dosyalar: { yol, sha1 }
export function agacDosyalari(baz, yollar) {
  const cikti = execFileSync('git', ['ls-tree', '-r', '-z', '--full-tree', baz, '--', ...yollar], { maxBuffer: 256 * 1024 * 1024 });
  return cikti.toString('utf8').split('\0').filter(Boolean).map((satir) => {
    const [meta, yol] = satir.split('\t'); const [, tip, sha1] = meta.split(' ');
    return tip === 'blob' ? { yol, sha1 } : null;
  }).filter(Boolean);
}

// git cat-file --batch ile tek süreçte blob içerikleri: Map(sha1 -> Buffer)
export function blobIcerikleri(sha1ler) {
  const benzersiz = [...new Set(sha1ler)];
  const r = spawnSync('git', ['cat-file', '--batch'], { input: benzersiz.join('\n') + '\n', maxBuffer: 1024 * 1024 * 1024 });
  if (r.status !== 0) throw new Error('git cat-file başarısız: ' + r.stderr);
  const buf = r.stdout, harita = new Map(); let i = 0;
  for (const sha of benzersiz) {
    const nl = buf.indexOf(0x0a, i); const [, tip, boyut] = buf.slice(i, nl).toString().split(' ');
    if (tip !== 'blob') throw new Error(`beklenmeyen nesne: ${sha}`);
    const n = Number(boyut); harita.set(sha, buf.slice(nl + 1, nl + 1 + n)); i = nl + 1 + n + 1;
  }
  return harita;
}

export class Rapor {
  constructor(ad) { this.ad = ad; this.hatalar = []; this.bilgi = []; }
  hata(m) { this.hatalar.push(m); }
  not(m) { this.bilgi.push(m); }
  bitir() {
    for (const b of this.bilgi) console.log(`  ${b}`);
    for (const h of this.hatalar.slice(0, 40)) console.log(`  KALDI: ${h}`);
    if (this.hatalar.length > 40) console.log(`  … ve ${this.hatalar.length - 40} hata daha`);
    console.log(`${this.hatalar.length ? 'KALDI' : 'GEÇTİ'}: ${this.ad}`);
    process.exit(this.hatalar.length ? 1 : 0);
  }
}
