// Collects exactly the files the live site needs into one upload folder, plus a .zip of it.
// Product photos under assets/images/products/source/ are copied only when a page, script or data
// file refers to them (the folder also holds working files: cutouts, a 70 MB video, a PDF).
// Usage: node tools/build-deploy.mjs ["output folder"]   (default: "رفع المشروع" in the project root)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.resolve(ROOT, process.argv[2] || 'رفع المشروع');
const ZIP = `${OUT}.zip`;
const SOURCE = 'assets/images/products/source/';
const norm = (p) => p.split(path.sep).join('/');
const walk = (dir) => fs.readdirSync(path.join(ROOT, dir), { recursive: true })
  .map((f) => `${dir}/${norm(f)}`)
  .filter((f) => fs.statSync(path.join(ROOT, f)).isFile());

const pages = ['index.html', 'products.html', 'product.html', 'about.html', 'contact.html'];
const code = [...walk('css'), ...walk('js'), ...walk('data').filter((f) => f.endsWith('.json'))];
const assets = walk('assets');

// Everything the site can refer to, to decide which source photos are in use.
const text = [...pages, ...code].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
const keep = [
  ...pages, 'web.config', ...code,
  ...assets.filter((f) => !f.startsWith(SOURCE) || text.includes(f)),
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.rmSync(ZIP, { force: true });
let bytes = 0;
for (const f of keep) {
  const to = path.join(OUT, f);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(path.join(ROOT, f), to);
  bytes += fs.statSync(to).size;
}
// Windows' built-in tar (bsdtar) writes standard zip files (forward-slash paths, unzip anywhere).
// Called by full path: Git Bash puts GNU tar first on PATH, which can't write zip.
// It can't take non-ASCII names as arguments, so it runs inside the folder and writes an ASCII-named temp file.
const TAR = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
const tmpZip = path.join(os.tmpdir(), `idt-site-${process.pid}.zip`);
execFileSync(TAR, ['-a', '-c', '-f', tmpZip, ...fs.readdirSync(OUT)], { cwd: OUT }); // names, not '.', so entries have no "./" prefix
fs.copyFileSync(tmpZip, ZIP);
fs.rmSync(tmpZip);

const skipped = assets.filter((f) => !keep.includes(f));
console.log(`${keep.length} files, ${(bytes / 1e6).toFixed(1)} MB  ->  ${OUT}`);
console.log(`zip: ${(fs.statSync(ZIP).size / 1e6).toFixed(1)} MB  ->  ${ZIP}`);
console.log(`left out: ${skipped.length} unused working files (${(skipped.reduce((s, f) => s + fs.statSync(path.join(ROOT, f)).size, 0) / 1e6).toFixed(1)} MB)`);
