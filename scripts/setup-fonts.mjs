/**
 * Self-host Poppins via @fontsource (weights 400–800, latin subset).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const fontPkg = path.join(root, 'node_modules/@fontsource/poppins');
const outDir = path.join(root, 'public/assets/fonts/poppins');
const cssOut = path.join(root, 'public/assets/css/fonts.css');

const weights = [400, 500, 600, 700, 800];
fs.mkdirSync(outDir, { recursive: true });

const faces = [];
for (const w of weights) {
  const srcDir = path.join(fontPkg, 'files');
  const files = fs.readdirSync(srcDir).filter((f) => f.includes(`latin-${w}-normal`) && f.endsWith('.woff2'));
  if (!files.length) continue;
  const srcFile = files[0];
  fs.copyFileSync(path.join(srcDir, srcFile), path.join(outDir, srcFile));
  faces.push(`@font-face {
  font-family: 'Poppins';
  font-style: normal;
  font-display: swap;
  font-weight: ${w};
  src: url('/assets/fonts/poppins/${srcFile}') format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}`);
}

fs.writeFileSync(cssOut, `${faces.join('\n\n')}\n`);
console.log(`fonts.css: ${weights.length} Poppins weights → public/assets/fonts/poppins/`);

const publicDir = path.join(root, 'public');
for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(publicDir, file), 'utf8');
  html = html.replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/g, '\n');
  html = html.replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin>\n?/g, '\n');
  html = html.replace(
    /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"\s*\n?\s*rel="stylesheet">\n?/g,
    '\n',
  );
  fs.writeFileSync(path.join(publicDir, file), html);
}
console.log('Removed Google Fonts links from HTML');
