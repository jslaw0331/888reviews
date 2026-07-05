import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'asset-config.json'), 'utf8'));

const cssManifest = JSON.parse(
  fs.readFileSync(path.join(publicDir, 'assets/css/dist/manifest.json'), 'utf8'),
);
const jsManifest = JSON.parse(
  fs.readFileSync(path.join(publicDir, 'assets/js/dist/manifest.json'), 'utf8'),
);

function bundlesForPage(filename) {
  const bundles = new Set(['base']);
  for (const [bundle, files] of Object.entries(config.pages)) {
    if (bundle === 'base') continue;
    if (files.includes('*') || files.includes(filename)) {
      bundles.add(bundle);
    }
  }
  return [...bundles];
}

function isStaticJsPage(filename) {
  return config.jsPages.static.includes(filename);
}

function strapiPublicUrlMeta() {
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return '';
  const m = fs.readFileSync(envPath, 'utf8').match(/^STRAPI_API_URL=(.+)$/m);
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '').replace(/\/$/, '');
}

const strapiUrl = process.env.STRAPI_API_URL?.replace(/\/$/, '') || strapiPublicUrlMeta();

function buildCssBlock(filename) {
  const bundles = bundlesForPage(filename);
  const lines = bundles
    .map((b) => cssManifest.css[b])
    .filter(Boolean)
    .map((b) => `    <link rel="stylesheet" href="/assets/css/${b.file}">`);
  lines.push('    <link rel="stylesheet" href="/assets/css/fonts.css">');
  return lines.join('\n');
}

let updated = 0;
for (const filename of fs.readdirSync(publicDir).filter((f) => f.endsWith('.html'))) {
  const filePath = path.join(publicDir, filename);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const cssBlock = buildCssBlock(filename);
  const cssMarker = '    <!-- build:css -->';
  const cssEnd = '    <!-- endbuild:css -->';

  html = html.replace(/\n?\s*<link rel="stylesheet" href="\/assets\/css\/styles\.css">\n?/g, '\n');

  if (html.includes(cssMarker)) {
    html = html.replace(
      new RegExp(`${cssMarker}[\\s\\S]*?${cssEnd}`),
      `${cssMarker}\n${cssBlock}\n${cssEnd}`,
    );
    changed = true;
  } else {
    html = html.replace(
      /\n(\s*)<link rel="stylesheet" href="\/assets\/css\/[^"]+">\n/g,
      '\n',
    );
    html = html.replace(
      /(<link rel="icon" href="\/assets\/img\/)/,
      `${cssMarker}\n${cssBlock}\n${cssEnd}\n$1`,
    );
    changed = true;
  }

  const jsFile = isStaticJsPage(filename)
    ? jsManifest.js.static.file
    : jsManifest.js.core.file;
  const jsTag = `    <script src="/assets/js/${jsFile}" defer></script>`;

  if (html.match(/\/assets\/js\/(script\.js|dist\/core\.[^"]+\.js|dist\/static\.[^"]+\.js)/)) {
    html = html.replace(
      /\s*<script src="\/assets\/js\/(?:script\.js[^"]*|dist\/(?:core|static)\.[^"]+\.js)" defer><\/script>\n?/g,
      '\n',
    );
  }
  if (!html.includes(`/assets/js/${jsFile}`)) {
    html = html.replace(
      /(<script src="\/components\/components\.js" defer><\/script>)/,
      `$1\n${jsTag}`,
    );
    changed = true;
  }

  if (strapiUrl) {
    if (html.includes('name="strapi-public-url"')) {
      html = html.replace(
        /(<meta name="strapi-public-url" content=")[^"]*(")/,
        `$1${strapiUrl}$2`,
      );
    } else {
      html = html.replace(
        /(<meta name="public-base-url"[^>]*>)/,
        `$1\n    <meta name="strapi-public-url" content="${strapiUrl}">`,
      );
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    updated++;
  }
}

console.log(`Updated ${updated} HTML files with built asset references`);
