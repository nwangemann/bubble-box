// Serves `dist` to a phone on the same network, sending the zipped copy where there is one.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const PORT = Number(process.env.PORT ?? 8098);
const DIST = resolve('dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

const stat = (path) => {
  const s = statSync(path, { throwIfNoEntry: false });
  return s?.isFile() ? s : null;
};

createServer((req, res) => {
  let url;
  try {
    url = decodeURIComponent(new URL(req.url, 'http://host').pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405).end();
    return;
  }
  const path = join(DIST, normalize(url.endsWith('/') ? `${url}index.html` : url));
  if (!path.startsWith(DIST + sep) || path.includes('\0') || !stat(path)) {
    res.writeHead(404).end('Not found');
    return;
  }
  const zipped = /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') && stat(`${path}.gz`);
  const file = zipped ? `${path}.gz` : path;
  const { size, mtimeMs } = stat(file);
  const etag = `"${size.toString(36)}-${Math.round(mtimeMs).toString(36)}"`;
  const headers = {
    'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream',
    // Scripts are named by what they hold, so never change; the rest is asked after each time.
    'Cache-Control': url.startsWith('/_expo/') ? 'max-age=31536000, immutable' : 'no-cache',
    ETag: etag,
    Vary: 'Accept-Encoding',
  };
  if (req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers).end();
    return;
  }
  headers['Content-Length'] = size;
  if (zipped) headers['Content-Encoding'] = 'gzip';
  res.writeHead(200, headers);
  if (req.method === 'HEAD') res.end();
  else
    createReadStream(file)
      .on('error', () => res.destroy())
      .pipe(res);
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
