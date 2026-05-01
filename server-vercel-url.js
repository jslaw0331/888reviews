/**
 * When vercel.json rewrites requests to /api (single Express entry), the Node handler
 * sometimes receives req.url as "/api" only. Restore pathname + query from edge headers.
 */
function restoreVercelUrlMiddleware(req, _res, next) {
    if (!process.env.VERCEL) {
        next();
        return;
    }
    const cur = typeof req.url === 'string' ? req.url : '/';
    if (cur !== '/api' && cur !== '/api/') {
        next();
        return;
    }

    const h = req.headers || {};

    const fromHeaders = () => {
        const keys = ['x-invoke-path', 'x-forwarded-uri', 'x-vercel-original-path', 'x-original-uri'];
        for (const k of keys) {
            const v = h[k];
            if (typeof v === 'string') {
                const p = v.split(',')[0].trim();
                if (p.startsWith('/')) return p;
            }
        }
        const matchPath = h['x-matched-path'];
        if (typeof matchPath === 'string') {
            const p = matchPath.split(',')[0].trim();
            if (p.startsWith('/')) return p;
        }
        const fwd = h['x-forwarded-url'] || h['x-vercel-forwarded-url'];
        if (typeof fwd === 'string' && fwd.includes('://')) {
            try {
                const u = new URL(fwd);
                return u.pathname + u.search;
            } catch (_) {
                /* ignore */
            }
        }
        return null;
    };

    const pq = fromHeaders();
    if (pq && pq.startsWith('/') && pq !== '/api' && pq !== '/api/') {
        req.url = pq;
        req.originalUrl = pq;
    }
    next();
}

module.exports = { restoreVercelUrlMiddleware };
