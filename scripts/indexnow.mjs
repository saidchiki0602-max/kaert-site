// Prévient Bing/IndexNow des URLs du sitemap après chaque déploiement.
import fs from 'node:fs';
const key = fs.readFileSync('.indexnow-key', 'utf8').trim();
const host = 'kaertgroupe.com';
const urls = [...fs.readFileSync('public/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList: urls }) });
console.log(`IndexNow → ${r.status} ${r.statusText} · ${urls.length} URLs`);
