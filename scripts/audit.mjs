// Audit SEO / GEO + étude de pertinence. Usage : node scripts/audit.mjs dist
// Sortie : rapport console, page dist/audit/index.html (noindex), code 1 si erreur bloquante.
import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2] || 'dist';
const seo = JSON.parse(fs.readFileSync('src/data/seo.json', 'utf8'));
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
const errs = [], warns = [], pages = [];
const strip = (h) => dec(h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
const norm = (s) => s.toLowerCase().replace(/œ/g, 'oe').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'\-]/g, ' ').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ');
const STOP = new Set(['de','du','des','la','le','les','un','une','en','pour','et','ses','soi','meme','a','au','aux','d','l','sur','dans','par','ou','mon','ma','mes','son','sa','votre','vos','ce','cet','cette','qui','que','est','avant','pres','chez','moi']);
const stem = (w) => { if (w.length <= 4) return w; w = w.replace(/(aux|eaux)$/, 'al').replace(/[sx]$/, ''); return w.length > 5 ? w.replace(/(ent|ez|er|e)$/, '') : w; };
const toks = (q) => norm(q).split(' ').filter(w => w && !STOP.has(w)).map(stem);
const hasAll = (hay, q) => { const H = new Set(norm(hay).split(' ').map(stem)); const T = toks(q); return T.length > 0 && T.every(t => H.has(t) || (t.length >= 5 && [...H].some(h => h.startsWith(t)))); };
const has = (hay, needle) => norm(hay).includes(norm(needle)) || hasAll(hay, needle);
const dec = (s) => s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const llms = fs.existsSync(path.join(dir, 'llms.txt')) ? fs.readFileSync(path.join(dir, 'llms.txt'), 'utf8') : '';
const sitemap = fs.existsSync(path.join(dir, 'sitemap.xml')) ? fs.readFileSync(path.join(dir, 'sitemap.xml'), 'utf8') : '';
for (const f of files) {
  const h = fs.readFileSync(path.join(dir, f), 'utf8'); const p = f.replace('.html', ''); const legal = /^(404|mentions-legales|confidentialite)$/.test(p);
  const title = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const desc = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const h1s = [...h.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map(m => strip(m[1]).trim());
  const h2s = [...h.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map(m => strip(m[1]).trim());
  const canonical = /<link rel="canonical"/.test(h);
  const lds = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => { try { return JSON.parse(m[1])['@type']; } catch { return 'INVALID'; } });
  const body = strip(h); const words = body.split(' ').length;
  const links = [...h.matchAll(/href="([^"#]+)(#[^"]*)?"/g)].map(m => m[1]).filter(u => !/^(https?:|mailto:|tel:)/.test(u));
  const broken = links.filter(u => { const t = u.replace(/^\//, '').replace(/\/$/, ''); return ![t, t + '.html', t + '/index.html', (t || 'index') + '.html'].some(c => fs.existsSync(path.join(dir, c))); });
  const imgsNoAlt = (h.match(/<img(?![^>]*alt=)[^>]*>/g) || []).length;
  const faqN = (h.match(/<details>/g) || []).length;
  // extrait : ce que Google peut composer, et le bruit d'interface qu'il peut y mettre
  const mainTxt = strip(h.replace(/<nav[\s\S]*?<\/nav>|<footer[\s\S]*?<\/footer>/g, ''));
  const snippet = mainTxt.slice(0, 180).trim();
  const uiNoise = ['Copier', 'Copié', 'Fermer', 'Menu', 'Ouvrir'].filter(w => new RegExp('\\b' + w + '\\b').test(mainTxt));
  const hasAddr = /\b\d{1,3}\s+(rue|avenue|boulevard|bd|place|chemin|impasse|all\u00e9e)\b|\b\d{5}\s+[A-Z\u00c9\u00c8]/i.test(mainTxt);
  // pertinence
  const s = seo[p]; let kw = null;
  if (s) {
    const q = s.requete;
    const count = (body.match(new RegExp(norm(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    const BW = norm(body).split(' ').map(stem); const bodyCount = Math.min(...toks(q).map(t => BW.filter(w => w === t || (t.length >= 5 && w.startsWith(t))).length));
    kw = { q, title: has(title, q), h1: h1s.some(x => has(x, q)), desc: has(desc, q), h2: h2s.some(x => has(x, q)), faq: has((h.match(/<section class="faq[\s\S]*?<\/section>/) || [''])[0], q), body: bodyCount,
      variantes: s.variantes.map(v => ({ v, body: has(body, v), title: has(title, v) })), intention: s.intention, pourquoi: s.pourquoi };
    const score = [kw.title, kw.h1, kw.desc, kw.h2 || kw.faq, kw.body >= 2].filter(Boolean).length;
    kw.score = score;
    if (score < 3 && !legal && p !== 'demo' && p !== 'guides') warns.push(`${p}: requête « ${q} » peu présente (score ${score}/5 : titre ${kw.title ? 'oui' : 'non'}, h1 ${kw.h1 ? 'oui' : 'non'}, description ${kw.desc ? 'oui' : 'non'}, corps ×${kw.body})`);
  } else if (!legal) warns.push(`${p}: pas d'entrée dans seo.json (requête visée non définie)`);
  pages.push({ page: p, title, desc, h1s, h2s, canonical, lds, words, faqN, broken, imgsNoAlt, kw, legal, snippet, uiNoise, hasAddr });
  if (!title) errs.push(`${p}: pas de <title>`); else if (title.length > 65) warns.push(`${p}: title ${title.length} caractères (> 60)`);
  if (!desc) errs.push(`${p}: pas de description`); else if (desc.length > 160) warns.push(`${p}: description ${desc.length} caractères (> 155)`);
  if (h1s.length !== 1 && p !== 'demo') (legal ? warns : errs).push(`${p}: ${h1s.length} <h1> (il en faut un)`);
  if (!canonical) errs.push(`${p}: pas de canonical`);
  if (lds.includes('INVALID')) errs.push(`${p}: JSON-LD invalide`);
  if (!lds.includes('FAQPage') && !legal) warns.push(`${p}: pas de FAQ balisée (GEO)`);
  if (words < 300 && !legal) warns.push(`${p}: ${words} mots, page mince`);
  if (broken.length) errs.push(`${p}: liens cassés → ${[...new Set(broken)].join(', ')}`);
  if (imgsNoAlt) warns.push(`${p}: ${imgsNoAlt} image(s) sans alt`);
  if (uiNoise.length) warns.push(`${p}: texte d'interface lisible par Google (peut finir dans l'extrait) → ${uiNoise.join(', ')}`);
  if (hasAddr && !legal) warns.push(`${p}: adresse postale dans le texte de la page (Google peut l'afficher dans l'extrait)`);
  if (!legal && p !== '404' && sitemap && !sitemap.includes(`/${p === 'index' ? '' : p + '/'}<`)) warns.push(`${p}: absente du sitemap`);
  if (!legal && p !== '404' && p !== 'index' && llms && !llms.includes(`/${p}/`)) warns.push(`${p}: absente de llms.txt`);
}
// console
console.log(`\nAudit SEO/GEO — ${files.length} pages\n`);
console.table(pages.map(({ page, title, desc, h1s, lds, words, faqN, kw }) => ({ page, titre: title.length, desc: desc.length, h1: h1s.length, 'JSON-LD': lds.join('+'), mots: words, FAQ: faqN, requête: kw ? `${kw.score}/5` : '—' })));
if (errs.length) { console.log('\nERREURS (bloquantes) :'); errs.forEach(e => console.log(' ✗ ' + e)); }
if (warns.length) { console.log('\nÀ AMÉLIORER :'); warns.forEach(w => console.log(' • ' + w)); }
if (!errs.length && !warns.length) console.log('Rien à signaler.');
// page /audit/
const ok = (b) => b ? '<span class="y">oui</span>' : '<span class="n">non</span>';
const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' });
const rows = pages.filter(x => !x.legal && x.page !== '404').map(x => `
<section class="pg" id="${x.page}">
  <h2>/${x.page === 'index' ? '' : x.page + '/'} <small>${x.words} mots · ${x.faqN} questions FAQ · ${x.lds.join(' + ')}</small></h2>
  <table class="t"><tr><th>Titre Google</th><td>${esc(x.title)} <em>(${x.title.length}/60)</em></td></tr>
  <tr><th>Description</th><td>${esc(x.desc)} <em>(${x.desc.length}/155)</em></td></tr>
  <tr><th>Extrait probable</th><td class="sn">${esc(x.snippet)}…</td></tr>
  <tr><th>H1</th><td>${x.h1s.map(esc).join('<br>') || '<span class="n">aucun</span>'} ${x.h1s.length === 1 ? '' : '<span class="n">(' + x.h1s.length + ')</span>'}</td></tr>
  <tr><th>H2</th><td>${x.h2s.map(esc).join(' · ')}</td></tr>
  <tr><th>Technique</th><td>canonical ${ok(x.canonical)} · liens cassés ${x.broken.length ? '<span class="n">' + x.broken.length + '</span>' : '<span class="y">0</span>'} · images sans alt ${x.imgsNoAlt ? '<span class="n">' + x.imgsNoAlt + '</span>' : '<span class="y">0</span>'}</td></tr></table>
  ${x.kw ? `<div class="kw"><div class="kwh"><b>Requête visée : « ${esc(x.kw.q)} »</b> <span class="sc">${x.kw.score}/5</span></div>
  <div class="grid"><div>dans le titre ${ok(x.kw.title)}</div><div>dans le h1 ${ok(x.kw.h1)}</div><div>dans la description ${ok(x.kw.desc)}</div><div>dans un h2 ou la FAQ ${ok(x.kw.h2 || x.kw.faq)}</div><div>dans le texte : ×${x.kw.body}</div></div>
  <p><b>Intention.</b> ${esc(x.kw.intention)}</p><p><b>Pourquoi ce choix.</b> ${esc(x.kw.pourquoi)}</p>
  <p><b>Variantes couvertes :</b> ${x.kw.variantes.map(v => `<span class="v ${v.body ? 'on' : 'off'}">${esc(v.v)}</span>`).join(' ')}</p></div>` : '<p class="n">Pas de requête définie pour cette page.</p>'}
</section>`).join('');
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Audit SEO / GEO — kaertgroupe.com</title>
<style>:root{--bg:#fff;--fg:#0a0a0a;--fg2:#555;--line:#ddd;--bg2:#f6f6f6}@media(prefers-color-scheme:dark){:root{--bg:#0a0a0a;--fg:#fff;--fg2:#b5b5b5;--line:#2a2a2a;--bg2:#141414}}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,sans-serif;padding:24px 16px 80px}.wrap{max-width:980px;margin:0 auto}h1{font-size:1.8rem;margin:0 0 6px}h2{font-size:1.25rem;margin:0 0 12px;display:flex;gap:12px;align-items:baseline;flex-wrap:wrap}h2 small{font-weight:400;color:var(--fg2);font-size:.85rem}
.sum{background:var(--bg2);border:1px solid var(--line);padding:16px;margin:20px 0}.sum ul{margin:8px 0 0;padding-left:20px}.y{color:#1a7f37;font-weight:700}.n{color:#b42318;font-weight:700}
.pg{border-top:2px solid var(--fg);padding:26px 0}.t{width:100%;border-collapse:collapse;font-size:.95rem}.t th{text-align:left;width:140px;color:var(--fg2);font-weight:600;padding:6px 8px 6px 0;vertical-align:top}.t td{padding:6px 0;border-bottom:1px solid var(--line)}.t em{color:var(--fg2);font-style:normal;font-size:.85rem}
.kw{background:var(--bg2);border:1px solid var(--line);padding:16px;margin-top:16px}.kwh{display:flex;justify-content:space-between;align-items:center;gap:12px}.sc{background:var(--fg);color:var(--bg);padding:3px 10px;font-weight:700}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:6px 16px;margin:12px 0;font-size:.95rem}.kw p{margin:10px 0 0;font-size:.95rem}
.v{display:inline-block;padding:2px 8px;border:1px solid var(--line);font-size:.85rem;margin:2px}.v.on{border-color:#1a7f37}.v.off{opacity:.55;text-decoration:line-through}
nav{display:flex;flex-wrap:wrap;gap:6px;margin:14px 0}nav a{font-size:.85rem;padding:4px 8px;border:1px solid var(--line);color:var(--fg);text-decoration:none}</style></head><body><div class="wrap">
<h1>Audit SEO / GEO — kaertgroupe.com</h1><div style="color:var(--fg2)">Généré automatiquement à chaque publication · ${now} · page non indexée</div>
<div class="sum"><b>${errs.length ? '<span class="n">' + errs.length + ' erreur(s) bloquante(s)</span>' : '<span class="y">Aucune erreur bloquante</span>'}</b> · ${warns.length} point(s) à améliorer · ${pages.length} pages
${errs.length ? '<ul>' + errs.map(e => '<li class="n">' + esc(e) + '</li>').join('') + '</ul>' : ''}${warns.length ? '<ul>' + warns.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul>' : ''}
<p style="margin:12px 0 0;font-size:.9rem;color:var(--fg2)">Lecture : le score /5 compte où la requête visée apparaît (titre, h1, description, h2 ou FAQ, au moins deux fois dans le texte). Les variantes barrées ne sont pas encore dans la page. Les volumes de recherche réels arriveront avec Search Console.</p></div>
<nav>${pages.filter(x => !x.legal && x.page !== '404').map(x => `<a href="#${x.page}">/${x.page === 'index' ? '' : x.page + '/'}</a>`).join('')}</nav>
${rows}</div></body></html>`;
fs.mkdirSync(path.join(dir, 'audit'), { recursive: true }); fs.writeFileSync(path.join(dir, 'audit', 'index.html'), html);
console.log(`\nRapport : ${path.join(dir, 'audit', 'index.html')}`);
process.exit(errs.length ? 1 : 0);
