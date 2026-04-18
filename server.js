require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
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

/** SEO: static indexable routes (CMS detail URLs are discovered via internal links). */
app.get('/sitemap.xml', (req, res) => {
    const base = sitePublicOrigin(req);
    const paths = [
        '/',
        '/casinos',
        '/bonuses',
        '/slots',
        '/providers',
        '/guides',
        '/news',
        '/about',
        '/privacy',
        '/terms',
        '/contact',
    ];
    const lines = paths.map((p) => {
        const loc = `${base}${p === '/' ? '/' : p}`;
        const priority = p === '/' ? '1.0' : '0.8';
        return `  <url><loc>${escapeXml(loc)}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
    });
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join(
        '\n',
    )}\n</urlset>\n`;
    res.type('application/xml');
    res.send(body);
});

/**
 * Root HTML pages (only these are served; avoids exposing .env, package.json, etc.).
 * Public URLs omit `.html` (e.g. `/bonuses`); `/bonuses.html` 301s to `/bonuses`.
 */
const ROOT_HTML = [
    'index.html',
    'bonuses.html',
    'slots.html',
    'casinos.html',
    'providers.html',
    'guides.html',
    'news.html',
    'about.html',
    'privacy.html',
    'terms.html',
    'contact.html',
];

// Enable CORS so your frontend can call this proxy
app.use(cors());
app.use(express.json());

/**
 * Legacy `/bonus.html?slug=` → 301 to `/bonus/:slug`.
 * Bare `/bonus.html` → redirect to bonuses directory (pretty URLs use `/bonus/:slug` only).
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
    res.redirect(302, '/bonuses');
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
        res.status(503).send('STRAPI_API_URL is not set');
        return;
    }
    const targetUrl = `${base.replace(/\/$/, '')}${req.path}`;
    try {
        const tryStream = (headers) =>
            axios.get(targetUrl, {
                responseType: 'stream',
                timeout: 60000,
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
            timeout: 60000,
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
        const { endpoint } = req.params;
        
        // Grab any query parameters (like ?populate=*) from the incoming request
        const queryParams = req.url.split('?')[1] || '';
        
        // Build the literal target URL to your secure Strapi server
        const targetUrl = `${process.env.STRAPI_API_URL}/api/${endpoint}?${queryParams}`;

        // Make the server-side request (This hides the token from the browser completely!)
        const response = await axios.get(targetUrl, {
            headers: {
                Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`
            }
        });

        // Send the Strapi data back to your local vanilla HTML frontend
        res.json(response.data);

    } catch (error) {
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
            error: 'Failed to fetch data securely from Strapi',
            details: error.response?.data || error.message,
        });
    }
});

// Static site: same origin as /api so one `npm start` serves pages + proxy
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/components', express.static(path.join(__dirname, 'components')));

app.get('/casino/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'review.html'));
});

app.get('/review.html', (req, res) => {
    const slug = req.query.slug;
    if (slug) {
        res.redirect(301, `/casino/${encodeURIComponent(String(slug))}`);
        return;
    }
    res.sendFile(path.join(__dirname, 'review.html'));
});

app.get('/provider/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'provider.html'));
});

app.get('/slot/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'slot.html'));
});

app.get('/bonus/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'bonus.html'));
});

/** Guide / strategy article (Strapi `posts`); legacy `post.html?slug=` → `/guide/:slug`. */
app.get('/guide/:slug', (req, res) => {
    const raw = req.params.slug;
    if (!raw || /[/\\]|\.\./.test(raw)) {
        res.status(404).send('Not found');
        return;
    }
    res.sendFile(path.join(__dirname, 'post.html'));
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
    res.sendFile(path.join(__dirname, 'provider.html'));
});

app.get('/slot.html', (req, res) => {
    const slug = req.query.slug;
    if (slug) {
        res.redirect(301, `/slot/${encodeURIComponent(String(slug))}`);
        return;
    }
    res.sendFile(path.join(__dirname, 'slot.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', (req, res) => {
    res.redirect(301, '/');
});
ROOT_HTML.filter((name) => name !== 'index.html').forEach((name) => {
    const pretty = `/${name.replace(/\.html$/, '')}`;
    app.get(pretty, (req, res) => {
        res.sendFile(path.join(__dirname, name));
    });
    app.get(`/${name}`, (req, res) => {
        res.redirect(301, pretty);
    });
});

// Boot up the proxy server
app.listen(PORT, () => {
    console.log(`🛡️ Site + API proxy: http://localhost:${PORT}`);
    console.log(`🔗 Strapi backend: ${process.env.STRAPI_API_URL || '(set STRAPI_API_URL in .env)'}`);
    console.log(
        `🗺️ SEO: /robots.txt + /sitemap.xml (set SITE_PUBLIC_URL in production for canonical domain in sitemap)`,
    );
});
