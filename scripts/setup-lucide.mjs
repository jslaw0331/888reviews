/**
 * Copy Lucide UMD bundle locally (replaces jsDelivr CDN).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const src = path.join(root, 'node_modules/lucide/dist/umd/lucide.min.js');
const dest = path.join(root, 'public/assets/js/lucide.min.js');

if (!fs.existsSync(src)) {
  console.warn('lucide package not found — run npm install lucide');
  process.exit(0);
}

fs.copyFileSync(src, dest);
const publicDir = path.join(root, 'public');
const cdnPattern =
  /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/lucide@[^"]+" defer><\/script>/g;

let count = 0;
for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(publicDir, file), 'utf8');
  if (!cdnPattern.test(html)) continue;
  html = html.replace(
    cdnPattern,
    '<script src="/assets/js/lucide.min.js" defer></script>',
  );
  fs.writeFileSync(path.join(publicDir, file), html);
  count++;
}
console.log(`Local lucide.min.js (${(fs.statSync(dest).size / 1024).toFixed(1)}KB), updated ${count} HTML files`);
