import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://kaert.fr',
  output: 'static',
  build: { inlineStylesheets: 'always' },
  compressHTML: true,
});
