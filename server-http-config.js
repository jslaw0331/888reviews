/**
 * Strapi / outbound HTTP timeouts aligned with Vercel serverless maxDuration.
 * Set STRAPI_HTTP_TIMEOUT_MS in env (1000–120000). Defaults: 9000ms on Vercel (Hobby-safe), 25000ms elsewhere.
 */
function getStrapiAxiosTimeoutMs() {
    const raw = process.env.STRAPI_HTTP_TIMEOUT_MS;
    const n = raw !== undefined ? parseInt(String(raw), 10) : NaN;
    if (Number.isFinite(n) && n >= 1000 && n <= 120000) {
        return n;
    }
    return process.env.VERCEL ? 9000 : 25000;
}

/** CDN cache for JSON proxy (browser + edge). */
const API_PROXY_CACHE_CONTROL =
    'public, max-age=0, s-maxage=120, stale-while-revalidate=86400';

/** Public config endpoint — changes rarely. */
const API_CONFIG_CACHE_CONTROL =
    'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400';

/** Sitemap regenerated periodically at edge. */
const SITEMAP_CACHE_CONTROL =
    'public, max-age=300, s-maxage=600, stale-while-revalidate=86400';

module.exports = {
    getStrapiAxiosTimeoutMs,
    API_PROXY_CACHE_CONTROL,
    API_CONFIG_CACHE_CONTROL,
    SITEMAP_CACHE_CONTROL,
};
