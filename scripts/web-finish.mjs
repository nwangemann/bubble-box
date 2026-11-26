// After `expo export`: has the page fetch Skia and the app at once, not in turn, and zips what is large.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const SCRIPTS = '_expo/static/js/web';

const app = readdirSync(join(DIST, SCRIPTS)).filter((f) => /^App-[0-9a-f]+\.js$/.test(f));
if (app.length !== 1) throw new Error(`Expected one App script, found ${app.length}`);

const page = join(DIST, 'index.html');
const html = readFileSync(page, 'utf8');
// Skia is fetched with same-origin credentials, which `crossorigin` matches; the app by a script tag.
// Relative, so they resolve to the same URLs at the root and under a base path (ADR 5).
const ahead = [
  '<link rel="preload" href="canvaskit.wasm" as="fetch" type="application/wasm" crossorigin>',
  `<link rel="preload" href="${SCRIPTS}/${app[0]}" as="script">`,
].join('');
if (!html.includes('</head>')) throw new Error('No head to add to');
writeFileSync(page, html.replace('</head>', `${ahead}</head>`));

for (const file of readdirSync(DIST, { recursive: true })) {
  if (!/\.(wasm|js|html)$/.test(file)) continue;
  const path = join(DIST, file);
  writeFileSync(`${path}.gz`, gzipSync(readFileSync(path), { level: 9 }));
}
