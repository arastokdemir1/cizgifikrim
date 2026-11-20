// Etkin yönlendirme listesi: redirects.json.
import fs from 'node:fs';
const oku = (ad) => JSON.parse(fs.readFileSync(new URL(ad, import.meta.url), 'utf8'));
export default oku('./redirects.json').redirects;
