/**
 * A dev server with no dependencies, because this site has none: one HTML file
 * with its fonts, styles and script inlined. Anything heavier would be tooling
 * for its own sake.
 *
 *   npm run dev            -> http://127.0.0.1:4321
 *   npm run dev -- 8080    -> a different port
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = process.cwd();
const PORT = Number(process.argv[2] || process.env.PORT || 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    // normalize + strip leading separators: without this, a request for
    // /../../.env walks out of the site directory
    let rel = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (rel === '' || rel.endsWith('/')) rel += 'index.html';

    const file = join(ROOT, rel);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
      return;
    }

    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store', // it is a dev server; always serve the edit
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('Server error');
    console.error(err);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`loqal join page  ->  http://127.0.0.1:${PORT}`);
});
