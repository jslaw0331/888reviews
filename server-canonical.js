/**
 * Single-hop URL canonicalization for legacy WP paths, trailing slashes, and junk query keys.
 * Keeps GSC from seeing slash-strip → legacy chains (Redirect error).
 */

function normalizeLegacyPath(pathname) {
    let p = String(pathname || '/').split('?')[0];
    try {
        p = decodeURIComponent(p);
    } catch {
        /* keep raw */
    }
    p = p.replace(/\/+/g, '/').trim();
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p || '/';
}

function legacyDestForPath(pathNorm, { aliases, exact, prefixes }) {
    const aliasDest = aliases.get(pathNorm);
    if (aliasDest) return aliasDest;
    const exactDest = exact.get(pathNorm);
    if (exactDest) return exactDest;
    for (let i = 0; i < prefixes.length; i++) {
        const prefix = prefixes[i][0];
        const dest = prefixes[i][1];
        if (pathNorm === prefix || pathNorm.startsWith(`${prefix}/`)) {
            return dest;
        }
    }
    return null;
}

/**
 * @returns {{ href: string, changed: boolean }}
 */
function resolveCanonicalUrl(originalUrl, opts) {
    const raw = String(originalUrl || '/');
    const qIdx = raw.indexOf('?');
    const rawPath = (qIdx >= 0 ? raw.slice(0, qIdx) : raw) || '/';
    const rawSearch = qIdx >= 0 ? raw.slice(qIdx + 1) : '';

    const collapsed = rawPath.replace(/\/{2,}/g, '/') || '/';
    const stripped =
        collapsed.length > 1 && collapsed.endsWith('/') ? collapsed.replace(/\/+$/, '') : collapsed;
    const pathNorm = normalizeLegacyPath(stripped);

    const params = new URLSearchParams(rawSearch);
    if ([...params.keys()].length === 1 && params.has('p')) {
        return { href: '/', changed: true };
    }

    let junkRemoved = false;
    for (const key of [...params.keys()]) {
        if (opts.junkKeys.has(key)) {
            params.delete(key);
            junkRemoved = true;
        }
    }
    const search = params.toString();
    const legacy = legacyDestForPath(pathNorm, opts);
    const finalPath = legacy || pathNorm;
    const href = search ? `${finalPath}?${search}` : finalPath;

    const pathShapeChanged = collapsed !== rawPath || stripped !== collapsed || pathNorm !== stripped;
    const changed = Boolean(legacy) || junkRemoved || pathShapeChanged;
    return { href, changed };
}

module.exports = {
    normalizeLegacyPath,
    legacyDestForPath,
    resolveCanonicalUrl,
};

if (require.main === module) {
    const assert = require('assert');
    const opts = {
        aliases: new Map([['/casino/mylvking-review', '/reviews']]),
        exact: new Map([
            ['/home', '/'],
            ['/bonuses.html', '/bonus'],
        ]),
        prefixes: [
            ['/bonuses', '/bonus'],
            ['/casino-slots-game', '/slots'],
            ['/casino-reviews', '/reviews'],
            ['/category/casino-top-10', '/reviews'],
            ['/casino-top-10', '/reviews'],
        ],
        junkKeys: new Set(['archives-list', 'reviews-page', 'byp455']),
    };

    assert.strictEqual(resolveCanonicalUrl('/home/', opts).href, '/');
    assert.strictEqual(resolveCanonicalUrl('/home/', opts).changed, true);
    assert.strictEqual(resolveCanonicalUrl('/bonuses', opts).href, '/bonus');
    assert.strictEqual(resolveCanonicalUrl('/bonuses/', opts).href, '/bonus');
    assert.strictEqual(resolveCanonicalUrl('/bonuses/welcome', opts).href, '/bonus');
    assert.strictEqual(resolveCanonicalUrl('/casino-slots-game/4/', opts).href, '/slots');
    assert.strictEqual(resolveCanonicalUrl('/casino/mylvking-review/', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/casino-reviews/dafabet/', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/category/casino-top-10/page/2/', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/casino-top-10', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/reviews', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/reviews', opts).changed, false);
    assert.strictEqual(resolveCanonicalUrl('/reviews/', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/reviews?archives-list=1', opts).href, '/reviews');
    assert.strictEqual(resolveCanonicalUrl('/about?p=12', opts).href, '/');
    console.log('server-canonical: ok');
}
