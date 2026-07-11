/**
 * Minify public/assets/js/script.js → hashed dist/core.*.js and update manifest.
 * Run: node scripts/build-js.mjs
 */
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distDir = path.join(root, 'public', 'assets', 'js', 'dist');
const entry = path.join(root, 'public', 'assets', 'js', 'script.js');
const manifestPath = path.join(distDir, 'manifest.json');

const tmp = path.join(distDir, '_core.tmp.js');
await esbuild.build({
  entryPoints: [entry],
  outfile: tmp,
  minify: true,
  bundle: false,
  target: ['es2018'],
});

const buf = fs.readFileSync(tmp);
const hash = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
const outName = `core.${hash}.js`;
const outPath = path.join(distDir, outName);
fs.renameSync(tmp, outPath);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const oldCore = manifest.js?.core?.file;
manifest.js = manifest.js || {};
manifest.js.core = { file: `dist/${outName}`, hash, bytes: buf.length };
manifest.builtAt = new Date().toISOString();
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

if (oldCore && oldCore !== `dist/${outName}`) {
  const oldPath = path.join(root, 'public', 'assets', 'js', oldCore);
  if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
}

console.log(`JS core: dist/${outName} (${(buf.length / 1024).toFixed(1)}KB)`);
