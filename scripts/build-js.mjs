import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import * as esbuild from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'public/assets/js/dist');

function hashContent(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 8);
}

fs.mkdirSync(outDir, { recursive: true });

const shared = {
  entryPoints: [path.join(root, 'public/assets/js/script.js')],
  outfile: path.join(outDir, 'core.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'none',
};

await esbuild.build(shared);

const coreBuf = fs.readFileSync(path.join(outDir, 'core.js'));
const coreHash = hashContent(coreBuf);
const coreName = `core.${coreHash}.js`;
fs.renameSync(path.join(outDir, 'core.js'), path.join(outDir, coreName));

const staticEntry = path.join(__dirname, 'static-entry.js');
fs.writeFileSync(
  staticEntry,
  `document.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  document.querySelectorAll('.accordion-header').forEach((header) => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.accordion-item').forEach((acc) => {
        acc.classList.remove('active');
        acc.querySelector('.accordion-header')?.setAttribute('aria-expanded', 'false');
      });
      if (!isActive) {
        item.classList.add('active');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  });
});
`,
);

await esbuild.build({
  entryPoints: [staticEntry],
  outfile: path.join(outDir, 'static.js'),
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
});

const staticBuf = fs.readFileSync(path.join(outDir, 'static.js'));
const staticHash = hashContent(staticBuf);
const staticName = `static.${staticHash}.js`;
fs.renameSync(path.join(outDir, 'static.js'), path.join(outDir, staticName));
fs.unlinkSync(staticEntry);

const manifest = {
  js: {
    core: { file: `dist/${coreName}`, hash: coreHash, bytes: coreBuf.length },
    static: { file: `dist/${staticName}`, hash: staticHash, bytes: staticBuf.length },
  },
  builtAt: new Date().toISOString(),
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`JS core ${(coreBuf.length / 1024).toFixed(1)}KB, static ${(staticBuf.length / 1024).toFixed(1)}KB`);
