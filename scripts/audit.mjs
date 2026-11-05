// Audit SEO / GEO du site construit. Usage : node scripts/audit.mjs dist
// Sortie : rapport lisible + code de sortie 1 si une erreur bloquante.
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2] || 'dist';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const errs = [], warns = [], pages = [];
const txt = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const llms = fs.existsSync(path.join(dir, 'llms.txt')) ? fs.readFileSync(path.join(dir, 'llms.txt'), 'utf8') : '';
const sitemap = fs.existsSync(path.join(dir, 'sitemap.xml')) ? fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8') : '';
for (const f of files) {
  const h = fs.readFileSync(path.join(dir, f), 'utf8'); const p = f.replace('.html', ''); const legal = /^(404|mentions-legales|confidentialite)$/.test(p);
  const title = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const desc = (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const h1 = (h.match(/<h1[\s\S]*?<\/h1>/g) || []).length;
  const canonical = /<link rel="canonical"/.test(h);
  const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => { try { return JSON.parse(m[1])['@type']; } catch { return 'INVALID'; } });
  const words = txt(h).split(' ').length;
  const links = [...h.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]).filter(u => !/^(https?:|mailto:|tel:)/.test(u));
  const broken = links.filter(u => { const t = u.replace(/^\//, '').replace(/\/$/, ''); const cand = [t, t + '.html', t + '/index.html', (t || 'index') + '.html']; return !cand.some(c => fs.existsSync(path.join(dir, c))); });
  const imgsNoAlt = (h.match(/<img(?![^>]*alt=)[^>]*>/g) || []).length;
  const faq = lds.includes('FAQPage');
  const r = { page: p, title: title.length, desc: desc.length, h1, canonical, ld: lds.join('+'), words, faq, broken, imgsNoAlt };
  pages.push(r);
  if (!title) errs.push(`${p}: pas de <title>`); else if (title.length > 65) warns.push(`${p}: title ${title.length} caractères (> 60)`);
  if (!desc) errs.push(`${p}: pas de description`); else if (desc.length > 160) warns.push(`${p}: description ${desc.length} caractères (> 155)`);
  if (h1 !== 1 && p !== 'demo') (legal ? warns : errs).push(`${p}: ${h1} <h1> (il en faut un)`);
  if (!canonical) errs.push(`${p}: pas de canonical`);
  if (lds.includes('INVALID')) errs.push(`${p}: JSON-LD invalide`);
  if (!faq && !legal) warns.push(`${p}: pas de FAQ balisée (GEO)`);
  if (words < 300 && !legal) warns.push(`${p}: ${words} mots, page mince`);
  if (broken.length) errs.push(`${p}: liens cassés → ${[...new Set(broken)].join(', ')}`);
  if (imgsNoAlt) warns.push(`${p}: ${imgsNoAlt} image(s) sans alt`);
  if (!legal && p !== '404' && sitemap && !sitemap.includes(`kaert.fr/${p === 'index' ? '' : p + '/'}<`)) warns.push(`${p}: absente du sitemap`);
  if (!legal && p !== '404' && p !== 'index' && llms && !llms.includes(`/${p}/`)) warns.push(`${p}: absente de llms.txt`);
}
console.log(`\nAudit SEO/GEO — ${files.length} pages\n`);
console.table(pages.map(({ page, title, desc, h1, ld, words, faq }) => ({ page, title, desc, h1, 'JSON-LD': ld, mots: words, FAQ: faq ? 'oui' : '—' })));
if (errs.length) { console.log('\nERREURS (bloquantes) :'); errs.forEach(e => console.log(' ✗ ' + e)); }
if (warns.length) { console.log('\nÀ AMÉLIORER :'); warns.forEach(w => console.log(' • ' + w)); }
if (!errs.length && !warns.length) console.log('Rien à signaler.');
process.exit(errs.length ? 1 : 0);
