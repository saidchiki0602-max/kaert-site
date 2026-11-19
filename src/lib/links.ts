// En aperçu (artefact), les liens sont relatifs et en .html ; en production, absolus.
const PREVIEW = import.meta.env.PUBLIC_PREVIEW === '1';
export const L = (p: string): string => {
  if (/^https?:\/\//.test(p)) return p;
  if (!PREVIEW) return p;
  if (p === '/') return 'index.html';
  const [path, hash] = p.split('#');
  const clean = path.replace(/^\//, '').replace(/\/$/, '');
  return (clean ? clean + '.html' : 'index.html') + (hash ? '#' + hash : '');
};
