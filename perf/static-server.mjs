// Load-test target: serves the site the way IIS 10 serves static files by default, so JMeter
// measures the site rather than the single-threaded dev server (tools/serve.ps1).
//   - ETag + Last-Modified, 304 on revalidation, no Cache-Control max-age (IIS default)
//   - gzip for html/css/js/json when the client accepts it (IIS static compression)
//   - files held in memory (IIS kernel-mode output cache)
// Options:
//   --port 8080        listen port
//   --workers 4        CPU processes (ignored when --max-conn is set: the limit must be global)
//   --max-conn 200     emulate a hosting plan's concurrent-connection cap: extra connections get
//                      "503 Service Unavailable", as IIS does when a site's maxConnections is reached
//   --cache 3600       send Cache-Control: max-age (to test the recommended web.config)
import cluster from 'node:cluster';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const arg = (name, def) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : def;
};
const PORT = arg('port', 8080);
const MAX_CONN = arg('max-conn', 0);
const WORKERS = MAX_CONN ? 1 : arg('workers', 4);
const CACHE = arg('cache', 0);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};
const COMPRESS = new Set(['.html', '.css', '.js', '.json', '.svg']);

if (cluster.isPrimary && WORKERS > 1) {
  for (let i = 0; i < WORKERS; i++) cluster.fork();
  console.log(`static-server :${PORT}  workers=${WORKERS}  cache=${CACHE || 'IIS default'}`);
} else {
  const files = new Map();
  const load = (rel) => {
    if (files.has(rel)) return files.get(rel);
    const full = path.join(ROOT, rel);
    if (!full.startsWith(ROOT) || !fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
    const ext = path.extname(full).toLowerCase();
    if (!MIME[ext]) return null;
    const body = fs.readFileSync(full);
    const stat = fs.statSync(full);
    const entry = {
      body,
      gz: COMPRESS.has(ext) ? zlib.gzipSync(body) : null,
      type: MIME[ext],
      etag: `"${crypto.createHash('sha1').update(body).digest('hex').slice(0, 16)}"`,
      modified: stat.mtime.toUTCString(),
    };
    files.set(rel, entry);
    return entry;
  };

  let open = 0;
  const server = http.createServer((req, res) => {
    let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const f = load(rel);
    if (!f) { res.writeHead(404); res.end('404'); return; }
    const headers = { 'Content-Type': f.type, ETag: f.etag, 'Last-Modified': f.modified, Vary: 'Accept-Encoding' };
    if (CACHE) headers['Cache-Control'] = `public, max-age=${CACHE}`;
    if (req.headers['if-none-match'] === f.etag || req.headers['if-modified-since'] === f.modified) {
      res.writeHead(304, headers); res.end(); return;
    }
    const gzip = f.gz && /\bgzip\b/.test(req.headers['accept-encoding'] || '');
    if (gzip) headers['Content-Encoding'] = 'gzip';
    const body = gzip ? f.gz : f.body;
    headers['Content-Length'] = body.length;
    res.writeHead(200, headers);
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  server.keepAliveTimeout = 120_000; // IIS connectionTimeout default
  server.headersTimeout = 125_000;
  if (MAX_CONN) {
    server.on('connection', (socket) => {
      open++;
      socket.on('close', () => open--);
      if (open > MAX_CONN) {
        socket.end('HTTP/1.1 503 Service Unavailable\r\nContent-Length: 0\r\nConnection: close\r\n\r\n');
      }
    });
  }
  // IIS accepts connections in the kernel (http.sys) with a deep queue; Node's default backlog of 511
  // would refuse connections during a spike and blame the site for a test-server limit.
  server.listen(PORT, '127.0.0.1', 65535, () => {
    if (WORKERS === 1) console.log(`static-server :${PORT}  max-conn=${MAX_CONN || 'unlimited'}  cache=${CACHE || 'IIS default'}`);
  });
}
