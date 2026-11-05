# Kaërt — gabarit « usine à sites »

Ce dépôt est le premier site produit par le modèle Webenvue 2.0 : **gabarit + données + agents**.

## Où sont les choses
- `src/data/pages/*.json` — tout le texte modifiable d'une page : balises Google (`title`, `description`), bloc produit (`product` : promesse, 3 blocs, OUI, client, prix, bouton), balisage appli (`app`), FAQ (`faq`). **Un agent ou un humain modifie ici, jamais dans les `.astro`.**
- `src/pages/*.astro` — la structure de chaque page (quels blocs, dans quel ordre). Change rarement.
- `src/components/` — les briques : `Product` (gabarit produit), `Faq` (FAQ + schema FAQPage), `AppLd` (schema SoftwareApplication), `DemoForm` (formulaire → Supabase), `Nav`, `Footer`.
- `src/styles/global.css` — l'identité (noir/blanc, couleur par produit via `--c`).
- `public/llms.txt`, `public/sitemap.xml`, `public/robots.txt` — ce que lisent les robots et les IA.
- `scripts/audit.mjs` — l'agent d'audit SEO/GEO : titres, descriptions, h1, canonical, JSON-LD, FAQ, liens cassés, pages absentes du sitemap ou de llms.txt. Bloque le déploiement sur erreur.

## Commandes
- `npm run preview` — build d'aperçu (fichiers plats, liens relatifs) pour relecture.
- `npm run check` — build de production + audit. C'est ce que fait GitHub Actions avant de publier.

## Règles du gabarit (valables pour les 5 sites suivants)
1. Chaque page répond à la question principale dans ses deux premières lignes.
2. Chaque page a une FAQ balisée (3 à 6 questions formulées comme les gens les posent).
3. Chaque produit a son schema `SoftwareApplication` ; le site a `Organization` ; `llms.txt` liste tout avec prix et dates.
4. Titres ≤ 60 caractères, descriptions ≤ 155, un seul h1, canonical, sitemap complet.
5. Les textes vivent dans les données ; le code ne contient pas de phrase destinée au visiteur (hors structure).

## Agents prévus
- **Audit** (fait) : à chaque build.
- **Contenu** : écrit les guides sur les requêtes où le site est en page 2 (Search Console) ; produit un `.md` par guide, relu avant publication.
- **Rapport mensuel** : positions, pages citées par les IA, formulaires reçus, FAQ à rafraîchir.
