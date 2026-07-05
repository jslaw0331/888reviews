/**
 * Pre-render CMS hub pages at build time (requires STRAPI_API_URL + STRAPI_API_TOKEN).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
dotenv.config({ path: path.join(root, '.env'), override: true });

const base = process.env.STRAPI_API_URL?.replace(/\/$/, '');
const token = process.env.STRAPI_API_TOKEN;

if (!base || !token) {
  console.log('prerender: skipped (STRAPI_API_URL or STRAPI_API_TOKEN not set)');
  process.exit(0);
}

async function strapiGet(pathAfterApi) {
  const url = `${base}/api/${pathAfterApi}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function attrFromEntry(entry) {
  return entry?.attributes || entry || {};
}

function casinoName(attr) {
  return attr.Name || attr.name || 'Casino';
}

function renderOperatorRow(entry, rank) {
  const attr = attrFromEntry(entry);
  const name = escapeHtml(casinoName(attr));
  const initial = escapeHtml((name.charAt(0) || 'C').toUpperCase());
  const bonus = escapeHtml(attr.BonusHeadline || attr.bonusHeadline || '—');
  const highlight = escapeHtml(
    attr.Highlight || attr.highlight || attr.MalaysiaHighlight || '—',
  );
  const rating = (5 - (rank - 1) * 0.1).toFixed(1);
  const podium =
    rank <= 3
      ? ` malaysia-operator-row--podium malaysia-operator-row--podium-${rank}`
      : '';
  return `<article class="malaysia-operator-row${podium}">
                        <div class="malaysia-operator-row__rank" aria-hidden="true">${rank}</div>
                        <div class="malaysia-operator-row__brand">
                            <span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${initial}</span>
                            <h3 class="malaysia-operator-row__name">${name}</h3>
                        </div>
                        <div class="malaysia-operator-row__rating"><span class="malaysia-operator-row__score">${rating}/5</span></div>
                        <div class="malaysia-operator-row__bonus"><span class="malaysia-operator-row__field-label">Bonus amount</span><strong>${bonus}</strong></div>
                        <div class="malaysia-operator-row__highlight"><span class="malaysia-operator-row__field-label">Casino site highlight</span><p>${highlight}</p></div>
                        <div class="malaysia-operator-row__cta"><a href="#" class="btn btn-primary btn-block" rel="nofollow noopener">Visit site</a></div>
                    </article>`;
}

async function prerenderIndex() {
  const indexPath = path.join(root, 'public/index.html');
  let html = fs.readFileSync(indexPath, 'utf8');
  const listMatch = html.match(
    /(<div class="malaysia-operator-list" id="malaysia-operator-list" role="list">)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/,
  );
  if (!listMatch) {
    console.warn('prerender: malaysia-operator-list not found in index.html');
    return;
  }

  const json = await strapiGet(
    'casinos?populate=*&sort=rank:asc&pagination[limit]=11',
  );
  const rows = json?.data;
  if (!Array.isArray(rows) || !rows.length) {
    console.warn('prerender: no casino rows from Strapi');
    return;
  }

  const rendered = rows.map((r, i) => renderOperatorRow(r, i + 1)).join('\n                    ');
  html = html.replace(
    listMatch[0],
    `${listMatch[1]}\n                    ${rendered}\n                ${listMatch[3]}`,
  );
  html = html.replace(
    /(<meta name="strapi-public-url" content=")[^"]*(")/,
    `$1${base}$2`,
  );
  if (!html.includes('name="strapi-public-url"')) {
    html = html.replace(
      /(<meta name="public-base-url"[^>]*>)/,
      `$1\n    <meta name="strapi-public-url" content="${base}">`,
    );
  }
  const updated = new Date().toISOString().slice(0, 10);
  html = html.replace(
    /(<time class="malaysia-listing-meta__updated-date" id="malaysia-listing-updated"\s+datetime=")[^"]*(")/,
    `$1${updated}$2`,
  );
  fs.writeFileSync(indexPath, html);
  console.log(`prerender: index.html updated with ${rows.length} operators`);
}

await prerenderIndex();
