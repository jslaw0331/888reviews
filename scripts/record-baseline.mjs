/**
 * Record asset sizes for performance regression tracking.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'perf-baseline');
fs.mkdirSync(outDir, { recursive: true });

function sizeOf(p) {
  if (!fs.existsSync(p)) return null;
  return fs.statSync(p).size;
}

const report = {
  recordedAt: new Date().toISOString(),
  assets: {
    stylesSource: sizeOf(path.join(root, 'public/assets/css/styles.css')),
    scriptSource: sizeOf(path.join(root, 'public/assets/js/script.js')),
    cssManifest: JSON.parse(
      fs.readFileSync(path.join(root, 'public/assets/css/dist/manifest.json'), 'utf8'),
    ),
    jsManifest: JSON.parse(
      fs.readFileSync(path.join(root, 'public/assets/js/dist/manifest.json'), 'utf8'),
    ),
  },
  notes: [
    'Run Lighthouse manually on /, /reviews, /blackjack, /bonus/:slug after deploy.',
    'Compare TTFB before/after Vercel static routing.',
  ],
};

const outFile = path.join(outDir, `baseline-${Date.now()}.json`);
fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
console.log('Performance baseline written to', path.relative(root, outFile));
