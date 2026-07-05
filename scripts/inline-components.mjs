/**
 * Inline header, footer, and optional sidebar into HTML; remove component fetch preloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const componentsDir = path.join(publicDir, 'components');

const header = fs.readFileSync(path.join(componentsDir, 'header.html'), 'utf8').trim();
const footer = fs.readFileSync(path.join(componentsDir, 'footer.html'), 'utf8').trim();
const sidebar = fs.readFileSync(path.join(componentsDir, 'sidebar.html'), 'utf8').trim();

const headerBlock = `<div class="site-header-inlined" data-inlined="true">\n${header}\n</div>`;
const footerBlock = `<div class="site-footer-inlined" data-inlined="true">\n${footer}\n</div>`;

let count = 0;
for (const file of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  let html = fs.readFileSync(path.join(publicDir, file), 'utf8');
  let changed = false;

  html = html.replace(/\s*<link rel="preload" href="\/components\/header\.html" as="fetch" crossorigin>\n?/g, '\n');
  html = html.replace(/\s*<link rel="preload" href="\/components\/footer\.html" as="fetch" crossorigin>\n?/g, '\n');
  html = html.replace(/\s*<link rel="preload" href="\/components\/sidebar\.html" as="fetch" crossorigin>\n?/g, '\n');
  changed = true;

  if (html.includes('<site-header></site-header>')) {
    html = html.replace('<site-header></site-header>', headerBlock);
    changed = true;
  }
  if (html.includes('<site-footer></site-footer>')) {
    html = html.replace('<site-footer></site-footer>', footerBlock);
    changed = true;
  }
  if (html.includes('<site-sidebar></site-sidebar>')) {
    html = html.replace('<site-sidebar></site-sidebar>', sidebar);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(path.join(publicDir, file), html);
    count++;
  }
}
console.log(`Inlined components in ${count} HTML files`);
