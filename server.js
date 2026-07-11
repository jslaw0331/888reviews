const path = require('path');
/** override: true — stale shell/IDE STRAPI_* vars must not block .env (fixes local 401 proxy). */
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const serverSeo = require('./server-seo');
const { restoreVercelUrlMiddleware } = require('./server-vercel-url');
const {
    getStrapiAxiosTimeoutMs,
    API_PROXY_CACHE_CONTROL,
    API_CONFIG_CACHE_CONTROL,
    SITEMAP_CACHE_CONTROL,
} = require('./server-http-config');

const app = express();
if (process.env.VERCEL) {
    app.use(restoreVercelUrlMiddleware);
}
const STRAPI_HTTP_MS = getStrapiAxiosTimeoutMs();
const PORT = process.env.PORT || 3000;

/**
 * Public site origin for sitemap/robots. Set SITE_PUBLIC_URL in production (e.g. https://yoursite.com).
 * Falls back to request host so local `npm start` still emits valid absolute sitemap URLs.
 */
function sitePublicOrigin(req) {
    const env = process.env.SITE_PUBLIC_URL;
    if (env && String(env).trim()) {
        return String(env).replace(/\/$/, '');
    }
    if (process.env.NODE_ENV === 'production') {
        return 'https://888reviews.com';
    }
    const rawProto = req.get('x-forwarded-proto') || req.protocol || 'http';
    const proto = String(rawProto).split(',')[0].trim();
    const host = req.get('host') || `localhost:${PORT}`;
    return `${proto}://${host}`;
}

function escapeXml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** SEO: allow crawlers; block API proxy. Sitemap uses SITE_PUBLIC_URL or incoming Host. */
app.get('/robots.txt', (req, res) => {
    const base = sitePublicOrigin(req);
    res.type('text/plain');
    res.send(
        [
            'User-agent: *',
            'Allow: /',
            '',
            'Disallow: /api/',
            '',
            `Sitemap: ${base}/sitemap.xml`,
            '',
        ].join('\n'),
    );
});

/**
 * SEO: hub URLs + CMS detail URLs when STRAPI_API_URL and STRAPI_API_TOKEN are set.
 * Falls back to hub-only lines if Strapi pagination fails.
 */
app.get('/sitemap.xml', async (req, res) => {
    try {
        const lines = await serverSeo.collectSitemapUrlLines(req, escapeXml, sitePublicOrigin);
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join(
            '\n',
        )}\n</urlset>\n`;
        res.setHeader('Cache-Control', SITEMAP_CACHE_CONTROL);
        res.type('application/xml');
        res.send(body);
    } catch (e) {
        console.error('[sitemap]', e);
        const base = sitePublicOrigin(req);
        const hubPaths = [
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
        const lines = hubPaths.map((p) => {
            const loc = `${base}${p === '/' ? '/' : p}`;
            const priority = p === '/' ? '1.0' : '0.8';
            return `  <url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
        });
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join(
            '\n',
        )}\n</urlset>\n`;
        res.setHeader('Cache-Control', SITEMAP_CACHE_CONTROL);
        res.type('application/xml').send(body);
    }
});

/**
 * Root HTML pages (only these are served; avoids exposing .env, package.json, etc.).
 * Public URLs omit `.html` (e.g. `/bonus`); `/bonus.html` with slug → `/bonus/:slug`.
 */
const ROOT_HTML = [
    'index.html',
    'reviews.html',
    'slots.html',
    'guides.html',
    'news.html',
    'about.html',
    'privacy.html',
    'terms.html',
    'contact.html',
    'how-we-rate.html',
];

/**
 * Browser CORS for `/api/*` etc. Gates who may call this Express proxy from another origin.
 * Optional env: CORS_ORIGINS=https://a.com,https://b.com (comma-separated exact origins only).
 */
function defaultCorsMatchers() {
    return [
        'https://888reviews.com',
        'https://www.888reviews.com',
        'https://888reviews.vercel.app',
        /^http:\/\/localhost(?::\d+)?$/,
        /^http:\/\/127\.0\.0\.1(?::\d+)?$/,
        /^https:\/\/888reviews-[a-z0-9-]+\.vercel\.app$/i,
        /^https:\/\/[a-z0-9-]+-888reviews\.vercel\.app$/i,
    ];
}

function corsMatchersFromEnv() {
    const raw = process.env.CORS_ORIGINS;
    if (!raw || !String(raw).trim()) return null;
    return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function isOriginAllowedForCors(origin) {
    if (!origin) return true;
    const explicit = corsMatchersFromEnv();
    const matchers = explicit && explicit.length > 0 ? explicit : defaultCorsMatchers();
    return matchers.some((m) => (typeof m === 'string' ? m === origin : m.test(origin)));
}

app.use(
    cors({
        origin(origin, callback) {
            if (isOriginAllowedForCors(origin)) {
                callback(null, true);
            } else {
                callback(null, false);
            }
        },
        methods: ['GET', 'HEAD', 'OPTIONS'],
    }),
);
app.use(express.json());

/**
 * Legacy `/bonus.html?slug=` → 301 to `/bonus/:slug`.
 * Bare `/bonus.html` → redirect to bonus hub (pretty URLs use `/bonus/:slug` for detail pages).
 */
app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path !== '/bonus.html') {
        next();
        return;
    }
    const slug = req.query && req.query.slug;
    if (slug && String(slug).trim()) {
        res.redirect(301, `/bonus/${encodeURIComponent(String(slug).trim())}`);
        return;
    }
    res.redirect(302, '/bonus');
});

/** Legacy WordPress-style provider hub → slots directory. */
app.get('/casino-gaming-provider', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/casino-gaming-provider/', (req, res) => {
    res.redirect(301, '/slots');
});

/** Legacy WordPress slot hub (`/casino-slots-game/`) → pretty URL. */
app.get('/casino-slots-game', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/casino-slots-game/', (req, res) => {
    res.redirect(301, '/slots');
});

/**
 * Strapi media URLs are usually relative (/uploads/...). The browser resolves them against this app
 * (e.g. localhost:3000), not Strapi. Without this, logos and images 404.
 */
app.get(/^\/uploads\/.+/, async (req, res) => {
    if (req.path.includes('..')) {
        res.status(400).end();
        return;
    }
    const base = process.env.STRAPI_API_URL;
    if (!base) {
        res.status(503).send('Content is temporarily unavailable.');
        return;
    }
    const targetUrl = `${base.replace(/\/$/, '')}${req.path}`;
    try {
        const tryStream = (headers) =>
            axios.get(targetUrl, {
                responseType: 'stream',
                timeout: STRAPI_HTTP_MS,
                validateStatus: () => true,
                headers,
            });
        let response = await tryStream({});
        if (
            (response.status === 401 || response.status === 403) &&
            process.env.STRAPI_API_TOKEN
        ) {
            response = await tryStream({ Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}` });
        }
        if (response.status >= 400) {
            res.status(response.status).end();
            return;
        }
        const ct = response.headers['content-type'];
        if (ct) res.setHeader('Content-Type', ct);
        const cc = response.headers['cache-control'];
        if (cc) res.setHeader('Cache-Control', cc);
        response.data.pipe(res);
    } catch (error) {
        console.error('Upload proxy:', error.message);
        res.status(502).end();
    }
});

/** Public Strapi base URL for resolving /uploads/... in the browser (no secrets). Must be before /api/:endpoint. */
app.get('/api/config', (req, res) => {
    res.setHeader('Cache-Control', API_CONFIG_CACHE_CONTROL);
    res.json({
        strapiPublicUrl: (process.env.STRAPI_API_URL || '').replace(/\/$/, ''),
    });
});

/** Allowlist for /api/media-proxy: external Strapi media (R2, etc.) that blocks hotlinking in the browser. */
function isAllowedMediaProxyUrl(urlStr) {
    try {
        const u = new URL(urlStr);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        const h = u.hostname.toLowerCase();
        if (h.endsWith('.r2.dev') || h.endsWith('.r2.cloudflarestorage.com')) return true;
        const strapiBase = process.env.STRAPI_API_URL;
        if (strapiBase) {
            const sh = new URL(strapiBase).hostname.toLowerCase();
            if (h === sh) return true;
        }
        if (h.includes('amazonaws.com') || h.includes('cloudfront.net')) return true;
        return false;
    } catch {
        return false;
    }
}

/**
 * Same-origin image proxy so <img> loads R2/CDN assets without referrer / hotlink blocks.
 * Query: ?url=https%3A%2F%2F...
 */
app.get('/api/media-proxy', async (req, res) => {
    const raw = req.query.url;
    if (!raw || typeof raw !== 'string') {
        res.status(400).json({ error: 'Missing url' });
        return;
    }
    let targetUrl;
    try {
        targetUrl = decodeURIComponent(raw.trim());
    } catch {
        res.status(400).end();
        return;
    }
    if (!isAllowedMediaProxyUrl(targetUrl)) {
        res.status(403).json({ error: 'URL not allowed for proxy' });
        return;
    }
    try {
        const response = await axios.get(targetUrl, {
            responseType: 'stream',
            timeout: STRAPI_HTTP_MS,
            validateStatus: () => true,
            headers: {
                'User-Agent': '888reviews-media-proxy/1.0',
                Accept: 'image/*,*/*;q=0.8',
            },
        });
        if (response.status >= 400) {
            res.status(response.status).end();
            return;
        }
        const ct = response.headers['content-type'];
        if (ct) res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.data.pipe(res);
    } catch (error) {
        console.error('[media-proxy]', error.message);
        res.status(502).end();
    }
});

// Universal Proxy Route
// Takes any request to /api/... and forwards it to Strapi with the secure token
app.get('/api/:endpoint', async (req, res) => {
    try {
        let { endpoint } = req.params;
        /** Strapi REST uses plural collection URLs; singular `/api/review` does not exist (404). */
        if (endpoint === 'review') {
            endpoint = 'reviews';
        }

        // Grab any query parameters (like ?populate=*) from the incoming request
        const queryParams = req.url.split('?')[1] || '';

        // Build the literal target URL to your secure Strapi server
        if (!process.env.STRAPI_API_URL || !process.env.STRAPI_API_TOKEN) {
            res.status(503).json({
                error: 'Content is temporarily unavailable. Please check back later.',
            });
            return;
        }

        const targetUrl = `${process.env.STRAPI_API_URL}/api/${endpoint}?${queryParams}`;

        // Make the server-side request (This hides the token from the browser completely!)
        // Timeout required on serverless: default axios has no limit and can spin forever, so the page fetch never completes.
        const response = await axios.get(targetUrl, {
            headers: {
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
            },
            timeout: STRAPI_HTTP_MS,
        });

        res.setHeader('Cache-Control', API_PROXY_CACHE_CONTROL);
        // Send the Strapi data back to your local vanilla HTML frontend
        res.json(response.data);

    } catch (error) {
        const isTimeout = error.code === 'ECONNABORTED' || /timeout/i.test(String(error.message || ''));
        if (isTimeout) {
            console.error(`[Strapi proxy] timeout /api/${req.params.endpoint}`);
            res.status(504).json({
                error: 'Content is temporarily unavailable. Please check back later.',
            });
            return;
        }
        const st = error.response?.status;
        if (st === 400 || st === 404) {
            console.warn(
                `[Strapi proxy] ${st} /api/${req.params.endpoint}: bad query (e.g. invalid populate) or missing collection. Strapi message:`,
                error.response?.data?.error?.message || error.message,
            );
        } else {
            console.error('Error fetching from Strapi proxy:', error.message);
        }
        res.status(st || 500).json({
            error: 'Content is temporarily unavailable. Please check back later.',
        });
    }
});

// Static site: same origin as /api so one `npm start` serves pages + proxy.
// On Vercel, express.static is ignored — files must live in public/ for CDN serving.
const PUBLIC_DIR = path.join(__dirname, 'public');
const ASSETS_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
app.use(
    '/assets',
    express.static(path.join(PUBLIC_DIR, 'assets'), { maxAge: ASSETS_MAX_AGE_MS }),
);
app.use(
    '/components',
    express.static(path.join(PUBLIC_DIR, 'components'), {
        maxAge: 3600 * 1000,
        setHeaders: (res) => {
            res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        },
    }),
);

/** Legacy casino review URLs → reviews directory. */
app.get('/casino/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.redirect(301, '/reviews');
});

app.get('/review.html', (req, res) => {
    res.redirect(301, '/reviews');
});

app.get('/provider/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    serverSeo.sendDetailPage(res, PUBLIC_DIR, 'provider', raw, sitePublicOrigin(req));
});

app.get('/slot/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    serverSeo.sendDetailPage(res, PUBLIC_DIR, 'slot', raw, sitePublicOrigin(req));
});

app.get('/bonus/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    serverSeo.sendDetailPage(res, PUBLIC_DIR, 'bonus', raw, sitePublicOrigin(req));
});

/** Guide / strategy article (Strapi `blog-posts`); legacy `post.html?slug=` → `/guide/:slug`. */
app.get('/guide/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    serverSeo.sendDetailPage(res, PUBLIC_DIR, 'guide', raw, sitePublicOrigin(req));
});

/** News article (Strapi `blog-posts`, category news). */
app.get('/news/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    serverSeo.sendDetailPage(res, PUBLIC_DIR, 'news', raw, sitePublicOrigin(req));
});

app.get('/post.html', (req, res) => {
    const slug = req.query && req.query.slug;
    if (slug && String(slug).trim()) {
        res.redirect(301, `/guide/${encodeURIComponent(String(slug).trim())}`);
        return;
    }
    res.redirect(302, '/guides');
});

app.get('/provider.html', (req, res) => {
    const slug = req.query.slug;
    if (slug) {
        res.redirect(301, `/provider/${encodeURIComponent(String(slug))}`);
        return;
    }
    res.sendFile(path.join(PUBLIC_DIR, 'provider.html'));
});

app.get('/slot.html', (req, res) => {
    const slug = req.query.slug;
    if (slug) {
        res.redirect(301, `/slot/${encodeURIComponent(String(slug))}`);
        return;
    }
    res.sendFile(path.join(PUBLIC_DIR, 'slot.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.redirect(301, '/');
});

/** Malaysia hub sub-pages and legacy canonical paths used in site navigation. */
const MALAYSIA_NAV_ROUTES = {
    '/mobile': 'mobile.html',
    '/blackjack': 'games-blackjack.html',
    '/roulette': 'games-roulette.html',
    '/baccarat': 'games-baccarat.html',
    '/bonus': 'bonus-hub.html',
    '/live': 'live-casino.html',
};

Object.entries(MALAYSIA_NAV_ROUTES).forEach(([route, file]) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(PUBLIC_DIR, file));
    });
    app.get(`${route}/`, (req, res) => {
        res.redirect(301, route);
    });
});

/** Canonical blackjack hub — legacy /games/blackjack → /blackjack */
app.get('/games/blackjack', (req, res) => {
    res.redirect(301, '/blackjack');
});
app.get('/games/blackjack/', (req, res) => {
    res.redirect(301, '/blackjack');
});

/** Canonical roulette hub — legacy /games/roulette → /roulette */
app.get('/games/roulette', (req, res) => {
    res.redirect(301, '/roulette');
});
app.get('/games/roulette/', (req, res) => {
    res.redirect(301, '/roulette');
});

/** Canonical baccarat hub — legacy /games/baccarat → /baccarat */
app.get('/games/baccarat', (req, res) => {
    res.redirect(301, '/baccarat');
});
app.get('/games/baccarat/', (req, res) => {
    res.redirect(301, '/baccarat');
});

app.get('/providers', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/providers/', (req, res) => {
    res.redirect(301, '/slots');
});

app.get('/live-casino', (req, res) => {
    res.redirect(301, '/live');
});
app.get('/live-casino/', (req, res) => {
    res.redirect(301, '/live');
});

/** Legacy mobile sub-hubs → single Malaysia mobile guide. */
app.get('/mobile/ios', (req, res) => {
    res.redirect(301, '/mobile');
});
app.get('/mobile/ios/', (req, res) => {
    res.redirect(301, '/mobile');
});
app.get('/mobile/android', (req, res) => {
    res.redirect(301, '/mobile');
});
app.get('/mobile/android/', (req, res) => {
    res.redirect(301, '/mobile');
});

/** Legacy bonuses directory → Malaysia bonus hub. */
app.get('/bonuses', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/welcome', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/welcome/', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/free-spins', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/free-spins/', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/no-deposit', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses/no-deposit/', (req, res) => {
    res.redirect(301, '/bonus');
});
app.get('/bonuses.html', (req, res) => {
    res.redirect(301, '/bonus');
});

app.get('/games/live-casino', (req, res) => {
    res.redirect(301, '/live');
});
app.get('/games/live-casino/', (req, res) => {
    res.redirect(301, '/live');
});

/** Legacy games hub and sub-pages → current nav routes. */
app.get('/games', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/games/', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/games/live-baccarat', (req, res) => {
    res.redirect(301, '/baccarat');
});
app.get('/games/live-baccarat/', (req, res) => {
    res.redirect(301, '/baccarat');
});
app.get('/games/live-blackjack', (req, res) => {
    res.redirect(301, '/blackjack');
});
app.get('/games/live-blackjack/', (req, res) => {
    res.redirect(301, '/blackjack');
});
app.get('/games/live-roulette', (req, res) => {
    res.redirect(301, '/roulette');
});
app.get('/games/live-roulette/', (req, res) => {
    res.redirect(301, '/roulette');
});
app.get('/games/poker', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/games/poker/', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/games/bingo', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/games/bingo/', (req, res) => {
    res.redirect(301, '/reviews');
});

/** Legacy real-money hubs → game guides or reviews directory. */
app.get('/real-money', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/real-money/', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/real-money/slots', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/real-money/slots/', (req, res) => {
    res.redirect(301, '/slots');
});
app.get('/real-money/blackjack', (req, res) => {
    res.redirect(301, '/blackjack');
});
app.get('/real-money/blackjack/', (req, res) => {
    res.redirect(301, '/blackjack');
});
app.get('/real-money/roulette', (req, res) => {
    res.redirect(301, '/roulette');
});
app.get('/real-money/roulette/', (req, res) => {
    res.redirect(301, '/roulette');
});
app.get('/real-money/poker', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/real-money/poker/', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/real-money/bingo', (req, res) => {
    res.redirect(301, '/reviews');
});
app.get('/real-money/bingo/', (req, res) => {
    res.redirect(301, '/reviews');
});

/** Legacy payments hubs → e-wallet guide (header nav). */
app.get('/payments', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/skrill', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/skrill/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/neteller', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/neteller/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/touch-n-go', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/touch-n-go/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/bank-transfer', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/bank-transfer/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/visa', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/visa/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/crypto', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/payments/crypto/', (req, res) => {
    res.redirect(301, '/ewallet');
});

/** Malaysia market hub lives at `/`; legacy `/malaysia` URLs redirect. */
app.get('/ewallet', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'malaysia-ewallet.html'));
});
app.get('/touch-n-go', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/touch-n-go/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/malaysia', (req, res) => {
    res.redirect(301, '/');
});
app.get('/malaysia/', (req, res) => {
    res.redirect(301, '/');
});
app.get('/malaysia/ewallet', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/malaysia/ewallet/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/malaysia/touch-n-go', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/malaysia/touch-n-go/', (req, res) => {
    res.redirect(301, '/ewallet');
});

/** Legacy Malaysia hub URLs → current routes. */
app.get('/casinos/malaysia', (req, res) => {
    res.redirect(301, '/');
});
app.get('/casinos/malaysia/', (req, res) => {
    res.redirect(301, '/');
});
app.get('/casinos/malaysia/ewallet', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/casinos/malaysia/ewallet/', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/casinos/malaysia/touch-n-go', (req, res) => {
    res.redirect(301, '/ewallet');
});
app.get('/casinos/malaysia/touch-n-go/', (req, res) => {
    res.redirect(301, '/ewallet');
});

app.get(['/casinos', '/casinos/'], (req, res) => {
    res.redirect(301, '/reviews');
});

ROOT_HTML.filter((name) => name !== 'index.html').forEach((name) => {
    const pretty = `/${name.replace(/\.html$/, '')}`;
    app.get(pretty, (req, res) => {
        res.sendFile(path.join(PUBLIC_DIR, name));
    });
    app.get(`/${name}`, (req, res) => {
        res.redirect(301, pretty);
    });
});

// Vercel: api/index.js re-exports this app; rewrite sends traffic to /api — see server-vercel-url.js.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🛡️ Site + API proxy: http://localhost:${PORT}`);
        console.log(`🔗 Strapi backend: ${process.env.STRAPI_API_URL || '(set STRAPI_API_URL in .env)'}`);
        const tokenLen = (process.env.STRAPI_API_TOKEN || '').length;
        if (!tokenLen) {
            console.warn('⚠️ STRAPI_API_TOKEN missing — /api/* proxy will return 503/401');
        } else {
            console.log(`🔑 Strapi API token loaded (${tokenLen} chars)`);
        }
        console.log(
            `🗺️ SEO: /robots.txt + /sitemap.xml (set SITE_PUBLIC_URL in production for canonical domain in sitemap)`,
        );
    });
}

module.exports = app;
