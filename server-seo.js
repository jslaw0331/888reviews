/**
 * Server-side SEO helpers: SSR meta/canonical for CMS detail routes,
 * Strapi slug validation (404 + noindex), and sitemap URL generation.
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getStrapiAxiosTimeoutMs } = require('./server-http-config');

const templateCache = new Map();

/** Wall-clock budget for sitemap Strapi pagination (stay under Vercel 60s). */
const SITEMAP_BUDGET_MS = 45000;
const SITEMAP_MAX_PAGES_PER_ENDPOINT = 25;
const SITEMAP_PAGE_SIZE = 100;

const ROBOTS_INDEX = 'index, follow, max-image-preview:large';
const ROBOTS_NOINDEX = 'noindex, follow';

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

function firstNonEmptyAttr(attr, keys) {
    if (!attr) return '';
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (typeof v === 'string' && v.trim()) return v.trim();
        if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    }
    return '';
}

function strapiEntryAttr(entry) {
    if (!entry) return null;
    if (entry.attributes == null) return { ...entry };
    const out = { ...entry.attributes };
    if (out.id == null && entry.id != null) out.id = entry.id;
    if (out.documentId == null && entry.documentId != null) out.documentId = entry.documentId;
    return out;
}

function strapiRelationToAttrList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw.map((item) => (item && item.attributes ? item.attributes : item)).filter(Boolean);
    }
    if (raw.data) {
        if (Array.isArray(raw.data)) {
            return raw.data.map((item) => strapiEntryAttr(item)).filter(Boolean);
        }
        const one = strapiEntryAttr(raw.data);
        return one ? [one] : [];
    }
    if (typeof raw === 'object') return [raw];
    return [];
}

function postCategorySlugForFilter(attr) {
    if (!attr) return '';
    const flat = firstNonEmptyAttr(attr, ['category', 'Category', 'postType', 'type']);
    if (flat) {
        const t = String(flat).trim().toLowerCase();
        if (t === 'guide' || t === 'strategy' || t === 'news') return t;
    }
    const relKeys = ['category', 'categories', 'postCategory', 'Category', 'post_categories', 'PostCategories'];
    for (const k of relKeys) {
        const raw = attr[k];
        if (raw == null) continue;
        for (const c of strapiRelationToAttrList(raw)) {
            const s = String(firstNonEmptyAttr(c, ['slug', 'Slug']) || '')
                .toLowerCase()
                .trim();
            if (s === 'guide' || s === 'strategy' || s === 'news') return s;
        }
    }
    return '';
}

function mediaFieldUrl(field) {
    if (!field) return '';
    if (typeof field === 'string' && field.trim()) return field.trim();
    const data = field.data || field;
    const node = Array.isArray(data) ? data[0] : data;
    if (!node) return '';
    const a = node.attributes || node;
    const u = a.url || a.URL || '';
    return u ? String(u).trim() : '';
}

function absoluteMediaUrl(rawUrl, siteOrigin) {
    const u = String(rawUrl || '').trim();
    if (!u) return '';
    if (/^https?:\/\//i.test(u)) return u;
    const strapiBase = String(process.env.STRAPI_PUBLIC_URL || process.env.STRAPI_API_URL || '')
        .replace(/\/$/, '')
        .replace(/\/api$/, '');
    const site = String(siteOrigin || '').replace(/\/$/, '');
    if (u.startsWith('/')) {
        if (u.startsWith('/uploads/') && strapiBase) return `${strapiBase}${u}`;
        if (site) return `${site}${u}`;
    }
    if (strapiBase) return `${strapiBase}/${u.replace(/^\//, '')}`;
    return u;
}

function coverImageFromAttr(attr) {
    const keys = [
        'CoverImage',
        'coverImage',
        'featuredImage',
        'FeaturedImage',
        'Image',
        'image',
        'thumbnail',
        'Thumbnail',
        'Hero',
        'hero',
        'Logo',
        'logo',
    ];
    for (const k of keys) {
        const u = mediaFieldUrl(attr[k]);
        if (u) return u;
    }
    return '';
}

const PAGE_CONFIG = {
    provider: {
        file: 'provider.html',
        pathSeg: 'provider',
        idPrefix: 'pv',
        endpoint: 'providers',
        notFoundTitle: 'Provider not found | 888reviews',
        titleTpl: (h) => `${h} | Software provider | 888reviews`,
        descTpl: (h) =>
            `Provider dossier on 888reviews: game portfolio, standout titles, and editorial notes on ${h}.`,
    },
    slot: {
        file: 'slot.html',
        pathSeg: 'slot',
        idPrefix: 'sv',
        endpoint: 'slots',
        notFoundTitle: 'Slot not found | 888reviews',
        titleTpl: (h) => `${h} | Slot review | 888reviews`,
        descTpl: (h) =>
            `Slot review on 888reviews: features, volatility context, RTP notes, and where to play ${h}. 18+ only.`,
    },
    bonus: {
        file: 'bonus.html',
        pathSeg: 'bonus',
        idPrefix: 'bd',
        endpoint: 'bonuses',
        notFoundTitle: 'Bonus not found | 888reviews',
        titleTpl: (h) => `${h} | Casino bonus | 888reviews`,
        descTpl: (h) =>
            `Casino bonus breakdown on 888reviews: headline value, wagering context, and eligibility notes for ${h}. 18+ only.`,
    },
    guide: {
        file: 'post.html',
        pathSeg: 'guide',
        idPrefix: 'gp',
        endpoint: 'blog-posts',
        allowedCategories: ['guide', 'strategy'],
        notFoundTitle: 'Guide not found | 888reviews',
        titleTpl: (h) => `${h} | Guide | 888reviews`,
        descTpl: (h) =>
            `Editorial guide on 888reviews: expert notes and practical takeaways — ${h}. 18+ only. Play responsibly.`,
    },
    news: {
        file: 'post.html',
        pathSeg: 'news',
        idPrefix: 'gp',
        endpoint: 'blog-posts',
        allowedCategories: ['news'],
        notFoundTitle: 'Article not found | 888reviews',
        titleTpl: (h) => `${h} | News | 888reviews`,
        descTpl: (h) =>
            `Latest news on 888reviews: industry updates and editorial coverage — ${h}. 18+ only. Play responsibly.`,
    },
    casino: {
        file: 'casino.html',
        pathSeg: 'casino',
        idPrefix: 'cr',
        endpoint: 'casinos',
        notFoundTitle: 'Casino review not found | 888reviews',
        titleTpl: (h) => `${h} Review | 888reviews`,
        descTpl: (h) =>
            `Independent ${h} review for Malaysian players: licensing, bonuses, payments, games, and editorial rating. 18+ only.`,
    },
};

function readTemplate(rootDir, fileName) {
    if (!templateCache.has(fileName)) {
        templateCache.set(fileName, fs.readFileSync(path.join(rootDir, fileName), 'utf8'));
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

function replaceMetaRobots(html, value) {
    const v = escapeHtmlAttr(value);
    return html.replace(
        /(<meta name="robots" content=")[^"]*(")/i,
        `$1${v}$2`,
    );
}

function replaceMetaPropertyContent(html, id, value) {
    const v = escapeHtmlAttr(value);
    return html.replace(
        new RegExp(`(<meta property="[^"]+" id="${id}" content=")[^"]*(")`, 'i'),
        `$1${v}$2`,
    );
}

function replaceMetaPropertyContentNoId(html, property, value) {
    const v = escapeHtmlAttr(value);
    return html.replace(
        new RegExp(`(<meta property="${property}" content=")[^"]*(")`, 'i'),
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

function buildSeoFromAttr(pageType, attr, slug, siteOrigin) {
    const cfg = PAGE_CONFIG[pageType];
    const base = String(siteOrigin || '').replace(/\/$/, '');
    const enc = encodeURIComponent(String(slug).trim());
    const canonical = `${base}/${cfg.pathSeg}/${enc}`;
    const h = humanizeSlug(slug);

    if (!attr) {
        return {
            title: cfg.titleTpl(h),
            description: cfg.descTpl(h),
            canonical,
            image: '',
        };
    }

    let title = cfg.titleTpl(h);
    let description = cfg.descTpl(h);

    if (pageType === 'guide' || pageType === 'news') {
        const postTitle = firstNonEmptyAttr(attr, ['title', 'Title', 'name', 'Name']) || h;
        const seoTitle = firstNonEmptyAttr(attr, ['seoTitle', 'SeoTitle']);
        const seoDesc = firstNonEmptyAttr(attr, ['seoDescription', 'SeoDescription']);
        title = seoTitle ? `${seoTitle} | 888reviews` : cfg.titleTpl(postTitle);
        description =
            seoDesc ||
            firstNonEmptyAttr(attr, ['excerpt', 'Excerpt', 'dek', 'Dek']) ||
            description;
    } else if (pageType === 'casino') {
        const name = firstNonEmptyAttr(attr, ['Name', 'name']) || h;
        const seoTitle = firstNonEmptyAttr(attr, ['SEOTitle', 'seoTitle']);
        const seoDesc = firstNonEmptyAttr(attr, ['SEODescription', 'seoDescription']);
        title = seoTitle || `${name} Review | 888reviews`;
        description = seoDesc || cfg.descTpl(name);
    } else {
        const seoTitle = firstNonEmptyAttr(attr, ['SEOTitle', 'seoTitle']);
        const seoDesc = firstNonEmptyAttr(attr, ['SEODescription', 'seoDescription']);
        const name =
            firstNonEmptyAttr(attr, ['Name', 'name', 'Title', 'title']) || h;
        if (seoTitle) title = seoTitle.includes('888reviews') ? seoTitle : `${seoTitle} | 888reviews`;
        else if (pageType === 'provider') title = `${name} | Software provider | 888reviews`;
        else if (pageType === 'slot') title = `${name} | Slot review | 888reviews`;
        else if (pageType === 'bonus') title = `${name} | Casino bonus | 888reviews`;
        if (seoDesc) description = seoDesc;
        else {
            const excerpt = firstNonEmptyAttr(attr, ['Excerpt', 'excerpt', 'Description', 'ShortDescription']);
            if (excerpt) description = String(excerpt).slice(0, 320);
        }
    }

    const rawCanon = firstNonEmptyAttr(attr, ['CanonicalURL', 'canonicalURL', 'canonicalUrl']);
    const finalCanonical =
        rawCanon && /^https?:\/\//i.test(rawCanon) ? rawCanon : canonical;

    const rawImage = coverImageFromAttr(attr);
    const image = absoluteMediaUrl(rawImage, siteOrigin);

    return {
        title: String(title).slice(0, 120),
        description: String(description).slice(0, 320),
        canonical: finalCanonical,
        image,
    };
}

function injectDetailPageHtml(html, pageType, slug, siteOrigin, seoMeta, options = {}) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg) return html;
    const p = cfg.idPrefix;
    let meta = seoMeta;
    if (!meta) {
        if (options.notFound) {
            const base = String(siteOrigin || '').replace(/\/$/, '');
            const enc = encodeURIComponent(String(slug).trim());
            meta = {
                title: cfg.notFoundTitle,
                description: 'This page is not available on 888reviews.',
                canonical: `${base}/${cfg.pathSeg}/${enc}`,
                image: '',
            };
        } else {
            meta = buildSeoFromAttr(pageType, null, slug, siteOrigin);
        }
    }
    const robots = options.notFound ? ROBOTS_NOINDEX : ROBOTS_INDEX;
    const defaultImage = `${String(siteOrigin || '').replace(/\/$/, '')}/assets/img/888review-siteicon.webp`;
    const ogImage = meta.image || defaultImage;

    let out = html;
    out = replaceMetaRobots(out, robots);
    out = replaceCanonicalHref(out, `${p}-canonical`, meta.canonical);
    out = replaceMetaDescription(out, `${p}-meta-description`, meta.description);
    out = replaceMetaPropertyContent(out, `${p}-og-title`, meta.title);
    out = replaceMetaPropertyContent(out, `${p}-og-description`, meta.description);
    out = replaceMetaPropertyContent(out, `${p}-og-url`, meta.canonical);
    out = replaceMetaPropertyContent(out, `${p}-og-image`, ogImage);
    out = replaceTwitterMetaContent(out, `${p}-twitter-title`, meta.title);
    out = replaceTwitterMetaContent(out, `${p}-twitter-description`, meta.description);
    out = replaceTwitterMetaContent(out, `${p}-twitter-image`, ogImage);
    if (!html.includes('og:locale')) {
        out = out.replace(/<\/head>/i, '    <meta property="og:locale" content="en_US">\n</head>');
    } else {
        out = replaceMetaPropertyContentNoId(out, 'og:locale', 'en_US');
    }
    const pageTitle = options.notFound ? cfg.notFoundTitle : meta.title;
    out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtmlText(pageTitle)}</title>`);
    return out;
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
        console.warn('[seo] Strapi fetch failed:', pathAfterApi, e.message);
        return null;
    }
}

function slugFilterVariants(slug) {
    const raw = decodeURIComponent(String(slug)).trim();
    return [
        `filters[Slug][$eqi]=${encodeURIComponent(raw)}`,
        `filters[Slug][$eq]=${encodeURIComponent(raw)}`,
        `filters[slug][$eqi]=${encodeURIComponent(raw)}`,
        `filters[slug][$eq]=${encodeURIComponent(raw)}`,
    ];
}

function entryMatchesPageType(pageType, attr) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg?.allowedCategories) return true;
    const cat = postCategorySlugForFilter(attr);
    return cfg.allowedCategories.includes(cat);
}

/**
 * Fetch a single CMS entry by slug for detail-page SSR validation.
 */
async function fetchEntryBySlug(pageType, slug) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg?.endpoint) return null;
    const publishQs =
        cfg.endpoint === 'blog-posts'
            ? '&filters[workflowStatus][$eq]=completed&status=published'
            : '';
    const pop = `populate=*&pagination[limit]=1${publishQs}`;

    for (const filter of slugFilterVariants(slug)) {
        let data = await strapiFetchJson(`${cfg.endpoint}?${filter}&${pop}`);
        if (data == null && cfg.endpoint === 'blog-posts') {
            const fallbackPop = pop.replace(/&?status=published/, '').replace(/^&/, '');
            data = await strapiFetchJson(`${cfg.endpoint}?${filter}&${fallbackPop}`);
        }
        if (!data?.data?.length) continue;
        const attr = strapiEntryAttr(data.data[0]);
        if (!attr) continue;
        if (!entryMatchesPageType(pageType, attr)) continue;
        return attr;
    }
    return null;
}

async function sendDetailPage(res, rootDir, pageType, slug, siteOrigin) {
    const cfg = PAGE_CONFIG[pageType];
    if (!cfg) {
        res.status(500).send('Invalid page type');
        return;
    }
    try {
        const raw = readTemplate(rootDir, cfg.file);
        let attr = null;
        if (process.env.STRAPI_API_URL && process.env.STRAPI_API_TOKEN) {
            attr = await fetchEntryBySlug(pageType, slug);
        }
        if (!attr) {
            const html = injectDetailPageHtml(raw, pageType, slug, siteOrigin, null, { notFound: true });
            res.status(404).type('html').send(html);
            return;
        }
        const seoMeta = buildSeoFromAttr(pageType, attr, slug, siteOrigin);
        const html = injectDetailPageHtml(raw, pageType, slug, siteOrigin, seoMeta);
        res.type('html').send(html);
    } catch (e) {
        console.error('[sendDetailPage]', pageType, slug, e.message);
        res.status(500).send('Page unavailable');
    }
}

function slugValueFromAttr(attr) {
    return (attr.Slug || attr.slug || attr.URLSlug || attr.urlSlug || '').toString().trim();
}

function lastmodFromAttr(attr) {
    const t = attr.updatedAt || attr.updated_at || attr.publishedAt || attr.published_at;
    if (!t) return '';
    try {
        const d = new Date(t);
        if (Number.isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    } catch {
        return '';
    }
}

function sitemapUrlLine(escapeXml, loc, priority, lastmod) {
    const lastmodTag = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : '';
    return `  <url><loc>${escapeXml(loc)}</loc>${lastmodTag}<changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
}

function entriesFromStrapiData(data) {
    if (!data?.data || !Array.isArray(data.data)) return [];
    const out = [];
    for (const entry of data.data) {
        const a = strapiEntryAttr(entry);
        const s = slugValueFromAttr(a);
        if (s) out.push({ slug: s, lastmod: lastmodFromAttr(a), attr: a });
    }
    return out;
}

async function fetchSitemapEntriesForEndpoint(endpoint, extraQs, deadline) {
    const entries = [];
    let page = 1;
    let pageCount = 1;
    const blogPublishQs =
        endpoint === 'blog-posts'
            ? '&filters[workflowStatus][$eq]=completed&status=published'
            : extraQs || '';

    do {
        if (Date.now() >= deadline) {
            console.warn('[sitemap] budget exceeded, stopping:', endpoint);
            break;
        }
        const qs = `pagination[page]=${page}&pagination[pageSize]=${SITEMAP_PAGE_SIZE}${blogPublishQs}`;
        let data = await strapiFetchJson(`${endpoint}?${qs}`);
        if (data == null && endpoint === 'blog-posts') {
            const qsFallback = `pagination[page]=${page}&pagination[pageSize]=${SITEMAP_PAGE_SIZE}&filters[workflowStatus][$eq]=completed${extraQs || ''}`;
            data = await strapiFetchJson(`${endpoint}?${qsFallback}`);
        }
        if (!data?.data?.length) break;
        for (const row of entriesFromStrapiData(data)) {
            entries.push(row);
        }
        const pg = data.meta?.pagination;
        pageCount = pg?.pageCount || 1;
        page += 1;
        if (page > SITEMAP_MAX_PAGES_PER_ENDPOINT) {
            console.warn('[sitemap] page cap reached:', endpoint);
            break;
        }
    } while (page <= pageCount);

    return entries;
}

function splitBlogPostEntries(entries) {
    const guides = [];
    const news = [];
    for (const row of entries) {
        const cat = postCategorySlugForFilter(row.attr);
        if (cat === 'news') news.push(row);
        else if (cat === 'guide' || cat === 'strategy') guides.push(row);
    }
    return { guides, news };
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
 * @returns {Promise<string[]>}
 */
async function collectSitemapUrlLines(req, escapeXml, sitePublicOrigin) {
    const base = sitePublicOrigin(req);
    const lines = [];

    for (const p of HUB_PATHS) {
        const loc = `${base}${p === '/' ? '/' : p}`;
        const priority = p === '/' ? '1.0' : '0.8';
        lines.push(sitemapUrlLine(escapeXml, loc, priority, ''));
    }

    if (!process.env.STRAPI_API_URL || !process.env.STRAPI_API_TOKEN) {
        return lines;
    }

    const deadline = Date.now() + SITEMAP_BUDGET_MS;

    const [providers, slots, bonuses, casinos, blogPosts] = await Promise.all([
        fetchSitemapEntriesForEndpoint('providers', '', deadline).catch(() => []),
        fetchSitemapEntriesForEndpoint('slots', '', deadline).catch(() => []),
        fetchSitemapEntriesForEndpoint('bonuses', '', deadline).catch(() => []),
        fetchSitemapEntriesForEndpoint('casinos', '', deadline).catch(() => []),
        fetchSitemapEntriesForEndpoint('blog-posts', '', deadline).catch(() => []),
    ]);

    const { guides, news } = splitBlogPostEntries(blogPosts);

    const detailGroups = [
        ['/provider/', providers],
        ['/slot/', slots],
        ['/bonus/', bonuses],
        ['/casino/', casinos],
        ['/guide/', guides],
        ['/news/', news],
    ];

    for (const [prefix, rows] of detailGroups) {
        for (const row of rows) {
            const loc = `${base}${prefix}${encodeURIComponent(row.slug)}`;
            lines.push(sitemapUrlLine(escapeXml, loc, '0.7', row.lastmod));
        }
    }

    return lines;
}

module.exports = {
    sendDetailPage,
    injectDetailPageHtml,
    collectSitemapUrlLines,
    fetchEntryBySlug,
    buildSeoFromAttr,
    PAGE_CONFIG,
};
