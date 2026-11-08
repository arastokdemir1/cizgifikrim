// Tüm kontrolleri sırayla çalıştırır. Kullanım: node scripts/kontrol-hepsi.mjs [--site _site] [--base origin/main] [--no-audit]
import { spawnSync } from 'node:child_process';
import { arg, bayrak } from './ortak.mjs';

const ortak = ['--site', arg('site', '_site'), '--base', arg('base', 'origin/main')];
const adimlar = [
  ['kontrol-passthrough.mjs', ortak], ['kontrol-redirects.mjs', ortak], ['kontrol-sitemap.mjs', ortak],
  ['kontrol-seo.mjs', ortak], ['kontrol-url-listesi.mjs', ortak],
];
let kalan = 0;
for (const [betik, a] of adimlar) {
  console.log(`\n▶ ${betik}`);
  if (spawnSync(process.execPath, [`scripts/${betik}`, ...a], { stdio: 'inherit' }).status !== 0) kalan++;
}
if (!bayrak('no-audit')) {
  console.log('\n▶ npm audit --omit=dev --audit-level=high');
  const a = spawnSync('npm', ['audit', '--omit=dev', '--audit-level=high'], { stdio: 'inherit' });
  if (a.status !== 0) { kalan++; console.log('KALDI: npm audit'); } else console.log('GEÇTİ: npm audit');
}
console.log(`\n${kalan ? `KALDI: ${kalan} kontrol başarısız` : 'TÜM KONTROLLER GEÇTİ'}`);
process.exit(kalan ? 1 : 0);
