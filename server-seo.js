/**
 * Server-side SEO helpers: first-paint meta/canonical for CMS detail routes,
 * and Strapi-backed sitemap URL lines.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getStrapiAxiosTimeoutMs } = require('./server-http-config');

const templateCache = new Map();

function escapeHtmlAttr(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

function escapeHtmlText(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function humanizeSlug(raw) {
    try {
        const s = decodeURIComponent(String(raw)).trim();
        if (!s) return 'this page';
        const words = s.replace(/[-_]+/g, ' ').trim();
        return words.replace(/\b\w/g, (c) => c.toUpperCase());
    } catch {
        return String(raw);
    }
}

const PAGE_CONFIG = {
    provider: {
        file: 'provider.html',
        pathSeg: 'provider',
        idPrefix: 'pv',
        titleTpl: (h) => `${h} | Software provider | 888reviews`,
        descTpl: (h) =>
            `Provider dossier on 888reviews: game portfolio, standout titles, and editorial notes on ${h}.`,
    },
    slot: {
        file: 'slot.html',
        pathSeg: 'slot',
        idPrefix: 'sv',
        titleTpl: (h) => `${h} | Slot review | 888reviews`,
        descTpl: (h) =>
            `Slot review on 888reviews: features, volatility context, RTP notes, and where to play ${h}. 18+ only.`,
    },
    bonus: {
        file: 'bonus.html',
        pathSeg: 'bonus',
        idPrefix: 'bd',
        titleTpl: (h) => `${h} | Casino bonus | 888reviews`,
        descTpl: (h) =>
            `Casino bonus breakdown on 888reviews: headline value, wagering context, and eligibility notes for ${h}. 18+ only.`,
    },
    guide: {
        file: 'post.html',
        pathSeg: 'guide',
        idPrefix: 'gp',
        titleTpl: (h) => `${h} | Guide | 888reviews`,
        descTpl: (h) =>
            `Editorial guide on 888reviews: expert notes and practical takeaways — ${h}. 18+ only. Play responsibly.`,
    },
    news: {
        file: 'post.html',
        pathSeg: 'news',
        idPrefix: 'gp',
        titleTpl: (h) => `${h} | News | 888reviews`,
        descTpl: (h) =>
            `Latest news on 888reviews: industry updates and editorial coverage — ${h}. 18+ only. Play responsibly.`,
    },
};

function readTemplate(rootDir, fileName) {
    if (!templateCache.has(fileName)) {
        templateCache.set(
            fileName,
            fs.readFileSync(path.join(rootDir, fileName), 'utf8'),
        );
    }
    return templateCache.get(fileName);
}

function replaceCanonicalHref(html, id, href) {
    const v = escapeHtmlAttr(href);
    return html.replace(
        new RegExp(`(<link rel="canonical" id="${id}" href=")[^"]*(")`, 'i'),
        `$1${v}$2`,
    );
}

function replaceMetaDescription(html, id, value) {
    const v = escapeHtmlAttr(value);
    let next = html.replace(
        new RegExp(`(<meta name="description" content=")[^"]*(" id="${id}">)`, 'i'),
        `$1${v}$2`,
    );
    if (next === html) {
        next = html.replace(
            new RegExp(`(<meta name="description" id="${id}" content=")[^"]*(")`, 'i'),
            `$1${v}$2`,
        );
    }
    return next;
}

function replaceMetaPropertyContent(html, id, value) {
    const v = escapeHtmlAttr(value);
    return html.replace(
        new RegExp(`(<meta property="[^"]+" id="${id}" content=")[^"]*(")`, 'i'),
        `$1${v}$2`,
    );
}

function replaceTwitterMetaContent(html, id, value) {
    const v = escapeHtmlAttr(value);
    return html.replace(
        new RegExp(`(<meta name="twitter:[^"]+" id="${id}" content=")[^"]*(")`, 'i'),
        `$1${v}$2`,
    );
}

function injectDetailPageHtml(html, pageType, slug, siteOrigin) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg) return html;
    const base = String(siteOrigin || '').replace(/\/$/, '');
    const enc = encodeURIComponent(String(slug).trim());
    const canonical = `${base}/${cfg.pathSeg}/${enc}`;
    const h = humanizeSlug(slug);
    const title = cfg.titleTpl(h);
    const description = cfg.descTpl(h);
    const p = cfg.idPrefix;

    let out = html;
    out = replaceCanonicalHref(out, `${p}-canonical`, canonical);
    out = replaceMetaDescription(out, `${p}-meta-description`, description);
    out = replaceMetaPropertyContent(out, `${p}-og-title`, title);
    out = replaceMetaPropertyContent(out, `${p}-og-description`, description);
    out = replaceMetaPropertyContent(out, `${p}-og-url`, canonical);
    out = replaceTwitterMetaContent(out, `${p}-twitter-title`, title);
    out = replaceTwitterMetaContent(out, `${p}-twitter-description`, description);
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlText(title)}</title>`);
    return out;
}

function sendDetailPage(res, rootDir, pageType, slug, siteOrigin) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg) {
        res.status(500).send('Invalid page type');
        return;
    }
    const raw = readTemplate(rootDir, cfg.file);
    const html = injectDetailPageHtml(raw, pageType, slug, siteOrigin);
    res.type('html').send(html);
}

async function strapiFetchJson(pathAfterApi) {
    const base = process.env.STRAPI_API_URL;
    if (!base || !process.env.STRAPI_API_TOKEN) {
        return null;
    }
    const root = String(base).replace(/\/$/, '');
    const url = `${root}/api/${pathAfterApi}`;
    const timeout = getStrapiAxiosTimeoutMs();
    try {
        const response = await axios.get(url, {
            headers: { Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` },
            timeout,
            validateStatus: () => true,
        });
        if (response.status >= 400) {
            return null;
        }
        return response.data;
    } catch (e) {
        console.warn('[sitemap] Strapi fetch failed:', pathAfterApi, e.message);
        return null;
    }
}

function slugsFromStrapiData(data) {
    if (!data?.data || !Array.isArray(data.data)) {
        return [];
    }
    const out = [];
    for (const entry of data.data) {
        const a = entry.attributes || entry;
        const s = (a.Slug || a.slug || a.URLSlug || a.urlSlug || '').toString().trim();
        if (s) {
            out.push(s);
        }
    }
    return out;
}

async function fetchAllSlugsForEndpoint(endpoint) {
    const slugs = new Set();
    let page = 1;
    const pageSize = 100;
    let pageCount = 1;
    // Guides/news: only completed + published blog-posts in the sitemap.
    const blogPublishQs =
        endpoint === 'blog-posts'
            ? '&filters[workflowStatus][$eq]=completed&status=published'
            : '';

    do {
        const qs = `pagination[page]=${page}&pagination[pageSize]=${pageSize}${blogPublishQs}`;
        let data = await strapiFetchJson(`${endpoint}?${qs}`);
        // Strapi 4 may reject `status=published`; retry with workflow filter only.
        if (data == null && endpoint === 'blog-posts') {
            const qsFallback = `pagination[page]=${page}&pagination[pageSize]=${pageSize}&filters[workflowStatus][$eq]=completed`;
            data = await strapiFetchJson(`${endpoint}?${qsFallback}`);
        }
        if (!data?.data?.length) {
            break;
        }
        for (const s of slugsFromStrapiData(data)) {
            slugs.add(s);
        }
        const pg = data.meta?.pagination;
        pageCount = pg?.pageCount || 1;
        page += 1;
        if (page > 1000) {
            console.warn('[sitemap] pagination safety stop:', endpoint);
            break;
        }
    } while (page <= pageCount);

    return [...slugs];
}

const HUB_PATHS = [
    '/',
    '/reviews',
    '/bonus',
    '/slots',
    '/blackjack',
    '/roulette',
    '/baccarat',
    '/mobile',
    '/live',
    '/ewallet',
    '/guides',
    '/news',
    '/about',
    '/privacy',
    '/terms',
    '/contact',
    '/how-we-rate',
];

/**
 * @param {import('express').Request} req
 * @param {(s: string) => string} escapeXml
 * @param {(req: import('express').Request) => string} sitePublicOrigin
 * @returns {Promise<string[]>} lines like `  <url>...</url>`
 */
async function collectSitemapUrlLines(req, escapeXml, sitePublicOrigin) {
    const base = sitePublicOrigin(req);
    const lines = [];

    for (const p of HUB_PATHS) {
        const loc = `${base}${p === '/' ? '/' : p}`;
        const priority = p === '/' ? '1.0' : '0.8';
        lines.push(
            `  <url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`,
        );
    }

    if (!process.env.STRAPI_API_URL || !process.env.STRAPI_API_TOKEN) {
        return lines;
    }

    const detailDefs = [
        ['providers', '/provider/'],
        ['slots', '/slot/'],
        ['bonuses', '/bonus/'],
        ['blog-posts', '/guide/'],
    ];

    const slugResults = await Promise.all(
        detailDefs.map(async ([endpoint, prefix]) => {
            try {
                const slugs = await fetchAllSlugsForEndpoint(endpoint);
                return { prefix, slugs };
            } catch (e) {
                console.warn('[sitemap] skip endpoint', endpoint, e.message);
                return { prefix, slugs: [] };
            }
        }),
    );

    for (const { prefix, slugs } of slugResults) {
        for (const s of slugs) {
            const loc = `${base}${prefix}${encodeURIComponent(s)}`;
            lines.push(
                `  <url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`,
            );
        }
    }

    return lines;
}

module.exports = {
    sendDetailPage,
    injectDetailPageHtml,
    collectSitemapUrlLines,
};
