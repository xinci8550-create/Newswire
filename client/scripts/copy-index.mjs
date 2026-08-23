// Copy client/index.html into client/dist and point it at the content-hashed
// asset bundle that esbuild emitted (entry-names=[name]-[hash]). This makes
// assets cacheable immutably while the HTML is always fresh, so UI updates
// appear immediately after a rebuild — no stale-bundle problem.
//
// It also picks the NEWEST .js/.css (content-hash naming means a changed build
// always writes a new filename) and deletes stale bundles, so the served SPA
// can never fall back to an out-of-date build.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const clientRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcIndex = path.join(clientRoot, 'index.html');
const dist = path.join(clientRoot, 'dist');
const destIndex = path.join(dist, 'index.html');
const assetsDir = path.join(dist, 'assets');

const files = readdirSync(assetsDir);

function newest(list) {
  if (!list.length) return null;
  return list.sort((a, b) => statSync(path.join(assetsDir, b)).mtimeMs - statSync(path.join(assetsDir, a)).mtimeMs)[0];
}

const jsFile = newest(files.filter((f) => f.endsWith('.js')));
const cssFile = newest(files.filter((f) => f.endsWith('.css')));

if (!jsFile || !cssFile) {
  console.error('[client-build] ERROR: no .js/.css bundle found in dist/assets');
  process.exit(1);
}

// Remove stale builds so only the current bundle remains.
for (const f of files) {
  if ((f.endsWith('.js') || f.endsWith('.css')) && f !== jsFile && f !== cssFile) {
    try { unlinkSync(path.join(assetsDir, f)); } catch { /* ignore */ }
  }
}

mkdirSync(dist, { recursive: true });
let html = readFileSync(srcIndex, 'utf8');
// Replace the fixed asset references with the hashed filenames esbuild produced.
html = html.replace('/assets/main.js', `/assets/${jsFile}`).replace('/assets/main.css', `/assets/${cssFile}`);
writeFileSync(destIndex, html);
console.log(`[client-build] index.html -> ${jsFile}, ${cssFile} (stale cleaned)`);
