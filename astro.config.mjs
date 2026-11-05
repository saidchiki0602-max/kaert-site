import { defineConfig } from 'astro/config';
// PUBLIC_PREVIEW=1 : build « aperçu » en fichiers plats (kov.html…) pour relecture hors ligne ; sinon dossiers propres (/kov/).
const preview = process.env.PUBLIC_PREVIEW === '1';
export default defineConfig({
  site: 'https://kaertgroupe.com',
  output: 'static',
  build: { inlineStylesheets: 'always', format: preview ? 'file' : 'directory' },
  compressHTML: true,
});
