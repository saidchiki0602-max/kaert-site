# Kaërt — gabarit « usine à sites »

Ce dépôt est le premier site produit par le modèle Webenvue 2.0 : **gabarit + données + agents**.

## Où sont les choses
- `src/data/pages/*.json` — tout le texte modifiable d'une page : balises Google (`title`, `description`), bloc produit (`product` : promesse, 3 blocs, OUI, client, prix, bouton), balisage appli (`app`), FAQ (`faq`). **Un agent ou un humain modifie ici, jamais dans les `.astro`.**
- `src/pages/*.astro` — la structure de chaque page (quels blocs, dans quel ordre). Change rarement.
- `src/components/` — les briques : `Product` (gabarit produit), `Faq` (FAQ + schema FAQPage), `AppLd` (schema SoftwareApplication), `DemoForm` (formulaire → Supabase), `Nav`, `Footer`.
- `src/styles/global.css` — l'identité (noir/blanc, couleur par produit via `--c`).
- `public/llms.txt`, `public/sitemap.xml`, `public/robots.txt` — ce que lisent les robots et les IA.
- `scripts/audit.mjs` — l'agent d'audit SEO/GEO : titres, descriptions, h1, sous-titres sur la requête, titres de bloc non balisés, canonical, JSON-LD, FAQ, liens cassés ou sans destination, pages absentes du sitemap ou de llms.txt. Bloque le déploiement sur erreur.

## Commandes
- `npm run preview` — build d'aperçu (fichiers plats, liens relatifs) pour relecture.
- `npm run check` — build de production + audit. C'est ce que fait GitHub Actions avant de publier.

## Règles du gabarit (valables pour les 5 sites suivants)
1. Chaque page répond à la question principale dans ses deux premières lignes.
2. Chaque page a une FAQ balisée (3 à 6 questions formulées comme les gens les posent).
3. Chaque produit a son schema `SoftwareApplication` ; le site a `Organization` ; `llms.txt` liste tout avec prix et dates.
4. Titres ≤ 60 caractères, descriptions ≤ 155, un seul h1, canonical, sitemap complet.
5. Les textes vivent dans les données ; le code ne contient pas de phrase destinée au visiteur (hors structure).
6. Au moins deux sous-titres (h2/h3) par page reprennent la requête visée ou une de ses variantes (`seo.json`) : un sous-titre dit ce que les gens tapent, pas seulement une accroche. Bloquant.
7. Un titre de bloc est un h2 ou un h3, jamais un texte en gras suivi d'un paragraphe : Google ne lit pas le gras comme un sujet de la page. Bloquant.
8. Aucun lien sans destination (`href="#"`, vide, `javascript:`) : un réseau social sans adresse ne s'affiche pas. Bloquant.
9. On n'affirme pas au présent ce qu'un produit en développement fera au lancement (conformité, certification) : « sera », avec la date. Relecture humaine, non automatisé.

10. Tout contenu qui affirme une règle (droit, fiscalité, norme, prix public) cite sa source officielle : champ `sources` de la page (liste `[libellé, adresse]`), affiché dans un bloc « Sources officielles » et repris dans les données structurées (`citation`). Sites publics uniquement (Service-Public, Légifrance, DGCCRF, impots.gouv.fr, Assemblée nationale…), chaque adresse ouverte et lue avant d'être citée. Sans source, une IA n'a aucune raison de reprendre un site récent.
11. Chaque guide porte deux dates : `published` (première publication) et `updated` (dernière vérification), reprises dans `datePublished` et `dateModified`.
12. Les guides liés en bas de page sont des voisins thématiques déclarés dans les données (`voisins`), pas les trois mêmes partout : chaque nouveau guide doit recevoir des liens.

## Référencement IA (GEO) : liste de mise en ligne, à refaire pour chaque nouveau site
Établie le 26 novembre 2026 sur travauxsanspiege.fr. Les quatre premiers points sont dans le gabarit ; les suivants se font une fois par site.
1. `robots.txt` autorise nommément GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended et Bingbot. Contrôle : demander une page avec chacun de ces noms de robot, obtenir un code 200 et la page complète.
2. Le texte est dans le HTML, lisible sans JavaScript.
3. `llms.txt` à jour, avec les pages utiles, les prix et les dates.
4. IndexNow prévient Bing à chaque déploiement.
5. Google Search Console : propriété validée, sitemap envoyé, demande d'indexation des nouvelles pages. Le rapport « IA générative » (bêta) donne les pages affichées dans les réponses IA de Google.
6. Bing Webmaster Tools : importer le site depuis la Search Console, puis envoyer le sitemap à la main (l'import ne le reprend pas pour une propriété de domaine). Bing alimente ChatGPT et Copilot ; sa rubrique « AI Performance » donne les citations. Premières données sous 48 heures.
7. Relever les deux rapports IA trois à quatre semaines après la mise en ligne : les citations suivent le classement, elles ne le précèdent pas.

## Agents prévus
- **Audit** (fait) : à chaque build.
- **Contenu** : écrit les guides sur les requêtes où le site est en page 2 (Search Console) ; produit un `.md` par guide, relu avant publication.
- **Rapport mensuel** : positions, pages citées par les IA, formulaires reçus, FAQ à rafraîchir.
