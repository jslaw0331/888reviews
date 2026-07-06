import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { transform } from 'lightningcss';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const cssSource = path.join(root, 'public/assets/css/styles.css');
const outDir = path.join(root, 'public/assets/css/dist');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset-config.json'), 'utf8'));

function hashContent(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

function extractLines(allLines, ranges) {
  const chunks = [];
  for (const [start, end] of ranges) {
    chunks.push(...allLines.slice(start - 1, end));
  }
  return chunks.join('\n');
}

function minifyCss(source, filename) {
  const { code } = transform({
    filename,
    code: Buffer.from(source),
    minify: true,
  });
  return code;
}

function writeBundle(name, css) {
  let out;
  try {
    out = minifyCss(css, `${name}.css`);
  } catch (err) {
    console.warn(`${name}: minify skipped (${err.message})`);
    out = Buffer.from(css, 'utf8');
  }
  const hash = hashContent(out);
  const outName = `${name}.${hash}.css`;
  fs.writeFileSync(path.join(outDir, outName), out);
  return { name, file: `dist/${outName}`, hash, bytes: out.length };
}

fs.mkdirSync(outDir, { recursive: true });
const allLines = fs.readFileSync(cssSource, 'utf8').split('\n');
const manifest = { css: {}, builtAt: new Date().toISOString() };

for (const [name, ranges] of Object.entries(config.bundles)) {
  const css = extractLines(allLines, ranges);
  manifest.css[name] = writeBundle(name, css);
}

const fullMin = minifyCss(fs.readFileSync(cssSource), 'styles.css');
const fullHash = hashContent(fullMin);
const fullName = `styles.${fullHash}.css`;
fs.writeFileSync(path.join(outDir, fullName), fullMin);
manifest.css.full = { name: 'full', file: `dist/${fullName}`, hash: fullHash, bytes: fullMin.length };

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('CSS bundles:', Object.values(manifest.css).map((b) => `${b.name} ${(b.bytes / 1024).toFixed(1)}KB`).join(', '));
