// V6 (Frontend-2): src/assets/img/proje/** görsellerinin piksel ölçüleri, yayın yoluna göre ({"/assets/v1/img/proje/x/y.webp": [g, y]}).
// Sergi ve katalog şablonları width/height (CLS yok) ve çerçeve seçimi (telefon ekranı mı, yatay mı) için kullanır. Bağımlılık yok: webp/png/jpeg başlığı okunur.
import fs from 'node:fs';
import path from 'node:path';

const KOK = 'src/assets/img/proje';

function olc(b) {
  // WebP
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (t === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  }
  // PNG
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return null;
}

export default function () {
  const sonuc = {};
  const gez = (d) => {
    if (!fs.existsSync(d)) return;
    for (const a of fs.readdirSync(d, { withFileTypes: true })) {
      const y = path.join(d, a.name);
      if (a.isDirectory()) gez(y);
      else if (/\.(webp|png|jpe?g)$/i.test(a.name)) {
        try {
          const o = olc(fs.readFileSync(y));
          if (o) sonuc['/assets/v1/img/proje/' + path.relative(KOK, y).split(path.sep).join('/')] = o;
        } catch { /* okunamayan görsel: ölçüsüz geçilir */ }
      }
    }
  };
  gez(KOK);
  return sonuc;
}
