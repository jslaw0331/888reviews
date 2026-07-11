document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons (script may load deferred after our UMD bundle).
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Filter logic removed as filters were removed from UI.

    // Accordion Logic
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isActive = item.classList.contains('active');
            
            // Close all
            document.querySelectorAll('.accordion-item').forEach(acc => {
                acc.classList.remove('active');
                acc.querySelector('.accordion-header').setAttribute('aria-expanded', 'false');
            });
            
            // If it wasn't active, open it
            if (!isActive) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
});



// --- Strapi API Proxy Integration ---
// Express (npm start) serves /api on the same origin. Live Server and other static
// dev servers have no /api - use the Node proxy on port 3000 (same host as the page).
function getApiBaseUrl() {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    if (window.location.protocol === 'file:') return 'http://localhost:3000';
    const host = window.location.hostname;
    const port = window.location.port;
    const staticDevPorts = new Set(['5500', '5501', '5502', '5173', '4173', '8080', '8888']);
    if (port && staticDevPorts.has(port)) {
        return `${window.location.protocol}//${host}:3000`;
    }
    return window.location.origin;
}

const API_URL = getApiBaseUrl();

/**
 * Canonical / Open Graph / JSON-LD base URL. Set in HTML:
 * `<meta name="public-base-url" content="https://888reviews.com">`
 * Falls back to `window.location.origin` when missing (local dev).
 */
function getPublicSiteOrigin() {
    if (typeof document === 'undefined') return '';
    const m = document.querySelector('meta[name="public-base-url"]');
    const c = m && m.getAttribute('content');
    if (c && /^https?:\/\//i.test(String(c).trim())) {
        return String(c).trim().replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location && window.location.origin) {
        return window.location.origin;
    }
    return '';
}

/** Homepage: top casinos by Rank + top providers (not filtered by IsTierOne; that badge is per entry in Strapi) */
const HOME_TIER_ONE_CASINOS_LIMIT = 5;
const HOME_TOP_PROVIDERS_LIMIT = 5;

/** Site footer: FAQ accordion (`/components/footer.html`). */

/** Featured operator on the homepage hero + Tier One sidebar (Strapi Slug, case-insensitive). */
const HOME_FEATURED_CASINO_SLUG = 'bk-8';

/** Internal link for casino listings (individual /casino/{slug} pages removed). */
function casinoReviewPath(_slug) {
    return '/reviews';
}

/** Path to provider dossier page: /provider/{slug} */
function providerPath(slug) {
    if (!slug) return '#';
    return `/provider/${encodeURIComponent(slug)}`;
}

/** Path to bonus detail page: `/bonus/{slug}` (Express serves `bonus.html`; legacy `bonus.html?slug=` redirects). */
function bonusDetailPath(slug) {
    if (!slug) return '#';
    return `/bonus/${encodeURIComponent(String(slug).trim())}`;
}

/** Guide or strategy article: `/guide/{slug}` (Express serves `post.html`; legacy `post.html?slug=` redirects). */
function guideDetailPath(slug) {
    if (!slug) return '/guides';
    return `/guide/${encodeURIComponent(String(slug).trim())}`;
}

/** News article: `/news/{slug}` (same `post.html` template as guides). */
function newsDetailPath(slug) {
    if (!slug) return '/news';
    return `/news/${encodeURIComponent(String(slug).trim())}`;
}

function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
}

/** Centered spinner + message for empty containers and homepage sections. */
function loadingHtml(message = 'Loading…', extraClass = '') {
    const mod = extraClass ? ` ${extraClass}` : '';
    return `<div class="app-loading${mod}" role="status" aria-live="polite">
        <div class="app-loading__spinner" aria-hidden="true"></div>
        ${message ? `<p class="app-loading__text">${escapeHtml(message)}</p>` : ''}
    </div>`;
}

function skeletonGridHtml(variant, count = 6) {
    const n = Math.max(1, Math.min(12, Math.floor(Number(count)) || 6));
    const cards = [];
    for (let i = 0; i < n; i++) {
        cards.push(skeletonCardHtml(variant));
    }
    return cards.join('');
}

function skeletonCardHtml(variant) {
    if (variant === 'listing-card') {
        return `<article class="app-skel app-skel--listing-card listing-card" aria-hidden="true">
            <div class="app-skel-block app-skel-review-panel"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--lg"></div>
                <div class="app-skel-block app-skel-line--md"></div>
                <div class="app-skel-block app-skel-line--sm"></div>
            </div>
            <div class="app-skel-actions">
                <div class="app-skel-block app-skel-btn"></div>
                <div class="app-skel-block app-skel-btn"></div>
            </div>
        </article>`;
    }
    if (variant === 'tier-card') {
        return `<div class="app-skel app-skel--tier-card tier-card" aria-hidden="true">
            <div class="app-skel-block app-skel-logo-col"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--lg"></div>
                <div class="app-skel-block app-skel-line--md"></div>
                <div class="app-skel-block app-skel-line--sm"></div>
                <div class="app-skel-block app-skel-line--body"></div>
            </div>
            <div class="app-skel-block app-skel-bonus"></div>
        </div>`;
    }
    if (variant === 'slot-card') {
        return `<div class="app-skel app-skel--slot-card slot-card" aria-hidden="true">
            <div class="app-skel-block app-skel-media"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--sub"></div>
                <div class="app-skel-block app-skel-line--title"></div>
                <div class="app-skel-block app-skel-line--body"></div>
            </div>
        </div>`;
    }
    if (variant === 'provider-card') {
        return `<div class="app-skel app-skel--provider-card" aria-hidden="true">
            <div class="app-skel-block app-skel-media"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--title"></div>
                <div class="app-skel-block app-skel-line--sub"></div>
                <div class="app-skel-block app-skel-line--body"></div>
            </div>
        </div>`;
    }
    if (variant === 'bonus-card') {
        return `<article class="app-skel app-skel--bonus-card bonus-card" aria-hidden="true">
            <div class="app-skel-block app-skel-media"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--title"></div>
                <div class="app-skel-block app-skel-line--sub"></div>
                <div class="app-skel-block app-skel-btn"></div>
            </div>
        </article>`;
    }
    if (variant === 'guide-card') {
        return `<article class="app-skel app-skel--guide-card guide-card" aria-hidden="true">
            <div class="app-skel-block app-skel-media"></div>
            <div class="app-skel-body">
                <div class="app-skel-block app-skel-line--sub"></div>
                <div class="app-skel-block app-skel-line--title"></div>
                <div class="app-skel-block app-skel-line--body"></div>
            </div>
        </article>`;
    }
    return loadingHtml('Loading…');
}

function setDetailPageLoading(rootEl) {
    if (rootEl) rootEl.classList.add('detail-page--loading');
}

function clearDetailPageLoading(rootEl) {
    if (rootEl) rootEl.classList.remove('detail-page--loading');
}

/** Which boot path to run — avoids bonus-map + homepage fetches on unrelated pages. */
function detectBootPageType() {
    if (document.getElementById('gp-page-root')) return 'guide-post';
    if (document.getElementById('bonus-page-root') && document.getElementById('bd-title')) return 'bonus-detail';
    if (document.getElementById('provider-content') && document.getElementById('pv-title')) return 'provider-detail';
    if (document.getElementById('slot-page-root') && document.getElementById('sv-title')) return 'slot-detail';
    if (document.getElementById('malaysia-operator-list') || document.getElementById('malaysia-casino-table')) {
        return 'malaysia-hub';
    }
    if (document.getElementById('mobile-operator-list')) return 'mobile-hub';
    if (document.getElementById('bonus-page-operator-list')) return 'bonus-hub';
    if (document.getElementById('live-casino-operator-list')) return 'live-casino-hub';
    if (document.getElementById('reviews-operator-list')) return 'reviews-hub';
    if (document.getElementById('e-wallet-operator-list')) return 'e-wallet-hub';
    if (document.getElementById('roulette-operator-list')) return 'roulette-hub';
    if (document.getElementById('blackjack-operator-list')) return 'blackjack-hub';
    if (document.getElementById('baccarat-operator-list')) return 'baccarat-hub';
    if (document.getElementById('slot-page-operator-list')) return 'slot-page-hub';
    if (document.getElementById('casinos-listing-container')) return 'casinos-listing';
    if (document.getElementById('slots-listing-grid')) return 'slots-listing';
    if (document.getElementById('providers-listing-grid')) return 'providers-listing';
    if (document.getElementById('bonuses-grid')) return 'bonuses-listing';
    if (document.getElementById('guides-grid')) return 'guides-listing';
    if (document.getElementById('news-grid')) return 'news-listing';
    if (
        document.getElementById('hero-casino-card') ||
        document.getElementById('casinos-container') ||
        document.getElementById('providers-container')
    ) {
        return 'home';
    }
    return 'static';
}

/**
 * Compact page list for large totals (e.g. 1 … 7 8 9 … 99).
 * @param {number} current 1-based
 * @param {number} total
 * @returns {(number|'ellipsis')[]}
 */
function buildPageList(current, total) {
    if (total <= 1) return [];
    const pages = new Set([1, total, current, current - 1, current + 1, current - 2, current + 2]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    for (const p of sorted) {
        if (prev && p - prev > 1) out.push('ellipsis');
        out.push(p);
        prev = p;
    }
    return out;
}

function listingPagerNumbersHtml(current, total) {
    const items = buildPageList(current, total);
    return items
        .map((item) => {
            if (item === 'ellipsis') {
                return '<span class="listing-pager__ellipsis" aria-hidden="true">…</span>';
            }
            const active = item === current;
            return `<button type="button" class="listing-pager__page${active ? ' is-active' : ''}" data-page="${item}"${active ? ' aria-current="page"' : ''}>${item}</button>`;
        })
        .join('');
}

function updateListingPagerDom(
    wrap,
    pageCount,
    currentPage,
    prevBtn,
    nextBtn,
    pageNumbersEl,
    pageInput,
    pageTotalHint
) {
    if (!wrap || !prevBtn || !nextBtn) return;
    if (pageCount <= 1) {
        wrap.style.display = 'none';
        wrap.classList.remove('listing-pager--hide-goto');
        return;
    }
    wrap.style.display = 'flex';
    wrap.classList.toggle('listing-pager--hide-goto', pageCount <= 3);
    const gotoBtn = wrap.querySelector('.listing-pager__goto-btn');
    if (gotoBtn) {
        gotoBtn.setAttribute('aria-label', `Submit page number (1 to ${pageCount})`);
    }
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= pageCount;
    const firstBtn = wrap.querySelector('.listing-pager__btn--first');
    const lastBtn = wrap.querySelector('.listing-pager__btn--last');
    if (firstBtn) firstBtn.disabled = currentPage <= 1;
    if (lastBtn) lastBtn.disabled = currentPage >= pageCount;
    if (pageNumbersEl) {
        pageNumbersEl.innerHTML = listingPagerNumbersHtml(currentPage, pageCount);
    }
    if (pageInput) {
        pageInput.max = String(pageCount);
        if (document.activeElement !== pageInput) {
            pageInput.value = String(currentPage);
        }
    }
    if (pageTotalHint) {
        pageTotalHint.textContent = `of ${pageCount}`;
    }
}

function bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigate) {
    if (pageNumbersEl) {
        pageNumbersEl.addEventListener('click', (e) => {
            const btn = e.target.closest('button[data-page]');
            if (!btn) return;
            const p = parseInt(btn.getAttribute('data-page'), 10);
            if (!Number.isNaN(p)) navigate(p);
        });
    }
    const submitGoto = () => {
        if (!pageInput) return;
        const raw = pageInput.value.trim();
        if (raw === '') return;
        const p = parseInt(raw, 10);
        if (Number.isNaN(p)) return;
        navigate(p);
    };
    if (pageGoBtn && pageInput) {
        pageGoBtn.addEventListener('click', submitGoto);
        pageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitGoto();
            }
        });
    }
}

/** Scroll listing anchor into view before fetch (pagination). Skip on internal page redirects. */
function scrollListingAnchorIntoView(selector, { skip = false } = {}) {
    if (skip) return;
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** First non-empty string from attr[key] for listed keys (Strapi name variants). */
function firstNonEmptyAttr(attr, keys) {
    if (!attr || !keys) return '';
    for (const k of keys) {
        const v = attr[k];
        if (v != null && String(v).trim() !== '') return String(v).trim();
    }
    return '';
}

/** External terms / T&Cs URL if Strapi provides one. */
function casinoTermsUrl(attr) {
    if (!attr) return '';
    const keys = [
        'TermsUrl',
        'PromoTermsUrl',
        'TermsAndConditionsUrl',
        'TAndCsUrl',
        'termsUrl',
        'promoTermsUrl',
    ];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        const u = String(v).trim();
        if (/^https?:\/\//i.test(u)) return u;
    }
    return '';
}

/**
 * External operator URL from Strapi `AffiliateLink` only (https). Supports plain string or { url } link-field shapes.
 */
function casinoAffiliateUrl(attr) {
    if (!attr || typeof attr !== 'object') return '';
    const coerceHttp = (raw) => {
        if (raw == null) return '';
        if (typeof raw === 'object') {
            const nested =
                raw.url ??
                raw.href ??
                raw.URL ??
                raw.link ??
                raw.attributes?.url;
            if (nested != null) return coerceHttp(nested);
            return '';
        }
        const u = String(raw).trim();
        return /^https?:\/\//i.test(u) ? u : '';
    };
    return coerceHttp(attr.AffiliateLink ?? attr.affiliateLink ?? attr.websiteUrl);
}

/** VISIT SITE: external URL when configured, else reviews directory. */
function casinoVisitSiteHref(attr) {
    const ext = casinoAffiliateUrl(attr);
    if (ext) return ext;
    return '/reviews';
}

function casinoVisitSiteIsExternal(attr) {
    return !!casinoAffiliateUrl(attr);
}

/** Homepage hero + cards: region / availability line (green badge). */
function casinoRegionBadgeText(attr) {
    return firstNonEmptyAttr(attr, [
        'RegionBadge',
        'GeoLabel',
        'AvailabilityLabel',
        'PlayerRegionsLine',
        'AcceptedRegions',
        'RegionLine',
        'HeroGeo',
        'geoLabel',
        'regionBadge',
    ]);
}

/** Homepage hero: subtitle under the casino name. */
function casinoHeroSubtitleLine(attr) {
    return firstNonEmptyAttr(attr, [
        'HeroSubtitle',
        'HeroTagline',
        'EditorialKicker',
        'CardSubtitle',
        'HomeHeroSubtitle',
        'heroSubtitle',
    ]);
}

/** Listing stats: game count - common Strapi naming variants. */
function casinoGameCountDisplay(attr) {
    return firstNonEmptyAttr(attr, [
        'GameCount',
        'GamesCount',
        'TotalGames',
        'gameCount',
        'gamesCount',
    ]);
}

function casinoPayoutSpeedDisplay(attr) {
    return firstNonEmptyAttr(attr, [
        'PayoutSpeed',
        'WithdrawalSpeed',
        'CashoutSpeed',
        'payoutSpeed',
    ]);
}

/**
 * Labels for payment-method chips (repeatable component { Label }, plain array, or comma-separated string).
 */
function casinoPaymentMethodLabels(attr) {
    if (!attr) return [];
    const raw =
        attr.PaymentMethods ??
        attr.PaymentOptions ??
        attr.paymentMethods ??
        attr.TypicalPayments ??
        null;
    const out = [];
    const push = (s) => {
        const t = String(s || '').trim();
        if (t && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
    };

    if (raw == null) return [];

    if (typeof raw === 'string') {
        raw.split(/[,;|]/).forEach((x) => push(x));
        return out.slice(0, 8);
    }

    const d = raw.data != null ? raw.data : raw;
    const list = Array.isArray(d) ? d : [d];
    for (const item of list) {
        if (!item) continue;
        if (typeof item === 'string') {
            push(item);
            continue;
        }
        const a = item.attributes != null ? item.attributes : item;
        const label = a.Label ?? a.Name ?? a.Title ?? a.Text ?? a.label ?? a.name;
        if (label != null && String(label).trim() !== '') {
            push(String(label).trim());
        }
    }
    return out.slice(0, 8);
}

function lucideIconForPaymentLabel(label) {
    const s = String(label || '').toLowerCase();
    if (/crypto|bitcoin|btc|ethereum|eth|usdt/.test(s)) return 'bitcoin';
    if (/apple|google\s*pay|paypal|pay\s*pal/.test(s)) return 'smartphone';
    if (/bank|wire|transfer|sepa|ach|interac/.test(s)) return 'landmark';
    if (/card|visa|master|amex|credit|debit|maestro/.test(s)) return 'credit-card';
    if (/wallet|skrill|neteller|ecopayz|muchbetter|e-wallet|ewallet/.test(s)) return 'wallet';
    if (/paysafe|voucher|prepaid|neosurf/.test(s)) return 'ticket';
    return 'banknote';
}

/** HTML for tier card payment strip; falls back to generic chips when the API has no list. */
function renderCasinoPaymentChipsHtml(attr) {
    const labels = casinoPaymentMethodLabels(attr);
    if (labels.length === 0) {
        return `
                                <span class="tier-payment-chip"><i data-lucide="credit-card"></i> Cards</span>
                                <span class="tier-payment-chip"><i data-lucide="wallet"></i> E-wallets</span>`;
    }
    return labels
        .map(
            (lab) =>
                `<span class="tier-payment-chip"><i data-lucide="${lucideIconForPaymentLabel(lab)}"></i> ${escapeHtml(lab)}</span>`,
        )
        .join('');
}

/** Strapi Blocks: inline nodes (text, hard_break, link) to HTML. */
function richTextLinkHtml(href, inner) {
    const h = escapeHtml(String(href || ''));
    if (!h) return inner || '';
    const ext = /^https?:\/\//i.test(h);
    const tgt = ext ? ' target="_blank" rel="noopener noreferrer"' : ' rel="noopener noreferrer"';
    return `<a href="${h}"${tgt}>${inner || ''}</a>`;
}

function strapiInlineToHtml(nodes) {
    if (!nodes || !Array.isArray(nodes)) return '';
    return nodes
        .map((node) => {
            if (!node) return '';
            if (node.type === 'link') {
                const href = node.url || node.attrs?.href || '';
                const inner = strapiInlineToHtml(node.children ?? node.content);
                return richTextLinkHtml(href, inner);
            }
            if (node.type === 'text') {
                let t = escapeHtml(node.text ?? '');
                const marks = node.marks || [];
                marks.forEach((m) => {
                    if (!m || !m.type) return;
                    if (m.type === 'bold') t = `<strong>${t}</strong>`;
                    else if (m.type === 'italic') t = `<em>${t}</em>`;
                    else if (m.type === 'underline') t = `<u>${t}</u>`;
                    else if (m.type === 'strike') t = `<s>${t}</s>`;
                    else if (m.type === 'code') t = `<code>${t}</code>`;
                    else if (m.type === 'link' && m.attrs && m.attrs.href) {
                        t = richTextLinkHtml(m.attrs.href, t);
                    }
                });
                if (node.bold) t = `<strong>${t}</strong>`;
                if (node.italic) t = `<em>${t}</em>`;
                if (node.underline) t = `<u>${t}</u>`;
                if (node.strikethrough || node.strike) t = `<s>${t}</s>`;
                if (node.code) t = `<code>${t}</code>`;
                return t;
            }
            if (node.type === 'hard_break') return '<br>';
            return '';
        })
        .join('');
}

/** Strapi Blocks: one block node to HTML. */
function strapiBlockNodeToHtml(node) {
    if (!node || !node.type) return '';
    const kids = node.content ?? node.children;
    switch (node.type) {
        case 'paragraph':
            return `<p>${strapiInlineToHtml(kids) || '&nbsp;'}</p>`;
        case 'heading': {
            const level = Math.min(4, Math.max(2, node.attrs?.level ?? 2));
            return `<h${level}>${strapiInlineToHtml(kids)}</h${level}>`;
        }
        case 'bulletList':
            return `<ul>${(kids || []).map(strapiBlockNodeToHtml).join('')}</ul>`;
        case 'orderedList':
            return `<ol>${(kids || []).map(strapiBlockNodeToHtml).join('')}</ol>`;
        case 'list': {
            const tag = node.format === 'ordered' ? 'ol' : 'ul';
            return `<${tag}>${(kids || []).map(strapiBlockNodeToHtml).join('')}</${tag}>`;
        }
        case 'listItem':
        case 'list-item': {
            const inline = strapiInlineToHtml(kids);
            if (inline) return `<li>${inline}</li>`;
            return `<li>${(kids || []).map(strapiBlockNodeToHtml).join('')}</li>`;
        }
        case 'blockquote':
            return `<blockquote>${(kids || []).map(strapiBlockNodeToHtml).join('')}</blockquote>`;
        case 'code':
            return `<pre><code>${escapeHtml(strapiInlineToHtml(kids))}</code></pre>`;
        case 'image': {
            let url = node.attrs?.url ?? node.attrs?.src;
            if (!url && node.image?.data?.attributes?.url) {
                url = node.image.data.attributes.url;
            }
            if (!url) return '';
            const abs = resolveMediaUrl(String(url));
            const alt = escapeHtml(String(node.attrs?.alternativeText ?? node.attrs?.alt ?? ''));
            return `<figure class="rich-text-figure"><img src="${escapeHtml(abs)}" alt="${alt}" loading="lazy" decoding="async" /></figure>`;
        }
        default:
            return '';
    }
}

/** Strapi v4 Rich Text (Blocks) root document → HTML. */
function strapiBlocksToHtml(doc) {
    if (!doc || doc.type !== 'doc' || !Array.isArray(doc.content)) return '';
    return doc.content.map(strapiBlockNodeToHtml).join('');
}

/** Plain text with blank lines → multiple <p>; single newlines → separate <p>. */
function plainTextToParagraphsHtml(text) {
    const trimmed = String(text ?? '').trim();
    if (!trimmed) return '';
    let chunks = trimmed.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (chunks.length <= 1 && trimmed.includes('\n')) {
        chunks = trimmed.split('\n').map((p) => p.trim()).filter(Boolean);
    }
    if (chunks.length === 0) return '';
    return chunks.map((c) => `<p>${escapeHtml(c)}</p>`).join('');
}

function decodeHtmlEntitiesLight(s) {
    if (typeof document === 'undefined') return String(s ?? '');
    const ta = document.createElement('textarea');
    ta.innerHTML = s;
    return ta.value;
}

/** True when the string likely contains Markdown (headings, hr, lists, blockquote). */
function looksLikeMarkdown(s) {
    const t = String(s ?? '').trim();
    if (!t) return false;
    const lines = t.split('\n');
    for (let i = 0; i < Math.min(lines.length, 80); i++) {
        const L = lines[i].trim();
        if (!L) continue;
        if (/^#{1,6}\s+/.test(L)) return true;
        if (/^(\*{3}|-{3}|_{3})(\s*)$/.test(L)) return true;
        if (/^[-*+]\s+/.test(L)) return true;
        if (/^\d+\.\s+/.test(L)) return true;
        if (/^>\s+/.test(L)) return true;
    }
    return false;
}

/**
 * Strapi / CMS sometimes saves Markdown inside one or more HTML <p> wrappers.
 * Unwrap so `marked` can see real `#` headings and block structure.
 */
function unwrapMarkdownWrappedInParagraphHtml(t) {
    const s = String(t).trim();
    if (!s) return s;
    if (!/^(\s*<p(\s[^>]*)?>[\s\S]*?<\/p>\s*)+$/i.test(s)) return s;
    const collapsed = s
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>\s*<p(\s[^>]*)?>/gi, '\n\n')
        .replace(/^<p(\s[^>]*)?>/i, '')
        .replace(/<\/p>\s*$/i, '');
    return decodeHtmlEntitiesLight(collapsed.trim());
}

/**
 * Rich text from API: Blocks (object), HTML string, JSON string of blocks, or plain text.
 */
function richTextToHtml(raw) {
    if (raw == null) return '';
    if (typeof raw === 'object' && raw !== null && raw.type === 'doc') {
        return strapiBlocksToHtml(raw);
    }
    if (Array.isArray(raw) && raw.length > 0 && raw.some((n) => n && n.type)) {
        return raw.map(strapiBlockNodeToHtml).join('');
    }
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (!t) return '';
        if (t.startsWith('{') && t.includes('"type"') && t.includes('"doc"')) {
            try {
                const parsed = JSON.parse(t);
                if (parsed && parsed.type === 'doc') return strapiBlocksToHtml(parsed);
            } catch {
                /* fall through */
            }
        }
        if (/<[a-z][\s\S]*>/i.test(t)) return t;
        return plainTextToParagraphsHtml(t);
    }
    return '';
}

/** Plain or rich text from the API: Blocks, HTML, or plain text → spaced paragraphs. */
function setRichTextHtml(el, raw) {
    if (!el) return;
    const html = richTextToHtml(raw);
    if (!html) {
        el.innerHTML = '';
        return;
    }
    el.innerHTML = `<div class="rich-text-body">${html}</div>`;
}

/** Plain text for hero/meta when Strapi sends Blocks or HTML in an excerpt field. */
function richTextToPlainText(raw) {
    if (raw == null || raw === '') return '';
    if (typeof raw === 'object' && raw !== null && raw.type === 'doc' && Array.isArray(raw.content)) {
        const walk = (nodes) => {
            if (!nodes || !Array.isArray(nodes)) return '';
            return nodes
                .map((n) => {
                    if (!n) return '';
                    if (n.type === 'text') return n.text ?? '';
                    if (n.content) return walk(n.content);
                    if (n.children) return walk(n.children);
                    return '';
                })
                .join(' ');
        };
        return walk(raw.content).replace(/\s+/g, ' ').trim();
    }
    if (Array.isArray(raw) && raw.length > 0 && raw.some((n) => n && n.type)) {
        const html = raw.map(strapiBlockNodeToHtml).join('');
        if (html) {
            if (typeof document !== 'undefined') {
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
            }
            return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
    }
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (!t) return '';
        if (/<[a-z][\s\S]*>/i.test(t)) {
            if (typeof document !== 'undefined') {
                const tmp = document.createElement('div');
                tmp.innerHTML = t;
                return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
            }
            return t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return t;
    }
    if (typeof raw === 'object') return '';
    return String(raw).replace(/\s+/g, ' ').trim();
}

/** Lucide icon name for data-lucide (alphanumeric + hyphens only). */
function safeLucideIcon(raw) {
    const s = String(raw || 'star')
        .trim()
        .toLowerCase();
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) ? s : 'star';
}

const DEFAULT_PROVIDER_CARD_IMAGE =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop';

/** Flatten Strapi media field (single or repeatable) to URL strings (main + formats + nested data). */
function normalizeStrapiMediaToUrls(field) {
    if (field == null) return [];
    if (typeof field === 'string') return field.trim() ? [field.trim()] : [];
    const out = [];
    const push = (u) => {
        if (u && typeof u === 'string' && u.trim() && !out.includes(u)) out.push(u);
    };
    push(field.url);
    push(field.href);
    if (field.formats && typeof field.formats === 'object') {
        for (const k of ['large', 'medium', 'small', 'thumbnail']) {
            push(field.formats[k]?.url);
        }
    }
    const data = field.data;
    if (data == null) return out;
    const list = Array.isArray(data) ? data : [data];
    for (const item of list) {
        if (!item) continue;
        const a = item.attributes ?? item;
        push(a?.url);
        if (a?.formats && typeof a.formats === 'object') {
            for (const k of ['large', 'medium', 'small', 'thumbnail']) {
                push(a.formats[k]?.url);
            }
        }
    }
    return out;
}

/** Push every resolvable URL from a Strapi media object (main + formats) - used for hero img fallback chain. */
function pushResolvedMediaUrlsFromField(push, field) {
    if (field == null || field === '') return;
    if (typeof field === 'string') {
        const r = resolveMediaUrl(field.trim());
        if (r) push(r);
        return;
    }
    for (const raw of normalizeStrapiMediaToUrls(field)) {
        const r = resolveMediaUrl(raw);
        if (r) push(r);
    }
}

/** Hero / logo: first available URL from common Strapi shapes. */
function casinoHeroImageUrl(attr) {
    const h = attr.HeroImage;
    let raw = '';
    if (h) {
        raw = h.url ?? h.data?.attributes?.url ?? '';
        if (!raw && h.data) {
            const d = Array.isArray(h.data) ? h.data[0] : h.data;
            raw = d?.attributes?.url ?? d?.url ?? '';
        }
    }
    if (!raw && attr.Logo) {
        const lg = attr.Logo;
        raw = lg.url ?? lg.data?.attributes?.url ?? '';
        if (!raw && lg.data) {
            const d = Array.isArray(lg.data) ? lg.data[0] : lg.data;
            raw = d?.attributes?.url ?? d?.url ?? '';
        }
    }
    return raw ? resolveMediaUrl(raw) : '';
}

/** True when Strapi has a dedicated hero photo (not logo-only fallback). */
function hasHeroEditorImage(attr) {
    const h = attr.HeroImage;
    if (!h) return false;
    let raw = h.url ?? h.data?.attributes?.url ?? '';
    if (!raw && h.data) {
        const d = Array.isArray(h.data) ? h.data[0] : h.data;
        raw = d?.attributes?.url ?? d?.url ?? '';
    }
    return !!String(raw).trim();
}

function getProviderCardImageUrl(attr) {
    const cover = attr.CoverImage?.url ?? attr.CoverImage?.data?.attributes?.url;
    const hero = attr.HeroImage?.url ?? attr.HeroImage?.data?.attributes?.url;
    const resolved = resolveMediaUrl(cover || hero);
    return resolved || getLogoUrl(attr) || DEFAULT_PROVIDER_CARD_IMAGE;
}

function providerSignatureLines(attr) {
    const ft = attr.FlagshipTitles;
    if (ft && String(ft).trim()) {
        return String(ft)
            .split(/[,;]|\n/)
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, 3);
    }
    return (attr.KeyStrengths || [])
        .slice(0, 3)
        .map((k) => (k && k.Text ? k.Text : String(k || '')))
        .filter(Boolean);
}

/** Slug field from Strapi (UID / text field names vary by schema). */
function providerSlugValue(attr) {
    if (!attr) return '';
    const v =
        attr.Slug ??
        attr.slug ??
        attr.URLSlug ??
        attr.urlSlug ??
        attr.documentSlug ??
        '';
    return String(v).trim();
}

/**
 * White/light wordmarks on transparent PNGs need a dark mat; dark logos need a light mat.
 * Strapi: optional text field LogoCardMat = "dark" | "light". Slug fallbacks for known cases.
 */
const PROVIDER_LOGO_DARK_MAT_SLUGS = new Set([
    'red-tiger',
    'redtiger',
    'dafabet',
    'mega888',
    '918kiss',
    'w88',
    'pg-soft',
    'pgsoft',
    'pg-soft-games',
    'netent',
    'net-ent',
]);

/** Dark-coloured logos that must stay on a light mat (overrides LogoStyle / dark-mat list). */
const PROVIDER_LOGO_FORCE_LIGHT_MAT_SLUGS = new Set([
    'pragmatic-play',
    'pragmaticplay',
    'pragmatic-play-casino',
    'evolution',
    'evolution-gaming',
    'playtech',
    'play-tech',
]);

function entitySlugForLogoMat(attr) {
    if (!attr) return '';
    const slug = providerSlugValue(attr) || casinoSlugNormalized(attr);
    if (slug) return String(slug).toLowerCase();
    return slugifyLabel(attr.Name || '');
}

function providerLogoMatIsDark(attr) {
    const slug = entitySlugForLogoMat(attr);
    if (slug && PROVIDER_LOGO_FORCE_LIGHT_MAT_SLUGS.has(slug)) {
        return false;
    }
    const styleRaw = firstNonEmptyAttr(attr, ['LogoStyle', 'logoStyle']);
    if (styleRaw !== '') {
        const s = styleRaw.toLowerCase();
        if (s === 'white' || s === 'light' || s === 'inverted' || s === 'on-dark') return true;
        if (s === 'dark' || s === 'color' || s === 'default' || s === 'on-light') return false;
    }
    const raw = firstNonEmptyAttr(attr, ['LogoCardMat', 'logoCardMat', 'CardLogoMat', 'cardLogoMat']);
    if (raw !== '') {
        const s = raw.toLowerCase();
        if (s === 'dark' || s === 'dark-mat' || s === 'dark_mat') return true;
        if (s === 'light' || s === 'light-mat' || s === 'light_mat') return false;
    }
    return PROVIDER_LOGO_DARK_MAT_SLUGS.has(slug);
}

/** Portfolio count from Strapi: "300+" or 300 → display without double "+". */
function formatProviderPortfolioDisplay(port) {
    if (port == null || String(port).trim() === '') return '-';
    const s = String(port).trim();
    if (/\+|games?\b/i.test(s)) return s;
    return `${s}+ titles`;
}

/** Flagship title lines for detail page (more than listing card teaser). */
function providerFlagshipTitleLines(attr, maxLines = 12) {
    const ft = attr.FlagshipTitles;
    if (ft && String(ft).trim()) {
        return String(ft)
            .split(/[,;]|\n/)
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, maxLines);
    }
    return [];
}

function slugifyLabel(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

/** REST plural API ID for the slot content-type (change if your backend uses e.g. slot-games). */
const SLOTS_API_COLLECTION = 'slots';

/** Bonuses collection - proxied at same origin as `/api/bonuses` (maps to Strapi e.g. http://localhost:1337/api/bonuses). */
const BONUSES_API_COLLECTION = 'bonuses';
const BONUSES_PAGE_SIZE = 50;

/** Guides / news articles — Strapi collection `blog-posts` (category: guide | strategy | news). */
const POSTS_API_COLLECTION = 'blog-posts';

/** Built from GET /api/bonuses so each casino slug/id maps to its Bonus entry (correct card + hero copy). */
let casinoBonusSlugMapCache = null;
let bonusesListRowsCache = null;

/** /bonuses listing: cached rows + UI state for client-side filter and sort. */
let bonusesPageRawList = null;
let bonusesPageFilter = 'all';
let bonusesPageSort = 'newest';

/** Slots list sort. Use `Rank:asc` only after adding a Rank field to the Slot type in Strapi (otherwise Strapi returns 400). */
const SLOTS_LIST_SORT = 'publishedAt:desc';

/** Slots listing: items per page - 4 cards per row × 2 rows = 8. */
const SLOTS_PAGE_SIZE = 8;

/** Providers listing (/providers.html) - aligned with slots grid (4×2). */
const PROVIDERS_PAGE_SIZE = 8;

const DEFAULT_SLOT_CARD_IMAGE =
    'https://images.unsplash.com/photo-1596203597022-b5eefceca167?w=600&auto=format&fit=crop';

/** Single slot review URL (pretty path; falls back query still works). */
function slotDetailPath(slug) {
    if (!slug) return '#';
    return `/slot/${encodeURIComponent(slug)}`;
}

function slotSlugValue(attr) {
    if (!attr) return '';
    const v =
        attr.Slug ??
        attr.slug ??
        attr.URLSlug ??
        attr.urlSlug ??
        '';
    return String(v).trim();
}

/** Provider name(s) from relation (populate); manyToMany joins with ", ". */
function slotProviderDisplayName(attr) {
    if (!attr) return '';
    const direct = firstNonEmptyAttr(attr, ['ProviderName', 'StudioName', 'Software', 'providerName']);
    if (direct) return direct;
    const rel = attr.provider ?? attr.Provider ?? attr.providers ?? attr.software_provider;
    const pd = rel && (rel.data != null ? rel.data : rel);
    if (!pd) return '';
    const list = Array.isArray(pd) ? pd : [pd];
    const names = [];
    for (const item of list) {
        const a = item?.attributes ?? item;
        const n = String(a?.Name ?? a?.name ?? '').trim();
        if (n) names.push(n);
    }
    return names.join(', ');
}

/** Repeatable Benefit-style components: { Text } or Strapi nested data. */
function slotBenefitTexts(field) {
    if (field == null) return [];
    if (Array.isArray(field)) {
        return field
            .map((x) => String(x?.Text ?? x?.text ?? x?.attributes?.Text ?? '').trim())
            .filter(Boolean);
    }
    const d = field.data;
    if (Array.isArray(d)) {
        return d
            .map((item) => {
                const a = item?.attributes ?? item;
                return String(a?.Text ?? a?.text ?? '').trim();
            })
            .filter(Boolean);
    }
    return [];
}

/** External play URL when Strapi stores a full http(s) link. */
function slotPlayLinkUrl(attr) {
    if (!attr) return '';
    const u = firstNonEmptyAttr(attr, ['PlayLink', 'playLink']);
    if (!u) return '';
    const s = String(u).trim();
    if (/^https?:\/\//i.test(s)) return s;
    return '';
}

function getSlotCardImageUrl(attr) {
    if (!attr) return DEFAULT_SLOT_CARD_IMAGE;
    const fromFields = [
        ...normalizeStrapiMediaToUrls(attr.coverImage),
        ...normalizeStrapiMediaToUrls(attr.CoverImage),
        ...normalizeStrapiMediaToUrls(attr.HeroImage),
        ...normalizeStrapiMediaToUrls(attr.Thumbnail),
        ...normalizeStrapiMediaToUrls(attr.Image),
        ...normalizeStrapiMediaToUrls(attr.Screenshot),
    ];
    const u = fromFields[0];
    return u ? resolveMediaUrl(u) : DEFAULT_SLOT_CARD_IMAGE;
}

function formatSlotVolatilityBadge(attr) {
    const v = firstNonEmptyAttr(attr, ['Volatility', 'Variance', 'volatility', 'VolatilityLabel']);
    if (!v) return '';
    return String(v)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, ' ');
}

/** RTP as display string (e.g. 96.5%). */
function formatSlotRtpDisplay(attr) {
    const raw = attr.RTP ?? attr.Rtp ?? attr.rtp ?? attr.PayoutPercent;
    if (raw == null || raw === '') return '-';
    const n = coerceToNumber(raw);
    if (n == null) return String(raw).trim() || '-';
    const pct = n > 0 && n <= 1 ? n * 100 : n;
    const dec = Math.abs(pct - Math.round(pct)) < 0.05 ? 0 : 1;
    return `${pct.toFixed(dec)}%`;
}

/** RTP as 0–100 for comparisons (listing filters). */
function slotRtpPercentNumber(attr) {
    const raw = attr.RTP ?? attr.Rtp ?? attr.rtp ?? attr.PayoutPercent;
    if (raw == null || raw === '') return null;
    const n = coerceToNumber(raw);
    if (n == null) return null;
    return n > 0 && n <= 1 ? n * 100 : n;
}

function formatSlotReelsDisplay(attr) {
    const r = attr.Reels ?? attr.ReelCount ?? attr.reels;
    if (r == null || r === '') return '-';
    return `${String(r).trim()} Reels`;
}

function formatSlotMaxWinDisplay(attr) {
    const s = firstNonEmptyAttr(attr, [
        'MaxWin',
        'MaxWinDisplay',
        'MaxPayout',
        'WinPotential',
        'MaxWinMultiplier',
    ]);
    return s || '-';
}

/** Strapi media URLs may be relative (/uploads/...) or absolute (e.g. R2/CDN). */
function resolveMediaUrl(pathOrUrl) {
    if (pathOrUrl == null || pathOrUrl === '') return '';
    const s = String(pathOrUrl).trim();
    if (/^https?:\/\//i.test(s) || s.startsWith('//')) return s;
    const rel = s.startsWith('/') ? s : `/${s}`;
    if (
        typeof window !== 'undefined' &&
        rel.startsWith('/uploads') &&
        window.__STRAPI_PUBLIC_URL__
    ) {
        const base = String(window.__STRAPI_PUBLIC_URL__).replace(/\/$/, '');
        if (base) return `${base}${rel}`;
    }
    return `${API_URL}${rel}`;
}

/** Load Strapi public origin so /uploads/... resolves to Strapi (not this app - avoids 404 logos). */
async function ensureStrapiPublicUrl() {
    if (typeof window === 'undefined') return;
    if (window.__STRAPI_PUBLIC_URL__ !== undefined) return;
    window.__STRAPI_PUBLIC_URL__ = '';
    try {
        const r = await fetch(`${API_URL}/api/config`);
        if (!r.ok) return;
        const j = await r.json();
        const u = j.strapiPublicUrl;
        if (u && typeof u === 'string') {
            window.__STRAPI_PUBLIC_URL__ = u.replace(/\/$/, '');
        }
    } catch {
        /* offline / no proxy */
    }
}

/**
 * R2 / some CDNs block or flake on <img src> from the page origin; load via our /api/media-proxy (same origin).
 * Relative /uploads paths are unchanged (handled by resolveMediaUrl + uploads proxy).
 */
function sameOriginMediaProxyUrl(absoluteUrl) {
    if (absoluteUrl == null || absoluteUrl === '') return '';
    const s = String(absoluteUrl).trim();
    if (!/^https?:\/\//i.test(s)) return s;
    if (typeof window === 'undefined') return s;
    try {
        const u = new URL(s);
        const api = new URL(API_URL);
        if (u.origin === api.origin) return s;
        const host = u.hostname.toLowerCase();
        let strapiHost = '';
        if (window.__STRAPI_PUBLIC_URL__) {
            try {
                strapiHost = new URL(window.__STRAPI_PUBLIC_URL__).hostname.toLowerCase();
            } catch {
                /* ignore */
            }
        }
        const allow =
            host.endsWith('.r2.dev') ||
            host.endsWith('.r2.cloudflarestorage.com') ||
            (strapiHost && host === strapiHost) ||
            host.includes('amazonaws.com') ||
            host.includes('cloudfront.net');
        if (!allow) return s;
        return `${API_URL}/api/media-proxy?url=${encodeURIComponent(s)}`;
    } catch {
        return s;
    }
}

function logoImgSrcForDisplay(rawUrl) {
    return sameOriginMediaProxyUrl(rawUrl);
}

/** Absolute media URL from Strapi (flat v5, nested data.attributes, formats). */
function strapiMediaAbsoluteUrl(field) {
    if (field == null || field === '') return '';
    if (typeof field === 'string') {
        const t = field.trim();
        return t ? resolveMediaUrl(t) : '';
    }
    const urls = normalizeStrapiMediaToUrls(field);
    for (const u of urls) {
        const r = resolveMediaUrl(u);
        if (r) return r;
    }
    return '';
}

/** First usable URL from a Strapi media object (formats, data, flat url). */
function logoUrlFromMediaField(field) {
    if (field == null || field === '') return '';
    if (typeof field === 'string') {
        const t = field.trim();
        return t ? resolveMediaUrl(t) : '';
    }
    return strapiMediaAbsoluteUrl(field);
}

/** Logo media on the related Bonus entry (Strapi “Bonuses” type - often the only place Logo is set). */
function collectBonusLogoUrlsForCasinoAttr(attr) {
    if (!attr) return [];
    const bonus = bonusFromSlugMapForCasino(attr);
    if (!bonus) return [];
    const keys = [
        'Logo',
        'logo',
        'BrandLogo',
        'brandLogo',
        'OperatorLogo',
        'operatorLogo',
        'siteLogo',
        'SiteLogo',
    ];
    const out = [];
    const push = (u) => {
        if (u && !out.includes(u)) out.push(u);
    };
    for (const k of keys) {
        pushResolvedMediaUrlsFromField(push, bonus[k]);
    }
    const skip = new Set(['LogoStyle', 'logoStyle']);
    for (const key of Object.keys(bonus)) {
        if (skip.has(key)) continue;
        if (!/(logo|brand|operator|thumbnail|favicon|site_?logo|header_?logo|wordmark)/i.test(key)) continue;
        const val = bonus[key];
        if (typeof val === 'string' && val.length > 0 && !/^https?:\/\//i.test(val.trim())) continue;
        pushResolvedMediaUrlsFromField(push, val);
    }
    return out;
}

/**
 * All distinct logo image URLs (order = hero img fallback chain).
 * Bonus (Bonuses) logos first when present - many sites only upload Logo on the Bonus entry, not Casino.
 */
function collectCasinoLogoUrlsFromApi(attr) {
    if (!attr) return [];
    const out = [];
    const push = (u) => {
        if (u && !out.includes(u)) out.push(u);
    };
    for (const u of collectBonusLogoUrlsForCasinoAttr(attr)) {
        push(u);
    }
    const keys = [
        'Logo',
        'logo',
        'BrandLogo',
        'brandLogo',
        'LogoImage',
        'logoImage',
        'CasinoLogo',
        'casinoLogo',
        'CardLogo',
        'cardLogo',
        'HeroCardLogo',
        'heroCardLogo',
        'siteLogo',
        'SiteLogo',
        'headerLogo',
        'HeaderLogo',
    ];
    for (const k of keys) {
        pushResolvedMediaUrlsFromField(push, attr[k]);
    }
    const skipDynamic = new Set(['LogoStyle', 'logoStyle', 'SEOTitle', 'SEODescription']);
    for (const key of Object.keys(attr)) {
        if (skipDynamic.has(key)) continue;
        if (!/(logo|brand|operator|thumbnail|favicon|site_?logo|header_?logo|wordmark)/i.test(key)) {
            continue;
        }
        if (key === 'LogoStyle' || key === 'logoStyle') continue;
        const val = attr[key];
        if (typeof val === 'string' && val.length > 0 && !/^https?:\/\//i.test(val.trim())) continue;
        pushResolvedMediaUrlsFromField(push, val);
    }
    return out;
}

function getLogoUrl(attr) {
    const urls = collectCasinoLogoUrlsFromApi(attr);
    const raw = urls[0] || '';
    return raw ? logoImgSrcForDisplay(raw) : '';
}

/**
 * Second request with explicit Logo populate - some Strapi versions omit media URLs with populate=* only.
 */
async function fetchCasinoAttrsWithDeepLogo(slug) {
    if (!slug) return null;
    /* Strapi v5 rejects nested populate[Logo][populate]=* on many schemas - use populate=* only (same as fetchCasinoBySlug). */
    const variants = [
        `filters[Slug][$eqi]=${encodeURIComponent(slug)}&populate=*&pagination[limit]=1`,
        `filters[slug][$eqi]=${encodeURIComponent(slug)}&populate=*&pagination[limit]=1`,
    ];
    for (const qs of variants) {
        try {
            const res = await fetchCasinosWithBonusPopulate(qs);
            const json = await res.json();
            if (!res.ok || !json.data?.[0]) continue;
            const a = attrFromCasinoEntry(json.data[0]);
            if (getLogoUrl(a)) return a;
        } catch {
            /* ignore network */
        }
    }
    return null;
}

function formatTierRank(rank) {
    const n = Number(rank);
    if (!Number.isFinite(n) || n < 1) return 'N/A';
    const r = Math.floor(n);
    return r > 99 ? String(r) : String(r).padStart(2, '0');
}

/** Homepage list position as ordinal only (no duplicate 01 / 02) */
function homeRankOrdinal(listPos) {
    if (listPos === 1) return '1st';
    if (listPos === 2) return '2nd';
    if (listPos === 3) return '3rd';
    if (listPos === 4) return '4th';
    if (listPos === 5) return '5th';
    const n = Math.floor(Number(listPos));
    return Number.isFinite(n) && n > 0 ? `${n}th` : 'N/A';
}

function homeTierCardPodiumClass(listPos) {
    if (listPos >= 1 && listPos <= 3) {
        return ` tier-card--podium tier-card--podium-${listPos}`;
    }
    return '';
}

function listingRankPickLabel(listPos) {
    return `${homeRankOrdinal(listPos)} Pick`;
}

function reviewRankPanelClass(listPos) {
    if (listPos >= 1 && listPos <= 3) {
        return `review-rank-panel review-rank-panel--p${listPos}`;
    }
    return 'review-rank-panel review-rank-panel--default';
}

/** Unified rank badge + logo panel for casino listing and tier cards. */
function renderReviewRankPanelHtml({ listPos, attr, logoUrl, isVerified, totalInList }) {
    const name = escapeHtml(attr.Name || '');
    const pickLabel = escapeHtml(listingRankPickLabel(listPos));
    const ariaLabel = totalInList
        ? `Rank ${listPos} of ${totalInList} on this list`
        : `Rank ${listPos} in this list`;
    const logoMatIsDark = providerLogoMatIsDark(attr);
    const logoMatClass = logoMatIsDark
        ? 'review-rank-panel__logo--mat-dark'
        : 'review-rank-panel__logo--mat-light';
    const logoHtml = logoUrl
        ? `<img class="review-rank-panel__logo-img" src="${escapeHtml(logoUrl)}" alt="${name}" loading="lazy" decoding="async">`
        : `<span class="review-rank-panel__logo-fallback review-rank-panel__logo-fallback--${logoMatIsDark ? 'dark' : 'light'}">${name}</span>`;
    const verifiedHtml = isVerified
        ? `<span class="review-rank-panel__verified" title="Tier One verified" aria-label="Verified Tier One casino"><i data-lucide="check" aria-hidden="true"></i></span>`
        : '<span class="review-rank-panel__verified-spacer" aria-hidden="true"></span>';

    return `
        <div class="${reviewRankPanelClass(listPos)}" aria-label="${escapeHtml(ariaLabel)}">
            <div class="review-rank-panel__header">
                <span class="review-rank-panel__pick-badge">${pickLabel}</span>
                ${verifiedHtml}
            </div>
            <div class="review-rank-panel__logo ${logoMatClass}">
                ${logoHtml}
            </div>
        </div>`;
}

const TIER_PROS_CAP = 3;
const TIER_CONS_CAP = 2;

/** Two-column highlights / drawbacks with optional expand for long lists */
function renderCasinoProsConsHTML(prosArr, consArr) {
    const pros = prosArr || [];
    const cons = consArr || [];
    const proLi = (p, i) =>
        `<li class="pro tier-pros-item ${i >= TIER_PROS_CAP ? 'tier-extra' : ''}"><i data-lucide="check-circle-2"></i> ${p.Text}</li>`;
    const conLi = (c, i) =>
        `<li class="con tier-cons-item ${i >= TIER_CONS_CAP ? 'tier-extra' : ''}"><i data-lucide="x-circle"></i> ${c.Text}</li>`;
    const prosHtml = pros.map((p, i) => proLi(p, i)).join('');
    const consHtml = cons.map((c, i) => conLi(c, i)).join('');
    const hasMore = pros.length > TIER_PROS_CAP || cons.length > TIER_CONS_CAP;
    const total = pros.length + cons.length;
    return `
    <div class="tier-pros-cons${hasMore ? '' : ' tier-pros-cons--full'}">
      <div class="pros-cons-grid-2col">
        <div class="pros-cons-col">
          <span class="pros-cons-col-label">Highlights</span>
          <ul class="pros-cons pros-list">${prosHtml}</ul>
        </div>
        <div class="pros-cons-col">
          <span class="pros-cons-col-label">Drawbacks</span>
          <ul class="pros-cons cons-list">${consHtml}</ul>
        </div>
      </div>
      ${hasMore ? `<button type="button" class="tier-expand-btn" aria-expanded="false" data-total="${total}"><span class="tier-expand-label">Show all (${total} points)</span><i data-lucide="chevron-down" class="tier-expand-chevron"></i></button>` : ''}
    </div>`;
}

function wireTierProsConsExpand(root) {
    root.querySelectorAll('.tier-expand-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const wrap = btn.closest('.tier-pros-cons');
            if (!wrap) return;
            const expanded = wrap.classList.toggle('is-expanded');
            btn.setAttribute('aria-expanded', expanded);
            const label = btn.querySelector('.tier-expand-label');
            const total = btn.getAttribute('data-total') || '';
            if (label) {
                label.textContent = expanded ? 'Show less' : `Show all (${total} points)`;
            }
        });
    });
}

/** Homepage tier cards: info icon expands clamped bonus terms (when present). */
function wireTierCasinoBonusPanels(root) {
    root.querySelectorAll('.tier-card--casino .tier-bonus .info-btn').forEach((btn) => {
        const panel = btn.closest('.tier-bonus');
        const terms = panel && panel.querySelector('.bonus-terms');
        if (!terms || !String(terms.textContent || '').trim()) return;
        btn.addEventListener('click', () => {
            const expanded = terms.classList.toggle('bonus-terms--expanded');
            btn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    });
}

/** Flatten Strapi string / number / rich-text blocks to plain text for parsing. */
function ratingLabelToString(label) {
    if (label == null || label === '') return '';
    if (typeof label === 'number' && Number.isFinite(label)) return String(label);
    if (typeof label === 'string') return label;
    if (Array.isArray(label)) {
        return label.map(ratingLabelToString).filter(Boolean).join(' ');
    }
    if (typeof label === 'object') {
        if (typeof label.text === 'string') return label.text;
        if (Array.isArray(label.children)) {
            return label.children.map(ratingLabelToString).filter(Boolean).join('');
        }
        if (Array.isArray(label.blocks)) {
            return label.blocks.map(ratingLabelToString).filter(Boolean).join(' ');
        }
        try {
            return JSON.stringify(label);
        } catch (e) {
            return '';
        }
    }
    return String(label);
}

/** Map RatingLabel to 0-5. Prefer a/b ratios; avoid taking the first digit in strings like "5 stars, 4.7". */
function parseRatingToFive(ratingLabel) {
    const flat = ratingLabelToString(ratingLabel);
    if (flat === '') return 5;
    const s = flat.trim();
    const ratio = s.match(/([\d.,]+)\s*\/\s*([\d.,]+)/);
    if (ratio) {
        const num = parseFloat(ratio[1].replace(',', '.'));
        const den = parseFloat(ratio[2].replace(',', '.'));
        if (den > 0 && !Number.isNaN(num)) {
            return Math.min(5, Math.max(0, (num / den) * 5));
        }
    }
    const outOf = s.match(/([\d.,]+)\s*out\s*of\s*([\d.,]+)/i);
    if (outOf) {
        const num = parseFloat(outOf[1].replace(',', '.'));
        const den = parseFloat(outOf[2].replace(',', '.'));
        if (den > 0 && !Number.isNaN(num)) {
            return Math.min(5, Math.max(0, (num / den) * 5));
        }
    }
    const tokenRe = /(?:\d+[.,]\d+|\d+)/g;
    const tokens = s.match(tokenRe);
    if (tokens && tokens.length) {
        const nums = tokens
            .map((t) => parseFloat(t.replace(',', '.')))
            .filter((n) => Number.isFinite(n) && n > 0 && n <= 10);
        if (nums.length) {
            const last = nums[nums.length - 1];
            if (last <= 5) return Math.min(5, Math.max(0, last));
            return Math.min(5, Math.max(0, (last / 10) * 5));
        }
    }
    return 5;
}

/** Coerce Strapi number / decimal / string / { value } to a finite number, or null. */
function coerceToNumber(raw) {
    if (raw == null || raw === '') return null;
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
    if (typeof raw === 'object' && raw !== null) {
        if ('value' in raw && raw.value != null) return coerceToNumber(raw.value);
        if ('data' in raw && raw.data != null) return coerceToNumber(raw.data);
    }
    const s = String(raw).trim();
    const m = s.match(/-?\d+(?:[.,]\d+)?/);
    if (m) return parseFloat(m[0].replace(',', '.'));
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
}

/** Strapi decimal to 0-5 star scale. Values in (5,10] are treated as out of 10. */
function normalizeToFiveStarScale(raw) {
    const n = coerceToNumber(raw);
    if (n == null) return null;
    if (n > 5 && n <= 10) return Math.min(5, Math.max(0, (n / 10) * 5));
    return Math.min(5, Math.max(0, n));
}

/** Display rating without unnecessary decimals (5 not 5.00; 4.9 not 4.90). */
function formatRatingNumber(value) {
    const n = coerceToNumber(value);
    if (n == null || !Number.isFinite(n)) return '';
    const rounded = Math.round(n * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatRatingSlashFive(value) {
    const num = formatRatingNumber(value);
    return num ? `${num}/5` : '';
}

/**
 * Curator score on a 0-5 scale for display (no default when data is missing).
 * Used on the casino review page ring and headline.
 */
function getCuratorScoreOutOfFive(attr) {
    if (!attr || typeof attr !== 'object') return null;
    const fromRatingScore = normalizeToFiveStarScale(
        attr.RatingScore ?? attr.ratingScore ?? attr.rating_score,
    );
    if (fromRatingScore != null) return fromRatingScore;

    const labelRaw = attr.RatingLabel ?? attr.ratingLabel;
    const labelText = ratingLabelToString(labelRaw);
    const labelHasDigit = labelText !== '' && /[\d]/.test(labelText);
    if (labelHasDigit) {
        return parseRatingToFive(labelRaw);
    }
    const raw = attr.Rating ?? attr.rating ?? attr.StarRating ?? attr.starRating ?? attr.Score ?? attr.score;
    const fromLegacy = normalizeToFiveStarScale(raw);
    if (fromLegacy != null) return fromLegacy;

    return null;
}

/**
 * Resolve 0-5 for stars. Strapi field RatingScore is the source of truth when set.
 * Otherwise parse RatingLabel, then legacy Rating / Score fields.
 */
function ratingScoreFromAttr(attr) {
    if (!attr || typeof attr !== 'object') return 5;
    const fromRatingScore = normalizeToFiveStarScale(
        attr.RatingScore ?? attr.ratingScore ?? attr.rating_score
    );
    if (fromRatingScore != null) return fromRatingScore;

    const labelRaw = attr.RatingLabel ?? attr.ratingLabel;
    const labelText = ratingLabelToString(labelRaw);
    const labelHasDigit = labelText !== '' && /[\d]/.test(labelText);
    if (labelHasDigit) {
        return parseRatingToFive(labelRaw);
    }
    const raw = attr.Rating ?? attr.rating ?? attr.StarRating ?? attr.starRating ?? attr.Score ?? attr.score;
    const fromLegacy = normalizeToFiveStarScale(raw);
    if (fromLegacy != null) return fromLegacy;

    const tail = parseRatingToFive(labelRaw);
    return Number.isFinite(tail) ? tail : 5;
}

/** Short number for hero / curator chip - always 0-5 scale when numeric. */
function formatRatingScoreHeadline(attr) {
    const v = getCuratorScoreOutOfFive(attr);
    if (v == null) return 'N/A';
    return formatRatingNumber(v) || 'N/A';
}

/** Line next to stars on cards: "4.7 / 5" or label text. */
function formatRatingScoreLine(attr, emptyFallback = '5 / 5') {
    const raw = attr.RatingScore ?? attr.ratingScore ?? attr.rating_score;
    const n = coerceToNumber(raw);
    if (n != null) {
        const v5 = normalizeToFiveStarScale(raw);
        if (v5 != null) return `${formatRatingNumber(v5)} / 5`;
    }
    const lab = attr.RatingLabel ?? attr.ratingLabel;
    if (lab != null && String(lab).trim() !== '') return ratingLabelToString(lab);
    return emptyFallback;
}

/** "4.9" + " / 5" split for typographic emphasis on provider cards. */
function formatRatingScoreLineRich(attr, emptyFallback = '5 / 5') {
    const line = formatRatingScoreLine(attr, emptyFallback);
    const m = line.match(/^([\d.]+)(\s*\/\s*\d+(?:\.\d+)?)$/);
    if (m) {
        return `<span class="tier-rating-score"><strong class="tier-rating-num">${m[1]}</strong><span class="tier-rating-denom">${m[2]}</span></span>`;
    }
    return `<span class="tier-rating-score tier-rating-score--plain">${line}</span>`;
}

function providerTierBadgeClass(attr) {
    const b = (attr.TierBadge || '').trim().toUpperCase();
    if (b.includes('INNOVATOR')) return 'tier-provider-badge--innovator';
    if (b.includes('TOP')) return 'tier-provider-badge--top';
    return 'tier-provider-badge--default';
}

/**
 * Five separate star cells (0-5 scale). Star i is filled by min(100%, max(0, (score - (i - 1)) * 100%)).
 * e.g. 4.9: four full gold + fifth at 90%.
 */
function renderStars(attrOrLabel) {
    let score;
    if (typeof attrOrLabel === 'number' && Number.isFinite(attrOrLabel)) {
        score = attrOrLabel;
    } else if (attrOrLabel != null && typeof attrOrLabel === 'object' && !Array.isArray(attrOrLabel)) {
        score = ratingScoreFromAttr(attrOrLabel);
    } else {
        score = parseRatingToFive(attrOrLabel);
    }
    const s = Number.isFinite(score) ? Math.max(0, Math.min(5, score)) : 0;
    const aria = `${formatRatingNumber(s)} out of 5 stars`;
    let units = '';
    for (let i = 1; i <= 5; i++) {
        const fillPct = Math.min(100, Math.max(0, (s - (i - 1)) * 100));
        const fp = Number.isFinite(fillPct) ? (fillPct >= 99.5 ? 100 : fillPct) : 0;
        units += `<span class="star-unit"><span class="star-unit__track" aria-hidden="true">★</span><span class="star-unit__fill" style="width:${fp}%"><span class="star-unit__fill-inner" aria-hidden="true">★</span></span></span>`;
    }
    return `<span class="stars-meter stars-meter--units" role="img" aria-label="${aria}">${units}</span>`;
}

/** User-facing copy when listings fail to load — same tone as empty states, no technical detail. */
const CONTENT_EMPTY_MESSAGES = {
    casinos: 'No casinos found yet.',
    providers: 'No providers found yet.',
    slots: 'No slots found yet.',
    bonuses: 'No bonuses published yet.',
    guides: 'No guides yet. Check back soon.',
    news: 'No news posts yet. Check back soon.',
    default: 'Nothing to show here yet. Check back soon.',
};

function contentEmptyMessage(kind) {
    return CONTENT_EMPTY_MESSAGES[kind] || CONTENT_EMPTY_MESSAGES.default;
}

function apiErrorMessage(_status, _json, kind) {
    return contentEmptyMessage(kind);
}

/**
 * Footer loads asynchronously (`<site-footer>`). Wire FAQ accordions (if present) + Lucide icons.
 */
document.addEventListener('site-footer-loaded', (e) => {
    const root = e.detail?.root;
    if (!root) return;
    root.querySelectorAll('.accordion-header').forEach((header) => {
        if (header.dataset.footerAccordionWired) return;
        header.dataset.footerAccordionWired = '1';
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isActive = item && item.classList.contains('active');
            root.querySelectorAll('.accordion-item').forEach((acc) => {
                acc.classList.remove('active');
                const h = acc.querySelector('.accordion-header');
                if (h) h.setAttribute('aria-expanded', 'false');
            });
            if (!isActive && item) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root });
});

async function loadCasinos() {
    const container = document.getElementById('casinos-container');
    if (!container) return;
    container.innerHTML = skeletonGridHtml('tier-card', HOME_TIER_ONE_CASINOS_LIMIT);
    try {
        const res = await fetchCasinosWithBonusPopulate(
            `populate=*&sort=Rank:asc&pagination[limit]=${HOME_TIER_ONE_CASINOS_LIMIT}`,
        );
        const json = await res.json();
        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center; padding: 40px; color: #64748b;">${apiErrorMessage(res.status, json, 'casinos')}</p>`;
            return;
        }
        const { data } = json;

        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 40px;">No casinos found yet.</p>';
            return;
        }

        const rows = data.slice(0, HOME_TIER_ONE_CASINOS_LIMIT);
        const html = rows.map((c, index) => {
            const attr = attrFromCasinoEntry(c);
            const listPos = index + 1;
            const logoUrl = getLogoUrl(attr);
            const prosConsHtml = renderCasinoProsConsHTML(attr.Pros, attr.Cons);
            const editorChip = attr.IsTierOne
                ? '<span class="tier-editor-chip">Editor\'s pick</span>'
                : '';
            const visitHref = escapeHtml(casinoVisitSiteHref(attr));
            const visitRel = casinoVisitSiteIsExternal(attr)
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
            const hasPromo = casinoListedPromoHasDetail(attr);
            const amtRaw = String(casinoBonusAmountDisplay(attr) || '').trim();
            const termsRaw = casinoBonusTermsDisplay(attr);
            const termsTrim = String(termsRaw || '').trim();
            const labelLine = String(casinoBonusLabelDisplay(attr) || '').trim() || 'Welcome offer';
            const amountHtml = amtRaw
                ? `<h4 class="bonus-amount">${escapeHtml(amtRaw)}</h4>`
                : '';
            const termsHtml = termsTrim
                ? `<p class="terms bonus-terms">${escapeHtml(termsRaw)}</p>`
                : '';
            const infoBtn = termsTrim
                ? `<button type="button" class="info-btn" aria-label="Show full bonus terms" aria-expanded="false" title="Bonus terms"><i data-lucide="info"></i></button>`
                : '';
            const bonusColHtml = hasPromo
                ? `<div class="tier-bonus__top-icon" aria-hidden="true"><i data-lucide="gift"></i></div>
                        <span class="bonus-label">${escapeHtml(labelLine)}</span>
                        ${amountHtml}
                        <div class="bonus-actions">
                            <a href="${visitHref}" class="btn btn-primary btn-block btn-visit-site"${visitRel}><i data-lucide="external-link" aria-hidden="true"></i><span>VISIT SITE</span></a>
                            ${infoBtn}
                        </div>
                        ${termsHtml}`
                : `<div class="tier-bonus__top-icon tier-bonus__top-icon--muted" aria-hidden="true"><i data-lucide="circle-alert"></i></div>
                        <span class="tier-bonus__eyebrow">No welcome offer on file</span>
                        <p class="tier-bonus__no-offer-msg">We don’t list a bonus for this operator. Check their site for current promotions.</p>
                        <div class="bonus-actions bonus-actions--solo">
                            <a href="${visitHref}" class="btn btn-primary btn-block btn-visit-site"${visitRel}><i data-lucide="external-link" aria-hidden="true"></i><span>VISIT SITE</span></a>
                        </div>`;
            return `
                <div class="tier-card tier-card--casino active${homeTierCardPodiumClass(listPos)}">
                    <div class="tier-rank-logo-col">
                        ${renderReviewRankPanelHtml({
                            listPos,
                            attr,
                            logoUrl,
                            isVerified: !!attr.IsTierOne,
                            totalInList: rows.length,
                        })}
                    </div>
                    <div class="tier-info">
                        <div class="tier-head-row">
                            <div class="tier-head-left">
                                <div class="info-header">
                                    <h3>${attr.Name || ''}</h3>
                                    ${editorChip}
                                </div>
                            </div>
                            <div class="tier-head-right">
                                <div class="rating-row rating-row--stack rating-row--trailing">
                                    <div class="stars">${renderStars(attr)}</div>
                                    <span class="rating-text">${formatRatingScoreLine(attr, 'RATED')}</span>
                                </div>
                            </div>
                        </div>
                        <div class="tier-payments-strip" aria-label="Typical payment methods">
                            <span class="tier-payments-label">Payments</span>
                            <div class="tier-payments-chips">
                                ${renderCasinoPaymentChipsHtml(attr)}
                            </div>
                        </div>
                        ${prosConsHtml}
                    </div>
                    <div class="tier-bonus${hasPromo ? '' : ' tier-bonus--no-offer'}">
                        ${bonusColHtml}
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = html;
        wireTierProsConsExpand(container);
        wireTierCasinoBonusPanels(container);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p style="text-align:center; padding: 40px; color: #64748b;">${contentEmptyMessage('casinos')}</p>`;
    }
}

async function loadProviders() {
    const container = document.getElementById('providers-container');
    if (!container) return;
    container.innerHTML = skeletonGridHtml('tier-card', HOME_TOP_PROVIDERS_LIMIT);
    try {
        const res = await fetch(
            `${API_URL}/api/providers?populate=*&sort=Rank:asc&pagination[limit]=${HOME_TOP_PROVIDERS_LIMIT}`
        );
        const json = await res.json();
        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center; padding: 40px; color: #64748b;">${apiErrorMessage(res.status, json, 'providers')}</p>`;
            return;
        }
        const { data } = json;
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding: 40px;">No providers found yet.</p>';
            return;
        }

        const rows = data.slice(0, HOME_TOP_PROVIDERS_LIMIT);
        const html = rows.map((p, index) => {
            const attr = p.attributes || p;
            const listPos = index + 1;
            const pros = (attr.KeyStrengths || [])
                .map((x) => `<li class="pro"><i data-lucide="check-circle-2"></i> ${escapeHtml(x.Text || '')}</li>`)
                .join('');
            const icons = (attr.ExpertiseIcons || []).map((i) => `<i data-lucide="${escapeHtml(i.LucideIconName || 'circle')}"></i>`).join('');
            const logoUrl = getProviderCardImageUrl(attr);
            const badgeClass = providerTierBadgeClass(attr);
            const nameSafe = escapeHtml(attr.Name || '');
            const portfolioCount = String(attr.GamePortfolioCount || '').trim();
            const hasPortfolioCount = !!portfolioCount;
            const dossierHref = attr.Slug
                ? escapeHtml(providerPath(attr.Slug))
                : escapeHtml(String(attr.DossierLink || '#'));
            const dossierRel = attr.Slug ? '' : ' target="_blank" rel="noopener noreferrer"';
            const portfolioColHtml = hasPortfolioCount
                ? `<div class="tier-bonus__top-icon tier-bonus__top-icon--provider" aria-hidden="true"><i data-lucide="library-big"></i></div>
                        <span class="bonus-label">Game portfolio</span>
                        <h4 class="bonus-amount">${escapeHtml(portfolioCount)}</h4>
                        <div class="bonus-actions bonus-actions--solo">
                            <a href="${dossierHref}" class="btn btn-outline btn-block btn-dossier"${dossierRel}><i data-lucide="book-open" aria-hidden="true"></i><span>READ DOSSIER</span></a>
                        </div>`
                : `<div class="tier-bonus__top-icon tier-bonus__top-icon--muted" aria-hidden="true"><i data-lucide="library-big"></i></div>
                        <span class="tier-bonus__eyebrow">Portfolio size</span>
                        <p class="tier-bonus__no-offer-msg">We don’t have a game count on file. Open the dossier for flagship titles and expertise.</p>
                        <div class="bonus-actions bonus-actions--solo">
                            <a href="${dossierHref}" class="btn btn-outline btn-block btn-dossier"${dossierRel}><i data-lucide="book-open" aria-hidden="true"></i><span>READ DOSSIER</span></a>
                        </div>`;

            return `
                <div class="tier-card tier-card--provider active${homeTierCardPodiumClass(listPos)}">
                    <div class="tier-rank-logo-col">
                        ${renderReviewRankPanelHtml({
                            listPos,
                            attr,
                            logoUrl,
                            isVerified: !!attr.IsTopProvider,
                            totalInList: rows.length,
                        })}
                    </div>
                    <div class="tier-info">
                        <div class="tier-provider-head">
                            <div class="info-header"><h3>${nameSafe}</h3></div>
                            <div class="tier-provider-meta">
                                <div class="stars">${renderStars(attr)}</div>
                                ${formatRatingScoreLineRich(attr, 'N/A')}
                                <span class="tier-provider-badge ${badgeClass}">${escapeHtml(attr.TierBadge || 'PROVIDER')}</span>
                            </div>
                        </div>
                        <ul class="pros-cons">${pros}</ul>
                    </div>
                    <div class="tier-features">
                        <span class="col-label">Flagship games</span>
                        <div style="font-size: 0.85rem; font-weight: 600; color: #0f172a; margin-bottom: 24px;">${escapeHtml(attr.FlagshipTitles || '')}</div>
                        <span class="col-label mt">EXPERTISE</span>
                        <div class="icon-row">${icons}</div>
                    </div>
                    <div class="tier-bonus tier-bonus--provider${hasPortfolioCount ? '' : ' tier-bonus--no-offer'}">
                        ${portfolioColHtml}
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error(e);
        container.innerHTML = `<p style="text-align:center; padding: 40px; color: #64748b;">${contentEmptyMessage('providers')}</p>`;
    }
}

/** Strapi entry → flat attributes (v4 attributes wrapper or v5 flat). Merges top-level id/documentId onto attributes so bonus↔casino maps can match by id (Strapi often keeps ids only on the entry wrapper). */
function attrFromCasinoEntry(entry) {
    if (!entry) return null;
    if (entry.attributes == null) {
        return { ...entry };
    }
    const inner = { ...entry.attributes };
    if (inner.id == null && entry.id != null) inner.id = entry.id;
    if (inner.documentId == null && entry.documentId != null) inner.documentId = entry.documentId;
    return inner;
}

/**
 * Find homepage featured operator (e.g. BK8) in a casinos list without relying on Strapi filters.
 * Matches Slug (case-insensitive), slug prefixes, or whole-word name match.
 */
function findFeaturedCasinoInList(rows, slugWant) {
    if (!Array.isArray(rows) || !slugWant) return null;
    const want = String(slugWant).trim().toLowerCase();
    const esc = want.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRe = new RegExp(`\\b${esc}\\b`, 'i');

    for (const row of rows) {
        const a = attrFromCasinoEntry(row);
        if (!a) continue;
        const s = firstNonEmptyAttr(a, ['Slug', 'slug', 'URLSlug', 'urlSlug'])
            .trim()
            .toLowerCase();
        if (s === want) return a;
        if (s.startsWith(`${want}-`) || s.startsWith(`${want}_`)) return a;
    }
    for (const row of rows) {
        const a = attrFromCasinoEntry(row);
        if (!a) continue;
        const name = String(a.Name || a.name || '').trim();
        if (nameRe.test(name)) return a;
    }
    return null;
}

/** Strapi relation / repeatable component → list of inner attribute objects. */
function strapiRelationToAttrList(raw) {
    if (raw == null) return [];
    const d = raw.data != null ? raw.data : raw;
    const list = Array.isArray(d) ? d : [d];
    return list
        .map((entry) => {
            if (!entry) return null;
            if (entry.attributes) return entry.attributes;
            return entry;
        })
        .filter(Boolean);
}

/** Single language row: relation, component, or plain string (Strapi v4/v5). */
function languageOneLabel(item) {
    if (item == null) return '';
    if (typeof item !== 'object') return String(item).trim();
    const inner = item.attributes != null ? item.attributes : item;
    return firstNonEmptyAttr(inner, [
        'Name',
        'name',
        'Title',
        'title',
        'Label',
        'label',
        'Text',
        'text',
        'Language',
        'language',
        'Code',
        'code',
    ]);
}

/**
 * Languages field: string, repeatable component (Text), or relation(s) to a Language collection.
 * Avoids firstNonEmptyAttr on objects (which yields "[object Object]").
 */
function casinoLanguagesDisplay(attr) {
    if (!attr || typeof attr !== 'object') return '';
    const keys = ['Languages', 'SupportedLanguages', 'languages', 'language', 'Language'];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (typeof v === 'string') {
            const s = v.trim();
            if (s) return s;
            continue;
        }
        if (Array.isArray(v)) {
            const parts = v.map(languageOneLabel).filter(Boolean);
            if (parts.length) return parts.join(', ');
            continue;
        }
        if (typeof v === 'object' && v.data !== undefined) {
            const list = strapiRelationToAttrList(v);
            const parts = list.map(languageOneLabel).filter(Boolean);
            if (parts.length) return parts.join(', ');
            continue;
        }
        if (typeof v === 'object') {
            const one = languageOneLabel(v);
            if (one) return one;
        }
    }
    return '';
}

/**
 * Bonus rows from related collections / components (Strapi often stores these off the flat BonusAmount fields).
 */
function collectBonusLikeObjects(attr) {
    if (!attr || typeof attr !== 'object') return [];
    const keys = [
        'bonuses',
        'Bonuses',
        'casino_bonuses',
        'CasinoBonuses',
        'casinoBonuses',
        'bonus',
        'Bonus',
        'promotions',
        'Promotions',
        'welcome_bonuses',
        'WelcomeBonuses',
        'bonus_offers',
        'BonusOffers',
    ];
    const out = [];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (Array.isArray(v)) {
            for (const row of v) {
                if (!row) continue;
                out.push(row.attributes != null ? row.attributes : row);
            }
            continue;
        }
        out.push(...strapiRelationToAttrList(v));
    }
    return out;
}

function bonusFieldPlain(val) {
    if (val == null || val === '') return '';
    if (typeof val === 'object' && val !== null && val.type === 'doc') {
        return richTextToPlainText(val);
    }
    return String(val).trim();
}

/**
 * Related Casino from a Bonus entry (Strapi v4/v5 shapes: .data, arrays, flat).
 */
function getRelatedCasinoFromBonus(attr) {
    if (!attr || typeof attr !== 'object') return null;
    const keys = ['casino', 'Casino', 'operator', 'Operator', 'site', 'casinos', 'brand', 'Brand'];
    for (const k of keys) {
        const raw = attr[k];
        if (raw == null) continue;
        const d = raw.data !== undefined ? raw.data : raw;
        if (d == null) continue;
        const row = Array.isArray(d) ? d[0] : d;
        if (!row || typeof row !== 'object') continue;
        const rid = row.id ?? row.documentId;
        const a = row.attributes != null ? { ...row.attributes } : { ...row };
        if (rid != null) a.__relationId = rid;
        if (a.id == null && row.id != null) a.id = row.id;
        if (a.documentId == null && row.documentId != null) a.documentId = row.documentId;
        if (a.Name || a.name || a.Slug || a.slug || a.Title) return a;
    }
    return null;
}

function buildCasinoSlugToBonusMap(rows) {
    const map = new Map();
    const list = [...(rows || [])]
        .map((row) => bonusEntryAttr(row))
        .filter(Boolean)
        .sort((a, b) => Number(a.Rank ?? 999) - Number(b.Rank ?? 999));
    const gotSlug = new Set();
    const gotId = new Set();
    for (const b of list) {
        const casino = getRelatedCasinoFromBonus(b);
        if (!casino) continue;
        const slug = firstNonEmptyAttr(casino, ['Slug', 'slug', 'URLSlug', 'urlSlug'])
            .trim()
            .toLowerCase();
        const idCandidates = new Set();
        const pushId = (v) => {
            if (v == null || v === '') return;
            idCandidates.add(String(v));
            const n = Number(v);
            if (Number.isFinite(n)) idCandidates.add(String(n));
        };
        pushId(casino.__relationId);
        pushId(casino.id);
        pushId(casino.documentId);
        if (slug && !gotSlug.has(slug)) {
            gotSlug.add(slug);
            map.set(slug, b);
        }
        for (const rid of idCandidates) {
            if (gotId.has(rid)) continue;
            gotId.add(rid);
            map.set(`id:${rid}`, b);
        }
    }
    return map;
}

async function fetchBonusesIndexData() {
    /* Bonus type may not have Rank - use publishedAt / createdAt only. */
    /* `populate=*` returns Logo + related casino on this schema; nested populate[casino][populate] can 500 - keep safest queries first. */
    const tries = [
        `populate=*&sort=publishedAt:desc&pagination[limit]=${BONUSES_PAGE_SIZE}`,
        `populate=*&sort=createdAt:desc&pagination[limit]=${BONUSES_PAGE_SIZE}`,
        `populate=*&pagination[limit]=${BONUSES_PAGE_SIZE}`,
        `populate[casino][populate]=*&populate[CoverImage][populate]=*&populate[Image][populate]=*&sort=publishedAt:desc&pagination[limit]=${BONUSES_PAGE_SIZE}`,
    ];
    for (const qs of tries) {
        const res = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?${qs}`);
        let json;
        try {
            json = await res.json();
        } catch {
            continue;
        }
        if (!res.ok) continue;
        const rows = json.data || [];
        return {
            res,
            json,
            rows,
            map: buildCasinoSlugToBonusMap(rows),
        };
    }
    return { res: null, json: null, rows: [], map: new Map() };
}

function bonusSlugValue(attr) {
    if (!attr) return '';
    return String(firstNonEmptyAttr(attr, ['Slug', 'slug']) || '')
        .trim()
        .toLowerCase();
}

/**
 * Fetch one bonus by Slug. Tries common Strapi filter shapes, then scans the bonuses list.
 */
async function fetchBonusBySlug(slug) {
    const wanted = decodeURIComponent(String(slug)).trim().toLowerCase();
    const pop = 'populate=*&pagination[pageSize]=10&pagination[page]=1';
    const qsVariants = [
        `filters[Slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[Slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
    ];
    let last = { res: null, json: null };
    for (const qs of qsVariants) {
        try {
            const res = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?${qs}`);
            let json;
            try {
                json = await res.json();
            } catch {
                continue;
            }
            last = { res, json };
            if (res.ok && json.data && json.data.length > 0) {
                return last;
            }
            if (res.status === 400 || res.status === 404) continue;
            if (!res.ok) break;
        } catch {
            continue;
        }
    }

    try {
        const listRes = await fetch(
            `${API_URL}/api/${BONUSES_API_COLLECTION}?populate=*&sort=publishedAt:desc&pagination[limit]=${BONUSES_PAGE_SIZE}`,
        );
        const listJson = await listRes.json();
        last = { res: listRes, json: listJson };
        if (!listRes.ok || !listJson.data) return last;
        const found = (listJson.data || []).find((e) => bonusSlugValue(bonusEntryAttr(e)) === wanted);
        if (found) {
            return { res: listRes, json: { data: [found], meta: listJson.meta } };
        }
    } catch (e) {
        console.warn('fetchBonusBySlug list fallback failed', e);
    }
    return last;
}

function formatBonusDateDisplay(value) {
    if (value == null || value === '') return '';
    try {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return String(value);
    }
}

/**
 * Guide post body: Strapi blocks JSON, raw HTML, or markdown string (uses `marked` on post.html).
 */
function postBodyToHtmlForGuide(raw) {
    if (raw == null) return '';
    if (typeof raw === 'object' && raw !== null && raw.type === 'doc') {
        return richTextToHtml(raw) || '';
    }
    if (typeof raw === 'string') {
        const t = raw.trim();
        if (!t) return '';
        if (t.startsWith('{') && t.includes('"type"') && t.includes('"doc"')) {
            try {
                const parsed = JSON.parse(t);
                if (parsed && parsed.type === 'doc') return richTextToHtml(parsed) || '';
            } catch {
                /* fall through */
            }
        }
        const unwrapped = unwrapMarkdownWrappedInParagraphHtml(t);
        const markdownSource = looksLikeMarkdown(unwrapped)
            ? unwrapped
            : looksLikeMarkdown(t)
              ? t
              : null;
        if (
            markdownSource &&
            typeof marked !== 'undefined' &&
            marked &&
            typeof marked.parse === 'function'
        ) {
            return marked.parse(markdownSource, { breaks: true, gfm: true });
        }
        if (/<[a-z][\s\S]*>/i.test(t)) return t;
        if (typeof marked !== 'undefined' && marked && typeof marked.parse === 'function') {
            return marked.parse(t, { breaks: true, gfm: true });
        }
        return plainTextToParagraphsHtml(t);
    }
    return '';
}

/** Bonus `FullTerms` field (markdown) → HTML (uses `marked` on bonus.html). */
function bonusFullTermsToHtml(raw) {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';
    if (typeof marked !== 'undefined' && marked && typeof marked.parse === 'function') {
        return `<div class="rich-text-body bonus-terms-md">${marked.parse(s, { breaks: true })}</div>`;
    }
    return plainTextToParagraphsHtml(s);
}

async function ensureCasinoBonusSlugMap() {
    if (casinoBonusSlugMapCache) return casinoBonusSlugMapCache;
    try {
        const { map, rows } = await fetchBonusesIndexData();
        casinoBonusSlugMapCache = map;
        bonusesListRowsCache = rows;
    } catch (e) {
        console.warn('ensureCasinoBonusSlugMap:', e);
        casinoBonusSlugMapCache = new Map();
        bonusesListRowsCache = [];
    }
    return casinoBonusSlugMapCache;
}

function bonusFromSlugMapForCasino(attr) {
    if (!casinoBonusSlugMapCache || !attr) return null;
    const map = casinoBonusSlugMapCache;
    const slug = casinoSlugNormalized(attr);
    if (slug && map.has(slug)) {
        return map.get(slug);
    }
    const keys = [];
    for (const v of [attr.id, attr.documentId]) {
        if (v == null || v === '') continue;
        keys.push(String(v));
        const n = Number(v);
        if (Number.isFinite(n)) keys.push(String(n));
    }
    for (const k of keys) {
        if (k === 'NaN') continue;
        const idKey = `id:${k}`;
        if (map.has(idKey)) return map.get(idKey);
    }
    return null;
}

/** Copy Logo from matching Bonus row onto casino attrs when casino media is missing (Strapi split fields). */
function mergeHeroAttrWithBonusLogo(heroAttr) {
    if (!heroAttr) return heroAttr;
    if (logoUrlFromMediaField(heroAttr.Logo) || logoUrlFromMediaField(heroAttr.logo)) return heroAttr;
    const bonus = bonusFromSlugMapForCasino(heroAttr);
    if (!bonus) return heroAttr;
    const fromBonus = bonus.Logo ?? bonus.logo ?? bonus.BrandLogo ?? bonus.brandLogo;
    if (!fromBonus) return heroAttr;
    return { ...heroAttr, Logo: fromBonus };
}

/** First resolvable logo URL for rescue path (raw Strapi media). */
function pickHeroLogoDirectUrl(heroAttr) {
    if (!heroAttr) return '';
    let u = strapiMediaAbsoluteUrl(heroAttr.Logo) || strapiMediaAbsoluteUrl(heroAttr.logo);
    if (u) return u;
    const bonus = bonusFromSlugMapForCasino(heroAttr);
    if (!bonus) return '';
    return strapiMediaAbsoluteUrl(bonus.Logo) || strapiMediaAbsoluteUrl(bonus.logo) || '';
}

/** Re-fetch one casino by slug when populate list omits media. */
async function mergeHeroAttrWithLogoRefetch(heroAttr) {
    if (!heroAttr) return heroAttr;
    if (collectCasinoLogoUrlsFromApi(heroAttr).length > 0) return heroAttr;
    const slug = firstNonEmptyAttr(heroAttr, ['Slug', 'slug', 'URLSlug', 'urlSlug']);
    if (!slug) return heroAttr;
    try {
        const res = await fetchCasinosWithBonusPopulate(
            `filters[Slug][$eqi]=${encodeURIComponent(slug)}&populate=*&pagination[limit]=1`,
        );
        const json = await res.json();
        if (!res.ok || !json.data?.[0]) return heroAttr;
        const fresh = attrFromCasinoEntry(json.data[0]);
        return { ...heroAttr, ...fresh };
    } catch {
        return heroAttr;
    }
}

/**
 * If the hero logo slot is empty but Strapi has a direct Logo URL, inject <img>.
 * (Some CDNs block img until referrerPolicy is set; this runs after apply.)
 */
function rescueHeroLogoIfTextFallback(heroAttr) {
    const logoEl = document.getElementById('hero-logo');
    if (!logoEl || !heroAttr || logoEl.classList.contains('hero-logo--has-image')) return;
    const url = pickHeroLogoDirectUrl(heroAttr);
    if (!url) return;
    logoEl.hidden = false;
    logoEl.classList.remove('hero-logo--text');
    logoEl.classList.add('hero-logo--has-image');
    logoEl.replaceChildren();
    const img = document.createElement('img');
    img.src = logoImgSrcForDisplay(url);
    img.referrerPolicy = 'no-referrer';
    img.className = 'hero-logo-img';
    img.alt = String(heroAttr.Name || '').trim() || 'Casino';
    img.loading = 'eager';
    img.decoding = 'async';
    img.onerror = () => {
        logoEl.classList.remove('hero-logo--has-image');
        logoEl.replaceChildren();
        logoEl.hidden = true;
    };
    logoEl.appendChild(img);
}

function casinoBonusAmountDisplay(attr) {
    if (!attr) return '';
    const indexed = bonusFromSlugMapForCasino(attr);
    if (indexed) {
        const v = firstNonEmptyAttr(indexed, [
            'Amount',
            'Headline',
            'Title',
            'Name',
            'Offer',
            'PromoText',
            'BonusAmount',
            'Text',
            'Summary',
        ]);
        if (v) return bonusFieldPlain(v);
    }
    if (attr.BonusAmount != null && String(attr.BonusAmount).trim() !== '') {
        return String(attr.BonusAmount);
    }
    const fromFlat = firstNonEmptyAttr(attr, [
        'bonusAmount',
        'WelcomeBonus',
        'PromoAmount',
        'BonusHeadline',
        'HeadlineBonus',
        'OfferAmount',
    ]);
    if (fromFlat) return fromFlat;
    for (const b of collectBonusLikeObjects(attr)) {
        const line = firstNonEmptyAttr(b, [
            'Amount',
            'amount',
            'Headline',
            'headline',
            'Title',
            'title',
            'Value',
            'value',
            'PromoText',
            'promoText',
            'Offer',
            'offer',
            'Text',
            'text',
            'Description',
            'description',
            'Summary',
            'summary',
        ]);
        if (line) return bonusFieldPlain(line);
    }
    return '';
}

function casinoBonusLabelDisplay(attr) {
    if (!attr) return '';
    const indexed = bonusFromSlugMapForCasino(attr);
    if (indexed) {
        const t = firstNonEmptyAttr(indexed, [
            'BonusLabel',
            'Label',
            'Subtitle',
            'Type',
            'BonusHeading',
            'Category',
            'ShortLabel',
        ]);
        if (t) return bonusFieldPlain(t);
    }
    const flat = firstNonEmptyAttr(attr, ['BonusLabel', 'BonusHeading', 'WelcomePackageLabel']);
    if (flat) return flat;
    for (const b of collectBonusLikeObjects(attr)) {
        const t = firstNonEmptyAttr(b, [
            'Label',
            'label',
            'Type',
            'type',
            'Subtitle',
            'subtitle',
            'Category',
            'category',
            'Badge',
            'badge',
            'Name',
            'name',
        ]);
        if (t) return bonusFieldPlain(t);
    }
    return '';
}

function casinoBonusTermsDisplay(attr) {
    if (!attr) return '';
    const indexed = bonusFromSlugMapForCasino(attr);
    if (indexed) {
        const t = firstNonEmptyAttr(indexed, ['BonusTerms', 'Terms', 'FinePrint', 'TAndCs', 'Legal']);
        if (t) return bonusFieldPlain(t);
    }
    if (attr.BonusTerms != null && String(attr.BonusTerms).trim() !== '') {
        return String(attr.BonusTerms);
    }
    const flat = firstNonEmptyAttr(attr, ['BonusTerms', 'bonusTerms', 'Terms', 'PromoTerms']);
    if (flat) return flat;
    for (const b of collectBonusLikeObjects(attr)) {
        const t = firstNonEmptyAttr(b, ['Terms', 'terms', 'BonusTerms', 'TermsAndConditions', 'FinePrint', 'finePrint']);
        if (t) return bonusFieldPlain(t);
    }
    return '';
}

/** True when Strapi / slug map exposes any promo line we can show (homepage tier column + hero). */
function casinoListedPromoHasDetail(attr) {
    return !!(
        String(casinoBonusAmountDisplay(attr) || '').trim() ||
        String(casinoBonusTermsDisplay(attr) || '').trim() ||
        String(casinoBonusLabelDisplay(attr) || '').trim()
    );
}

/**
 * Fetch /api/casinos with the given query string only.
 * Do not append populate[bonuses] etc. - Strapi returns 400 if those relations are not defined on the schema.
 * `populate=*` already loads first-level relations; use collectBonusLikeObjects() for nested bonus fields.
 */
async function fetchCasinosWithBonusPopulate(queryString) {
    return fetch(`${API_URL}/api/casinos?${queryString}`);
}

function applyHeroLogoElement(logoEl, attr) {
    if (!logoEl || !attr) return;
    const brand = String(attr.Name || '').trim() || 'Casino';
    const urls = collectCasinoLogoUrlsFromApi(attr);

    const hideLogoSlot = () => {
        logoEl.classList.remove('hero-logo--has-image', 'hero-logo--text');
        logoEl.replaceChildren();
        logoEl.hidden = true;
    };

    if (urls.length === 0) {
        hideLogoSlot();
        return;
    }

    logoEl.hidden = false;
    logoEl.classList.add('hero-logo--has-image');
    logoEl.classList.remove('hero-logo--text');
    logoEl.replaceChildren();
    const img = document.createElement('img');
    img.className = 'hero-logo-img';
    img.alt = brand;
    img.loading = 'eager';
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    let i = 0;
    img.src = logoImgSrcForDisplay(urls[0]);
    img.onerror = () => {
        i += 1;
        if (i < urls.length) {
            img.src = logoImgSrcForDisplay(urls[i]);
        } else {
            hideLogoSlot();
        }
    };
    logoEl.appendChild(img);
}

function applySimpleHeroFromAttr(attr) {
    const headlineEl = document.getElementById('hero-bonus-headline');
    const heroLink = document.getElementById('hero-link');
    const logoEl = document.getElementById('hero-logo');
    const brandNameEl = document.getElementById('hero-brand-name');
    const heroCard = document.getElementById('hero-casino-card');

    // Apply logo FIRST - even if other parts fail, the logo still shows.
    if (logoEl) {
        try { applyHeroLogoElement(logoEl, attr); }
        catch (err) { console.error('[hero] logo error:', err); }
    }

    if (!headlineEl || !heroLink) return;

    const name = String(attr.Name || '').trim();
    const hasPromo = casinoListedPromoHasDetail(attr);
    if (heroCard) heroCard.classList.toggle('hero-card--no-offer', !hasPromo);

    if (brandNameEl) {
        if (name) {
            brandNameEl.textContent = name;
            brandNameEl.hidden = false;
        } else {
            brandNameEl.textContent = '';
            brandNameEl.hidden = true;
        }
    }
    const labelEl = document.getElementById('hero-bonus-label');
    const dekEl = document.getElementById('hero-bonus-dek');
    const amountEl = document.getElementById('hero-bonus-amount');
    const termsEl = document.getElementById('hero-terms');

    try {
        if (hasPromo) {
            const labelLine = casinoBonusLabelDisplay(attr) || 'Welcome offer';
            if (labelEl) labelEl.textContent = labelLine.toUpperCase();
            const amt = String(casinoBonusAmountDisplay(attr) || '').trim();
            headlineEl.textContent = amt || 'Welcome bonus';
        } else {
            if (labelEl) labelEl.textContent = 'FEATURED CASINO';
            headlineEl.textContent = name || 'Featured operator';
        }
    } catch (err) { console.error('[hero] headline error:', err); }

    try {
        if (dekEl) {
            if (hasPromo) {
                const terms = casinoBonusTermsDisplay(attr);
                dekEl.textContent =
                    terms ||
                    'Minimum deposit required with wagering requirements applied before withdrawal.';
            } else {
                dekEl.textContent =
                    'No welcome offer on file in our editorial database. Open the site to see current promotions and eligibility.';
            }
        }
    } catch (err) { console.error('[hero] dek error:', err); }

    try {
        if (amountEl) {
            const amt = String(casinoBonusAmountDisplay(attr) || '').trim();
            const headlineText = (headlineEl?.textContent || '').trim();
            if (amt && hasPromo && amt !== headlineText) {
                amountEl.textContent = amt;
                amountEl.hidden = false;
            } else {
                amountEl.textContent = '';
                amountEl.hidden = true;
            }
        }
    } catch (err) { console.error('[hero] amount error:', err); }

    if (termsEl) termsEl.textContent = 'T&Cs apply';

    try {
        heroLink.href = casinoVisitSiteHref(attr);
        if (casinoVisitSiteIsExternal(attr)) {
            heroLink.target = '_blank';
            heroLink.rel = 'noopener noreferrer';
        } else {
            heroLink.target = '_self';
            heroLink.removeAttribute('rel');
        }
    } catch (err) { console.error('[hero] link error:', err); }
}

/** Sidebar brand row: logo (when URL exists) with title to the right; else title only. */
function applySidebarBrandLogo(logoWrap, logoImg, nameEl, attr) {
    if (!nameEl || !attr) return;
    const nm = String(attr.Name || '').trim();
    nameEl.textContent = nm;
    nameEl.hidden = !nm;
    if (!logoWrap || !logoImg) return;
    const url = getLogoUrl(attr);
    if (url) {
        logoImg.src = logoImgSrcForDisplay(url);
        logoImg.alt = nm ? `${nm} logo` : 'Casino logo';
        logoImg.referrerPolicy = 'no-referrer';
        logoWrap.hidden = false;
        logoImg.onerror = () => {
            logoWrap.hidden = true;
            logoImg.removeAttribute('src');
        };
    } else {
        logoImg.removeAttribute('src');
        logoWrap.hidden = true;
    }
}

/** Wager / min-deposit chips for verdict bonus sidebar. */
function bonusPromoMetaParts(attr) {
    if (!attr) return [];
    const indexed = bonusFromSlugMapForCasino(attr);
    const sources = [indexed, ...collectBonusLikeObjects(attr), attr].filter(Boolean);
    let wager = '';
    let minDep = '';
    for (const s of sources) {
        if (!wager) {
            wager = firstNonEmptyAttr(s, [
                'WageringRequirement',
                'Wagering',
                'WagerRequirement',
                'Playthrough',
                'Wager',
            ]);
        }
        if (!minDep) {
            minDep = firstNonEmptyAttr(s, ['MinDeposit', 'MinimumDeposit', 'MinDep']);
        }
        if (wager && minDep) break;
    }
    const parts = [];
    if (wager) parts.push(wager);
    if (minDep) parts.push(`Min ${minDep}`);
    return parts;
}

function bonusSidebarLinesRedundant(label, amount, casinoName) {
    const l = String(label || '').trim().toLowerCase();
    const a = String(amount || '').trim().toLowerCase();
    if (!l || !a) return false;
    if (l === a) return true;
    if (a.includes(l) || l.includes(a)) return true;
    const n = String(casinoName || '').trim().toLowerCase();
    if (n && l.includes(n) && (a.includes(n) || a.includes('welcome') || a.includes('bonus'))) {
        return true;
    }
    return false;
}

function bonusDetailHrefForCasino(attr) {
    const indexed = bonusFromSlugMapForCasino(attr);
    if (!indexed) return '';
    const slug = firstNonEmptyAttr(indexed, ['Slug', 'slug']);
    return slug ? bonusDetailPath(slug) : '';
}

/**
 * Sticky welcome-offer card (logo, bonus lines, visit CTA) beside Expert Verdict.
 * @param {string} asideId e.g. cr-verdict-bonus-sidebar
 * @param {string} prefix e.g. cr-vb → cr-vb-name, cr-vb-cta, …
 */
function applyBonusSidebarSlot(asideId, prefix, attr, bonusTag, bonusAmt, bonusDesc, terms, show) {
    const aside = document.getElementById(asideId);
    if (!aside) return;
    const amountEl = document.getElementById(`${prefix}-amount`);
    const ctaEl = document.getElementById(`${prefix}-cta`);
    if (!amountEl || !ctaEl) return;

    if (!show) {
        aside.hidden = true;
        return;
    }

    aside.removeAttribute('hidden');

    const nameEl = document.getElementById(`${prefix}-name`);
    const labelEl = document.getElementById(`${prefix}-label`);
    const metaEl = document.getElementById(`${prefix}-meta`);
    const termsEl = document.getElementById(`${prefix}-terms`);
    const detailEl = document.getElementById(`${prefix}-detail`);

    if (nameEl) {
        applySidebarBrandLogo(
            document.getElementById(`${prefix}-logo-wrap`),
            document.getElementById(`${prefix}-logo`),
            nameEl,
            attr,
        );
    }
    const casinoName = String(attr.Name || '').trim();
    const amountText = String(bonusAmt || '').trim();
    amountEl.textContent = amountText;
    amountEl.hidden = !amountText;

    if (labelEl) {
        let line = String(bonusTag || '').trim() || casinoBonusLabelDisplay(attr);
        if (bonusSidebarLinesRedundant(line, amountText, casinoName)) {
            line = '';
        }
        if (!line && amountText) {
            line = 'Welcome offer';
        }
        labelEl.textContent = line;
        labelEl.hidden = !line;
    }

    if (metaEl) {
        const chips = bonusPromoMetaParts(attr);
        if (chips.length) {
            metaEl.innerHTML = chips
                .map((c) => `<li class="cr-verdict-bonus-sidebar__chip">${escapeHtml(c)}</li>`)
                .join('');
            metaEl.hidden = false;
            metaEl.removeAttribute('hidden');
        } else {
            metaEl.innerHTML = '';
            metaEl.hidden = true;
            metaEl.setAttribute('hidden', '');
        }
    }

    if (termsEl) {
        termsEl.textContent = 'T&Cs apply · 18+';
        termsEl.hidden = false;
    }

    if (detailEl) {
        const detailHref = bonusDetailHrefForCasino(attr);
        if (detailHref) {
            detailEl.href = detailHref;
            detailEl.hidden = false;
        } else {
            detailEl.removeAttribute('href');
            detailEl.hidden = true;
        }
    }

    ctaEl.href = casinoVisitSiteHref(attr);
    if (casinoVisitSiteIsExternal(attr)) {
        ctaEl.target = '_blank';
        ctaEl.rel = 'noopener noreferrer';
    } else {
        ctaEl.target = '_self';
        ctaEl.removeAttribute('rel');
    }
}

/**
 * Hero: minimal card. Prefer BK8 from API; else #1 by Rank.
 * Uses a ranked list scan first so we do not depend on Strapi filter operators or exact Slug casing.
 */
async function loadHomeFeaturedCasino() {
    const heroCard = document.getElementById('hero-casino-card');
    if (!heroCard) return;

    try {
        await ensureCasinoBonusSlugMap();

        let featuredAttr = null;
        let heroAttr = null;

        const resList = await fetchCasinosWithBonusPopulate('populate=*&sort=Rank:asc&pagination[limit]=100');
        const jsonList = await resList.json();

        if (resList.ok && Array.isArray(jsonList.data) && jsonList.data.length > 0) {
            featuredAttr = findFeaturedCasinoInList(jsonList.data, HOME_FEATURED_CASINO_SLUG);
            heroAttr = featuredAttr || attrFromCasinoEntry(jsonList.data[0]);
        }

        /* Slug filters still find BK8 when it is outside the first page of the list. */
        if (!featuredAttr) {
            const bkResult = await fetchCasinoBySlug(HOME_FEATURED_CASINO_SLUG);
            const slugHit = casinoAttrFromFetchResult(bkResult);
            if (slugHit) {
                featuredAttr = slugHit;
                heroAttr = slugHit;
            }
        }

        if (!heroAttr) {
            const res = await fetchCasinosWithBonusPopulate('populate=*&sort=Rank:asc&pagination[limit]=1');
            const json = await res.json();
            if (!res.ok) {
                console.warn('Home featured casino:', apiErrorMessage(res.status, json));
                return;
            }
            const { data } = json;
            if (!data || data.length === 0) return;
            heroAttr = attrFromCasinoEntry(data[0]);
        }

        if (heroAttr) {
            heroAttr = mergeHeroAttrWithBonusLogo(heroAttr);
            heroAttr = await mergeHeroAttrWithLogoRefetch(heroAttr);
        }

        if (heroAttr && !getLogoUrl(heroAttr)) {
            const slugForLogo = firstNonEmptyAttr(heroAttr, ['Slug', 'slug', 'URLSlug', 'urlSlug']);
            const deeper = await fetchCasinoAttrsWithDeepLogo(slugForLogo);
            if (deeper) {
                heroAttr = {
                    ...heroAttr,
                    Logo: deeper.Logo ?? deeper.logo ?? heroAttr.Logo,
                    logo: deeper.logo ?? heroAttr.logo,
                    BrandLogo: deeper.BrandLogo ?? heroAttr.BrandLogo,
                    LogoImage: deeper.LogoImage ?? heroAttr.LogoImage,
                };
            }
        }

        if (!heroAttr) return;

        applySimpleHeroFromAttr(heroAttr);

        // Direct bonus logo: fetch /api/bonuses ourselves, find matching casino slug, grab Logo URL, set it.
        const logoEl = document.getElementById('hero-logo');
        if (logoEl && !logoEl.classList.contains('hero-logo--has-image')) {
            try {
                const bonusRes = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?populate=*&pagination[limit]=50`);
                if (bonusRes.ok) {
                    const bonusJson = await bonusRes.json();
                    const heroSlug = firstNonEmptyAttr(heroAttr, ['Slug', 'slug', 'URLSlug', 'urlSlug']).toLowerCase();
                    for (const row of (bonusJson.data || [])) {
                        const b = row.attributes || row;
                        const cas = b.casino || b.Casino;
                        const bSlug = String(cas?.Slug || cas?.slug || '').toLowerCase();
                        if (bSlug !== heroSlug) continue;
                        const logo = b.Logo;
                        if (!logo) break;
                        const rawUrl = logo.url
                            || logo.formats?.large?.url
                            || logo.formats?.medium?.url
                            || logo.formats?.small?.url
                            || logo.formats?.thumbnail?.url;
                        if (!rawUrl) break;
                        const src = sameOriginMediaProxyUrl(rawUrl);
                        logoEl.hidden = false;
                        logoEl.classList.remove('hero-logo--text');
                        logoEl.classList.add('hero-logo--has-image');
                        logoEl.replaceChildren();
                        const img = document.createElement('img');
                        img.src = src;
                        img.referrerPolicy = 'no-referrer';
                        img.crossOrigin = 'anonymous';
                        img.alt = heroAttr?.Name || 'Casino';
                        img.className = 'hero-logo-img';
                        img.onerror = () => {
                            img.referrerPolicy = '';
                            img.crossOrigin = '';
                            img.src = rawUrl;
                        };
                        logoEl.appendChild(img);
                        break;
                    }
                }
            } catch (err) {
                console.warn('[hero-logo] direct bonus fetch failed:', err);
            }
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Failed to load home featured casino:', e);
    }
}

// ============================================================
// Guides index (/guides.html) - Strapi /api/blog-posts (categories guide | strategy)
// ============================================================

const GUIDES_PAGE_SIZE = 6;
const GUIDES_PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1000&auto=format&fit=crop';

function emptyPostsPageResult(page) {
    const p = Math.max(1, Math.floor(Number(page)) || 1);
    return {
        rows: [],
        meta: {
            pagination: {
                page: p,
                pageSize: GUIDES_PAGE_SIZE,
                pageCount: 1,
                total: 0,
            },
        },
    };
}

/** Append category filters for blog-posts (enum/string field, not a relation). */
function appendBlogPostCategoryFilters(params, filterKey) {
    if (filterKey === 'guide' || filterKey === 'strategy' || filterKey === 'news') {
        params.set('filters[category][$eq]', filterKey);
        return;
    }
    // Guides listing "all": guide + strategy (news has its own index)
    params.set('filters[category][$in][0]', 'guide');
    params.set('filters[category][$in][1]', 'strategy');
}

/** Site only surfaces completed + published blog-posts (Strapi 5: status=published). */
function appendBlogPostPublishFilters(params) {
    params.set('filters[workflowStatus][$eq]', 'completed');
    params.set('status', 'published');
}

/** Client-side guard when API filters are skipped or chunked fallback is used. */
function isBlogPostPubliclyVisible(attr) {
    if (!attr) return false;
    const wf = String(
        firstNonEmptyAttr(attr, ['workflowStatus', 'WorkflowStatus']) || '',
    )
        .trim()
        .toLowerCase();
    if (wf !== 'completed') return false;
    const pub = attr.publishedAt || attr.published_at;
    return Boolean(pub);
}

/** Strapi often 400s on `filters[slug]`; chunk list as a last-resort fallback. */
async function fetchAllPostsChunked() {
    const chunkLimit = 100;
    let allData = [];
    let start = 0;
    for (let i = 0; i < 40; i++) {
        const params = new URLSearchParams();
        params.set('populate', '*');
        params.set('sort', 'publishedAt:desc');
        params.set('pagination[start]', String(start));
        params.set('pagination[limit]', String(chunkLimit));
        appendBlogPostPublishFilters(params);
        let res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
        let json = await res.json();
        // Strapi 4 may reject `status=published`; retry with workflow filter only.
        if (!res.ok && (res.status === 400 || res.status === 500)) {
            params.delete('status');
            res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
            json = await res.json();
        }
        if (!res.ok || !json || !Array.isArray(json.data)) {
            throw new Error(`blog-posts list failed (${res.status})`);
        }
        const batch = json.data.filter((row) => isBlogPostPubliclyVisible(postEntryAttr(row)));
        if (json.data.length === 0) break;
        allData.push(...batch);
        const total = json.meta?.pagination?.total;
        start += json.data.length;
        if (typeof total === 'number' && start >= total) break;
        if (json.data.length < chunkLimit) break;
    }
    return allData;
}

function findPostRowBySlug(rows, slug) {
    const want = decodeURIComponent(String(slug)).trim().toLowerCase();
    if (!want || !Array.isArray(rows)) return null;
    for (const row of rows) {
        const s = postSlugValue(postEntryAttr(row)).toLowerCase();
        if (s === want) return row;
    }
    return null;
}

async function fetchGuidesPageFallback(page, filterKey) {
    try {
        const allData = await fetchAllPostsChunked();
        if (allData.length === 0) {
            return emptyPostsPageResult(1);
        }
        let rows = allData.filter((row) => {
            const a = postEntryAttr(row);
            if (!isBlogPostPubliclyVisible(a)) return false;
            const s = postCategorySlugForFilter(a);
            if (filterKey === 'guide') return s === 'guide';
            if (filterKey === 'strategy') return s === 'strategy';
            return s === 'guide' || s === 'strategy';
        });
        rows.sort((a, b) => postPublishedTime(postEntryAttr(b)) - postPublishedTime(postEntryAttr(a)));
        const total = rows.length;
        const pageCount = Math.max(1, Math.ceil(total / GUIDES_PAGE_SIZE));
        const p = Math.min(Math.max(1, page), pageCount);
        const sliceStart = (p - 1) * GUIDES_PAGE_SIZE;
        const slice = rows.slice(sliceStart, sliceStart + GUIDES_PAGE_SIZE);
        return {
            rows: slice,
            meta: {
                pagination: {
                    page: p,
                    pageSize: GUIDES_PAGE_SIZE,
                    pageCount,
                    total,
                },
            },
        };
    } catch (e) {
        console.warn('[guides] fallback failed:', e);
        return emptyPostsPageResult(page);
    }
}

async function fetchGuidesPage(page, filterKey) {
    const p = Math.max(1, Math.floor(Number(page)) || 1);
    const params = new URLSearchParams();
    params.set('populate', '*');
    params.set('sort', 'publishedAt:desc');
    params.set('pagination[page]', String(p));
    params.set('pagination[pageSize]', String(GUIDES_PAGE_SIZE));
    appendBlogPostCategoryFilters(params, filterKey === 'guide' || filterKey === 'strategy' ? filterKey : 'all');
    appendBlogPostPublishFilters(params);

    try {
        let res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
        let json = await res.json();
        if (!res.ok && (res.status === 400 || res.status === 500)) {
            params.delete('status');
            res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
            json = await res.json();
        }
        if (!res.ok || !json || !Array.isArray(json.data)) {
            throw new Error(`blog-posts guides list failed (${res.status})`);
        }
        return {
            rows: json.data.filter((row) => isBlogPostPubliclyVisible(postEntryAttr(row))),
            meta: json.meta || emptyPostsPageResult(p).meta,
        };
    } catch (e) {
        console.warn('[guides] filtered fetch failed, using fallback:', e);
        return fetchGuidesPageFallback(p, filterKey);
    }
}

/** News index (/news.html): Strapi /api/blog-posts (category news only). */
async function fetchNewsPageFallback(page) {
    const p = Math.max(1, Math.floor(Number(page)) || 1);
    try {
        const allData = await fetchAllPostsChunked();
        if (allData.length === 0) {
            return emptyPostsPageResult(1);
        }
        const rows = allData.filter((row) => {
            const a = postEntryAttr(row);
            return isBlogPostPubliclyVisible(a) && postCategorySlugForFilter(a) === 'news';
        });
        rows.sort((a, b) => postPublishedTime(postEntryAttr(b)) - postPublishedTime(postEntryAttr(a)));
        const total = rows.length;
        const pageCount = Math.max(1, Math.ceil(total / GUIDES_PAGE_SIZE));
        const p2 = Math.min(Math.max(1, p), pageCount);
        const sliceStart = (p2 - 1) * GUIDES_PAGE_SIZE;
        const slice = rows.slice(sliceStart, sliceStart + GUIDES_PAGE_SIZE);
        return {
            rows: slice,
            meta: {
                pagination: {
                    page: p2,
                    pageSize: GUIDES_PAGE_SIZE,
                    pageCount,
                    total,
                },
            },
        };
    } catch (e) {
        console.warn('[news] fallback failed:', e);
        return emptyPostsPageResult(p);
    }
}

async function fetchNewsPage(page) {
    const p = Math.max(1, Math.floor(Number(page)) || 1);
    const params = new URLSearchParams();
    params.set('populate', '*');
    params.set('sort', 'publishedAt:desc');
    params.set('pagination[page]', String(p));
    params.set('pagination[pageSize]', String(GUIDES_PAGE_SIZE));
    appendBlogPostCategoryFilters(params, 'news');
    appendBlogPostPublishFilters(params);

    try {
        let res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
        let json = await res.json();
        if (!res.ok && (res.status === 400 || res.status === 500)) {
            params.delete('status');
            res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${params}`);
            json = await res.json();
        }
        if (!res.ok || !json || !Array.isArray(json.data)) {
            throw new Error(`blog-posts news list failed (${res.status})`);
        }
        return {
            rows: json.data.filter((row) => isBlogPostPubliclyVisible(postEntryAttr(row))),
            meta: json.meta || emptyPostsPageResult(p).meta,
        };
    } catch (e) {
        console.warn('[news] filtered fetch failed, using fallback:', e);
        return fetchNewsPageFallback(p);
    }
}

function postEntryAttr(entry) {
    if (!entry) return null;
    return entry.attributes != null ? entry.attributes : entry;
}

function postSlugValue(attr) {
    return String(firstNonEmptyAttr(attr, ['slug', 'Slug', 'URLSlug', 'urlSlug']) || '').trim();
}

function postDetailHref(slug, category) {
    const cat = String(category || '').trim().toLowerCase();
    if (cat === 'news') return newsDetailPath(slug);
    return guideDetailPath(slug);
}

function postTitlePlain(attr) {
    return firstNonEmptyAttr(attr, ['title', 'Title', 'name', 'Name']) || 'Guide';
}

function postExcerptPlain(attr) {
    if (!attr) return '';
    const keys = ['excerpt', 'Excerpt', 'description', 'Description', 'summary', 'Summary', 'dek', 'Dek'];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (typeof v === 'object' && v !== null && v.type === 'doc') {
            const t = richTextToPlainText(v);
            if (t) return t.length > 280 ? `${t.slice(0, 277)}…` : t;
            continue;
        }
        const s = String(v).trim();
        if (s) return s.length > 280 ? `${s.slice(0, 277)}…` : s;
    }
    return '';
}

function postCoverImageUrl(attr) {
    if (!attr) return '';
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
    ];
    for (const k of keys) {
        const u = logoUrlFromMediaField(attr[k]);
        if (u) return logoImgSrcForDisplay(u);
    }
    return '';
}

function postCategorySlugForFilter(attr) {
    if (!attr) return '';
    const flat = firstNonEmptyAttr(attr, ['category', 'Category', 'postType', 'type']);
    if (flat && typeof flat === 'string') {
        const t = flat.trim().toLowerCase();
        if (t === 'guide' || t === 'strategy' || t === 'news') return t;
    }
    const relKeys = ['category', 'categories', 'postCategory', 'Category', 'post_categories', 'PostCategories'];
    for (const k of relKeys) {
        const raw = attr[k];
        if (raw == null) continue;
        const list = strapiRelationToAttrList(raw);
        for (const c of list) {
            const s = String(firstNonEmptyAttr(c, ['slug', 'Slug']) || '')
                .toLowerCase()
                .trim();
            if (s === 'guide' || s === 'strategy' || s === 'news') return s;
        }
    }
    return '';
}

function postCategoryDisplayLabel(attr) {
    const slug = postCategorySlugForFilter(attr);
    if (slug === 'guide') return 'GUIDE';
    if (slug === 'strategy') return 'STRATEGY';
    if (slug === 'news') return 'NEWS';
    const relKeys = ['category', 'categories', 'postCategory', 'Category'];
    for (const k of relKeys) {
        const raw = attr[k];
        if (raw == null) continue;
        const list = strapiRelationToAttrList(raw);
        for (const c of list) {
            const n = firstNonEmptyAttr(c, ['name', 'Name', 'title', 'Title']);
            if (n) return String(n).toUpperCase();
        }
    }
    return 'ARTICLE';
}

function postPublishedTime(attr) {
    const t = attr?.publishedAt || attr?.published_at || attr?.createdAt || attr?.created_at;
    return t ? new Date(t).getTime() : 0;
}

/** Plain text from main post body (Strapi rich text or string), for read-time estimate. */
function postMainBodyPlain(attr) {
    if (!attr) return '';
    const keys = [
        'bodyLinked',
        'BodyLinked',
        'bodyRaw',
        'BodyRaw',
        'content',
        'Content',
        'body',
        'Body',
        'article',
        'Article',
        'copy',
        'Copy',
        'post',
        'Post',
        'mainContent',
        'MainContent',
        'richText',
        'RichText',
        'ArticleBody',
        'articleBody',
    ];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (typeof v === 'object' && v !== null && v.type === 'doc' && Array.isArray(v.content)) {
            const t = richTextToPlainText(v);
            if (t) return t;
            continue;
        }
        if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return '';
}

/** First usable main body field for rich HTML (Strapi blocks or string). */
function postMainBodyRaw(attr) {
    if (!attr) return null;
    const keys = [
        'bodyLinked',
        'BodyLinked',
        'bodyRaw',
        'BodyRaw',
        'content',
        'Content',
        'body',
        'Body',
        'article',
        'Article',
        'copy',
        'Copy',
        'post',
        'Post',
        'mainContent',
        'MainContent',
        'richText',
        'RichText',
        'ArticleBody',
        'articleBody',
    ];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        if (typeof v === 'object' && v !== null && v.type === 'doc' && Array.isArray(v.content)) return v;
        if (typeof v === 'string' && v.trim()) return v;
    }
    return null;
}

function postWordCount(text) {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Reading duration from Strapi (minutes). Checks common schema field names.
 * Returns null if the API does not provide a usable value.
 */
function postReadingMinutesFromApi(attr) {
    if (!attr || typeof attr !== 'object') return null;
    const raw = firstNonEmptyAttr(attr, [
        'readingTime',
        'ReadingTime',
        'readTime',
        'ReadTime',
        'readTimeMinutes',
        'ReadTimeMinutes',
        'reading_time',
        'read_time',
        'minutesToRead',
        'MinutesToRead',
        'minutes',
        'Minutes',
        'minute',
        'Minute',
        'timeToRead',
        'TimeToRead',
        'durationMinutes',
        'DurationMinutes',
    ]);
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return null;
    /* Minutes when 1–120; larger integers are treated as seconds (e.g. 300 → 5 min). */
    if (n > 120 && n <= 7200) {
        return Math.min(120, Math.max(1, Math.round(n / 60)));
    }
    if (n > 7200) return null;
    return Math.round(Math.min(120, Math.max(1, n)));
}

function postReadingMinutes(attr) {
    const fromApi = postReadingMinutesFromApi(attr);
    if (fromApi != null) return fromApi;
    /* Fallback only when CMS omits reading time */
    const body = postMainBodyPlain(attr);
    let words = postWordCount(body);
    if (words < 1) {
        words = postWordCount(postExcerptPlain(attr));
        words += postWordCount(postTitlePlain(attr));
    }
    if (words < 1) words = 200;
    const WORDS_PER_MIN = 200;
    const minutes = Math.ceil(words / WORDS_PER_MIN);
    return Math.max(1, Math.min(45, minutes));
}

function postAuthorLine(attr) {
    const keys = ['author', 'Author', 'writtenBy', 'WrittenBy'];
    for (const k of keys) {
        const raw = attr[k];
        if (raw == null) continue;
        const list = strapiRelationToAttrList(raw);
        for (const a of list) {
            const n = firstNonEmptyAttr(a, ['name', 'Name', 'title', 'Title']);
            if (n) return String(n).trim();
        }
        if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
    return '888reviews Editorial';
}

/** Avatar URL from Strapi author / writer relation or post-level portrait fields. */
function postAuthorAvatarUrl(attr) {
    const mediaKeys = [
        'avatar',
        'Avatar',
        'image',
        'Image',
        'photo',
        'Photo',
        'picture',
        'Picture',
        'profileImage',
        'ProfileImage',
        'profile_photo',
        'ProfilePhoto',
        'headshot',
        'Headshot',
        'portrait',
        'Portrait',
    ];
    const authorKeys = [
        'author',
        'Author',
        'writtenBy',
        'WrittenBy',
        'writer',
        'Writer',
        'users_permissions_user',
        'Users_permissions_user',
    ];

    const urlFromAttrs = (a) => {
        if (!a || typeof a !== 'object') return '';
        for (const mk of mediaKeys) {
            const u = logoUrlFromMediaField(a[mk]);
            if (u) return logoImgSrcForDisplay(u);
        }
        return '';
    };

    for (const k of authorKeys) {
        const raw = attr[k];
        if (raw == null) continue;
        const list = strapiRelationToAttrList(raw);
        for (const a of list) {
            const u = urlFromAttrs(a);
            if (u) return u;
        }
    }

    const direct = urlFromAttrs(attr);
    if (direct) return direct;

    const postLevelPortraitKeys = [
        'AuthorAvatar',
        'authorAvatar',
        'authorPhoto',
        'AuthorPhoto',
        'writerAvatar',
        'WriterAvatar',
    ];
    for (const pk of postLevelPortraitKeys) {
        const u = logoUrlFromMediaField(attr[pk]);
        if (u) return logoImgSrcForDisplay(u);
    }

    const name = postAuthorLine(attr);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`;
}

function injectGuidesItemListJsonLd(rows, pageOffset) {
    const existing = document.getElementById('guides-itemlist-jsonld');
    if (existing) existing.remove();
    if (!rows || rows.length === 0) return;
    const origin = getPublicSiteOrigin();
    const base = Math.max(0, Number(pageOffset) || 0);
    const itemListElement = rows.map((row, i) => {
        const a = postEntryAttr(row);
        const slug = postSlugValue(a);
        const title = postTitlePlain(a);
        const url = slug ? `${origin}${guideDetailPath(slug)}` : `${origin}/guides`;
        return {
            '@type': 'ListItem',
            position: base + i + 1,
            name: title,
            url,
        };
    });
    const script = document.createElement('script');
    script.id = 'guides-itemlist-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Guides and strategies',
        itemListElement,
    });
    document.head.appendChild(script);
}

function injectNewsItemListJsonLd(rows, pageOffset) {
    const existing = document.getElementById('news-itemlist-jsonld');
    if (existing) existing.remove();
    if (!rows || rows.length === 0) return;
    const origin = getPublicSiteOrigin();
    const base = Math.max(0, Number(pageOffset) || 0);
    const itemListElement = rows.map((row, i) => {
        const a = postEntryAttr(row);
        const slug = postSlugValue(a);
        const title = postTitlePlain(a);
        const url = slug ? `${origin}${newsDetailPath(slug)}` : `${origin}/news`;
        return {
            '@type': 'ListItem',
            position: base + i + 1,
            name: title,
            url,
        };
    });
    const script = document.createElement('script');
    script.id = 'news-itemlist-jsonld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Online casino news | 888reviews',
        itemListElement,
    });
    document.head.appendChild(script);
}

async function fetchPostBySlug(slug, allowedCategories = ['guide', 'strategy']) {
    const raw = decodeURIComponent(String(slug)).trim();
    if (!raw) return { res: null, json: null };
    const allowed = new Set(allowedCategories);
    const publishQs = 'filters[workflowStatus][$eq]=completed&status=published';
    const slugQueries = [
        `filters[Slug][$eqi]=${encodeURIComponent(raw)}&populate=*&pagination[limit]=1&${publishQs}`,
        `filters[Slug][$eq]=${encodeURIComponent(raw)}&populate=*&pagination[limit]=1&${publishQs}`,
        `filters[slug][$eqi]=${encodeURIComponent(raw)}&populate=*&pagination[limit]=1&${publishQs}`,
        `filters[slug][$eq]=${encodeURIComponent(raw)}&populate=*&pagination[limit]=1&${publishQs}`,
    ];

    for (const qs of slugQueries) {
        try {
            let res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${qs}`);
            let json = await res.json();
            if (!res.ok && (res.status === 400 || res.status === 500)) {
                const qsNoStatus = qs.replace(/&?status=published/, '').replace(/^&/, '');
                res = await fetch(`${API_URL}/api/${POSTS_API_COLLECTION}?${qsNoStatus}`);
                json = await res.json();
            }
            if (!res.ok || !json || !Array.isArray(json.data) || json.data.length === 0) continue;
            const attr = postEntryAttr(json.data[0]);
            if (!isBlogPostPubliclyVisible(attr)) continue;
            const cat = postCategorySlugForFilter(attr);
            if (!allowed.has(cat)) continue;
            return { res, json };
        } catch (e) {
            console.warn('[post detail] slug fetch failed:', e);
        }
    }

    try {
        const rows = await fetchAllPostsChunked();
        const hit = findPostRowBySlug(rows, raw);
        if (!hit) return { res: null, json: null };
        const attr = postEntryAttr(hit);
        if (!isBlogPostPubliclyVisible(attr)) return { res: null, json: null };
        const cat = postCategorySlugForFilter(attr);
        if (!allowed.has(cat)) return { res: null, json: null };
        return { res: { ok: true, status: 200 }, json: { data: [hit] } };
    } catch (e) {
        console.warn('[post detail] chunked fetch failed:', e);
        return { res: null, json: null };
    }
}

function showGuidePostError(isNewsPage) {
    const err = document.getElementById('gp-error');
    const root = document.getElementById('gp-page-root');
    if (err) err.hidden = false;
    if (root) root.style.display = 'none';
    const textEl = err?.querySelector('.bonus-detail-error__text');
    if (textEl) {
        textEl.textContent = isNewsPage
            ? 'This article is not available yet.'
            : 'This guide is not available yet.';
    }
    document.title = isNewsPage ? 'Article not found | 888reviews' : 'Guide not found | 888reviews';
}

function setGuideCanonicalAndOg(attr, slug, pageTitle, seoDesc) {
    const path = postDetailHref(slug, postCategorySlugForFilter(attr));
    const abs = `${getPublicSiteOrigin()}${path}`;
    const canonical = document.getElementById('gp-canonical');
    const ogUrl = document.getElementById('gp-og-url');
    const metaDesc = document.getElementById('gp-meta-description');
    const ogTitle = document.getElementById('gp-og-title');
    const ogDesc = document.getElementById('gp-og-description');
    if (canonical) canonical.setAttribute('href', abs);
    if (ogUrl) ogUrl.setAttribute('content', abs);
    if (metaDesc) metaDesc.setAttribute('content', seoDesc);
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);
    if (ogDesc) ogDesc.setAttribute('content', seoDesc);
}

function guideHeadingSlug(text, used) {
    let base = String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 64);
    if (!base) base = 'section';
    let id = base;
    let n = 2;
    while (used.has(id)) {
        id = `${base}-${n}`;
        n += 1;
    }
    used.add(id);
    return id;
}

function stripDuplicateGuideTitle(mdRoot, title) {
    if (!mdRoot || !title) return;
    const first = mdRoot.querySelector('h1, h2');
    if (!first) return;
    const a = first.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    const b = String(title).replace(/\s+/g, ' ').trim().toLowerCase();
    if (a && b && a === b) first.remove();
}

function buildGuidePostToc(bodyEl) {
    const toc = document.getElementById('gp-toc');
    const list = document.getElementById('gp-toc-list');
    if (!toc || !list || !bodyEl) return;
    const md = bodyEl.querySelector('.guide-post-md') || bodyEl;
    const headings = [...md.querySelectorAll('h2')];
    list.innerHTML = '';
    if (headings.length < 2) {
        toc.hidden = true;
        return;
    }
    const used = new Set();
    const items = [];
    for (const h of headings) {
        const text = (h.textContent || '').trim();
        if (!text) continue;
        const id = h.id || guideHeadingSlug(text, used);
        h.id = id;
        items.push({ id, text });
    }
    if (items.length < 2) {
        toc.hidden = true;
        return;
    }
    list.innerHTML = items
        .map(
            (it) =>
                `<li><a href="#${escapeHtml(it.id)}" data-toc-id="${escapeHtml(it.id)}">${escapeHtml(it.text)}</a></li>`,
        )
        .join('');
    toc.hidden = false;

    const links = [...list.querySelectorAll('a[data-toc-id]')];
    const syncActive = () => {
        const offset = 120;
        let activeId = items[0]?.id || '';
        for (const it of items) {
            const el = document.getElementById(it.id);
            if (!el) continue;
            if (el.getBoundingClientRect().top <= offset) activeId = it.id;
        }
        for (const a of links) {
            a.classList.toggle('is-active', a.getAttribute('data-toc-id') === activeId);
        }
    };
    if (window.__gpTocScroll) {
        window.removeEventListener('scroll', window.__gpTocScroll);
    }
    window.__gpTocScroll = () => {
        window.requestAnimationFrame(syncActive);
    };
    window.addEventListener('scroll', window.__gpTocScroll, { passive: true });
    syncActive();
}

function initGuideReadingProgress() {
    const bar = document.getElementById('gp-progress-bar');
    const article = document.getElementById('gp-content-article');
    if (!bar || !article) return;
    const update = () => {
        const rect = article.getBoundingClientRect();
        const total = article.offsetHeight - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        const pct = total > 0 ? (scrolled / total) * 100 : 0;
        bar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    };
    if (window.__gpProgressScroll) {
        window.removeEventListener('scroll', window.__gpProgressScroll);
        window.removeEventListener('resize', window.__gpProgressScroll);
    }
    window.__gpProgressScroll = () => window.requestAnimationFrame(update);
    window.addEventListener('scroll', window.__gpProgressScroll, { passive: true });
    window.addEventListener('resize', window.__gpProgressScroll, { passive: true });
    update();
}

function initGuideShareButton(title) {
    const btn = document.getElementById('gp-share-btn');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    btn.addEventListener('click', async () => {
        const url = window.location.href;
        const shareData = { title: title || document.title, url };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
        } catch {
            /* fall through to clipboard */
        }
        try {
            await navigator.clipboard.writeText(url);
            btn.classList.add('is-copied');
            const label = btn.querySelector('span');
            const prev = label ? label.textContent : '';
            if (label) label.textContent = 'Copied';
            setTimeout(() => {
                btn.classList.remove('is-copied');
                if (label) label.textContent = prev || 'Share';
            }, 1600);
        } catch (e) {
            console.warn('[guide share]', e);
        }
    });
}

async function loadGuideRelatedPosts(currentSlug, isNewsPage) {
    const section = document.getElementById('gp-related');
    const list = document.getElementById('gp-related-list');
    if (!section || !list) return;
    const filterKey = isNewsPage ? 'news' : 'all';
    try {
        const { rows } = isNewsPage
            ? await fetchNewsPage(1)
            : await fetchGuidesPage(1, filterKey);
        const cards = (rows || [])
            .filter((row) => postSlugValue(postEntryAttr(row)).toLowerCase() !== String(currentSlug || '').toLowerCase())
            .slice(0, 3);
        if (!cards.length) {
            section.hidden = true;
            return;
        }
        list.innerHTML = cards
            .map((row) => {
                const a = postEntryAttr(row);
                const title = escapeHtml(postTitlePlain(a));
                const slug = postSlugValue(a);
                const href = escapeHtml(postDetailHref(slug, postCategorySlugForFilter(a)));
                const cat = escapeHtml(postCategoryDisplayLabel(a));
                const mins = postReadingMinutes(a);
                const img = postCoverImageUrl(a) || GUIDES_PLACEHOLDER_IMAGE;
                return `<li>
                    <a class="gp-related-card" href="${href}">
                        <div class="gp-related-card__img"><img src="${escapeHtml(img)}" alt="" loading="lazy" decoding="async" width="400" height="250"></div>
                        <div class="gp-related-card__body">
                            <span class="gp-related-card__cat">${cat}</span>
                            <span class="gp-related-card__title">${title}</span>
                            <span class="gp-related-card__meta">${mins} min read</span>
                        </div>
                    </a>
                </li>`;
            })
            .join('');
        section.hidden = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.warn('[guide related]', e);
        section.hidden = true;
    }
}

function populateGuidePostPage(attr, slug, options = {}) {
    const isNewsPage = !!options.isNewsPage;
    const title = postTitlePlain(attr);
    const excerpt =
        postExcerptPlain(attr) ||
        String(firstNonEmptyAttr(attr, ['seoDescription', 'SeoDescription']) || '').trim();
    const mins = postReadingMinutes(attr);
    const catLabel = postCategoryDisplayLabel(attr);
    const pillEl = document.getElementById('gp-pill');
    const readEl = document.getElementById('gp-read-time');
    const titleEl = document.getElementById('gp-title');
    const dekEl = document.getElementById('gp-dek');
    const dateEl = document.getElementById('gp-date');
    const heroImg = document.getElementById('gp-hero-img');
    const heroVisual = document.getElementById('gp-hero-visual');
    const bodyEl = document.getElementById('gp-body');
    const crumbEl = document.getElementById('gp-crumb-current');
    const crumbHub = document.getElementById('gp-crumb-hub');
    const footHub = document.getElementById('gp-foot-hub');
    const relatedTitle = document.getElementById('gp-related-title');
    const relatedAll = document.getElementById('gp-related-all');

    const seoTitle = String(firstNonEmptyAttr(attr, ['seoTitle', 'SeoTitle']) || '').trim();
    const pageTitle = `${seoTitle || title} | 888reviews`;
    document.title = pageTitle;
    const seoDesc =
        String(firstNonEmptyAttr(attr, ['seoDescription', 'SeoDescription']) || '').trim() ||
        excerpt ||
        `Editorial ${catLabel.toLowerCase()}: ${title}. Always verify terms with licensed operators.`;

    setGuideCanonicalAndOg(attr, slug, pageTitle, seoDesc);

    if (crumbHub) {
        crumbHub.href = isNewsPage ? '/news' : '/guides';
        crumbHub.textContent = isNewsPage ? 'News' : 'Guides';
    }
    if (footHub) {
        footHub.href = isNewsPage ? '/news' : '/guides';
        footHub.textContent = isNewsPage ? 'Browse all news' : 'Browse all guides';
    }
    if (relatedTitle) relatedTitle.textContent = isNewsPage ? 'More news' : 'More guides';
    if (relatedAll) {
        relatedAll.href = isNewsPage ? '/news' : '/guides';
        relatedAll.innerHTML = `${isNewsPage ? 'View all news' : 'View all guides'} <i data-lucide="arrow-right" aria-hidden="true"></i>`;
    }

    if (pillEl) pillEl.textContent = catLabel;
    if (readEl) readEl.textContent = `${mins} min read`;
    if (titleEl) titleEl.textContent = title;
    if (dekEl) dekEl.textContent = excerpt || '';
    if (dekEl) dekEl.hidden = !excerpt;
    if (crumbEl) crumbEl.textContent = title;

    const pub = attr.publishedAt || attr.published_at || attr.createdAt || attr.created_at;
    if (dateEl && pub) {
        const d = new Date(pub);
        if (!Number.isNaN(d.getTime())) {
            dateEl.textContent = `${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · Editorial`;
            dateEl.hidden = false;
        } else {
            dateEl.hidden = true;
        }
    } else if (dateEl) {
        dateEl.hidden = true;
    }

    const cover = postCoverImageUrl(attr) || GUIDES_PLACEHOLDER_IMAGE;
    if (heroImg) {
        heroImg.src = cover;
        heroImg.alt = title;
    }
    if (heroVisual) heroVisual.hidden = false;

    const pubOriginGuide = getPublicSiteOrigin();
    const defaultShareImgGuide = `${pubOriginGuide}/assets/img/888review-siteicon.webp`;
    let shareImgGuide = cover || '';
    if (shareImgGuide && shareImgGuide.startsWith('/')) shareImgGuide = `${pubOriginGuide}${shareImgGuide}`;
    if (!shareImgGuide) shareImgGuide = defaultShareImgGuide;
    const gpOgImg = document.getElementById('gp-og-image');
    const gpTwImg = document.getElementById('gp-twitter-image');
    const gpTwTitle = document.getElementById('gp-twitter-title');
    const gpTwDesc = document.getElementById('gp-twitter-description');
    if (gpOgImg) gpOgImg.setAttribute('content', shareImgGuide);
    if (gpTwImg) gpTwImg.setAttribute('content', shareImgGuide);
    if (gpTwTitle) gpTwTitle.setAttribute('content', pageTitle);
    if (gpTwDesc) gpTwDesc.setAttribute('content', seoDesc);

    if (bodyEl) {
        const raw = postMainBodyRaw(attr);
        if (raw) {
            const inner = postBodyToHtmlForGuide(raw);
            if (inner) {
                bodyEl.innerHTML = `<div class="rich-text-body guide-post-md">${inner}</div>`;
                const mdRoot = bodyEl.querySelector('.guide-post-md');
                stripDuplicateGuideTitle(mdRoot, title);
            } else {
                bodyEl.innerHTML = '';
            }
        } else {
            bodyEl.innerHTML = `<p>${escapeHtml(excerpt || 'Full article content will appear here soon.')}</p>`;
        }
        buildGuidePostToc(bodyEl);
    }

    initGuideReadingProgress();
    loadGuideRelatedPosts(slug, isNewsPage);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function initGuidePostPage() {
    if (!document.getElementById('gp-page-root')) return null;

    const guideMatch = window.location.pathname.match(/^\/guide\/([^/]+)\/?$/);
    const newsMatch = window.location.pathname.match(/^\/news\/([^/]+)\/?$/);
    const slugFromPath = guideMatch || newsMatch;
    const isNewsPage = !!newsMatch;
    const allowedCategories = isNewsPage ? ['news'] : ['guide', 'strategy'];
    const slug = slugFromPath
        ? decodeURIComponent(slugFromPath[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showGuidePostError(isNewsPage);
        return null;
    }

    const rootEl = document.getElementById('gp-page-root');
    setDetailPageLoading(rootEl);
    try {
        const { res, json } = await fetchPostBySlug(slug, allowedCategories);
        if (!res || !res.ok || !json || !json.data || json.data.length === 0) {
            showGuidePostError(isNewsPage);
            return null;
        }
        const attr = postEntryAttr(json.data[0]);
        populateGuidePostPage(attr, slug, { isNewsPage });
        return attr;
    } catch (e) {
        console.error('[post detail]', e);
        showGuidePostError(isNewsPage);
        return null;
    } finally {
        clearDetailPageLoading(rootEl);
    }
}

function initGuidesPage() {
    const grid = document.getElementById('guides-grid');
    const statusEl = document.getElementById('guides-status');
    const emptyEl = document.getElementById('guides-empty');
    const wrap = document.getElementById('guides-pagination-wrap');
    const firstBtn = document.getElementById('guides-btn-first');
    const prevBtn = document.getElementById('guides-btn-prev');
    const nextBtn = document.getElementById('guides-btn-next');
    const lastBtn = document.getElementById('guides-btn-last');
    const pageNumbersEl = document.getElementById('guides-page-numbers');
    const pageInput = document.getElementById('guides-page-input');
    const pageGoBtn = document.getElementById('guides-page-go');
    const pageTotalHint = document.getElementById('guides-page-total-hint');
    if (!grid || !statusEl) return;
    statusEl.hidden = true;
    grid.innerHTML = skeletonGridHtml('guide-card', 6);

    let currentPage = 1;
    try {
        const qp = parseInt(new URLSearchParams(window.location.search).get('page') || '', 10);
        if (!Number.isNaN(qp) && qp >= 1) currentPage = qp;
    } catch {
        /* ignore */
    }
    let pageCount = 1;
    let guidesFirstFetch = true;

    function setGuidesUrlPage() {
        try {
            const u = new URL(window.location.href);
            if (currentPage <= 1) u.searchParams.delete('page');
            else u.searchParams.set('page', String(currentPage));
            u.searchParams.delete('filter');
            history.replaceState(null, '', `${u.pathname}${u.search}`);
        } catch {
            /* ignore */
        }
    }

    function navigateToPage(p) {
        const n = Math.max(1, Math.min(pageCount, Math.floor(Number(p))));
        if (n === currentPage) return;
        currentPage = n;
        setGuidesUrlPage();
        loadAndRender();
    }

    bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigateToPage);
    if (firstBtn) {
        firstBtn.addEventListener('click', () => navigateToPage(1));
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateToPage(currentPage - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateToPage(currentPage + 1));
    }
    if (lastBtn) {
        lastBtn.addEventListener('click', () => navigateToPage(pageCount));
    }

    function renderCard(row) {
        const attr = postEntryAttr(row);
        if (!attr) return '';
        const title = escapeHtml(postTitlePlain(attr));
        const excerpt = escapeHtml(postExcerptPlain(attr));
        const slug = postSlugValue(attr);
        const href = escapeHtml(postDetailHref(slug));
        const img = postCoverImageUrl(attr) || GUIDES_PLACEHOLDER_IMAGE;
        const cat = escapeHtml(postCategoryDisplayLabel(attr));
        const mins = postReadingMinutes(attr);
        const imgAlt = escapeHtml(postTitlePlain(attr));
        return `
        <article class="guide-card">
            <a href="${href}" class="gc-link-wrap">
                <div class="gc-image-wrap">
                    <img src="${img}" alt="${imgAlt}" class="gc-image" width="600" height="360" loading="lazy" decoding="async">
                </div>
                <div class="gc-meta">
                    <span class="gc-category">${cat}</span>
                    <span class="gc-read-time">${mins} min read</span>
                </div>
                <h3 class="gc-title">${title}</h3>
                <p class="gc-excerpt">${excerpt || 'Read the full article.'}</p>
                <span class="gc-read-more">Read full guide <i data-lucide="arrow-right" aria-hidden="true"></i></span>
            </a>
        </article>`;
    }

    function resolvePageCount(meta) {
        const pg = meta?.pagination || {};
        if (typeof pg.pageCount === 'number' && pg.pageCount >= 1) {
            return Math.max(1, Math.floor(pg.pageCount));
        }
        if (typeof pg.total === 'number' && pg.total >= 0) {
            const ps = pg.pageSize || GUIDES_PAGE_SIZE;
            return Math.max(1, Math.ceil(pg.total / ps));
        }
        return 1;
    }

    async function loadAndRender() {
        statusEl.hidden = true;
        grid.innerHTML = skeletonGridHtml('guide-card', 6);
        if (wrap) wrap.style.display = 'none';
        try {
            let { rows, meta } = await fetchGuidesPage(currentPage, 'all');
            pageCount = resolvePageCount(meta);

            if (currentPage > pageCount) {
                currentPage = pageCount;
                setGuidesUrlPage();
                ({ rows, meta } = await fetchGuidesPage(currentPage, 'all'));
                pageCount = resolvePageCount(meta);
            }

            const total =
                typeof meta?.pagination?.total === 'number' ? meta.pagination.total : undefined;
            const cmsEmpty = (!rows || rows.length === 0) && total === 0;

            const listOffset = (currentPage - 1) * GUIDES_PAGE_SIZE;
            injectGuidesItemListJsonLd(rows, listOffset);

            if (emptyEl) {
                emptyEl.hidden = (rows && rows.length > 0) || cmsEmpty;
            }

            if (!rows || rows.length === 0) {
                grid.innerHTML = '';
                if (cmsEmpty) {
                    statusEl.hidden = false;
                    statusEl.textContent = contentEmptyMessage('guides');
                } else {
                    statusEl.textContent = '';
                    statusEl.hidden = true;
                }
                updateListingPagerDom(
                    wrap,
                    pageCount,
                    currentPage,
                    prevBtn,
                    nextBtn,
                    pageNumbersEl,
                    pageInput,
                    pageTotalHint,
                );
                if (typeof lucide !== 'undefined') lucide.createIcons({ root: wrap });
                guidesFirstFetch = false;
                return;
            }

            statusEl.textContent = '';
            statusEl.hidden = true;

            grid.innerHTML = rows.map(renderCard).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons({ root: grid });
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint,
            );
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: wrap });

            if (!guidesFirstFetch) {
                scrollListingAnchorIntoView('#guides-directory-heading');
            }
            guidesFirstFetch = false;
        } catch (e) {
            console.error('[guides]', e);
            grid.innerHTML = '';
            statusEl.hidden = false;
            statusEl.textContent = contentEmptyMessage('guides');
            if (wrap) wrap.style.display = 'none';
            guidesFirstFetch = false;
        }
    }

    loadAndRender();
}

function initNewsPage() {
    const grid = document.getElementById('news-grid');
    const statusEl = document.getElementById('news-status');
    const emptyEl = document.getElementById('news-empty');
    const wrap = document.getElementById('news-pagination-wrap');
    const firstBtn = document.getElementById('news-btn-first');
    const prevBtn = document.getElementById('news-btn-prev');
    const nextBtn = document.getElementById('news-btn-next');
    const lastBtn = document.getElementById('news-btn-last');
    const pageNumbersEl = document.getElementById('news-page-numbers');
    const pageInput = document.getElementById('news-page-input');
    const pageGoBtn = document.getElementById('news-page-go');
    const pageTotalHint = document.getElementById('news-page-total-hint');
    if (!grid || !statusEl) return;
    statusEl.hidden = true;
    grid.innerHTML = skeletonGridHtml('guide-card', 6);

    let currentPage = 1;
    try {
        const qp = parseInt(new URLSearchParams(window.location.search).get('page') || '', 10);
        if (!Number.isNaN(qp) && qp >= 1) currentPage = qp;
    } catch {
        /* ignore */
    }
    let pageCount = 1;
    let newsFirstFetch = true;

    function setNewsUrlPage() {
        try {
            const u = new URL(window.location.href);
            if (currentPage <= 1) u.searchParams.delete('page');
            else u.searchParams.set('page', String(currentPage));
            history.replaceState(null, '', `${u.pathname}${u.search}`);
        } catch {
            /* ignore */
        }
    }

    function navigateToPage(p) {
        const n = Math.max(1, Math.min(pageCount, Math.floor(Number(p))));
        if (n === currentPage) return;
        currentPage = n;
        setNewsUrlPage();
        loadAndRender();
    }

    bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigateToPage);
    if (firstBtn) {
        firstBtn.addEventListener('click', () => navigateToPage(1));
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateToPage(currentPage - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateToPage(currentPage + 1));
    }
    if (lastBtn) {
        lastBtn.addEventListener('click', () => navigateToPage(pageCount));
    }

    function renderNewsCard(row) {
        const attr = postEntryAttr(row);
        if (!attr) return '';
        const title = escapeHtml(postTitlePlain(attr));
        const excerpt = escapeHtml(postExcerptPlain(attr));
        const slug = postSlugValue(attr);
        const href = escapeHtml(postDetailHref(slug, 'news'));
        const img = postCoverImageUrl(attr) || GUIDES_PLACEHOLDER_IMAGE;
        const cat = escapeHtml(postCategoryDisplayLabel(attr));
        const mins = postReadingMinutes(attr);
        const imgAlt = escapeHtml(postTitlePlain(attr));
        return `
        <article class="guide-card">
            <a href="${href}" class="gc-link-wrap">
                <div class="gc-image-wrap">
                    <img src="${img}" alt="${imgAlt}" class="gc-image" width="600" height="360" loading="lazy" decoding="async">
                </div>
                <div class="gc-meta">
                    <span class="gc-category">${cat}</span>
                    <span class="gc-read-time">${mins} min read</span>
                </div>
                <h3 class="gc-title">${title}</h3>
                <p class="gc-excerpt">${excerpt || 'Read the full article.'}</p>
                <span class="gc-read-more">Read full story <i data-lucide="arrow-right" aria-hidden="true"></i></span>
            </a>
        </article>`;
    }

    function resolvePageCount(meta) {
        const pg = meta?.pagination || {};
        if (typeof pg.pageCount === 'number' && pg.pageCount >= 1) {
            return Math.max(1, Math.floor(pg.pageCount));
        }
        if (typeof pg.total === 'number' && pg.total >= 0) {
            const ps = pg.pageSize || GUIDES_PAGE_SIZE;
            return Math.max(1, Math.ceil(pg.total / ps));
        }
        return 1;
    }

    async function loadAndRender() {
        statusEl.hidden = true;
        grid.innerHTML = skeletonGridHtml('guide-card', 6);
        if (wrap) wrap.style.display = 'none';
        try {
            let { rows, meta } = await fetchNewsPage(currentPage);
            pageCount = resolvePageCount(meta);

            if (currentPage > pageCount) {
                currentPage = pageCount;
                setNewsUrlPage();
                ({ rows, meta } = await fetchNewsPage(currentPage));
                pageCount = resolvePageCount(meta);
            }

            const total =
                typeof meta?.pagination?.total === 'number' ? meta.pagination.total : undefined;
            const cmsEmpty = (!rows || rows.length === 0) && total === 0;

            const listOffset = (currentPage - 1) * GUIDES_PAGE_SIZE;
            injectNewsItemListJsonLd(rows, listOffset);

            if (emptyEl) {
                emptyEl.hidden = (rows && rows.length > 0) || cmsEmpty;
            }

            if (!rows || rows.length === 0) {
                grid.innerHTML = '';
                if (cmsEmpty) {
                    statusEl.hidden = false;
                    statusEl.textContent = contentEmptyMessage('news');
                } else {
                    statusEl.textContent = '';
                    statusEl.hidden = true;
                }
                updateListingPagerDom(
                    wrap,
                    pageCount,
                    currentPage,
                    prevBtn,
                    nextBtn,
                    pageNumbersEl,
                    pageInput,
                    pageTotalHint,
                );
                if (typeof lucide !== 'undefined') lucide.createIcons({ root: wrap });
                newsFirstFetch = false;
                return;
            }

            statusEl.textContent = '';
            statusEl.hidden = true;

            grid.innerHTML = rows.map(renderNewsCard).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons({ root: grid });
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint,
            );
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: wrap });

            if (!newsFirstFetch) {
                scrollListingAnchorIntoView('#news-directory-heading');
            }
            newsFirstFetch = false;
        } catch (e) {
            console.error('[news]', e);
            grid.innerHTML = '';
            statusEl.hidden = false;
            statusEl.textContent = contentEmptyMessage('news');
            if (wrap) wrap.style.display = 'none';
            newsFirstFetch = false;
        }
    }

    loadAndRender();
}

// ============================================================
// Bonuses index (/bonuses.html) - Strapi /api/bonuses
// ============================================================

function bonusEntryAttr(entry) {
    if (!entry) return null;
    return entry.attributes != null ? entry.attributes : entry;
}

function bonusRelatedCasinoName(attr) {
    if (!attr) return '';
    const c = getRelatedCasinoFromBonus(attr);
    if (c) {
        const n = String(c.Name ?? c.name ?? '').trim();
        if (n) return n;
    }
    return firstNonEmptyAttr(attr, ['CasinoName', 'OperatorName', 'Brand', 'casinoName']) || '';
}

/**
 * Bonus card art: Strapi media (Logo / cover / hero) or related casino logo.
 * Returns resolved URL and whether the primary asset is logo-like (contain layout in CSS).
 */
function bonusCardVisual(attr) {
    if (!attr) return { url: '', isLogo: false };
    const logoFieldKeys = ['Logo', 'logo', 'BrandLogo', 'brandLogo', 'OperatorLogo', 'operatorLogo'];
    for (const k of logoFieldKeys) {
        const u = logoUrlFromMediaField(attr[k]);
        if (u) return { url: logoImgSrcForDisplay(u), isLogo: true };
    }
    const coverFieldKeys = [
        'CoverImage',
        'coverImage',
        'Image',
        'image',
        'Thumbnail',
        'thumbnail',
        'HeroImage',
        'heroImage',
        'CardImage',
        'cardImage',
    ];
    for (const k of coverFieldKeys) {
        const u = logoUrlFromMediaField(attr[k]);
        if (u) return { url: logoImgSrcForDisplay(u), isLogo: false };
    }
    const c = getRelatedCasinoFromBonus(attr);
    if (c) {
        const logo = getLogoUrl(c);
        if (logo) return { url: logo, isLogo: true };
    }
    return { url: '', isLogo: false };
}

function bonusCardImageUrl(attr) {
    return bonusCardVisual(attr).url;
}

function bonusCtaHref(attr) {
    if (!attr) return '#';
    const keys = ['AffiliateLink', 'ClaimUrl', 'CTALink', 'Link', 'ExternalUrl', 'Url', 'DestinationUrl'];
    for (const k of keys) {
        const v = attr[k];
        if (v == null) continue;
        const s = typeof v === 'object' && v !== null ? v.url ?? v.href : v;
        const u = String(s || '').trim();
        if (/^https?:\/\//i.test(u)) return u;
    }
    const ca = getRelatedCasinoFromBonus(attr);
    if (ca) {
        const ext = casinoAffiliateUrl(ca);
        if (ext) return ext;
        const slug = firstNonEmptyAttr(ca, ['Slug', 'slug']);
        if (slug) return casinoReviewPath(slug);
    }
    return '#';
}

function populateBonusCodeSection(attr) {
    const section = document.getElementById('bd-code-section');
    const valueEl = document.getElementById('bd-code-value');
    const copyBtn = document.getElementById('bd-code-copy');
    if (!section || !valueEl) return;

    const raw = firstNonEmptyAttr(attr, ['BonusCode', 'bonusCode', 'PromoCode']);
    const s = raw != null ? String(raw).trim() : '';

    if (!s) {
        section.hidden = true;
        valueEl.textContent = '';
        valueEl.classList.remove('bd-code-value--muted');
        if (copyBtn) {
            copyBtn.hidden = true;
            delete copyBtn.dataset.code;
        }
        return;
    }

    section.hidden = false;
    if (/^no\s*code/i.test(s)) {
        valueEl.textContent = 'No code required';
        valueEl.classList.add('bd-code-value--muted');
        if (copyBtn) {
            copyBtn.hidden = true;
            delete copyBtn.dataset.code;
        }
    } else {
        const display = s.toUpperCase();
        valueEl.textContent = display;
        valueEl.classList.remove('bd-code-value--muted');
        if (copyBtn) {
            copyBtn.hidden = false;
            copyBtn.dataset.code = s;
        }
    }
}

function setupBonusDetailCodeCopy() {
    const btn = document.getElementById('bd-code-copy');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';
    const defaultLabel = btn.textContent || 'Copy code';
    btn.addEventListener('click', async () => {
        const code = btn.dataset.code || '';
        if (!code) return;
        try {
            await navigator.clipboard.writeText(code);
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = defaultLabel;
            }, 2000);
        } catch (e) {
            console.warn('Copy failed:', e);
        }
    });
}

function applyBonusLinkButton(el, href) {
    if (!el) return;
    if (href && href !== '#') {
        el.setAttribute('href', href);
        if (/^https?:\/\//i.test(href)) {
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        } else {
            el.removeAttribute('target');
            el.removeAttribute('rel');
        }
        el.style.display = '';
    } else {
        el.style.display = 'none';
    }
}

function bonusCardTrustPeriod(attr) {
    const t = attr?.publishedAt || attr?.published_at;
    if (!t) return '';
    try {
        const d = new Date(t);
        if (Number.isNaN(d.getTime())) return '';
        return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    } catch {
        return '';
    }
}

function renderBonusCardHtml(entry, index) {
    const attr = bonusEntryAttr(entry);
    if (!attr) return '';
    const casinoName = bonusRelatedCasinoName(attr);
    const title = firstNonEmptyAttr(attr, ['Title', 'Headline', 'Name', 'title']) || 'Bonus offer';
    const bonusAmount = firstNonEmptyAttr(attr, ['BonusAmount', 'bonusAmount']);
    const bonusType = firstNonEmptyAttr(attr, ['BonusType', 'bonusType']);
    const trustPeriod = bonusCardTrustPeriod(attr);
    const wager = firstNonEmptyAttr(attr, [
        'WageringRequirement',
        'Wagering',
        'WagerRequirement',
        'Playthrough',
        'Wager',
    ]);
    const minDep = firstNonEmptyAttr(attr, ['MinDeposit', 'MinimumDeposit', 'MinDep']);
    const { url: imgUrl, isLogo: bonusImgIsLogo } = bonusCardVisual(attr);
    const fallbackImg =
        'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=600&auto=format&fit=crop';
    const cta = bonusCtaHref(attr);
    const ctaLabel = firstNonEmptyAttr(attr, ['CTALabel', 'ButtonLabel', 'ButtonText']) || 'GET BONUS';
    const ctaRel = /^https?:\/\//i.test(cta) ? ' target="_blank" rel="noopener noreferrer"' : '';
    const bonusSlug = firstNonEmptyAttr(attr, ['Slug', 'slug']);
    const detailHref = bonusSlug ? bonusDetailPath(bonusSlug) : '';
    const titleHtml = detailHref
        ? `<a href="${escapeHtml(detailHref)}">${escapeHtml(title)}</a>`
        : escapeHtml(title);

    const chips = [];
    if (attr.IsHot || attr.Hot) chips.push('<span class="bc-chip bc-chip--hot">Hot</span>');
    if (attr.IsExclusive || attr.Exclusive) chips.push('<span class="bc-chip bc-chip--exc">Exclusive</span>');
    if (attr.IsNew || attr.New) chips.push('<span class="bc-chip bc-chip--new">New</span>');
    const chipsHtml = chips.length ? `<div class="bc-chips">${chips.join('')}</div>` : '';

    const delayClass = ['delay-100', 'delay-200', 'delay-300'][index % 3];
    const imgSrc = imgUrl || fallbackImg;
    const logoClass = bonusImgIsLogo ? ' bc-logo-img--contain' : ' bc-logo-img--cover';

    const termsLink = detailHref
        ? `<a href="${escapeHtml(detailHref)}" class="bc-terms-link">Full terms &amp; T&amp;Cs apply</a>`
        : '';

    const metaParts = [];
    if (wager) metaParts.push(escapeHtml(wager));
    if (minDep) metaParts.push(`Min ${escapeHtml(minDep)}`);
    const metaLine = metaParts.length
        ? `<p class="bc-meta">${metaParts.join(' · ')}</p>`
        : '';

    const trustSuffix = trustPeriod ? ` · ${escapeHtml(trustPeriod)}` : '';

    return `
        <article class="bonus-card reveal ${delayClass}">
            <div class="bc-logo-zone">
                <div class="bc-logo-mat">
                    <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(casinoName || 'Bonus')}" class="bc-logo-img${logoClass}" loading="lazy" decoding="async" width="120" height="120">
                </div>
                ${chipsHtml}
            </div>
            <div class="bc-trust">
                <i data-lucide="badge-check"></i>
                <span class="bc-trust-text">Listed by <strong>888reviews</strong>${trustSuffix}</span>
            </div>
            <div class="bc-content">
                ${bonusAmount ? `<p class="bc-amount">${escapeHtml(bonusAmount)}</p>` : ''}
                <h3 class="bc-title">${titleHtml}</h3>
                ${bonusType ? `<p class="bc-type">${escapeHtml(bonusType)}</p>` : ''}
                ${metaLine}
                <a href="${escapeHtml(cta)}" class="btn btn-primary btn-block bc-cta"${ctaRel}>${escapeHtml(ctaLabel)}</a>
                ${termsLink}
            </div>
        </article>`;
}

function bonusPublishedTimeMs(attr) {
    if (!attr) return 0;
    const raw = attr.publishedAt || attr.published_at || attr.createdAt || attr.created_at || 0;
    const n = new Date(raw).getTime();
    return Number.isNaN(n) ? 0 : n;
}

function bonusTitleSortKey(attr) {
    return (firstNonEmptyAttr(attr, ['Title', 'Headline', 'Name', 'title']) || '').toLowerCase();
}

function sortBonusesRows(rows, mode) {
    const list = [...rows];
    list.sort((a, b) => {
        const ta = bonusEntryAttr(a);
        const tb = bonusEntryAttr(b);
        switch (mode) {
            case 'oldest':
                return bonusPublishedTimeMs(ta) - bonusPublishedTimeMs(tb);
            case 'title-asc':
                return bonusTitleSortKey(ta).localeCompare(bonusTitleSortKey(tb));
            case 'title-desc':
                return bonusTitleSortKey(tb).localeCompare(bonusTitleSortKey(ta));
            case 'casino-asc': {
                const na = bonusRelatedCasinoName(ta).toLowerCase();
                const nb = bonusRelatedCasinoName(tb).toLowerCase();
                return na.localeCompare(nb);
            }
            case 'newest':
            default:
                return bonusPublishedTimeMs(tb) - bonusPublishedTimeMs(ta);
        }
    });
    return list;
}

function bonusMatchesFilter(attr, filterKey) {
    if (!attr || filterKey === 'all') return true;
    const type = String(firstNonEmptyAttr(attr, ['BonusType', 'bonusType']) || '').toLowerCase();
    const title = String(firstNonEmptyAttr(attr, ['Title', 'Headline', 'Name', 'title']) || '').toLowerCase();
    const hay = `${type} ${title}`;
    switch (filterKey) {
        case 'welcome':
            return /welcome|first deposit|sign\s*up|signup|matched deposit|welcome pack/.test(hay);
        case 'freespins':
            return /free\s*spin|freespin|\bfs\b|extra\s*spin/.test(hay);
        case 'nodeposit':
            return /no\s*deposit|without deposit/.test(hay);
        case 'reload':
            return /reload|redeposit|re-deposit|cashback/.test(hay);
        case 'highroller':
            return /high\s*roller|highroller|\bvip\b/.test(hay);
        default:
            return true;
    }
}

function filterBonusesRows(rows, filterKey) {
    if (filterKey === 'all') return [...rows];
    return rows.filter((e) => bonusMatchesFilter(bonusEntryAttr(e), filterKey));
}

function renderBonusesGrid(list) {
    const grid = document.getElementById('bonuses-grid');
    if (!grid) return;
    if (list.length === 0) {
        grid.innerHTML =
            '<p class="bonuses-grid-empty">No bonuses match this filter. Choose <strong>All bonuses</strong> or another category.</p>';
        return;
    }
    grid.innerHTML = list.map((row, i) => renderBonusCardHtml(row, i)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyBonusesPageView() {
    if (!bonusesPageRawList) return;
    const filtered = filterBonusesRows(bonusesPageRawList, bonusesPageFilter);
    const sorted = sortBonusesRows(filtered, bonusesPageSort);
    renderBonusesGrid(sorted);
}

function wireBonusesPageControls() {
    const bar = document.querySelector('.bonuses-filter-bar');
    if (!bar || bar.dataset.wired === '1') return;
    bar.dataset.wired = '1';

    bar.querySelectorAll('[data-bonus-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-bonus-filter') || 'all';
            bonusesPageFilter = key;
            bar.querySelectorAll('[data-bonus-filter]').forEach((b) => {
                b.classList.toggle('active', (b.getAttribute('data-bonus-filter') || 'all') === key);
            });
            applyBonusesPageView();
        });
    });

    const sortEl = document.getElementById('bonuses-sort-select');
    if (sortEl && sortEl.dataset.bound !== '1') {
        sortEl.dataset.bound = '1';
        sortEl.value = bonusesPageSort;
        sortEl.addEventListener('change', () => {
            bonusesPageSort = sortEl.value || 'newest';
            applyBonusesPageView();
        });
    }
}

function initBonusesPage() {
    const grid = document.getElementById('bonuses-grid');
    if (!grid) return;
    grid.innerHTML = skeletonGridHtml('bonus-card', 6);

    wireBonusesPageControls();

    (async () => {
        grid.innerHTML = skeletonGridHtml('bonus-card', 6);
        try {
            await ensureCasinoBonusSlugMap();
            bonusesPageRawList = [...(bonusesListRowsCache || [])];
            if (bonusesPageRawList.length === 0) {
                grid.innerHTML =
                    '<p class="bonuses-grid-empty">No bonuses published yet.</p>';
                return;
            }
            applyBonusesPageView();
        } catch (e) {
            console.error(e);
            grid.innerHTML =
                `<p class="bonuses-grid-empty">${contentEmptyMessage('bonuses')}</p>`;
        }
    })();
}

function showBonusDetailError() {
    const root = document.getElementById('bonus-page-root');
    const err = document.getElementById('bonus-error');
    if (root) root.style.display = 'none';
    if (err) err.hidden = false;
}

function setBonusCanonicalAndOg(attr, slug, pageTitle, seoDesc) {
    const path = `/bonus/${encodeURIComponent(String(slug).trim())}`;
    const canonRaw = firstNonEmptyAttr(attr, ['CanonicalURL', 'canonicalUrl', 'canonicalURL']);
    const canonEl = document.getElementById('bd-canonical');
    let absolutePageUrl = '';
    if (canonRaw && /^https?:\/\//i.test(String(canonRaw).trim())) {
        absolutePageUrl = String(canonRaw).trim();
        if (canonEl) canonEl.setAttribute('href', absolutePageUrl);
    } else {
        try {
            absolutePageUrl = new URL(path, getPublicSiteOrigin()).href;
        } catch {
            absolutePageUrl = path;
        }
        if (canonEl) canonEl.setAttribute('href', absolutePageUrl);
    }
    const ogUrl = document.getElementById('bd-og-url');
    if (ogUrl && absolutePageUrl) ogUrl.setAttribute('content', absolutePageUrl);
    const ogTitle = document.getElementById('bd-og-title');
    const ogDesc = document.getElementById('bd-og-description');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle.slice(0, 200));
    if (ogDesc) ogDesc.setAttribute('content', (seoDesc || '').slice(0, 320));
}

function bonusEligibleUsersDisplay(attr) {
    return (
        firstNonEmptyAttr(attr, [
            'EligibleUsers',
            'Eligibility',
            'Audience',
            'TargetAudience',
            'eligibleUsers',
        ]) || 'New members'
    );
}

function bonusProductDisplay(attr, casino) {
    const fromBonus = firstNonEmptyAttr(attr, [
        'Product',
        'Products',
        'ProductType',
        'AppliesTo',
        'product',
    ]);
    if (fromBonus) return fromBonus;

    const parts = [];
    const casinoHay = casino
        ? `${casino.Name || ''} ${casino.Description || ''} ${casino.ProductTags || ''}`.toLowerCase()
        : '';
    const bonusHay = `${firstNonEmptyAttr(attr, ['Title', 'Description']) || ''}`.toLowerCase();
    const hay = `${casinoHay} ${bonusHay}`;

    if (/sportsbook|sports\s*bet|sports betting/.test(hay)) parts.push('Sportsbook');
    if (/casino|slot|live dealer|table game/.test(hay) || (casino && casinoGameCountDisplay(casino))) {
        parts.push('Casino');
    }
    return parts.length ? parts.join(' / ') : 'Sportsbook / Casino';
}

function bonusTrustChipsList(casino, bonusAttr) {
    const chips = [];
    const license =
        casino &&
        firstNonEmptyAttr(casino, ['License', 'LicenseInfo', 'GamblingLicense', 'license']);
    if (license || casino || bonusAttr) {
        chips.push({ icon: 'shield-check', label: 'Licensed operator' });
    }

    const mobileKeys = ['MobileFriendly', 'IsMobileFriendly', 'HasMobileApp', 'MobileApp'];
    const hasMobile =
        casino && mobileKeys.some((k) => casino[k] === true || String(casino[k]).toLowerCase() === 'true');
    if (hasMobile || casino) {
        chips.push({ icon: 'smartphone', label: 'Mobile friendly' });
    }

    const productStr = bonusProductDisplay(bonusAttr, casino).toLowerCase();
    if (/sportsbook|sports/.test(productStr)) {
        chips.push({ icon: 'trophy', label: 'Sportsbook' });
    }
    if (/casino|slot|game/.test(productStr)) {
        chips.push({ icon: 'dice-5', label: 'Casino games' });
    }

    if (chips.length < 2) {
        if (!chips.some((c) => /sportsbook/i.test(c.label))) {
            chips.push({ icon: 'trophy', label: 'Sportsbook' });
        }
        if (!chips.some((c) => /casino/i.test(c.label))) {
            chips.push({ icon: 'dice-5', label: 'Casino games' });
        }
    }

    return chips.slice(0, 4);
}

function renderBonusTrustChipsHtml(casino, bonusAttr) {
    const chips = bonusTrustChipsList(casino, bonusAttr);
    return chips
        .map(
            (c) =>
                `<li><i data-lucide="${escapeHtml(c.icon)}" aria-hidden="true"></i>${escapeHtml(c.label)}</li>`,
        )
        .join('');
}

function populateBonusDetailPage(attr, slug) {
    const name = firstNonEmptyAttr(attr, ['Title', 'title']) || 'Casino bonus';
    const relatedCasino = getRelatedCasinoFromBonus(attr);
    const casinoName = bonusRelatedCasinoName(attr) || name.split(/\s+/)[0] || 'Casino';
    const seoTitle = firstNonEmptyAttr(attr, ['SEOTitle', 'seoTitle']);
    const seoDesc =
        firstNonEmptyAttr(attr, ['SEODescription', 'seoDescription']) ||
        firstNonEmptyAttr(attr, ['Description', 'ShortDescription']) ||
        '';
    const pageTitle = seoTitle || `${name} | Casino bonus | 888reviews`;
    document.title = pageTitle;

    const metaDesc = document.getElementById('bd-meta-description');
    if (metaDesc && seoDesc) {
        metaDesc.setAttribute('content', String(seoDesc).slice(0, 320));
    }

    setBonusCanonicalAndOg(attr, slug, pageTitle, seoDesc);

    const crumb = document.getElementById('bd-crumb-current');
    if (crumb) crumb.textContent = name;

    const casinoNameEl = document.getElementById('bd-casino-name');
    if (casinoNameEl) casinoNameEl.textContent = casinoName;

    const ratingEl = document.getElementById('bd-trust-rating');
    if (ratingEl) {
        const ratingSource = relatedCasino || attr;
        const scoreLine = formatRatingScoreLine(ratingSource, '');
        if (scoreLine && getCuratorScoreOutOfFive(ratingSource) != null) {
            ratingEl.innerHTML = `${renderStars(ratingSource)}<span class="bd-brand-rating__score">${escapeHtml(scoreLine)}</span>`;
            ratingEl.hidden = false;
        } else {
            ratingEl.innerHTML = '';
            ratingEl.hidden = true;
        }
    }

    const chipsEl = document.getElementById('bd-trust-chips');
    if (chipsEl) {
        chipsEl.innerHTML = renderBonusTrustChipsHtml(relatedCasino, attr);
    }

    const amountLine = firstNonEmptyAttr(attr, ['BonusAmount', 'bonusAmount']) || '';
    const amountEl = document.getElementById('bd-amount');
    if (amountEl) amountEl.textContent = amountLine;

    const descEl = document.getElementById('bd-desc');
    const descWrap = document.getElementById('bd-desc-wrap');
    const descPlain = firstNonEmptyAttr(attr, ['Description', 'ShortDescription']) || '';
    if (descEl) {
        descEl.textContent = descPlain;
    }
    if (descWrap) {
        descWrap.hidden = !descPlain;
    }

    const typeEl = document.getElementById('bd-bonus-type');
    const bonusType = firstNonEmptyAttr(attr, ['BonusType', 'bonusType']);
    if (typeEl) {
        if (bonusType) {
            typeEl.textContent = String(bonusType).toUpperCase();
            typeEl.hidden = false;
        } else {
            typeEl.hidden = true;
        }
    }

    const quickTypeEl = document.getElementById('bd-quick-type');
    if (quickTypeEl) {
        quickTypeEl.textContent = bonusType || 'Welcome bonus';
    }

    const quickEligibleEl = document.getElementById('bd-quick-eligible');
    if (quickEligibleEl) {
        quickEligibleEl.textContent = bonusEligibleUsersDisplay(attr);
    }

    const quickProductEl = document.getElementById('bd-quick-product');
    if (quickProductEl) {
        quickProductEl.textContent = bonusProductDisplay(attr, relatedCasino);
    }

    const quickTermsEl = document.getElementById('bd-quick-terms');
    if (quickTermsEl) {
        quickTermsEl.textContent = 'Check operator site';
    }

    const titleEl = document.getElementById('bd-title');
    if (titleEl) titleEl.textContent = name;

    const vf = formatBonusDateDisplay(attr.ValidFrom || attr.validFrom);
    const exp = formatBonusDateDisplay(attr.ExpiryDate || attr.expiryDate);
    const validFromEl = document.getElementById('bd-valid-from');
    const validFromTextEl = document.getElementById('bd-valid-from-text');
    const expiresEl = document.getElementById('bd-expires');
    const expiresTextEl = document.getElementById('bd-expires-text');
    if (validFromEl && validFromTextEl) {
        if (vf) {
            validFromTextEl.textContent = `Valid from ${vf}`;
            validFromEl.hidden = false;
        } else {
            validFromTextEl.textContent = '';
            validFromEl.hidden = true;
        }
    }
    if (expiresEl && expiresTextEl) {
        if (exp) {
            expiresTextEl.textContent = `Expires ${exp}`;
            expiresEl.hidden = false;
        } else {
            expiresTextEl.textContent = '';
            expiresEl.hidden = true;
        }
    }

    const { url: heroUrl, isLogo: heroIsLogo } = bonusCardVisual(attr);
    const fallbackHero =
        'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=800&auto=format&fit=crop';
    const img = document.getElementById('bd-hero-img');
    const frame = document.getElementById('bd-visual-frame');
    if (img && frame) {
        const src = heroUrl || fallbackHero;
        img.src = src;
        img.alt = `${casinoName} logo`;
        img.hidden = false;
        const useLogo = heroIsLogo && !!heroUrl;
        frame.classList.toggle('bd-hero-frame--logo', useLogo);
        frame.classList.toggle('bd-hero-frame--cover', !useLogo);
        img.classList.toggle('bd-hero-img--logo', useLogo);
    }

    const actionLede = document.getElementById('bd-action-lede');
    if (actionLede) {
        actionLede.textContent = amountLine
            ? `Claim the ${casinoName} offer through the operator’s official link. Confirm eligibility and terms before you deposit.`
            : `Use the operator’s official link to activate this ${casinoName} offer. Confirm eligibility on their site before you deposit.`;
    }

    const ctaPrimaryLabel = document.getElementById('bd-cta-primary-label');
    if (ctaPrimaryLabel) {
        ctaPrimaryLabel.textContent = `Claim ${casinoName} bonus`;
    }

    const ctaReviewLabel = document.getElementById('bd-cta-review-label');
    if (ctaReviewLabel) {
        ctaReviewLabel.textContent = `Read full ${casinoName} review`;
    }

    const pubOriginBonus = getPublicSiteOrigin();
    const defaultShareImgBonus = `${pubOriginBonus}/assets/img/888review-siteicon.webp`;
    let shareImgBonus = '';
    if (img && img.getAttribute('src')) shareImgBonus = img.getAttribute('src');
    if (shareImgBonus && shareImgBonus.startsWith('/')) shareImgBonus = `${pubOriginBonus}${shareImgBonus}`;
    if (!shareImgBonus) shareImgBonus = defaultShareImgBonus;
    const bdOgImg = document.getElementById('bd-og-image');
    const bdTwImg = document.getElementById('bd-twitter-image');
    const bdTwTitle = document.getElementById('bd-twitter-title');
    const bdTwDesc = document.getElementById('bd-twitter-description');
    if (bdOgImg) bdOgImg.setAttribute('content', shareImgBonus);
    if (bdTwImg) bdTwImg.setAttribute('content', shareImgBonus);
    if (bdTwTitle) bdTwTitle.setAttribute('content', pageTitle.slice(0, 200));
    if (bdTwDesc) bdTwDesc.setAttribute('content', (seoDesc || '').slice(0, 320));

    function showFact(id, val) {
        const wrap = document.getElementById(id);
        const s = val != null && String(val).trim() !== '' ? String(val).trim() : '';
        if (!wrap) return;
        if (!s) {
            wrap.hidden = true;
            return;
        }
        wrap.hidden = false;
        const dd = wrap.querySelector('dd');
        if (dd) dd.textContent = s;
    }

    showFact(
        'bd-fact-wager',
        firstNonEmptyAttr(attr, ['WageringRequirement', 'Wagering', 'WagerRequirement']),
    );
    showFact('bd-fact-mindep', firstNonEmptyAttr(attr, ['MinDeposit', 'MinimumDeposit', 'MinDep']));
    showFact('bd-fact-maxout', firstNonEmptyAttr(attr, ['MaxCashout', 'maxCashout', 'MaxWithdrawal']));
    populateBonusCodeSection(attr);

    const termsWrap = document.getElementById('bd-terms-wrap');
    const termsEl = document.getElementById('bd-full-terms');
    const fullTerms = attr.FullTerms ?? attr.fullTerms ?? '';
    if (termsWrap && termsEl) {
        const html = bonusFullTermsToHtml(fullTerms);
        if (html) {
            termsEl.innerHTML = html;
            termsWrap.hidden = false;
        } else {
            termsEl.innerHTML = '';
            termsWrap.hidden = true;
        }
    }

    const href = bonusCtaHref(attr);
    applyBonusLinkButton(document.getElementById('bd-cta-primary'), href);
    applyBonusLinkButton(document.getElementById('bd-sidebar-cta'), href);

    const reviewBtn = document.getElementById('bd-cta-review');
    const sidebarReview = document.getElementById('bd-sidebar-review');
    const cs = relatedCasino ? firstNonEmptyAttr(relatedCasino, ['Slug', 'slug']) : '';
    if (cs) {
        const reviewPath = casinoReviewPath(cs);
        if (reviewBtn) {
            reviewBtn.setAttribute('href', reviewPath);
            reviewBtn.style.display = '';
        }
        if (sidebarReview) {
            sidebarReview.setAttribute('href', reviewPath);
            sidebarReview.style.display = '';
        }
    } else {
        if (reviewBtn) reviewBtn.style.display = 'none';
        if (sidebarReview) sidebarReview.style.display = 'none';
    }

    const pathForJson = `/bonus/${encodeURIComponent(String(slug).trim())}`;
    const pub = getPublicSiteOrigin();
    let absoluteUrl;
    try {
        absoluteUrl = new URL(pathForJson, pub).href;
    } catch {
        absoluteUrl = pathForJson;
    }

    const webLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle,
        description: (seoDesc || descPlain || '').slice(0, 500),
        url: absoluteUrl,
        isPartOf: { '@type': 'WebSite', name: '888reviews', url: `${pub}/` },
    };
    const bcLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${pub}/` },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Casino Bonuses',
                item: `${pub}/bonus`,
            },
            { '@type': 'ListItem', position: 3, name: name, item: absoluteUrl },
        ],
    };
    const webEl = document.getElementById('bd-jsonld-webpage');
    const bcEl = document.getElementById('bd-jsonld-breadcrumb');
    if (webEl) webEl.textContent = JSON.stringify(webLd);
    if (bcEl) bcEl.textContent = JSON.stringify(bcLd);
}

async function initBonusDetailPage() {
    const root = document.getElementById('bonus-page-root');
    if (!root || !document.getElementById('bd-title')) {
        return;
    }
    setupBonusDetailCodeCopy();

    const pathMatch = window.location.pathname.match(/^\/bonus\/([^/]+)\/?$/);
    const slug = pathMatch
        ? decodeURIComponent(pathMatch[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showBonusDetailError();
        return;
    }

    setDetailPageLoading(root);
    try {
        const { res, json } = await fetchBonusBySlug(slug);
        if (!res || !res.ok || !json || !json.data || json.data.length === 0) {
            showBonusDetailError();
            return;
        }
        const attr = bonusEntryAttr(json.data[0]);
        if (!attr) {
            showBonusDetailError();
            return;
        }
        populateBonusDetailPage(attr, slug);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Failed to load bonus:', e);
        showBonusDetailError();
    } finally {
        clearDetailPageLoading(root);
    }
}

async function bootApp() {
    try {
        await ensureStrapiPublicUrl();
    } catch (e) {
        console.warn('Content API public URL:', e);
    }

    const pageType = detectBootPageType();

    switch (pageType) {
        case 'guide-post':
            await initGuidePostPage();
            return;
        case 'bonus-detail':
            await initBonusDetailPage();
            return;
        case 'provider-detail':
            await initProviderDetailPage();
            return;
        case 'slot-detail':
            await initSlotDetailPage();
            return;
        case 'home':
            await Promise.all([loadHomeFeaturedCasino(), loadCasinos(), loadProviders()]);
            return;
        case 'malaysia-hub': {
            try {
                await ensureCasinoBonusSlugMap();
            } catch (e) {
                console.warn('Malaysia hub bonus map:', e);
            }
            await initMalaysiaHubPage();
            return;
        }
        case 'live-casino-hub':
            await initLiveCasinoPage();
            return;
        case 'reviews-hub':
            await initReviewsHubPage();
            return;
        case 'e-wallet-hub':
            await initEWalletPage();
            return;
        case 'slot-page-hub':
            await initSlotPage();
            return;
        case 'roulette-hub':
            await initRoulettePage();
            return;
        case 'blackjack-hub':
            await initBlackjackPage();
            return;
        case 'baccarat-hub':
            await initBaccaratPage();
            return;
        case 'mobile-hub':
            await initMobilePage();
            return;
        case 'bonus-hub':
            await initBonusHubPage();
            return;
        case 'casinos-listing': {
            const casinosEl = document.getElementById('casinos-listing-container');
            if (casinosEl) casinosEl.innerHTML = skeletonGridHtml('listing-card', 5);
            try {
                await ensureCasinoBonusSlugMap();
            } catch (e) {
                console.warn('Bonus / casino map:', e);
            }
            initCasinosListingPage();
            return;
        }
        case 'slots-listing': {
            const slotsEl = document.getElementById('slots-listing-grid');
            if (slotsEl) slotsEl.innerHTML = skeletonGridHtml('slot-card', 6);
            initSlotsListingPage();
            return;
        }
        case 'providers-listing': {
            const providersEl = document.getElementById('providers-listing-grid');
            if (providersEl) providersEl.innerHTML = skeletonGridHtml('provider-card', 6);
            initProvidersListingPage();
            return;
        }
        case 'bonuses-listing':
            return;
        case 'guides-listing': {
            const guidesEl = document.getElementById('guides-grid');
            const guidesStatus = document.getElementById('guides-status');
            if (guidesEl) guidesEl.innerHTML = skeletonGridHtml('guide-card', 6);
            if (guidesStatus) guidesStatus.hidden = true;
            initGuidesPage();
            return;
        }
        case 'news-listing': {
            const newsEl = document.getElementById('news-grid');
            const newsStatus = document.getElementById('news-status');
            if (newsEl) newsEl.innerHTML = skeletonGridHtml('guide-card', 6);
            if (newsStatus) newsStatus.hidden = true;
            initNewsPage();
            return;
        }
        default:
            return;
    }
}

function scheduleBootApp() {
    const run = () => bootApp().catch((e) => console.error(e));
    // Defer when the document is already past "loading" so const populate strings
    // defined later in this file are initialized before any CMS fetch runs.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        queueMicrotask(run);
    }
}

/**
 * Strapi query fragment for providers directory filters (see providers.html tabs).
 * Uses boolean / string fields aligned with `providerTierBadgeClass` + homepage cards.
 */
function providersListingFilterQuery(filter) {
    if (filter === 'top') return '&filters[IsTopProvider][$eq]=true';
    if (filter === 'innovator') return '&filters[TierBadge][$containsi]=Innovator';
    return '';
}

// ============================================================
// Providers listing (/providers.html)
// ============================================================
function initProvidersListingPage() {
    const grid = document.getElementById('providers-listing-grid');
    if (!grid) return;
    grid.innerHTML = skeletonGridHtml('provider-card', 6);

    let currentPage = 1;
    const pageSize = PROVIDERS_PAGE_SIZE;
    let pageCount = 1;
    let activeFilter = 'all';
    let sortParam = 'Rank:asc';

    const wrap = document.getElementById('providers-pagination-wrap');
    const firstBtn = document.getElementById('providers-btn-first');
    const prevBtn = document.getElementById('providers-btn-prev');
    const nextBtn = document.getElementById('providers-btn-next');
    const lastBtn = document.getElementById('providers-btn-last');
    const pageNumbersEl = document.getElementById('providers-page-numbers');
    const pageInput = document.getElementById('providers-page-input');
    const pageGoBtn = document.getElementById('providers-page-go');
    const pageTotalHint = document.getElementById('providers-page-total-hint');
    const totalEl = document.getElementById('providers-total-count');
    const sortSelect = document.getElementById('providers-sort');
    let providersListingFirstFetch = true;
    /** After first response we can optimistically update pager before fetch completes. */
    let providersPagerReady = false;

    function setProviderFilterTabsUi(filter) {
        document.querySelectorAll('[data-provider-filter]').forEach((btn) => {
            const on = btn.getAttribute('data-provider-filter') === filter;
            btn.classList.toggle('active', on);
            btn.setAttribute('aria-selected', on ? 'true' : 'false');
        });
    }

    document.querySelectorAll('[data-provider-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const next = btn.getAttribute('data-provider-filter') || 'all';
            if (next === activeFilter) return;
            activeFilter = next;
            setProviderFilterTabsUi(activeFilter);
            currentPage = 1;
            fetchAndRender();
        });
    });

    if (sortSelect) {
        sortSelect.value = sortParam;
        sortSelect.addEventListener('change', () => {
            sortParam = sortSelect.value || 'Rank:asc';
            currentPage = 1;
            fetchAndRender();
        });
    }

    function navigateToProvidersPage(p) {
        const n = Math.max(1, Math.min(pageCount, Math.floor(Number(p))));
        if (n === currentPage) return;
        currentPage = n;
        fetchAndRender();
    }

    bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigateToProvidersPage);

    function renderCard(p) {
        const attr = p.attributes || p;
        const img = getProviderCardImageUrl(attr);
        const badge = escapeHtml(attr.TierBadge || 'VERIFIED');
        const score = formatRatingScoreHeadline(attr);
        const scoreDisplay = score !== 'N/A' ? score : '-';
        const name = escapeHtml(attr.Name || 'Provider');
        const imgAlt = escapeHtml(`${attr.Name || 'Provider'} logo`);
        const lines = providerSignatureLines(attr);
        const sigLis = lines.length ? lines.map((l) => `<li>${escapeHtml(l)}</li>`).join('') : '<li>-</li>';
        const portfolio = escapeHtml(String(attr.GamePortfolioCount ?? '-'));
        const slugForLink =
            providerSlugValue(attr) || (attr.Name ? slugifyLabel(attr.Name) : '');
        const href = slugForLink ? providerPath(slugForLink) : '#';
        const matClass = providerLogoMatIsDark(attr) ? ' pc-image-wrap--mat-dark' : '';

        return `
        <a href="${href}" class="provider-card reveal delay-200 active" style="text-decoration:none;color:inherit;display:block;">
            <div class="pc-image-wrap${matClass}">
                <img src="${img}" alt="${imgAlt}" class="pc-image" loading="lazy">
            </div>
            <div class="pc-content">
                <div class="pc-header">
                    <div class="pc-badge-wrap">
                        <span class="pc-badge">${badge}</span>
                    </div>
                    <div class="pc-rating-wrap">
                        <div class="pc-score">${escapeHtml(scoreDisplay)}</div>
                        <div class="review-stars small">${renderStars(attr)}</div>
                    </div>
                </div>
                <h3 class="pc-title">${name}</h3>
                <div class="pc-signature">
                    <span class="pc-sig-label">SIGNATURE TITLES</span>
                    <ul class="pc-sig-list">${sigLis}</ul>
                </div>
                <div class="pc-footer">
                    <div class="pc-portfolio">
                        <span class="port-label">Portfolio</span>
                        <span class="port-value"><strong>${portfolio}</strong> games</span>
                    </div>
                    <span class="pc-action-btn" aria-hidden="true"><i data-lucide="arrow-right"></i></span>
                </div>
            </div>
        </a>`;
    }

    async function fetchAndRender(opts = {}) {
        const skipScroll = opts.skipScroll === true;
        if (!providersListingFirstFetch && !skipScroll) {
            scrollListingAnchorIntoView('.providers-grid-section');
        }
        if (providersPagerReady && wrap && pageCount > 1) {
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint
            );
        }

        const holdHeight = Math.max(grid.offsetHeight, 200);
        grid.style.minHeight = `${holdHeight}px`;
        grid.innerHTML = skeletonGridHtml('provider-card', 6);

        const clearListingMinHeight = () => {
            grid.style.minHeight = '';
        };

        try {
            const sortQ = encodeURIComponent(sortParam);
            const filterQ = providersListingFilterQuery(activeFilter);
            const qs = `populate=*&sort=${sortQ}${filterQ}&pagination[page]=${currentPage}&pagination[pageSize]=${pageSize}`;
            const res = await fetch(`${API_URL}/api/providers?${qs}`);
            const json = await res.json();
            if (!res.ok) {
                clearListingMinHeight();
                grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">${apiErrorMessage(res.status, json, 'providers')}</p>`;
                if (wrap) wrap.style.display = 'none';
                providersListingFirstFetch = false;
                return;
            }
            const { data, meta } = json;
            const total = meta?.pagination?.total ?? data?.length ?? 0;
            pageCount = meta?.pagination?.pageCount ?? 1;
            if (totalEl) totalEl.textContent = String(total);

            if (currentPage > pageCount && pageCount >= 1) {
                currentPage = pageCount;
                clearListingMinHeight();
                return fetchAndRender({ skipScroll: true });
            }

            if (!data || data.length === 0) {
                clearListingMinHeight();
                grid.innerHTML =
                    '<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">No providers listed yet.</p>';
                if (wrap) wrap.style.display = 'none';
                providersListingFirstFetch = false;
                providersPagerReady = true;
                return;
            }

            clearListingMinHeight();
            grid.innerHTML = data.map(renderCard).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();

            providersPagerReady = true;
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint
            );
            providersListingFirstFetch = false;
        } catch (e) {
            console.error(e);
            clearListingMinHeight();
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">${contentEmptyMessage('providers')}</p>`;
            if (wrap) wrap.style.display = 'none';
            providersListingFirstFetch = false;
        }
    }

    if (firstBtn) {
        firstBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage = 1;
                fetchAndRender();
            }
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRender();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage++;
                fetchAndRender();
            }
        });
    }
    if (lastBtn) {
        lastBtn.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage = pageCount;
                fetchAndRender();
            }
        });
    }

    fetchAndRender();
}

// ============================================================
// Slots listing (/slots.html) - Strapi collection `slots` (see SLOTS_API_COLLECTION)
// ============================================================
function slotStatIsEmpty(display) {
    const s = String(display || '').trim();
    return s === '' || s === '-' || s === 'N/A';
}

/** One short editorial line for cards (HighlightQuote / Tagline only). */
function slotCardExcerptPlain(attr) {
    const raw = firstNonEmptyAttr(attr, ['HighlightQuote', 'Tagline']);
    if (!raw) return '';
    const plain = String(raw)
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plain) return '';
    if (plain.length > 72) return `${plain.slice(0, 69)}…`;
    return plain;
}

/** Full slot list cached when dropdown filters need client-side matching (reliable vs Strapi filter quirks). */
let slotsListingFullCache = null;

function slotsListingUsesClientFilters(state) {
    return !!(state.providerVal || state.volatility || state.rtpBand);
}

function slotPassesSlotListingFilters(entry, state) {
    const attr = entry.attributes || entry;
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const title = String(attr.Name || attr.Title || '').toLowerCase();
        const prov = (slotProviderDisplayName(attr) || '').toLowerCase();
        if (!title.includes(q) && !prov.includes(q)) return false;
    }
    if (state.providerVal) {
        if (state.providerVal.startsWith('id:')) {
            const want = state.providerVal.slice(3);
            const rel = attr.provider ?? attr.Provider ?? attr.providers;
            const pd = rel && (rel.data != null ? rel.data : rel);
            if (!pd) return false;
            const list = Array.isArray(pd) ? pd : [pd];
            const ids = list.map((x) => String(x?.id ?? '')).filter(Boolean);
            if (!ids.includes(want)) return false;
        } else if (state.providerVal.startsWith('name:')) {
            const want = state.providerVal.slice(5).toLowerCase();
            const prov = (slotProviderDisplayName(attr) || '').toLowerCase();
            if (!prov.includes(want)) return false;
        } else {
            const prov = (slotProviderDisplayName(attr) || '').toLowerCase();
            if (!prov.includes(state.providerVal.toLowerCase())) return false;
        }
    }
    if (state.volatility) {
        const v = formatSlotVolatilityBadge(attr);
        if (!v || !v.toUpperCase().includes(state.volatility.toUpperCase())) return false;
    }
    if (state.rtpBand) {
        const p = slotRtpPercentNumber(attr);
        if (p == null) return false;
        if (state.rtpBand === 'under94' && !(p < 94)) return false;
        if (state.rtpBand === '94-96' && !(p >= 94 && p < 96)) return false;
        if (state.rtpBand === 'over96' && !(p >= 96)) return false;
    }
    return true;
}

async function fetchAllSlotsForListingFilters() {
    if (slotsListingFullCache) return slotsListingFullCache;
    const all = [];
    let page = 1;
    let totalPages = 1;
    do {
        const qs = `populate=*&sort=${encodeURIComponent(SLOTS_LIST_SORT)}&pagination[page]=${page}&pagination[pageSize]=100`;
        const res = await fetch(`${API_URL}/api/${SLOTS_API_COLLECTION}?${qs}`);
        const json = await res.json();
        if (!res.ok) throw new Error('slots-list');
        (json.data || []).forEach((row) => all.push(row));
        totalPages = json.meta?.pagination?.pageCount || 1;
        page++;
    } while (page <= totalPages);
    slotsListingFullCache = all;
    return all;
}

/** Shorten native <option> labels so the OS dropdown width stays near the field (long text widens the menu). */
function truncateSlotsFilterOptionLabel(text, maxLen = 28) {
    const s = String(text || '').trim();
    if (s.length <= maxLen) return s;
    return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}

async function populateSlotsProviderFilterSelect() {
    const sel = document.getElementById('slots-filter-provider');
    if (!sel) return;
    sel.innerHTML = '';
    const allOpt = new Option('All providers', '');
    allOpt.title = 'All providers';
    sel.appendChild(allOpt);
    try {
        const res = await fetch(`${API_URL}/api/providers?pagination[limit]=500&sort=Name:asc`);
        const json = await res.json();
        if (!res.ok) return;
        (json.data || []).forEach((row) => {
            const a = row.attributes || row;
            const name = String(a.Name || '').trim();
            if (!name) return;
            const id = row.id != null ? String(row.id) : '';
            const opt = document.createElement('option');
            opt.value = id ? `id:${id}` : `name:${name}`;
            opt.textContent = truncateSlotsFilterOptionLabel(name);
            opt.title = name;
            sel.appendChild(opt);
        });
    } catch {
        /* non-fatal */
    }
}

function renderSlotCard(entry) {
    const attr = entry.attributes || entry;
    const title = escapeHtml(attr.Name || attr.Title || 'Slot');
    const providerName = (slotProviderDisplayName(attr) || '').trim();
    const providerInner = providerName
        ? escapeHtml(providerName.toUpperCase())
        : 'PROVIDER';
    const providerClass = providerName ? 'sc-provider-name' : 'sc-provider-name sc-provider-name--empty';
    const rtp = escapeHtml(formatSlotRtpDisplay(attr));
    const vol = formatSlotVolatilityBadge(attr);
    const volHtml = vol ? `<span class="sc-volatility-badge">${escapeHtml(vol)}</span>` : '';
    const imgUrl = getSlotCardImageUrl(attr);
    const img = escapeHtml(imgUrl);
    const slug = slotSlugValue(attr);
    const reviewHref = slotDetailPath(slug);
    const playUrl = slotPlayLinkUrl(attr);
    const fallback = escapeHtml(DEFAULT_SLOT_CARD_IMAGE);

    const pros = slotBenefitTexts(attr.Pros);
    const prosN = pros.length;
    const highlightsStr = prosN > 0 ? `${prosN} highlight${prosN === 1 ? '' : 's'}` : '';

    const excerpt = slotCardExcerptPlain(attr);
    const excerptHtml = excerpt
        ? `<p class="sc-dek">${escapeHtml(excerpt)}</p>`
        : '';

    const highlightsRow =
        prosN > 0
            ? `<div class="sc-quick-meta"><span class="sc-quick-meta__item"><i data-lucide="sparkles"></i> ${escapeHtml(highlightsStr)}</span></div>`
            : '';

    const playBtn = playUrl
        ? `<a href="${escapeHtml(playUrl)}" class="sc-btn sc-btn--play" target="_blank" rel="noopener noreferrer">PLAY</a>`
        : '';

    return `
        <div class="slot-card">
            <div class="sc-image-wrap">
                ${volHtml}
                <img src="${img}" alt="" class="sc-image" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallback}';">
                <div class="sc-image-shade" aria-hidden="true"></div>
            </div>
            <div class="sc-content">
                <div class="sc-content-head">
                    <div class="${providerClass}" title="${providerInner}">${providerInner}</div>
                    <div class="sc-rtp-pill">
                        <span class="sc-rtp-pill__val">${rtp}</span>
                        <span class="sc-rtp-pill__lbl">RTP</span>
                    </div>
                </div>
                <h3 class="sc-title">${title}</h3>
                ${excerptHtml}
                ${highlightsRow}
                <div class="sc-card-actions">
                    <a href="${reviewHref}" class="sc-btn">READ REVIEW</a>
                    ${playBtn}
                </div>
            </div>
        </div>`;
}

function initSlotsListingPage() {
    const grid = document.getElementById('slots-listing-grid');
    if (!grid) return;
    grid.innerHTML = skeletonGridHtml('slot-card', 6);

    let currentPage = 1;
    const pageSize = SLOTS_PAGE_SIZE;
    let pageCount = 1;
    let searchQuery = '';
    let searchDebounce = null;
    /** After first load, scroll the listing into view before fetch when changing page or search. */
    let slotsListingFirstFetch = true;
    let slotsPagerReady = false;

    const wrap = document.getElementById('slots-pagination-wrap');
    const firstBtn = document.getElementById('slots-btn-first');
    const prevBtn = document.getElementById('slots-btn-prev');
    const nextBtn = document.getElementById('slots-btn-next');
    const lastBtn = document.getElementById('slots-btn-last');
    const pageNumbersEl = document.getElementById('slots-page-numbers');
    const pageInput = document.getElementById('slots-page-input');
    const pageGoBtn = document.getElementById('slots-page-go');
    const pageTotalHint = document.getElementById('slots-page-total-hint');
    const totalEl = document.getElementById('slots-hero-total');
    const searchInput = document.getElementById('slots-search-input');
    const clearBtn = document.getElementById('slots-clear-btn');
    const providerSel = document.getElementById('slots-filter-provider');
    const volSel = document.getElementById('slots-filter-volatility');
    const rtpSel = document.getElementById('slots-filter-rtp');

    function readSlotFilterState() {
        return {
            searchQuery,
            providerVal: providerSel?.value?.trim() || '',
            volatility: volSel?.value?.trim() || '',
            rtpBand: rtpSel?.value?.trim() || '',
        };
    }

    function navigateToSlotsPage(p) {
        const n = Math.max(1, Math.min(pageCount, Math.floor(Number(p))));
        if (n === currentPage) return;
        currentPage = n;
        fetchAndRender();
    }

    bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigateToSlotsPage);

    async function fetchAndRender(opts = {}) {
        const skipScroll = opts.skipScroll === true;
        if (!slotsListingFirstFetch && !skipScroll) {
            scrollListingAnchorIntoView('.slots-grid-section');
        }
        if (slotsPagerReady && wrap && pageCount > 1) {
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint
            );
        }

        const holdHeight = Math.max(grid.offsetHeight, 200);
        grid.style.minHeight = `${holdHeight}px`;
        grid.innerHTML = skeletonGridHtml('slot-card', 6);

        const clearListingMinHeight = () => {
            grid.style.minHeight = '';
        };

        const state = readSlotFilterState();

        try {
            if (slotsListingUsesClientFilters(state)) {
                const all = await fetchAllSlotsForListingFilters();
                const filtered = all.filter((e) => slotPassesSlotListingFilters(e, state));
                const total = filtered.length;
                pageCount = Math.max(1, Math.ceil(total / pageSize));
                if (totalEl) totalEl.textContent = String(total);

                if (currentPage > pageCount && pageCount >= 1) {
                    currentPage = pageCount;
                    clearListingMinHeight();
                    return fetchAndRender({ skipScroll: true });
                }

                clearListingMinHeight();

                if (filtered.length === 0) {
                    grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">No slots match your filters.</p>`;
                    if (wrap) wrap.style.display = 'none';
                    slotsListingFirstFetch = false;
                    slotsPagerReady = true;
                    return;
                }

                const slice = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
                grid.innerHTML = slice.map(renderSlotCard).join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();

                slotsPagerReady = true;
                updateListingPagerDom(
                    wrap,
                    pageCount,
                    currentPage,
                    prevBtn,
                    nextBtn,
                    pageNumbersEl,
                    pageInput,
                    pageTotalHint
                );
                slotsListingFirstFetch = false;
                return;
            }

            let qs = `populate=*&sort=${encodeURIComponent(SLOTS_LIST_SORT)}&pagination[page]=${currentPage}&pagination[pageSize]=${pageSize}`;
            if (searchQuery) {
                qs += `&filters[$and][0][$or][0][Title][$containsi]=${encodeURIComponent(searchQuery)}`;
                qs += `&filters[$and][0][$or][1][ProviderName][$containsi]=${encodeURIComponent(searchQuery)}`;
                qs += `&filters[$and][0][$or][2][Software][$containsi]=${encodeURIComponent(searchQuery)}`;
            }

            let res = await fetch(`${API_URL}/api/${SLOTS_API_COLLECTION}?${qs}`);
            let json = await res.json();
            if (!res.ok && res.status === 400 && searchQuery) {
                qs = `populate=*&sort=${encodeURIComponent(SLOTS_LIST_SORT)}&pagination[page]=${currentPage}&pagination[pageSize]=${pageSize}&filters[Title][$containsi]=${encodeURIComponent(searchQuery)}`;
                res = await fetch(`${API_URL}/api/${SLOTS_API_COLLECTION}?${qs}`);
                json = await res.json();
            }
            if (!res.ok) {
                clearListingMinHeight();
                grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">${apiErrorMessage(res.status, json, 'slots')}</p>`;
                if (wrap) wrap.style.display = 'none';
                if (totalEl) totalEl.textContent = '-';
                slotsListingFirstFetch = false;
                return;
            }
            const { data, meta } = json;
            const total = meta?.pagination?.total ?? data?.length ?? 0;
            pageCount = meta?.pagination?.pageCount ?? 1;
            if (totalEl) totalEl.textContent = String(total);

            if (currentPage > pageCount && pageCount >= 1) {
                currentPage = pageCount;
                clearListingMinHeight();
                return fetchAndRender({ skipScroll: true });
            }

            clearListingMinHeight();

            if (!data || data.length === 0) {
                const emptyMsg = searchQuery
                    ? 'No slots match your search.'
                    : 'No slots listed yet.';
                grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">${emptyMsg}</p>`;
                if (wrap) wrap.style.display = 'none';
                slotsListingFirstFetch = false;
                slotsPagerReady = true;
                return;
            }

            const cardsHtml = data.map(renderSlotCard).join('');
            grid.innerHTML = cardsHtml;
            if (typeof lucide !== 'undefined') lucide.createIcons();

            slotsPagerReady = true;
            updateListingPagerDom(
                wrap,
                pageCount,
                currentPage,
                prevBtn,
                nextBtn,
                pageNumbersEl,
                pageInput,
                pageTotalHint
            );
            slotsListingFirstFetch = false;
        } catch (e) {
            console.error(e);
            clearListingMinHeight();
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #64748b;">${contentEmptyMessage('slots')}</p>`;
            if (wrap) wrap.style.display = 'none';
            if (totalEl) totalEl.textContent = '-';
            slotsListingFirstFetch = false;
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (searchDebounce) clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => {
                searchQuery = searchInput.value.trim();
                currentPage = 1;
                fetchAndRender();
            }, 400);
        });
    }

    [providerSel, volSel, rtpSel].forEach((el) => {
        if (!el) return;
        el.addEventListener('change', () => {
            currentPage = 1;
            fetchAndRender();
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchInput) searchInput.value = '';
            searchQuery = '';
            if (providerSel) providerSel.value = '';
            if (volSel) volSel.value = '';
            if (rtpSel) rtpSel.value = '';
            slotsListingFullCache = null;
            currentPage = 1;
            fetchAndRender();
        });
    }

    if (firstBtn) {
        firstBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage = 1;
                fetchAndRender();
            }
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRender();
            }
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage++;
                fetchAndRender();
            }
        });
    }
    if (lastBtn) {
        lastBtn.addEventListener('click', () => {
            if (currentPage < pageCount) {
                currentPage = pageCount;
                fetchAndRender();
            }
        });
    }

    populateSlotsProviderFilterSelect().finally(() => {
        fetchAndRender();
    });
}

// ============================================================
// Casinos listing: slide-out filter drawer (tablet & mobile)
// ============================================================
function initCasinosListingFilterDrawer() {
    const toggle = document.getElementById('listing-filter-toggle');
    const drawer = document.getElementById('listing-filter-drawer');
    const backdrop = document.getElementById('listing-filter-backdrop');
    const closeBtn = document.getElementById('listing-filter-close');
    if (!toggle || !drawer) return;

    const mq = window.matchMedia('(max-width: 1024px)');

    const setOpen = (open) => {
        if (!mq.matches) {
            document.body.classList.remove('listing-filter-open');
            drawer.classList.remove('is-open');
            drawer.removeAttribute('aria-hidden');
            toggle.setAttribute('aria-expanded', 'false');
            if (backdrop) backdrop.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            return;
        }
        document.body.classList.toggle('listing-filter-open', open);
        drawer.classList.toggle('is-open', open);
        drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (backdrop) {
            backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
        document.body.style.overflow = open ? 'hidden' : '';
    };

    const closeDrawer = () => setOpen(false);

    toggle.addEventListener('click', () => {
        setOpen(!document.body.classList.contains('listing-filter-open'));
    });
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('listing-filter-open')) {
            closeDrawer();
        }
    });

    const onMqChange = () => {
        if (!mq.matches) closeDrawer();
    };
    if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', onMqChange);
    } else if (typeof mq.addListener === 'function') {
        mq.addListener(onMqChange);
    }
    window.addEventListener('resize', onMqChange);
    setOpen(false);
}

// ============================================================
// Malaysia Hub: static table with optional Strapi override
// ============================================================

function malaysiaHighlightDisplay(attr) {
    return firstNonEmptyAttr(attr, ['MalaysiaHighlight', 'malaysiaHighlight', 'Highlight', 'highlight']) || '';
}

function malaysiaBonusLineDisplay(attr) {
    return firstNonEmptyAttr(attr, ['MalaysiaBonusLine', 'malaysiaBonusLine']) || casinoBonusAmountDisplay(attr) || '';
}

/** Split bonus into intro / amount / extra for homepage operator cards. */
function malaysiaBonusPartsDisplay(attr) {
    const intro = firstNonEmptyAttr(attr, ['MalaysiaBonusIntro', 'malaysiaBonusIntro']);
    const amount = firstNonEmptyAttr(attr, ['MalaysiaBonusAmount', 'malaysiaBonusAmount']);
    const extra = firstNonEmptyAttr(attr, ['MalaysiaBonusExtra', 'malaysiaBonusExtra']);
    if (intro || amount || extra) {
        return {
            intro: intro || 'Up to',
            amount: amount || malaysiaBonusLineDisplay(attr) || '—',
            extra: extra || '',
        };
    }
    const line = malaysiaBonusLineDisplay(attr);
    if (!line) return { intro: '', amount: '—', extra: '' };
    const weeklyMatch = line.match(/^(Weekly giveaways up to)\s*(.+)$/i);
    if (weeklyMatch) return { intro: weeklyMatch[1], amount: weeklyMatch[2], extra: '' };
    const pctMatch = line.match(/^(\d+% up to)\s*(.+)$/i);
    if (pctMatch) {
        const rest = pctMatch[2];
        const plusIdx = rest.search(/\s+\+\s+/i);
        if (plusIdx > -1) {
            return {
                intro: pctMatch[1],
                amount: rest.slice(0, plusIdx).trim(),
                extra: rest.slice(plusIdx).trim(),
            };
        }
        return { intro: pctMatch[1], amount: rest, extra: '' };
    }
    const upToMatch = line.match(/^(Up to)\s*(.+)$/i);
    if (upToMatch) {
        const rest = upToMatch[2];
        const plusIdx = rest.search(/\s+\+\s+/i);
        if (plusIdx > -1) {
            return {
                intro: upToMatch[1],
                amount: rest.slice(0, plusIdx).trim(),
                extra: rest.slice(plusIdx).trim(),
            };
        }
        return { intro: upToMatch[1], amount: rest, extra: '' };
    }
    return { intro: '', amount: line, extra: '' };
}

function applyTopCasinoItemRatingOverride(merged, item) {
    if (!merged || !item) return merged;
    const raw = item.ratingOverride;
    if (raw == null || raw === '') return merged;
    const score = Number(raw);
    if (!Number.isFinite(score)) return merged;
    merged.RatingScore = score;
    merged.ratingScore = score;
    merged.rating_score = score;
    return merged;
}

function malaysiaOperatorRatingDisplay(attr, listPos) {
    return formatRatingScoreLine(attr, `${formatRatingSlashFive(5 - (listPos - 1) * 0.1)}`).replace(
        ' / ',
        '/',
    );
}

function malaysiaOperatorRatingHtml(attr, listPos) {
    const line = malaysiaOperatorRatingDisplay(attr, listPos);
    const match = line.match(/^([\d.]+)\/(\d+(?:\.\d+)?)$/);
    if (match) {
        return `<span class="malaysia-operator-row__score">
            <span class="malaysia-operator-row__score-value"><strong>${match[1]}</strong><span class="malaysia-operator-row__score-denom">/${match[2]}</span></span>
        </span>`;
    }
    return `<span class="malaysia-operator-row__score"><span class="malaysia-operator-row__score-value">${line}</span></span>`;
}

function casinoVisitSiteLabel(attr) {
    const ext = casinoAffiliateUrl(attr);
    if (ext) {
        try {
            const host = new URL(ext).hostname.replace(/^www\./i, '');
            return `Visit ${host}`;
        } catch {
            /* fall through */
        }
    }
    const slug = firstNonEmptyAttr(attr, ['Slug', 'slug']);
    if (slug) return `Visit ${slug.replace(/-/g, '.')}`;
    const name = firstNonEmptyAttr(attr, ['Name', 'name']);
    return name ? `Visit ${name}` : 'Visit site';
}

function malaysiaTableRowClass(listPos) {
    if (listPos === 1) return ' malaysia-table__row--podium malaysia-table__row--podium-1';
    if (listPos === 2) return ' malaysia-table__row--podium malaysia-table__row--podium-2';
    if (listPos === 3) return ' malaysia-table__row--podium malaysia-table__row--podium-3';
    return '';
}

function malaysiaOperatorRowClass(listPos) {
    if (listPos === 1) return ' malaysia-operator-row--podium malaysia-operator-row--podium-1';
    if (listPos === 2) return ' malaysia-operator-row--podium malaysia-operator-row--podium-2';
    if (listPos === 3) return ' malaysia-operator-row--podium malaysia-operator-row--podium-3';
    return '';
}

function malaysiaCategoryWinner(rows, flagKey) {
    if (!Array.isArray(rows)) return null;
    for (const row of rows) {
        const attr = attrFromCasinoEntry(row);
        const flags = attr.CategoryFlags || attr.categoryFlags;
        if (flags && (flags[flagKey] || flags[flagKey.charAt(0).toUpperCase() + flagKey.slice(1)])) {
            return attr;
        }
    }
    return null;
}

function setMalaysiaSummaryPick(id, attr, options = {}) {
    const el = document.getElementById(id);
    if (!el) return;
    const fallback = options.display || el.dataset.default || el.textContent.trim();
    if (!attr) {
        el.textContent = fallback;
        el.className = 'malaysia-picks-item__value';
        return;
    }
    const display = options.display || attr.Name || attr.name || fallback;
    const href = casinoVisitSiteHref(attr);
    if (href && href !== '#') {
        const rel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
        el.outerHTML = `<a href="${escapeHtml(href)}" class="malaysia-picks-item__link" id="${id}"${rel}>${escapeHtml(display)}</a>`;
    } else {
        el.textContent = display;
        el.className = 'malaysia-picks-item__value';
    }
}

function updateMalaysiaSummaryTable(rows) {
    const grid = document.getElementById('malaysia-summary-grid');
    if (!grid || !Array.isArray(rows) || rows.length === 0) return;
    const editors = malaysiaCategoryWinner(rows, 'editorsPick');
    const payout = malaysiaCategoryWinner(rows, 'bestPayout');
    const slots = malaysiaCategoryWinner(rows, 'bestSlots');
    const live = malaysiaCategoryWinner(rows, 'bestLive');
    const fastest = malaysiaCategoryWinner(rows, 'fastestPayout');
    const mobile = malaysiaCategoryWinner(rows, 'bestMobile');
    setMalaysiaSummaryPick('summary-editors-pick', editors);
    setMalaysiaSummaryPick('summary-top-bonus', editors);
    setMalaysiaSummaryPick('summary-best-slots', slots);
    setMalaysiaSummaryPick('summary-best-live', live);
    setMalaysiaSummaryPick('summary-fastest-payout', fastest);
    setMalaysiaSummaryPick('summary-best-mobile', mobile);
    const payoutEl = document.getElementById('summary-best-payout');
    if (payoutEl && payout) {
        const display = payoutEl.dataset.default || payoutEl.textContent.trim();
        setMalaysiaSummaryPick('summary-best-payout', payout, { display });
    }
}

function updateMalaysiaFeaturedTables(rows) {
    const bonusPick = malaysiaCategoryWinner(rows, 'editorsPick') || (rows[0] ? attrFromCasinoEntry(rows[0]) : null);
    const livePick = malaysiaCategoryWinner(rows, 'bestLive');
    if (bonusPick) {
        const container = document.getElementById('malaysia-bonus-featured');
        if (container) {
            const attr = attrFromCasinoEntry(bonusPick);
            container.innerHTML = renderHomepageBonusCard({ casino: attr }, attr);
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
        }
    }
    if (livePick) {
        const container = document.getElementById('malaysia-live-featured');
        if (container) {
            const attr = attrFromCasinoEntry(livePick);
            container.innerHTML = renderHomepageFeaturedOperatorRow({ casino: attr }, attr, {
                ratingLabel: 'Live casino rating',
                defaultCta: 'Play live',
            });
            if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
        }
    }
}

function renderMalaysiaOperatorCard(entry, listPos) {
    const attr = attrFromCasinoEntry(entry);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const ratingHtml = malaysiaOperatorRatingHtml(attr, listPos);
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const bonusIntro = escapeHtml(bonusParts.intro || 'Up to');
    const bonusAmount = escapeHtml(bonusParts.amount);
    const bonusExtra = bonusParts.extra ? escapeHtml(bonusParts.extra) : '';
    const highlight = escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${bonusExtra}</span>`
        : '';
    return `<article class="malaysia-operator-row${malaysiaOperatorRowClass(listPos)}" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="Play at ${name}"><span class="sr-only">Play at ${name}</span></a>
        <div class="malaysia-operator-row__rank" aria-hidden="true">${listPos}</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">Rating</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${bonusIntro}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">Casino Highlight</span>
                <p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${highlight}</span></span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>Play Here!</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function renderMalaysiaTableRow(entry, listPos) {
    const attr = attrFromCasinoEntry(entry);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="" class="malaysia-table__logo" width="32" height="32" loading="lazy">`
        : `<span class="malaysia-table__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const rating = escapeHtml(formatRatingScoreLine(attr, formatRatingSlashFive(5 - (listPos - 1) * 0.1)));
    const bonus = escapeHtml(malaysiaBonusLineDisplay(attr) || '—');
    const highlight = escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    return `<tr class="malaysia-table__row${malaysiaTableRowClass(listPos)}">
        <td data-label="Casino"><span class="malaysia-table__rank">${listPos}</span>${logoHtml}<span class="malaysia-table__name">${name}</span></td>
        <td data-label="Rating">${rating}</td>
        <td data-label="Bonus">${bonus}</td>
        <td data-label="Highlight">${highlight}</td>
        <td data-label="Link"><a href="${visitHref}" class="btn btn-primary btn-small"${visitRel}>Visit site</a></td>
    </tr>`;
}

function updateMalaysiaConclusionFromAttr(attr) {
    if (!attr) return;
    applyMalaysiaConclusionCard('malaysia-conclusion-card', { casino: attr });
}

function findMalaysiaEditorsPick(rows) {
    if (!Array.isArray(rows)) return null;
    for (const row of rows) {
        const attr = attrFromCasinoEntry(row);
        const flags = attr.CategoryFlags || attr.categoryFlags;
        if (flags && (flags.editorsPick || flags.EditorsPick)) return attr;
    }
    return rows[0] ? attrFromCasinoEntry(rows[0]) : null;
}

/** Strapi v5 homepage single type — nested component + relation populate. */
const HOMEPAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[featuredSlots][populate][slot][populate]=coverImage' +
    '&populate[featuredSlots][populate][playAtCasino][populate]=logo' +
    '&populate[homepageBonus][populate][casino][populate]=logo' +
    '&populate[homepageBonus][populate][bonusOverride]=*' +
    '&populate[homepageBonus][populate][features]=*' +
    '&populate[liveDealerFeatured][populate][casino][populate]=logo' +
    '&populate[liveDealerFeatured][populate][bonusOverride]=*' +
    '&populate[liveDealerFeatured][populate][features]=*' +
    '&populate[liveDealerGames][populate]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true';

const HOMEPAGE_POPULATE_FALLBACK = 'populate=*';

async function fetchHomepage() {
    try {
        let res = await fetch(`${API_URL}/api/homepage?${HOMEPAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            const detail = json?.error?.message || res.status;
            if (res.status === 400 || res.status === 500) {
                console.warn('Homepage CMS populate failed, retrying shallow:', detail);
                res = await fetch(`${API_URL}/api/homepage?${HOMEPAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Homepage CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Homepage CMS fetch failed:', e);
        return null;
    }
}

/** Map Strapi v5 casino relation fields to names used by listing helpers. */
function normalizeV5CasinoAttr(casino) {
    if (!casino) return null;
    const base = attrFromCasinoEntry(casino);
    return {
        ...base,
        Name: base.Name || base.name,
        Slug: base.Slug || base.slug,
        RatingScore: base.RatingScore ?? base.ratingScore,
        AffiliateLink: base.AffiliateLink ?? base.affiliateLink ?? base.websiteUrl,
        Rank: base.Rank ?? base.rank,
    };
}

function homepageBonusOverrideLine(override) {
    if (!override) return '';
    const intro = String(override.intro || '').trim();
    const amount = String(override.amount || '').trim();
    const extra = String(override.extra || '').trim();
    return [intro, amount, extra].filter(Boolean).join(' ');
}

function homepageTopCasinoToAttr(item, enriched) {
    const casino = normalizeV5CasinoAttr(item?.casino) || {};
    const merged = enriched ? { ...enriched, ...casino } : { ...casino };
    if (item?.highlight) {
        merged.MalaysiaHighlight = item.highlight;
        merged.malaysiaHighlight = item.highlight;
    }
    const bonusLine = homepageBonusOverrideLine(item?.bonusOverride);
    if (bonusLine) {
        merged.MalaysiaBonusLine = bonusLine;
        merged.malaysiaBonusLine = bonusLine;
    }
    const override = item?.bonusOverride;
    if (override) {
        if (override.intro) {
            merged.MalaysiaBonusIntro = override.intro;
            merged.malaysiaBonusIntro = override.intro;
        }
        if (override.amount) {
            merged.MalaysiaBonusAmount = override.amount;
            merged.malaysiaBonusAmount = override.amount;
        }
        if (override.extra) {
            merged.MalaysiaBonusExtra = override.extra;
            merged.malaysiaBonusExtra = override.extra;
        }
    }
    return applyTopCasinoItemRatingOverride(merged, item);
}

function buildCasinoSlugMap(casinoRows) {
    const map = new Map();
    if (!Array.isArray(casinoRows)) return map;
    for (const row of casinoRows) {
        const attr = normalizeV5CasinoAttr(attrFromCasinoEntry(row));
        const slug = firstNonEmptyAttr(attr, ['Slug', 'slug']).toLowerCase();
        if (slug) map.set(slug, attr);
    }
    return map;
}

function buildHomepageOperatorRows(homepage, casinoRows) {
    const topCasinos = homepage?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return null;
    const slugMap = buildCasinoSlugMap(casinoRows);
    return topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .map((item) => {
            const slug = firstNonEmptyAttr(item?.casino || {}, ['slug', 'Slug']).toLowerCase();
            return homepageTopCasinoToAttr(item, slug ? slugMap.get(slug) : null);
        });
}

function setHomepageText(el, value, mode = 'text') {
    if (!el || value == null || String(value).trim() === '') return;
    if (mode === 'rich') setRichTextHtml(el, value);
    else if (mode === 'html') el.innerHTML = String(value);
    else el.textContent = String(value);
}

function applyHomepageSectionIntro(h2Id, value) {
    if (!value || String(value).trim() === '') return;
    const h2 = document.getElementById(h2Id);
    if (!h2) return;
    const section = h2.closest('.malaysia-section');
    const bodyContainer = section?.querySelector('.malaysia-section__body') || h2.closest('.container');
    if (!bodyContainer) return;
    let intro = bodyContainer.querySelector(':scope > p');
    if (!intro) {
        intro = document.createElement('p');
        bodyContainer.insertBefore(intro, bodyContainer.firstElementChild);
    }
    setRichTextHtml(intro, value);
}

function applyHomepageMeta(homepage) {
    const title = homepage.metaTitle;
    const desc = homepage.metaDescription;
    if (title) document.title = title;
    if (!desc) return;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && title) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', desc);
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle && title) twTitle.setAttribute('content', title);
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', desc);
}

function enrichHomepageFeaturedBlock(block, casinoRows) {
    if (!block?.casino) return block;
    const slug = (block.casino.slug || block.casino.Slug || '').toLowerCase();
    const enriched = casinoRows && slug ? buildCasinoSlugMap(casinoRows).get(slug) : null;
    if (!enriched) return block;
    return { ...block, casino: { ...block.casino, ...enriched } };
}

function malaysiaBonusFeaturedRatingHtml(attr, block) {
    const score =
        block?.bonusRatingOverride != null
            ? Number(block.bonusRatingOverride)
            : ratingScoreFromAttr(attr);
    if (!Number.isFinite(score)) {
        return malaysiaOperatorRatingHtml(attr, 1);
    }
    const num = formatRatingNumber(score);
    return `<span class="malaysia-operator-row__score">
            <span class="malaysia-operator-row__score-value"><strong>${num}</strong><span class="malaysia-operator-row__score-denom">/5</span></span>
        </span>`;
}

function renderHomepageFeaturedOperatorRow(block, attr, options = {}) {
    const ratingLabel = options.ratingLabel || 'Rating';
    const defaultCta = options.defaultCta || 'Play here';
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

    const override = block?.bonusOverride || {};
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const offerLabel = escapeHtml(
        options.offerLabel ||
            String(override.intro || bonusParts.intro || 'Up to').trim(),
    );
    const bonusAmount = escapeHtml(
        String(override.amount || '').trim() || bonusParts.amount || malaysiaBonusLineDisplay(attr) || '—',
    );
    const bonusExtra = String(override.extra || bonusParts.extra || '').trim();
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${escapeHtml(bonusExtra)}</span>`
        : '';

    const features = Array.isArray(block?.features)
        ? block.features.map((f) => f.label).filter(Boolean)
        : [];
    const highlightHtml = features.length
        ? features
              .map(
                  (label) =>
                      `<p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${escapeHtml(label)}</span></span></p>`,
              )
              .join('')
        : `<p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>—</span></span></p>`;

    const ctaText = escapeHtml(block?.ctaText || defaultCta);
    const visitHref = escapeHtml(block?.ctaLinkOverride || casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel =
        casinoVisitSiteIsExternal(attr) || block?.ctaLinkOverride
            ? ' rel="nofollow noopener" target="_blank"'
            : ' rel="nofollow noopener"';
    const ratingHtml = malaysiaBonusFeaturedRatingHtml(attr, block);

    return `<article class="malaysia-operator-row malaysia-operator-row--podium malaysia-operator-row--podium-1" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="${ctaText} at ${name}"><span class="sr-only">${ctaText} at ${name}</span></a>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">${escapeHtml(ratingLabel)}</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${offerLabel}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">Highlights</span>
                ${highlightHtml}
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>${ctaText}</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function renderHomepageBonusCard(block, attr) {
    return renderHomepageFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Bonus rating',
        defaultCta: 'Get bonus',
    });
}

function applyHomepageFeaturedOperator(containerId, block, options) {
    const container = document.getElementById(containerId);
    if (!container || !block?.casino) return;

    const attr = normalizeV5CasinoAttr(block.casino);
    container.innerHTML = renderHomepageFeaturedOperatorRow(block, attr, options);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function applyHomepageBonus(homepage, casinoRows) {
    const block = enrichHomepageFeaturedBlock(homepage?.homepageBonus, casinoRows);
    applyHomepageFeaturedOperator('malaysia-bonus-featured', block, {
        ratingLabel: 'Bonus rating',
        defaultCta: 'Get bonus',
    });
}

function applyHomepageLiveDealer(homepage, casinoRows) {
    const block = enrichHomepageFeaturedBlock(homepage?.liveDealerFeatured, casinoRows);
    applyHomepageFeaturedOperator('malaysia-live-featured', block, {
        ratingLabel: 'Live casino rating',
        defaultCta: 'Play live',
    });
}

function renderMalaysiaConclusionCerts(logos) {
    if (Array.isArray(logos) && logos.length > 0) {
        return logos
            .map((media) => {
                const url = media?.url;
                if (!url) return '';
                const src = logoImgSrcForDisplay(url);
                const alt = media?.alternativeText || media?.name || 'Certification';
                return `<img src="${escapeHtml(src)}" width="88" height="32" alt="${escapeHtml(alt)}" loading="lazy">`;
            })
            .filter(Boolean)
            .join('');
    }
    return `<img src="/assets/img/trust/ecogra.svg" width="88" height="32" alt="eCOGRA certified" loading="lazy">
        <img src="/assets/img/trust/gamcare.svg" width="88" height="32" alt="GamCare" loading="lazy">
        <span class="malaysia-trust__badge">Anjouan</span>`;
}

function malaysiaConclusionRatingBlockHtml(ratingText, starsHtml) {
    const line = String(ratingText || '');
    const match = line.match(/^([\d.]+)\/(\d+(?:\.\d+)?)$/);
    const scoreHtml = match
        ? `<span class="malaysia-conclusion-card__score-value"><strong>${match[1]}</strong><span class="malaysia-conclusion-card__score-denom">/${match[2]}</span></span>`
        : escapeHtml(line);
    return `<div class="malaysia-conclusion-card__rating-block">
        <p class="malaysia-conclusion-card__rating">${scoreHtml}</p>
        <div class="malaysia-conclusion-card__stars">${starsHtml}</div>
    </div>`;
}

function malaysiaConclusionBonusHtml(block, attr) {
    const override = block?.bonusOverride || {};
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const intro = String(override.intro || bonusParts.intro || '').trim();
    const amount =
        String(override.amount || '').trim() ||
        bonusParts.amount ||
        malaysiaBonusLineDisplay(attr) ||
        '—';
    const extra = String(override.extra || bonusParts.extra || '').trim();
    const introHtml = intro
        ? `<span class="malaysia-conclusion-card__bonus-intro">${escapeHtml(intro)}</span>`
        : '';
    const extraHtml = extra
        ? `<span class="malaysia-conclusion-card__bonus-extra">${escapeHtml(extra)}</span>`
        : '';
    return `<div class="malaysia-conclusion-card__bonus">${introHtml}<p class="malaysia-conclusion-card__amount">${escapeHtml(amount)}</p>${extraHtml}</div>`;
}

function renderMalaysiaConclusionCard(block, options = {}) {
    if (!block?.casino) return '';
    const attr = normalizeV5CasinoAttr(block.casino);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-conclusion-card__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-conclusion-card__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

    const score =
        block.ratingOverride != null
            ? Number(block.ratingOverride)
            : block.bonusRatingOverride != null
              ? Number(block.bonusRatingOverride)
              : ratingScoreFromAttr(attr);
    const ratingText = Number.isFinite(score)
        ? formatRatingSlashFive(score)
        : formatRatingScoreLine(attr, '5/5').replace(' / ', '/');
    const starsHtml = Number.isFinite(score) ? renderStars(score) : renderStars(attr);

    const features = Array.isArray(block.features)
        ? block.features.filter((f) => f?.label)
        : [];
    const fallbackFeatures = malaysiaHighlightDisplay(attr)
        ? malaysiaHighlightDisplay(attr)
              .split(/\s*·\s*/)
              .map((s) => s.trim())
              .filter(Boolean)
              .map((label) => ({ label }))
        : [];
    const featureItems = features.length ? features : fallbackFeatures;

    const featuresHtml = featureItems.length
        ? featureItems
              .map((item, i) => {
                  const label = item.label || item;
                  const isLead = item.isPrimary === true || (item.isPrimary !== false && i === 0);
                  return `<li class="malaysia-conclusion-card__feature${isLead ? ' malaysia-conclusion-card__feature--lead' : ''}"><i data-lucide="check-circle-2" aria-hidden="true"></i><span>${escapeHtml(label)}</span></li>`;
              })
              .join('')
        : `<li class="malaysia-conclusion-card__feature malaysia-conclusion-card__feature--lead"><i data-lucide="check-circle-2" aria-hidden="true"></i><span>—</span></li>`;

    const ctaText = escapeHtml(block.ctaText || 'Play Here!');
    const visitHref = escapeHtml(block.ctaLinkOverride || casinoVisitSiteHref(attr));
    const visitRel =
        casinoVisitSiteIsExternal(attr) || block.ctaLinkOverride
            ? ' rel="nofollow noopener" target="_blank"'
            : ' rel="nofollow noopener"';

    const certsHtml = options.hideCerts
        ? ''
        : `<div class="malaysia-conclusion-card__certs" aria-label="Certifications">${renderMalaysiaConclusionCerts(block.certificationLogos)}</div>`;

    return `<article class="malaysia-conclusion-card__inner">
        <div class="malaysia-conclusion-card__brand">
            ${logoHtml}
            ${malaysiaConclusionRatingBlockHtml(ratingText, starsHtml)}
        </div>
        <div class="malaysia-conclusion-card__panel">
            <div class="malaysia-conclusion-card__panel-grid">
                <ul class="malaysia-conclusion-card__features" role="list">${featuresHtml}</ul>
                ${certsHtml}
            </div>
        </div>
        <div class="malaysia-conclusion-card__offer">
            ${malaysiaConclusionBonusHtml(block, attr)}
            <a href="${visitHref}" class="btn-play-here malaysia-conclusion-card__cta"${visitRel}>
                <span class="malaysia-conclusion-card__cta-icon" aria-hidden="true"><i data-lucide="circle-play"></i></span>
                <span>${ctaText}</span>
            </a>
        </div>
    </article>`;
}

function applyMalaysiaConclusionCard(containerId, block, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !block?.casino) return;
    const normalized = {
        ...block,
        ratingOverride: block.ratingOverride ?? block.bonusRatingOverride,
    };
    container.innerHTML = renderMalaysiaConclusionCard(normalized, options);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function applyHomepageConclusionCta(block) {
    applyMalaysiaConclusionCard('malaysia-conclusion-card', block);
}

function renderMalaysiaFeaturedSlotCard(item, isFeatured) {
    const slot = item?.slot || {};
    const casino = normalizeV5CasinoAttr(item?.playAtCasino) || {};
    const slotName = slot.name || slot.Name || 'Slot';
    const imgUrl = getSlotCardImageUrl({
        coverImage: slot.coverImage,
        CoverImage: slot.CoverImage,
        Image: slot.image || slot.Image,
    });
    const casinoName = casino.Name || casino.name || '';
    const ctaLabel =
        String(item?.ctaLabel || '').trim() ||
        (casinoName ? `Play at ${casinoName}` : 'Play now');
    const visitHref = casinoVisitSiteHref(casino);
    const visitRel = casinoVisitSiteIsExternal(casino)
        ? ' target="_blank" rel="nofollow noopener"'
        : '';
    const featuredClass = isFeatured ? ' malaysia-featured-slot--featured' : '';
    const fallback = escapeHtml(DEFAULT_SLOT_CARD_IMAGE);

    return `<a href="${escapeHtml(visitHref)}" class="malaysia-featured-slot${featuredClass}"${visitRel} aria-label="${escapeHtml(`${slotName} — ${ctaLabel}`)}">
        <div class="malaysia-featured-slot__logo">
            <img src="${escapeHtml(imgUrl)}" alt="" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${fallback}';">
        </div>
        <span class="malaysia-featured-slot__cta btn btn-primary btn-small">${escapeHtml(ctaLabel)}</span>
    </a>`;
}

function applyHomepageFeaturedSlots(homepage, casinoRows) {
    const container = document.getElementById('malaysia-featured-slots');
    if (!container) return;
    const items = homepage?.featuredSlots;
    if (!Array.isArray(items) || items.length === 0) return;

    const featuredIndex = items.findIndex((item) => item?.isFeatured);
    const featuredIdx = featuredIndex >= 0 ? featuredIndex : 0;
    const slugMap = casinoRows ? buildCasinoSlugMap(casinoRows) : new Map();

    container.innerHTML = items
        .map((item, i) => {
            const slug = (item?.playAtCasino?.slug || item?.playAtCasino?.Slug || '').toLowerCase();
            const enriched = slug ? slugMap.get(slug) : null;
            const merged =
                enriched && item?.playAtCasino
                    ? { ...item, playAtCasino: { ...item.playAtCasino, ...enriched } }
                    : item;
            return renderMalaysiaFeaturedSlotCard(merged, i === featuredIdx);
        })
        .join('');

    container.dataset.count = String(items.length);
}

function renderMalaysiaOfficialListItem(attr) {
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';

    return `<li class="malaysia-official-list__item">
        <a href="${visitHref}" class="malaysia-official-list__link"${visitRel}>${name}</a>
    </li>`;
}

function applyHomepageOfficialList(homepage, casinoRows) {
    const listEl = document.getElementById('malaysia-official-list');
    const topCasinos = homepage?.topCasinos;
    if (!listEl || !Array.isArray(topCasinos) || topCasinos.length === 0) return;

    const slugMap = buildCasinoSlugMap(casinoRows);
    const items = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .map((item) => {
            const slug = firstNonEmptyAttr(item?.casino || {}, ['slug', 'Slug']).toLowerCase();
            const attr = homepageTopCasinoToAttr(item, slug ? slugMap.get(slug) : null);
            if (!attr?.Name && !attr?.name) return '';
            return renderMalaysiaOfficialListItem(attr);
        })
        .filter(Boolean);

    if (!items.length) return;

    listEl.innerHTML = items.join('');
}

function formatListingUpdatedDate(raw) {
    if (!raw) return '';
    const s = String(raw).trim();
    const d = new Date(s.includes('T') ? s : `${s}T12:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    const day = d.getDate();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
}

const MALAYSIA_LISTING_TRUST_BADGES = [
    { icon: 'lock', label: 'Secure' },
    { icon: 'thumbs-up', label: 'Trusted' },
    { icon: 'circle-check', label: 'Verified' },
];

function renderMalaysiaListingTrustBadges(badges) {
    const apiRows = Array.isArray(badges)
        ? badges.filter((b) => b && String(b.label || b.Label || '').trim())
        : [];
    const rows = apiRows.length > 0 ? apiRows : MALAYSIA_LISTING_TRUST_BADGES;
    return rows
        .map((badge) => {
            const icon = safeLucideIcon(badge.icon || badge.Icon || 'star');
            const label = escapeHtml(badge.label || badge.Label || '');
            if (!label) return '';
            return `<li class="malaysia-listing-meta__badge">
                <span class="malaysia-listing-meta__badge-icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
                <span>${label}</span>
            </li>`;
        })
        .filter(Boolean)
        .join('');
}

function applyHomepageListingMetaBar(homepage) {
    const bar = document.getElementById('malaysia-listing-meta');
    if (!bar) return;

    const updatedEl = document.getElementById('malaysia-listing-updated');
    const disclosureEl = document.getElementById('malaysia-listing-disclosure');
    const trustEl = document.getElementById('malaysia-listing-trust');

    const updatedRaw = homepage?.lastUpdated || homepage?.updatedAt || homepage?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }

    const disclosureText = homepage?.advertiserDisclosure || homepage?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }

    if (trustEl) {
        const apiBadges = homepage?.listingTrustBadges || homepage?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyHomepageFromCms(homepage) {
    if (!homepage) return;

    applyHomepageMeta(homepage);

    setHomepageText(document.getElementById('malaysia-operators-h2'), homepage.topCasinosHeading);
    applyHomepageSectionIntro('malaysia-operators-h2', homepage.topCasinosIntro);

    setHomepageText(document.getElementById('malaysia-slots-h2'), homepage.slotsHeading);
    applyHomepageSectionIntro('malaysia-slots-h2', homepage.slotsIntro);

    setHomepageText(document.getElementById('malaysia-live-h2'), homepage.liveDealerHeading);
    applyHomepageSectionIntro('malaysia-live-h2', homepage.liveDealerIntro);
    if (homepage.liveDealerOutro) {
        const section = document.getElementById('malaysia-live-h2')?.closest('section');
        const paragraphs = section?.querySelectorAll(':scope > p');
        const last = paragraphs?.[paragraphs.length - 1];
        if (last) setRichTextHtml(last, homepage.liveDealerOutro);
    }

    setHomepageText(document.getElementById('malaysia-conclusion-h2'), homepage.conclusionHeading);
    setHomepageText(document.querySelector('#malaysia-conclusion-cta > p'), homepage.conclusionBody, 'rich');
}

/** Strapi v5 live-casino single type — nested component + relation populate. */
const LIVE_CASINO_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[featuredWelcomeBonus][populate][casino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][bonusOverride]=*' +
    '&populate[featuredWelcomeBonus][populate][features]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true' +
    '&populate[paymentMethods]=*' +
    '&populate[blacklistItems]=*' +
    '&populate[ratingCriteria]=*' +
    '&populate[gameCategories]=*' +
    '&populate[checklistSteps]=*' +
    '&populate[providerTags]=*';

const LIVE_CASINO_POPULATE_FALLBACK = 'populate=*';

const LIVE_CASINO_CRITERIA_ICONS = ['shield-check', 'radio', 'sparkles', 'wallet', 'headphones', 'smartphone'];

function liveCasinoCriteriaIconForHeading(heading, index) {
    const h = String(heading || '').toLowerCase();
    if (/security|licen|trust|safe|audit/.test(h)) return 'shield-check';
    if (/game|variety|provider|studio|stream|dealer|table/.test(h)) return 'radio';
    if (/player|experience|value|bonus|payment|mobile|support/.test(h)) return 'sparkles';
    if (/bank|withdraw|payment|wallet|duitnow|ewallet/.test(h)) return 'wallet';
    return LIVE_CASINO_CRITERIA_ICONS[index % LIVE_CASINO_CRITERIA_ICONS.length];
}

function renderLiveCasinoCriteriaCard(c, index) {
    const heading = escapeHtml(c.heading || c.title || '');
    const bodyHtml = richTextToHtml(c.body) || plainTextToParagraphsHtml(c.description || c.body || '');
    const icon = liveCasinoCriteriaIconForHeading(c.heading || c.title, index);
    const bodyInner = bodyHtml
        ? `<div class="rich-text-body live-casino-criteria-card__body">${bodyHtml}</div>`
        : '';
    return `<article class="live-casino-criteria-card live-criteria-card" role="listitem">
        <div class="live-criteria-card__head">
            <span class="live-criteria-card__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <h3 class="live-casino-criteria-card__title">${heading}</h3>
        </div>
        ${bodyInner}
    </article>`;
}

function liveCasinoGameCategoryIcon(heading, index) {
    const h = String(heading || '').toLowerCase();
    if (/roulette/.test(h)) return 'circle-dot';
    if (/blackjack/.test(h)) return 'spade';
    if (/baccarat/.test(h)) return 'layers';
    if (/game show|monopoly|crazy time/.test(h)) return 'sparkles';
    if (/poker|other/.test(h)) return 'club';
    return ['circle-dot', 'spade', 'layers', 'sparkles', 'club'][index] || 'dice-5';
}

function renderLiveCasinoGameCategory(g, index) {
    const rawTitle = g.heading || g.title || '';
    const title = escapeHtml(rawTitle);
    const bodyHtml = richTextToHtml(g.body) || plainTextToParagraphsHtml(g.description || g.body || '');
    const bodyInner = bodyHtml
        ? `<div class="rich-text-body live-casino-game-category__body">${bodyHtml}</div>`
        : '';
    const icon = liveCasinoGameCategoryIcon(rawTitle, index);
    return `<article class="live-casino-game-category">
        <div class="live-casino-game-category__head">
            <span class="live-casino-game-category__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <h3>${title}</h3>
        </div>
        ${bodyInner}
    </article>`;
}

function applyLiveCasinoGameCategories(page) {
    const gamesEl = document.getElementById('live-casino-game-categories');
    const gameCategories = page?.gameCategories;
    if (!gamesEl || !Array.isArray(gameCategories) || gameCategories.length === 0) return;
    gamesEl.innerHTML = gameCategories.map(renderLiveCasinoGameCategory).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: gamesEl });
}

async function fetchLiveCasino() {
    try {
        let res = await fetch(`${API_URL}/api/live-casino?${LIVE_CASINO_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Live casino CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/live-casino?${LIVE_CASINO_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Live casino CMS:', json?.error?.message || res.status);
            return null;
        }
        let data = json.data;
        const shallowRes = await fetch(`${API_URL}/api/live-casino?${LIVE_CASINO_POPULATE_FALLBACK}`);
        const shallowJson = await shallowRes.json();
        if (shallowRes.ok && shallowJson?.data) {
            const shallow = shallowJson.data;
            data = {
                ...shallow,
                ...data,
                ratingCriteria: data.ratingCriteria?.length ? data.ratingCriteria : shallow.ratingCriteria,
                gameCategories: data.gameCategories?.length ? data.gameCategories : shallow.gameCategories,
                checklistSteps: data.checklistSteps?.length ? data.checklistSteps : shallow.checklistSteps,
                providerTags: data.providerTags?.length ? data.providerTags : shallow.providerTags,
                paymentMethods: data.paymentMethods?.length ? data.paymentMethods : shallow.paymentMethods,
                blacklistItems: data.blacklistItems?.length ? data.blacklistItems : shallow.blacklistItems,
                featuredWelcomeBonus: data.featuredWelcomeBonus?.casino
                    ? data.featuredWelcomeBonus
                    : shallow.featuredWelcomeBonus,
                conclusionCta: data.conclusionCta?.casino ? data.conclusionCta : shallow.conclusionCta,
            };
        }
        return data;
    } catch (e) {
        console.warn('Live casino CMS fetch failed:', e);
        return null;
    }
}

function liveCasinoTopCasinoToAttr(item) {
    const casino = normalizeV5CasinoAttr(item?.casino) || {};
    const merged = { ...casino };
    if (item?.highlight) {
        merged.MalaysiaHighlight = item.highlight;
        merged.malaysiaHighlight = item.highlight;
    }
    const override = item?.bonusOverride;
    if (override) {
        if (override.intro) merged.malaysiaBonusIntro = override.intro;
        if (override.amount) merged.malaysiaBonusAmount = override.amount;
        if (override.extra) merged.malaysiaBonusExtra = override.extra;
        const line = [override.intro, override.amount, override.extra].filter(Boolean).join(' ');
        if (line) {
            merged.MalaysiaBonusLine = line;
            merged.malaysiaBonusLine = line;
        }
    }
    return applyTopCasinoItemRatingOverride(merged, item);
}

function renderLiveCasinoOperatorRow(item, listPos, options = {}) {
    const highlightLabel = options.highlightLabel || 'Live casino highlight';
    const attr = liveCasinoTopCasinoToAttr(item);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const ratingHtml = malaysiaOperatorRatingHtml(attr, listPos);
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const bonusIntro = escapeHtml(bonusParts.intro || 'Bonus amount');
    const bonusAmount = escapeHtml(bonusParts.amount);
    const bonusExtra = bonusParts.extra ? escapeHtml(bonusParts.extra) : '';
    const highlight =
        options.highlightValue != null && options.highlightValue !== ''
            ? escapeHtml(String(options.highlightValue))
            : escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${bonusExtra}</span>`
        : '';
    return `<article class="malaysia-operator-row${malaysiaOperatorRowClass(listPos)}" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="Play at ${name}"><span class="sr-only">Play at ${name}</span></a>
        <div class="malaysia-operator-row__rank" aria-hidden="true">${listPos}</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">Rating</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${bonusIntro}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">${escapeHtml(highlightLabel)}</span>
                <p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${highlight}</span></span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>Play Here!</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function applyLiveCasinoMeta(page) {
    if (!page) return;
    const title = page.metaTitle || 'Best Live Casinos Malaysia 2026 | Top Live Dealer Sites | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best live casinos in Malaysia for 2026: HD live dealer tables, bonuses, and trusted payment methods. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyLiveCasinoHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('live-casino-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('live-casino-hero-desc'), page.heroIntro, 'rich');
}

function applyLiveCasinoListingMeta(page) {
    const bar = document.getElementById('live-casino-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('live-casino-listing-updated');
    const disclosureEl = document.getElementById('live-casino-listing-disclosure');
    const trustEl = document.getElementById('live-casino-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyLiveCasinoOperators(page) {
    const listEl = document.getElementById('live-casino-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows.map((item, i) => renderLiveCasinoOperatorRow(item, item.rank || i + 1)).join('');
}

function applyLiveCasinoBonusFeatured(page) {
    const container = document.getElementById('live-casino-bonus-featured');
    const block = page?.featuredWelcomeBonus;
    if (!container || !block?.casino) return;
    const attr = normalizeV5CasinoAttr(block.casino);
    container.innerHTML = renderHomepageFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Casino rating',
        defaultCta: block.ctaText || 'Claim bonus',
        offerLabel: block.bonusOverride?.intro || 'Welcome bonus',
    });
    const termsEl = document.getElementById('live-casino-welcome-bonus-terms');
    if (termsEl && page.welcomeBonusTerms) {
        setHomepageText(termsEl, page.welcomeBonusTerms);
    }
}

function renderLiveCasinoBottomTrio(block) {
    if (!block?.casino) return '';
    const attr = normalizeV5CasinoAttr(block.casino);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="live-casino-bottom-trio__logo" width="120" height="48" loading="lazy">`
        : `<span class="live-casino-bottom-trio__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

    const score =
        block.ratingOverride != null ? Number(block.ratingOverride) : ratingScoreFromAttr(attr);
    const ratingText = Number.isFinite(score)
        ? formatRatingSlashFive(score)
        : formatRatingScoreLine(attr, '5/5').replace(' / ', '/');
    const starsHtml = Number.isFinite(score) ? renderStars(score) : renderStars(attr);

    const ctaText = escapeHtml(block.ctaText || 'Visit Site!');
    const visitHref = escapeHtml(block.ctaLinkOverride || casinoVisitSiteHref(attr));
    const visitRel =
        casinoVisitSiteIsExternal(attr) || block.ctaLinkOverride
            ? ' rel="nofollow noopener" target="_blank"'
            : ' rel="nofollow noopener"';

    const cmsFeatures = Array.isArray(block.features)
        ? block.features.map((f) => f.label).filter(Boolean)
        : [];
    const defaultFeatures = [
        'Native speaking live dealers',
        'Multiple alternative payment methods',
        'Top-rated mobile apps',
    ];
    const bulletLabels =
        cmsFeatures.length >= 3
            ? cmsFeatures.slice(0, 3)
            : cmsFeatures.length
              ? [...cmsFeatures, ...defaultFeatures].slice(0, 3)
              : defaultFeatures;
    const bulletsHtml = bulletLabels
        .map((label) => `<li>${escapeHtml(label)}</li>`)
        .join('');

    return `<div class="live-casino-bottom-trio__grid">
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--featured">
            <p class="live-casino-bottom-trio__head"><span>2026&rsquo;s Best</span><strong>Malaysian Casino</strong></p>
            <div class="live-casino-bottom-trio__featured-row">
                <div class="live-casino-bottom-trio__logo-box">${logoHtml}</div>
                <div class="live-casino-bottom-trio__rating-box">
                    <span class="live-casino-bottom-trio__rating-label">Casino Rating</span>
                    <div class="live-casino-bottom-trio__stars">${starsHtml}</div>
                    <span class="live-casino-bottom-trio__rating-score">${escapeHtml(ratingText)}</span>
                </div>
            </div>
            <a href="${visitHref}" class="live-casino-bottom-trio__cta"${visitRel}>${ctaText}</a>
        </article>
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--explore">
            <p class="live-casino-bottom-trio__head"><span>Malaysia</span><strong>Explore All Casino Types</strong></p>
            <ul class="live-casino-bottom-trio__bullets" role="list">${bulletsHtml}</ul>
            <a href="/" class="live-casino-bottom-trio__outline-btn">See All Malaysian Online Casinos</a>
        </article>
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--guides">
            <p class="live-casino-bottom-trio__head"><strong>More Guides</strong></p>
            <div class="live-casino-bottom-trio__guides">
                <a href="/roulette" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">
                        <img src="/assets/img/icon/roulette-wheel-icon.webp" alt="" width="46" height="46" loading="lazy">
                    </span>
                    <span class="live-casino-bottom-trio__guide-label">Online Roulette</span>
                </a>
                <a href="/baccarat" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">
                        <img src="/assets/img/icon/cards-icon.webp" alt="" width="46" height="46" loading="lazy">
                    </span>
                    <span class="live-casino-bottom-trio__guide-label">Online Baccarat</span>
                </a>
            </div>
        </article>
    </div>`;
}

function applyLiveCasinoConclusion(page) {
    const container = document.getElementById('live-casino-bottom-trio');
    const block = page?.conclusionCta;
    if (!container || !block?.casino) return;
    container.innerHTML = renderLiveCasinoBottomTrio(block);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function liveCasinoPaymentTypeBadge(type) {
    const label = String(type || '—');
    const t = label.toLowerCase();
    let variant = 'default';
    if (t.includes('e-wallet') || t.includes('ewallet')) variant = 'ewallet';
    else if (t.includes('bank')) variant = 'bank';
    else if (t.includes('card') || t.includes('debit') || t.includes('credit')) variant = 'card';
    else if (t.includes('crypto')) variant = 'crypto';
    return `<span class="live-casino-type-badge live-casino-type-badge--${variant}">${escapeHtml(label)}</span>`;
}

function liveCasinoTimingCell(value) {
    const label = String(value || '—');
    const isFast = /instant|up to 5 minutes|up to 15 minutes/i.test(label);
    const cls = isFast ? ' live-casino-data-table__timing--fast' : '';
    return `<span class="live-casino-data-table__timing${cls}">${escapeHtml(label)}</span>`;
}

function applyLiveCasinoPayments(page) {
    const tbody = document.querySelector('#live-casino-payments-table tbody');
    const methods = page?.paymentMethods;
    if (!tbody || !Array.isArray(methods) || methods.length === 0) return;
    tbody.innerHTML = methods
        .map(
            (m) => `<tr>
            <td data-label="Payment method"><span class="live-casino-data-table__method">${escapeHtml(m.name || '—')}</span></td>
            <td data-label="Payment type">${liveCasinoPaymentTypeBadge(m.paymentType)}</td>
            <td data-label="Avg. deposit time">${liveCasinoTimingCell(m.avgDepositTime)}</td>
            <td data-label="Avg. withdrawal time">${liveCasinoTimingCell(m.avgWithdrawalTime)}</td>
            <td data-label="Notes"><span class="live-casino-data-table__notes">${escapeHtml(m.notes || '—')}</span></td>
        </tr>`,
        )
        .join('');
}

function applyLiveCasinoBlacklist(page) {
    const tbody = document.querySelector('#live-casino-blacklist-table tbody');
    const items = page?.blacklistItems;
    if (tbody && Array.isArray(items) && items.length > 0) {
        tbody.innerHTML = items
            .map(
                (item) => `<tr>
                <td data-label="Blacklisted casino">${escapeHtml(item.casinoName || '—')}</td>
                <td data-label="Primary reason">${escapeHtml(item.reason || '—')}</td>
            </tr>`,
            )
            .join('');
    }
    const noteEl = document.getElementById('live-casino-blacklist-note');
    if (noteEl && page?.blacklistNote) {
        setRichTextHtml(noteEl, page.blacklistNote);
    }
}

function applyLiveCasinoSectionText(page) {
    if (!page) return;
    const textMap = [
        ['live-casino-operators-h2', page.topCasinosHeading],
        ['live-casino-operators-intro', page.topCasinosIntro, 'rich'],
        ['live-casino-operators-outro', page.topCasinosOutro, 'rich'],
        ['live-casino-rating-h2', page.ratingHeading],
        ['live-casino-rating-intro', page.ratingIntro, 'rich'],
        ['live-casino-rating-outro', page.ratingOutro, 'rich'],
        ['live-casino-games-h2', page.gamesHeading],
        ['live-casino-games-intro', page.gamesIntro, 'rich'],
        ['live-casino-providers-h2', page.providersHeading],
        ['live-casino-providers-intro', page.providersIntro, 'rich'],
        ['live-casino-providers-outro', page.providersOutro, 'rich'],
        ['live-casino-bonus-h2', page.bonusesHeading],
        ['live-casino-bonus-intro', page.bonusesIntro, 'rich'],
        ['live-casino-welcome-bonus-h3', page.welcomeBonusHeading],
        ['live-casino-welcome-bonus-body', page.welcomeBonusBody, 'rich'],
        ['live-casino-cashback-h3', page.cashbackHeading],
        ['live-casino-cashback-body', page.cashbackBody, 'rich'],
        ['live-casino-wagering-h3', page.wageringHeading],
        ['live-casino-wagering-body', page.wageringBody, 'rich'],
        ['live-casino-checklist-h2', page.checklistHeading],
        ['live-casino-checklist-intro', page.checklistIntro, 'rich'],
        ['live-casino-checklist-outro', page.checklistOutro, 'rich'],
        ['live-casino-payments-h2', page.paymentsHeading],
        ['live-casino-payments-intro', page.paymentsIntro, 'rich'],
        ['live-casino-payments-outro', page.paymentsOutro, 'rich'],
        ['live-casino-types-h2', page.typesHeading],
        ['live-casino-types-intro', page.typesIntro, 'rich'],
        ['live-casino-high-roller-h3', page.highRollerHeading],
        ['live-casino-high-roller-body', page.highRollerBody, 'rich'],
        ['live-casino-low-stakes-h3', page.lowStakesHeading],
        ['live-casino-low-stakes-body', page.lowStakesBody, 'rich'],
        ['live-casino-legal-h2', page.legalHeading],
        ['live-casino-legal-body', page.legalBody, 'rich'],
        ['live-casino-blacklist-h2', page.blacklistHeading],
        ['live-casino-blacklist-intro', page.blacklistIntro, 'rich'],
        ['live-casino-conclusion-h2', page.conclusionHeading],
        ['live-casino-conclusion-body', page.conclusionBody, 'rich'],
        ['live-casino-faq-h2', page.faqHeading],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
    applyLiveCasinoRatingCriteria(page);
    applyLiveCasinoGameCategories(page);
    const tagsEl = document.getElementById('live-casino-provider-tags');
    const tags = page.providerTags;
    if (tagsEl && Array.isArray(tags) && tags.length > 0) {
        tagsEl.textContent = tags.map((t) => (typeof t === 'string' ? t : t.label || t.name || '')).filter(Boolean).join(' · ');
    }
    const stepsEl = document.getElementById('live-casino-checklist-steps');
    const steps = page.checklistSteps;
    if (stepsEl && Array.isArray(steps) && steps.length > 0) {
        stepsEl.innerHTML = steps
            .map(
                (s, i) =>
                    `<li><strong>Step ${s.step || i + 1}: ${escapeHtml(s.title || s.heading || '')}</strong> — ${escapeHtml(s.body || s.description || '')}</li>`,
            )
            .join('');
    }
}

function applyLiveCasinoRatingCriteria(page) {
    const criteriaEl = document.getElementById('live-casino-rating-criteria');
    const criteria = page?.ratingCriteria;
    if (!criteriaEl || !Array.isArray(criteria) || criteria.length === 0) return;
    criteriaEl.innerHTML = criteria.map(renderLiveCasinoCriteriaCard).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: criteriaEl });
}

function buildLiveCasinoJsonLd(page, operators) {
    const itemListEl = document.getElementById('live-casino-ld-itemlist');
    if (itemListEl && Array.isArray(operators) && operators.length > 0) {
        const items = operators.slice(0, 10).map((item, i) => {
            const attr = liveCasinoTopCasinoToAttr(item);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Live Casinos in Malaysia 2026',
            itemListElement: items,
        });
    }
    // FAQ JSON-LD stays static in live-casino.html (accordion is not CMS-hydrated).
    const webEl = document.getElementById('live-casino-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Live Casinos Malaysia 2026',
            url: 'https://888reviews.com/live',
            description:
                page.metaDescription ||
                'Compare the best live casinos in Malaysia for 2026: live dealer tables, bonuses, and trusted payment methods.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initLiveCasinoPage() {
    const listEl = document.getElementById('live-casino-operator-list');
    if (!listEl) return;

    const page = await fetchLiveCasino();
    if (!page) return;

    applyLiveCasinoMeta(page);
    applyLiveCasinoHero(page);
    applyLiveCasinoSectionText(page);
    applyLiveCasinoListingMeta(page);
    applyLiveCasinoOperators(page);
    applyLiveCasinoBonusFeatured(page);
    applyLiveCasinoConclusion(page);
    applyLiveCasinoPayments(page);
    applyLiveCasinoBlacklist(page);
    buildLiveCasinoJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 review-page single type — nested component + relation populate. */
const REVIEWS_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[topRatedSpotlight][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[featuredSlots][populate][slot][populate]=coverImage' +
    '&populate[featuredSlots][populate][playAtCasino][populate]=logo' +
    '&populate[paymentMethods]=*' +
    '&populate[bonusComparisonRows]=*' +
    '&populate[gameCategories]=*' +
    '&populate[ratingCriteria]=*';

const REVIEWS_PAGE_POPULATE_FALLBACK = 'populate=*';

function mergeReviewsTopCasinos(deepRows, shallowRows) {
    if (!Array.isArray(deepRows)) return shallowRows;
    if (!Array.isArray(shallowRows)) return deepRows;
    return deepRows.map((deep) => {
        const shallow = shallowRows.find((s) => s.id === deep.id || s.rank === deep.rank);
        if (!shallow) return deep;
        return {
            ...shallow,
            ...deep,
            casino: deep.casino ?? shallow.casino,
            bonusOverride: deep.bonusOverride ?? shallow.bonusOverride,
            highlight: deep.highlight ?? shallow.highlight,
            ratingOverride: deep.ratingOverride ?? shallow.ratingOverride,
        };
    });
}

async function fetchReviewPage() {
    try {
        let res = await fetch(`${API_URL}/api/review-page?${REVIEWS_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Review page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/review-page?${REVIEWS_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Review page CMS:', json?.error?.message || res.status);
            return null;
        }
        let data = json.data;
        const shallowRes = await fetch(`${API_URL}/api/review-page?${REVIEWS_PAGE_POPULATE_FALLBACK}`);
        const shallowJson = await shallowRes.json();
        if (shallowRes.ok && shallowJson?.data) {
            const shallow = shallowJson.data;
            data = {
                ...shallow,
                ...data,
                topCasinos: mergeReviewsTopCasinos(data.topCasinos, shallow.topCasinos),
                ratingCriteria: data.ratingCriteria?.length ? data.ratingCriteria : shallow.ratingCriteria,
                bonusComparisonRows: data.bonusComparisonRows?.length
                    ? data.bonusComparisonRows
                    : shallow.bonusComparisonRows,
                gameCategories: data.gameCategories?.length ? data.gameCategories : shallow.gameCategories,
                featuredSlots: data.featuredSlots?.length ? data.featuredSlots : shallow.featuredSlots,
                paymentMethods: data.paymentMethods?.length ? data.paymentMethods : shallow.paymentMethods,
                topRatedSpotlight: data.topRatedSpotlight?.casino
                    ? data.topRatedSpotlight
                    : shallow.topRatedSpotlight,
                conclusionCta: data.conclusionCta?.casino ? data.conclusionCta : shallow.conclusionCta,
            };
        }
        return data;
    } catch (e) {
        console.warn('Review page CMS fetch failed:', e);
        return null;
    }
}

function reviewsTopCasinoToAttr(item, slugMap) {
    const casino = bonusHubEnrichedCasino(item?.casino, slugMap) || {};
    const merged = { ...casino };
    if (item?.highlight) {
        merged.MalaysiaHighlight = item.highlight;
        merged.malaysiaHighlight = item.highlight;
    }
    const override = item?.bonusOverride;
    if (override) {
        if (override.intro) merged.malaysiaBonusIntro = override.intro;
        if (override.amount) merged.malaysiaBonusAmount = override.amount;
        if (override.extra) merged.malaysiaBonusExtra = override.extra;
        const line = [override.intro, override.amount, override.extra].filter(Boolean).join(' ');
        if (line) {
            merged.MalaysiaBonusLine = line;
            merged.malaysiaBonusLine = line;
        }
    }
    return applyTopCasinoItemRatingOverride(merged, item);
}

function renderReviewsOperatorRow(item, listPos, slugMap) {
    const attr = reviewsTopCasinoToAttr(item, slugMap);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const ratingHtml = malaysiaOperatorRatingHtml(attr, listPos);
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const bonusIntro = escapeHtml(bonusParts.intro || 'Bonus amount');
    const bonusAmount = escapeHtml(bonusParts.amount);
    const bonusExtra = bonusParts.extra ? escapeHtml(bonusParts.extra) : '';
    const highlight = escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${bonusExtra}</span>`
        : '';
    return `<article class="malaysia-operator-row${malaysiaOperatorRowClass(listPos)}" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="Play at ${name}"><span class="sr-only">Play at ${name}</span></a>
        <div class="malaysia-operator-row__rank" aria-hidden="true">${listPos}</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">Rating</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${bonusIntro}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">Casino highlight</span>
                <p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${highlight}</span></span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>Play Here!</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function applyReviewsMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Online Casino Reviews Malaysia 2026 | Top Site Ratings | 888reviews';
    const desc =
        page.metaDescription ||
        'Independent online casino reviews for Malaysian players: hands-on testing, ranked operators, bonus guides, and trusted payment methods. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    ['og:title', 'og:description', 'twitter:title', 'twitter:description'].forEach((name) => {
        const el =
            name.startsWith('og:')
                ? document.querySelector(`meta[property="${name}"]`)
                : document.querySelector(`meta[name="${name}"]`);
        if (el) el.setAttribute('content', name.includes('title') ? title : desc);
    });
}

function applyReviewsHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('reviews-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('reviews-hero-desc'), page.heroIntro, 'rich');
}

function applyReviewsListingMeta(page) {
    const bar = document.getElementById('reviews-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('reviews-listing-updated');
    const disclosureEl = document.getElementById('reviews-listing-disclosure');
    const trustEl = document.getElementById('reviews-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyReviewsOperators(page, slugMap) {
    const listEl = document.getElementById('reviews-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => renderReviewsOperatorRow(item, item.rank || i + 1, slugMap))
        .join('');
}

function applyReviewsSectionText(page) {
    if (!page) return;
    const textMap = [
        ['reviews-operators-h2', page.topCasinosHeading],
        ['reviews-operators-intro', page.topCasinosIntro, 'rich'],
        ['reviews-operators-outro', page.topCasinosOutro, 'rich'],
        ['reviews-rating-h2', page.ratingHeading],
        ['reviews-rating-intro', page.ratingIntro, 'rich'],
        ['reviews-rating-outro', page.ratingOutro, 'rich'],
        ['reviews-spotlight-h2', page.topRatedHeading],
        ['reviews-legal-h2', page.legalHeading],
        ['reviews-legal-intro', page.legalIntro, 'rich'],
        ['reviews-bonuses-h2', page.bonusesHeading],
        ['reviews-bonuses-intro', page.bonusesIntro, 'rich'],
        ['reviews-bonuses-outro', page.bonusesOutro, 'rich'],
        ['reviews-welcome-h3', page.welcomeBonusHeading],
        ['reviews-welcome-body', page.welcomeBonusBody, 'rich'],
        ['reviews-nodeposit-h3', page.noDepositHeading],
        ['reviews-nodeposit-body', page.noDepositBody, 'rich'],
        ['reviews-freespins-h3', page.freeSpinsHeading],
        ['reviews-freespins-body', page.freeSpinsBody, 'rich'],
        ['reviews-wagering-h3', page.wageringHeading],
        ['reviews-wagering-body', page.wageringBody, 'rich'],
        ['reviews-games-h2', page.gamesHeading],
        ['reviews-games-intro', page.gamesIntro, 'rich'],
        ['reviews-games-outro', page.gamesOutro, 'rich'],
        ['reviews-payments-h2', page.paymentsHeading],
        ['reviews-payments-intro', page.paymentsIntro, 'rich'],
        ['reviews-payments-outro', page.paymentsOutro, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
    const legalBodyEl = document.getElementById('reviews-legal-body');
    if (legalBodyEl && page.legalBody) {
        const html = richTextToHtml(page.legalBody);
        if (html) {
            legalBodyEl.classList.remove('reviews-legal-topics');
            legalBodyEl.classList.add('reviews-legal-body-plain');
            legalBodyEl.innerHTML = html;
        }
    }
}

const REVIEWS_RATING_ICONS = [
    'shield-check',
    'gamepad-2',
    'badge-percent',
    'banknote',
    'headphones',
    'smartphone',
];

function applyReviewsRatingCriteria(page) {
    const listEl = document.getElementById('reviews-rating-criteria');
    const criteria = page?.ratingCriteria;
    if (!listEl || !Array.isArray(criteria) || criteria.length === 0) return;
    listEl.innerHTML = criteria
        .map((c, i) => {
            const title = escapeHtml(c.heading || c.title || '');
            const icon = REVIEWS_RATING_ICONS[i] || 'circle-check';
            const bodyHtml =
                richTextToHtml(c.body) || plainTextToParagraphsHtml(c.description || c.body || '');
            const bodyInner = bodyHtml
                ? `<div class="rich-text-body reviews-rating-criteria__body">${bodyHtml}</div>`
                : '';
            return `<li class="reviews-rating-criteria__item" role="listitem" data-step="${i + 1}">
                <div class="reviews-rating-criteria__header">
                    <div class="reviews-rating-criteria__icon-wrap">
                        <span class="reviews-rating-criteria__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
                    </div>
                    <h3 class="reviews-rating-criteria__title">${title}</h3>
                </div>
                ${bodyInner}
            </li>`;
        })
        .join('');
}

function applyReviewsSpotlightBrandLogo(attr, name) {
    const logoUrl = getLogoUrl(attr);
    const editorLogo = document.getElementById('reviews-spotlight-editor-logo');
    if (!logoUrl || !editorLogo) return;
    editorLogo.src = logoUrl;
    editorLogo.alt = name;
    editorLogo.hidden = false;
}

function applyReviewsSpotlight(page, slugMap) {
    const spotlight = page?.topRatedSpotlight;
    if (!spotlight) return;
    if (spotlight.intro) {
        setHomepageText(document.getElementById('reviews-spotlight-intro'), spotlight.intro, 'rich');
    }
    if (spotlight.disclaimerNote) {
        const noteEl = document.getElementById('reviews-spotlight-note');
        if (noteEl) noteEl.textContent = `*Note: ${spotlight.disclaimerNote}`;
    }
    const casino = bonusHubEnrichedCasino(spotlight.casino, slugMap);
    if (!casino) return;
    const attr = normalizeV5CasinoAttr(casino);
    const name = attr.Name || attr.name || 'Casino';
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const editorCta = document.getElementById('reviews-spotlight-editor-cta');
    if (editorCta) {
        const labelEl = editorCta.querySelector('.reviews-spotlight-card__pill-label');
        if (labelEl) labelEl.textContent = name;
        else editorCta.textContent = name;
        editorCta.href = visitHref;
        if (visitRel.includes('target')) {
            editorCta.target = '_blank';
            editorCta.rel = 'nofollow noopener';
        }
        editorCta.setAttribute('aria-label', `Visit ${name}`);
    }
    applyReviewsSpotlightBrandLogo(attr, name);
    const gridEl = document.getElementById('reviews-spotlight-grid');
    if (gridEl && typeof lucide !== 'undefined') lucide.createIcons({ root: gridEl });
}

const REVIEWS_BONUS_ICONS = ['gift', 'sparkles', 'badge-percent', 'wallet', 'rotate-ccw'];

function reviewsBonusTypeCell(bonusType, index) {
    const icon = REVIEWS_BONUS_ICONS[index] || 'gift';
    const label = escapeHtml(bonusType || '—');
    return `<span class="reviews-bonus-table__type"><span class="reviews-bonus-table__type-icon" aria-hidden="true"><i data-lucide="${icon}"></i></span><span class="live-casino-data-table__method">${label}</span></span>`;
}

function applyReviewsBonusTable(page) {
    const tbody = document.getElementById('reviews-bonus-tbody');
    const rows = page?.bonusComparisonRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows
        .map(
            (r, i) => `<tr>
            <td data-label="Bonus type">${reviewsBonusTypeCell(r.bonusType, i)}</td>
            <td data-label="What is it?">${escapeHtml(r.whatIsIt || '—')}</td>
            <td data-label="Best for">${escapeHtml(r.bestFor || '—')}</td>
            <td data-label="Watch out for"><span class="live-casino-data-table__notes">${escapeHtml(r.watchOutFor || '—')}</span></td>
        </tr>`,
        )
        .join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: tbody });
}

function reviewsGameCategoryIcon(heading, index) {
    const h = String(heading || '').toLowerCase();
    if (/slot/.test(h)) return 'dice-5';
    if (/blackjack|roulette|table/.test(h)) return 'spade';
    if (/live/.test(h)) return 'radio';
    return ['dice-5', 'spade', 'radio', 'gamepad-2'][index] || 'gamepad-2';
}

function applyReviewsGameCategories(page) {
    const gamesEl = document.getElementById('reviews-game-categories');
    const gameCategories = page?.gameCategories;
    if (!gamesEl || !Array.isArray(gameCategories) || gameCategories.length === 0) return;

    const slotsWrap = document.getElementById('reviews-featured-slots-wrap');
    const slotsPanelMarkup = slotsWrap
        ? `<div class="reviews-featured-slots-panel"><p class="reviews-featured-slots-panel__label">Popular slot picks</p>${slotsWrap.outerHTML}</div>`
        : '';
    let slotsInserted = false;

    gamesEl.innerHTML = gameCategories
        .map((g, i) => {
            const title = escapeHtml(g.heading || g.title || '');
            const rawTitle = g.heading || g.title || '';
            const bodyHtml =
                richTextToHtml(g.body) || plainTextToParagraphsHtml(g.description || g.body || '');
            const bodyInner = bodyHtml
                ? `<div class="rich-text-body reviews-game-category__body">${bodyHtml}</div>`
                : '';
            const icon = reviewsGameCategoryIcon(rawTitle, i);
            const isSlots = !slotsInserted && /slot/i.test(rawTitle);
            if (isSlots) slotsInserted = true;
            const slotsPanel = isSlots ? slotsPanelMarkup : '';
            return `<article class="reviews-game-category">
                <div class="reviews-game-category__head">
                    <span class="reviews-game-category__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
                    <h3>${title}</h3>
                </div>
                ${bodyInner}
                ${slotsPanel}
            </article>`;
        })
        .join('');

    if (typeof lucide !== 'undefined') lucide.createIcons({ root: gamesEl });
}

function applyReviewsFeaturedSlots(page, casinoRows) {
    const container = document.getElementById('reviews-featured-slots');
    const wrap = document.getElementById('reviews-featured-slots-wrap');
    const items = page?.featuredSlots;
    if (!container || !Array.isArray(items) || items.length === 0) return;
    const featuredIndex = items.findIndex((item) => item?.isFeatured);
    const featuredIdx = featuredIndex >= 0 ? featuredIndex : 0;
    const slugMap = casinoRows ? buildCasinoSlugMap(casinoRows) : new Map();
    container.innerHTML = items
        .map((item, i) => {
            const slug = (item?.playAtCasino?.slug || item?.playAtCasino?.Slug || '').toLowerCase();
            const enriched = slug ? slugMap.get(slug) : null;
            const merged =
                enriched && item?.playAtCasino
                    ? { ...item, playAtCasino: { ...item.playAtCasino, ...enriched } }
                    : item;
            return renderMalaysiaFeaturedSlotCard(merged, i === featuredIdx);
        })
        .join('');
    container.dataset.count = String(items.length);
    if (wrap) wrap.hidden = false;
}

function reviewsPaymentMethodCell(name) {
    const label = String(name || '—').trim();
    const logoUrl = eWalletPayLogoUrl(label);
    if (logoUrl) {
        return `<span class="reviews-payments-table__method reviews-payments-table__method--has-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${escapeHtml(label)}"><span class="reviews-payments-table__method-label">${escapeHtml(label)}</span></span>`;
    }
    return `<span class="live-casino-data-table__method">${escapeHtml(label)}</span>`;
}

function applyReviewsPayments(page) {
    const tbody = document.querySelector('#reviews-payments-table tbody');
    const methods = page?.paymentMethods;
    if (!tbody || !Array.isArray(methods) || methods.length === 0) return;
    tbody.innerHTML = methods
        .map(
            (m) => `<tr>
            <td data-label="Payment method">${reviewsPaymentMethodCell(m.name)}</td>
            <td data-label="Payment type">${liveCasinoPaymentTypeBadge(m.paymentType)}</td>
            <td data-label="Avg. deposit time">${liveCasinoTimingCell(m.avgDepositTime)}</td>
            <td data-label="Avg. withdrawal time">${liveCasinoTimingCell(m.avgWithdrawalTime)}</td>
            <td data-label="Notes"><span class="live-casino-data-table__notes">${escapeHtml(m.notes || '—')}</span></td>
        </tr>`,
        )
        .join('');
}

function uniquePaymentLogoNames(names) {
    const seen = new Set();
    const out = [];
    for (const name of names) {
        const label = String(name || '').trim();
        if (!label) continue;
        const slug = eWalletPayLogoSlug(label) || label.toLowerCase();
        if (seen.has(slug)) continue;
        seen.add(slug);
        out.push(label);
    }
    return out;
}

function reviewsPaymentLogoTile(name) {
    const label = String(name || '').trim();
    const logoUrl = eWalletPayLogoUrl(label);
    if (logoUrl) {
        return `<span class="reviews-payments-logos__item reviews-payments-logos__item--has-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="listitem" aria-label="${escapeHtml(label)}"><span class="reviews-payments-logos__label">${escapeHtml(label)}</span></span>`;
    }
    return `<span class="reviews-payments-logos__item reviews-payments-logos__item--text" role="listitem">${escapeHtml(label)}</span>`;
}

function applyReviewsPaymentLogos(page) {
    const grid = document.getElementById('reviews-payment-logos');
    if (!grid) return;
    const methods = page?.paymentMethods;
    const names = Array.isArray(methods)
        ? methods.map((m) => m.name).filter(Boolean)
        : [];
    const extra = ['Mastercard', 'Skrill', 'Neteller', 'Bank Transfer'];
    const allNames = uniquePaymentLogoNames([...names, ...extra]);
    grid.innerHTML = allNames.map((name) => reviewsPaymentLogoTile(name)).join('');
}

function applyReviewsConclusion(page, slugMap) {
    const container = document.getElementById('reviews-bottom-trio');
    const block = page?.conclusionCta;
    if (!container || !block?.casino) return;
    const enriched = bonusHubEnrichedCasino(block.casino, slugMap);
    if (!enriched) return;
    container.innerHTML = renderLiveCasinoBottomTrio({ ...block, casino: enriched });
}

function buildReviewsJsonLd(page, operators) {
    const itemListEl = document.getElementById('reviews-ld-itemlist');
    if (itemListEl && Array.isArray(operators) && operators.length > 0) {
        const items = operators.slice(0, 10).map((item, i) => {
            const attr = reviewsTopCasinoToAttr(item, null);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Online Casino Reviews Malaysia 2026',
            itemListElement: items,
        });
    }
    const faqEl = document.getElementById('reviews-ld-faq');
    const accordion = document.getElementById('reviews-faq-accordion');
    if (faqEl && accordion) {
        const entities = [...accordion.querySelectorAll('.accordion-item')]
            .map((item) => {
                const question = item.querySelector('.accordion-title')?.textContent?.trim() || '';
                const answer = item.querySelector('.accordion-inner')?.textContent?.trim() || '';
                if (!question || !answer) return null;
                return {
                    '@type': 'Question',
                    name: question,
                    acceptedAnswer: { '@type': 'Answer', text: answer },
                };
            })
            .filter(Boolean);
        if (entities.length) {
            faqEl.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: entities,
            });
        }
    }
    const webEl = document.getElementById('reviews-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Online Casino Reviews Malaysia 2026',
            url: 'https://888reviews.com/reviews',
            description:
                page.metaDescription ||
                'Independent online casino reviews for Malaysian players: hands-on testing, ranked operators, and trusted payment methods.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initReviewsHubPage() {
    const listEl = document.getElementById('reviews-operator-list');
    if (!listEl) return;

    const [page, casinoRows] = await Promise.all([fetchReviewPage(), fetchBonusHubCasinos()]);
    if (!page) return;

    const slugMap = casinoRows ? buildCasinoSlugMap(casinoRows) : new Map();

    applyReviewsMeta(page);
    applyReviewsHero(page);
    applyReviewsSectionText(page);
    applyReviewsListingMeta(page);
    applyReviewsOperators(page, slugMap);
    applyReviewsRatingCriteria(page);
    applyReviewsSpotlight(page, slugMap);
    applyReviewsBonusTable(page);
    applyReviewsGameCategories(page);
    applyReviewsFeaturedSlots(page, casinoRows);
    applyReviewsPayments(page);
    applyReviewsPaymentLogos(page);
    applyReviewsConclusion(page, slugMap);
    buildReviewsJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 e-wallet-page single type — nested component + relation populate. */
const E_WALLET_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[topCasinos][populate][acceptedEWallets]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[depositWithdrawalRows][populate][casino][populate]=logo' +
    '&populate[gameTypePicks][populate][recommendedEWallets]=*' +
    '&populate[comparisonRows][populate]=*' +
    '&populate[whyReasons]=*' +
    '&populate[howToSteps]=*' +
    '&populate[faqItems]=*' +
    '&populate[conclusionTakeaways]=*';

const E_WALLET_PAGE_POPULATE_FALLBACK = 'populate=*';

const E_WALLET_HIGHLIGHT_LABEL = 'accepted E-wallet';

function eWalletAcceptedWalletsDisplay(item) {
    const raw = item?.acceptedEWallets;
    if (raw == null || raw === '') return '';
    if (typeof raw === 'string') return raw.trim();
    if (Array.isArray(raw)) {
        return raw
            .map((w) => {
                if (typeof w === 'string') return w.trim();
                if (w && typeof w === 'object') return w.label || w.name || w.wallet || w.title || '';
                return '';
            })
            .filter(Boolean)
            .join(', ');
    }
    return '';
}

function mergeEWalletGameTypePicks(deepRows, shallowRows) {
    if (!Array.isArray(deepRows)) return shallowRows;
    if (!Array.isArray(shallowRows)) return deepRows;
    return deepRows.map((deep) => {
        const shallow = shallowRows.find((s) => s.id === deep.id);
        if (!shallow) return deep;
        return {
            ...shallow,
            ...deep,
            recommendedEWallets: deep.recommendedEWallets ?? shallow.recommendedEWallets,
        };
    });
}

function mergeEWalletTopCasinos(deepRows, shallowRows) {
    if (!Array.isArray(deepRows)) return shallowRows;
    if (!Array.isArray(shallowRows)) return deepRows;
    return deepRows.map((deep) => {
        const shallow = shallowRows.find((s) => s.id === deep.id || s.rank === deep.rank);
        if (!shallow) return deep;
        return {
            ...shallow,
            ...deep,
            acceptedEWallets: deep.acceptedEWallets ?? shallow.acceptedEWallets,
        };
    });
}

function eWalletDepositRowHasCasino(row) {
    const casino = row?.casino;
    if (!casino || typeof casino !== 'object') return false;
    const attr = attrFromCasinoEntry(casino);
    return Boolean(attr?.name || attr?.Name);
}

function hasPopulatedEWalletDepositRows(rows) {
    return Array.isArray(rows) && rows.length > 0 && rows.some(eWalletDepositRowHasCasino);
}

function mergeEWalletDepositRows(deepRows, shallowRows) {
    const deep = Array.isArray(deepRows) ? deepRows : [];
    const shallow = Array.isArray(shallowRows) ? shallowRows : [];
    const source = deep.length ? deep : shallow;
    const other = deep.length ? shallow : deep;
    if (!source.length) return [];
    return source.map((row) => {
        const match = other.find((r) => r.id === row.id);
        const casino = eWalletDepositRowHasCasino(row)
            ? row.casino
            : match?.casino && eWalletDepositRowHasCasino(match)
              ? match.casino
              : row.casino ?? match?.casino;
        return {
            ...(match || {}),
            ...row,
            minDeposit: row.minDeposit ?? match?.minDeposit,
            depositTime: row.depositTime ?? match?.depositTime,
            minWithdrawal: row.minWithdrawal ?? match?.minWithdrawal,
            withdrawalTime: row.withdrawalTime ?? match?.withdrawalTime,
            fee: row.fee ?? match?.fee,
            casino,
        };
    });
}

async function fetchEWalletDepositRowsPopulated() {
    try {
        const qs = 'populate[depositWithdrawalRows][populate][casino][populate]=logo';
        const res = await fetch(`${API_URL}/api/e-wallet-page?${qs}`);
        const json = await res.json();
        if (!res.ok || !json?.data) return null;
        return json.data.depositWithdrawalRows;
    } catch (e) {
        console.warn('E-wallet deposit rows fetch failed:', e);
        return null;
    }
}

function pickEWalletComponentArray(deepVal, shallowVal) {
    return Array.isArray(deepVal) && deepVal.length ? deepVal : shallowVal;
}

async function fetchEWalletConclusionCtaPopulated() {
    try {
        const qs =
            'populate[conclusionCta][populate][casino][populate]=logo' +
            '&populate[conclusionCta][populate][bonusOverride]=*' +
            '&populate[conclusionCta][populate][features]=*';
        const res = await fetch(`${API_URL}/api/e-wallet-page?${qs}`);
        const json = await res.json();
        if (!res.ok || !json?.data) return null;
        return json.data.conclusionCta;
    } catch (e) {
        console.warn('E-wallet conclusion CTA fetch failed:', e);
        return null;
    }
}

function mergeEWalletConclusionCta(deepCta, shallowCta) {
    const deep = deepCta && typeof deepCta === 'object' ? deepCta : {};
    const shallow = shallowCta && typeof shallowCta === 'object' ? shallowCta : {};
    return {
        ...shallow,
        ...deep,
        casino: deep.casino ?? shallow.casino,
        bonusOverride: deep.bonusOverride ?? shallow.bonusOverride,
        features: Array.isArray(deep.features) && deep.features.length ? deep.features : shallow.features,
        certificationLogos: deep.certificationLogos ?? shallow.certificationLogos,
        ctaText: deep.ctaText ?? shallow.ctaText,
        ctaLinkOverride: deep.ctaLinkOverride ?? shallow.ctaLinkOverride,
        ratingOverride: deep.ratingOverride ?? deep.bonusRatingOverride ?? shallow.ratingOverride ?? shallow.bonusRatingOverride,
    };
}

async function fetchEWalletPage() {
    try {
        let res = await fetch(`${API_URL}/api/e-wallet-page?${E_WALLET_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('E-wallet page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/e-wallet-page?${E_WALLET_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('E-wallet page CMS:', json?.error?.message || res.status);
            return null;
        }
        let data = json.data;
        const needsShallowMerge =
            !Array.isArray(data.comparisonRows) ||
            !data.comparisonRows.length ||
            !Array.isArray(data.whyReasons) ||
            !data.whyReasons.length ||
            !Array.isArray(data.howToSteps) ||
            !data.howToSteps.length ||
            !Array.isArray(data.faqItems) ||
            !data.faqItems.length ||
            !Array.isArray(data.depositWithdrawalRows) ||
            !data.depositWithdrawalRows.length;
        if (needsShallowMerge) {
            const shallowRes = await fetch(`${API_URL}/api/e-wallet-page?${E_WALLET_PAGE_POPULATE_FALLBACK}`);
            const shallowJson = await shallowRes.json();
            if (shallowRes.ok && shallowJson?.data) {
                const shallow = shallowJson.data;
                data = {
                    ...shallow,
                    ...data,
                    topCasinos: mergeEWalletTopCasinos(data.topCasinos, shallow.topCasinos),
                    gameTypePicks: mergeEWalletGameTypePicks(data.gameTypePicks, shallow.gameTypePicks),
                    depositWithdrawalRows: mergeEWalletDepositRows(
                        data.depositWithdrawalRows,
                        shallow.depositWithdrawalRows
                    ),
                    comparisonRows: pickEWalletComponentArray(data.comparisonRows, shallow.comparisonRows),
                    whyReasons: pickEWalletComponentArray(data.whyReasons, shallow.whyReasons),
                    howToSteps: pickEWalletComponentArray(data.howToSteps, shallow.howToSteps),
                    faqItems: pickEWalletComponentArray(data.faqItems, shallow.faqItems),
                    conclusionTakeaways: pickEWalletComponentArray(
                        data.conclusionTakeaways,
                        shallow.conclusionTakeaways
                    ),
                    conclusionCta: mergeEWalletConclusionCta(data.conclusionCta, shallow.conclusionCta),
                };
            }
        }
        if (!hasPopulatedEWalletDepositRows(data.depositWithdrawalRows)) {
            const populatedRows = await fetchEWalletDepositRowsPopulated();
            data.depositWithdrawalRows = mergeEWalletDepositRows(
                populatedRows,
                data.depositWithdrawalRows
            );
        }
        if (!data.conclusionCta?.casino) {
            const populatedCta = await fetchEWalletConclusionCtaPopulated();
            data.conclusionCta = mergeEWalletConclusionCta(populatedCta, data.conclusionCta);
        }
        return data;
    } catch (e) {
        console.warn('E-wallet page CMS fetch failed:', e);
        return null;
    }
}

function renderEWalletOperatorRow(item, listPos) {
    const accepted = eWalletAcceptedWalletsDisplay(item) || '—';
    return renderLiveCasinoOperatorRow(item, listPos, {
        highlightLabel: E_WALLET_HIGHLIGHT_LABEL,
        highlightValue: accepted,
    });
}

function applyEWalletMeta(page) {
    if (!page) return;
    const title = page.metaTitle || 'Best E-Wallet Casinos Malaysia 2026 | TnG & DuitNow | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best e-wallet casinos in Malaysia for 2026: Touch \'n Go, DuitNow, GrabPay, Skrill, and Neteller. Fast deposits and trusted operators. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyEWalletHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('e-wallet-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('e-wallet-hero-desc'), page.heroIntro, 'rich');
}

function applyEWalletListingMeta(page) {
    const bar = document.getElementById('e-wallet-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('e-wallet-listing-updated');
    const disclosureEl = document.getElementById('e-wallet-listing-disclosure');
    const trustEl = document.getElementById('e-wallet-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyEWalletOperators(page) {
    const listEl = document.getElementById('e-wallet-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows.map((item, i) => renderEWalletOperatorRow(item, item.rank || i + 1)).join('');
}

function eWalletWhyReasonIcon(heading, index) {
    const h = String(heading || '').toLowerCase();
    if (/instant|transaction|speed|fast/.test(h)) return 'zap';
    if (/privacy|security/.test(h)) return 'shield-check';
    if (/easy|access/.test(h)) return 'smartphone';
    if (/reward|exclusive|bonus/.test(h)) return 'gift';
    return ['zap', 'shield-check', 'smartphone', 'gift'][index % 4];
}

function renderEWalletWhyCard(title, bodyInner, icon) {
    return `<article class="live-casino-criteria-card e-wallet-why-card" role="listitem">
        <div class="e-wallet-why-card__head">
            <span class="e-wallet-why-card__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <h3 class="live-casino-criteria-card__title">${title}</h3>
        </div>
        ${bodyInner}
    </article>`;
}

function applyEWalletWhyReasons(page) {
    const gridEl = document.getElementById('e-wallet-why-reasons');
    const reasons = page?.whyReasons;
    if (!gridEl || !Array.isArray(reasons) || reasons.length === 0) return;
    gridEl.innerHTML = reasons
        .map((r, i) => {
            const title = escapeHtml(r.heading || r.title || '');
            const bodyHtml = richTextToHtml(r.body) || plainTextToParagraphsHtml(r.description || '');
            const bodyInner = bodyHtml
                ? `<div class="rich-text-body live-casino-criteria-card__body">${bodyHtml}</div>`
                : '';
            const icon = eWalletWhyReasonIcon(r.heading || r.title, i);
            return renderEWalletWhyCard(title, bodyInner, icon);
        })
        .join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: gridEl });
}

function eWalletGameTypeIcon(category, index) {
    const c = String(category || '').toLowerCase();
    if (/slot/.test(c)) return 'dice-5';
    if (/live/.test(c)) return 'radio';
    if (/sport/.test(c)) return 'trophy';
    if (/4d|lottery|other/.test(c)) return 'ticket';
    return ['dice-5', 'radio', 'trophy', 'ticket'][index % 4];
}

function eWalletPayLogoSlug(name) {
    const n = String(name || '')
        .toLowerCase()
        .replace(/[''`’]/g, '')
        .replace(/[^a-z0-9]/g, '');
    if (/touch|tng/.test(n)) return 'touchngo';
    if (n.includes('grabpay') || n === 'grab') return 'grabpay';
    if (n.includes('shopee')) return 'shopeepay';
    if (n.includes('boost')) return 'boost';
    if (n.includes('googlepay') || n.includes('google')) return 'googlepay';
    if (n.includes('applepay') || n.includes('apple')) return 'apple-pay';
    if (n.includes('duitnow') || n.includes('duit')) return 'duitnow';
    if (n.includes('visa')) return 'visa';
    if (n.includes('mastercard') || n.includes('master')) return 'mastercard';
    if (/crypto|bitcoin|btc|eth|usdt/.test(n)) return 'bitcoin';
    if (n.includes('banktransfer') || (n.includes('bank') && n.includes('transfer'))) return 'banktransfer';
    if (n.includes('skrill')) return 'skrill';
    if (n.includes('neteller')) return 'neteller';
    if (n.includes('astropay') || n.includes('astro')) return 'astropay';
    return '';
}

function eWalletPayLogoUrl(name) {
    const slug = eWalletPayLogoSlug(name);
    return slug ? `/assets/img/paylogo/${slug}.webp` : '';
}

function renderEWalletWalletTag(label) {
    const name = String(label || '').trim();
    if (!name) return '';
    const logoUrl = eWalletPayLogoUrl(name);
    if (logoUrl) {
        return `<li class="e-wallet-wallet-tags__item e-wallet-wallet-tags__item--logo">
            <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(name)}" class="e-wallet-wallet-tags__logo" width="96" height="28" loading="lazy">
        </li>`;
    }
    return `<li class="e-wallet-wallet-tags__item e-wallet-wallet-tags__item--text">${escapeHtml(name)}</li>`;
}

function eWalletWalletTagsHtml(wallets) {
    if (!Array.isArray(wallets) || wallets.length === 0) return '';
    const tags = wallets
        .map((w) => (typeof w === 'string' ? w : w?.name || w?.label || w?.wallet || ''))
        .filter(Boolean);
    if (!tags.length) return '';
    return `<div class="e-wallet-game-type-card__wallets">
        <p class="e-wallet-game-type-card__wallets-label">Supported wallets</p>
        <ul class="e-wallet-wallet-tags" role="list">${tags.map((t) => renderEWalletWalletTag(t)).join('')}</ul>
    </div>`;
}

function renderEWalletGameTypeCard(pick, index) {
    const title = escapeHtml(pick.category || pick.title || pick.heading || '');
    const bodyHtml = richTextToHtml(pick.body) || plainTextToParagraphsHtml(pick.description || '');
    const bodyInner = bodyHtml
        ? `<div class="rich-text-body e-wallet-game-type-card__body">${bodyHtml}</div>`
        : '';
    const icon = eWalletGameTypeIcon(pick.category || pick.title, index);
    const tagsHtml = eWalletWalletTagsHtml(pick.recommendedEWallets);
    return `<article class="e-wallet-game-type-card">
        <div class="e-wallet-game-type-card__head">
            <span class="e-wallet-game-type-card__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <h3>${title}</h3>
        </div>
        ${bodyInner}
        ${tagsHtml}
    </article>`;
}

function applyEWalletGameTypePicks(page) {
    const container = document.getElementById('e-wallet-game-type-picks');
    const picks = page?.gameTypePicks;
    if (!container || !Array.isArray(picks) || picks.length === 0) return;
    container.innerHTML = picks.map((pick, i) => renderEWalletGameTypeCard(pick, i)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function renderEWalletComparisonRow(row, defaultCtaText) {
    const name = String(row.name || '—').trim();
    const highlights = escapeHtml(row.highlights || row.highlight || '—');
    const pros = escapeHtml(row.pros || '—');
    const cons = escapeHtml(row.cons || '—');
    const logoUrl = eWalletPayLogoUrl(name);
    const nameCell = logoUrl
        ? `<span class="e-wallet-comparison-table__wallet e-wallet-comparison-table__wallet--has-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${escapeHtml(name)}"><span class="e-wallet-comparison-table__wallet-label">${escapeHtml(name)}</span></span>`
        : `<span class="live-casino-data-table__method">${escapeHtml(name)}</span>`;
    const ctaHref = escapeHtml(row.ctaLink || row.ctaLinkOverride || '#e-wallet-operator-list');
    const ctaText = escapeHtml(row.ctaText || defaultCtaText || 'Try it here');
    return `<tr>
        <td data-label="Casino e-wallet Malaysia">${nameCell}</td>
        <td data-label="Highlights">${highlights}</td>
        <td data-label="Pros"><span class="e-wallet-comparison-table__pro">${pros}</span></td>
        <td data-label="Cons"><span class="e-wallet-comparison-table__con">${cons}</span></td>
        <td data-label="Play here"><a href="${ctaHref}" class="e-wallet-comparison-table__cta" rel="nofollow noopener">${ctaText}</a></td>
    </tr>`;
}

function applyEWalletComparisonTable(page) {
    const tbody = document.querySelector('#e-wallet-comparison-table tbody');
    const rows = page?.comparisonRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    const defaultCtaText = page?.comparisonCtaText || page?.conclusionCta?.ctaText || 'Try it here';
    tbody.innerHTML = rows.map((row) => renderEWalletComparisonRow(row, defaultCtaText)).join('');
}

function renderEWalletDepositRow(row) {
    const attr = row?.casino ? normalizeV5CasinoAttr(row.casino) : {};
    const nameRaw = String(attr.Name || attr.name || row.casinoName || '—').trim();
    const casinoName = escapeHtml(nameRaw);
    const logoUrl = getLogoUrl(attr);
    const casinoCell = logoUrl
        ? `<span class="e-wallet-deposits-table__casino e-wallet-deposits-table__casino--has-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${escapeHtml(nameRaw)}"><span class="e-wallet-deposits-table__casino-label">${casinoName}</span></span>`
        : `<span class="live-casino-data-table__method">${casinoName}</span>`;
    const fee = String(row.fee || '—').trim();
    const feeCell =
        /^free$/i.test(fee)
            ? `<span class="e-wallet-deposits-table__fee e-wallet-deposits-table__fee--free">${escapeHtml(fee)}</span>`
            : `<span class="live-casino-data-table__notes">${escapeHtml(fee)}</span>`;
    return `<tr>
        <td data-label="E-wallet casino">${casinoCell}</td>
        <td data-label="Minimum deposit">${escapeHtml(row.minDeposit || '—')}</td>
        <td data-label="Deposit time">${liveCasinoTimingCell(row.depositTime)}</td>
        <td data-label="Minimum withdrawal">${escapeHtml(row.minWithdrawal || '—')}</td>
        <td data-label="Withdrawal time">${liveCasinoTimingCell(row.withdrawalTime)}</td>
        <td data-label="Fee">${feeCell}</td>
    </tr>`;
}

function applyEWalletDepositTable(page) {
    const tbody = document.querySelector('#e-wallet-deposits-table tbody');
    const rows = page?.depositWithdrawalRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row) => renderEWalletDepositRow(row)).join('');
}

function eWalletHowToStepIcon(title, index) {
    const t = String(title || '').toLowerCase();
    if (/deposit|click/.test(t)) return 'credit-card';
    if (/choose|select|wallet/.test(t)) return 'wallet';
    if (/confirm|payment|pay/.test(t)) return 'check-circle';
    return ['credit-card', 'wallet', 'check-circle'][index] || 'circle';
}

function renderEWalletHowToStep(step, index) {
    const stepNum = step.stepNumber || step.step || index + 1;
    const title = escapeHtml(String(step.title || step.heading || '').trim());
    const bodyText =
        richTextToPlainText(step.body) ||
        richTextToPlainText(step.description) ||
        richTextToPlainText(step.bodyText) ||
        String(step.description || step.bodyText || '').trim();
    const icon = eWalletHowToStepIcon(step.title || step.heading, index);
    const bodyHtml = bodyText ? `<p class="e-wallet-how-to-step__body">${escapeHtml(bodyText)}</p>` : '';
    return `<li class="e-wallet-how-to-step">
        <div class="e-wallet-how-to-step__mark" aria-label="Step ${stepNum}">
            <span class="e-wallet-how-to-step__label">Step</span>
            <div class="e-wallet-how-to-step__num-wrap"><span class="e-wallet-how-to-step__num">${stepNum}</span></div>
        </div>
        <div class="e-wallet-how-to-step__content">
            <h3 class="e-wallet-how-to-step__title">${title}</h3>
            ${bodyHtml}
        </div>
        <span class="e-wallet-how-to-step__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
    </li>`;
}

function applyEWalletHowToSteps(page) {
    const stepsEl = document.getElementById('e-wallet-how-to-steps');
    const steps = page?.howToSteps;
    if (!stepsEl || !Array.isArray(steps) || steps.length === 0) return;
    stepsEl.innerHTML = steps.map((s, i) => renderEWalletHowToStep(s, i)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: stepsEl });
}

function resolveEWalletConclusionBlock(page) {
    const cta = page?.conclusionCta;
    if (cta?.casino) return mergeEWalletConclusionCta(cta, cta);
    const top = Array.isArray(page?.topCasinos)
        ? page.topCasinos.find((item) => item?.casino && attrFromCasinoEntry(item.casino)?.name)
        : null;
    if (!top?.casino) return null;
    return mergeEWalletConclusionCta(
        {
            casino: top.casino,
            bonusOverride: top.bonusOverride,
            ctaText: cta?.ctaText,
            ctaLinkOverride: cta?.ctaLinkOverride,
            ratingOverride: cta?.ratingOverride ?? cta?.bonusRatingOverride ?? top.bonusRatingOverride,
            features: cta?.features,
        },
        cta || {}
    );
}

function applyEWalletConclusion(page) {
    applyMalaysiaConclusionCard('e-wallet-conclusion-card', resolveEWalletConclusionBlock(page), {
        hideCerts: true,
    });
}

function wireEWalletFaqAccordion(root) {
    if (!root) return;
    root.querySelectorAll('.accordion-header').forEach((header) => {
        if (header.dataset.eWalletFaqWired) return;
        header.dataset.eWalletFaqWired = '1';
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isActive = item && item.classList.contains('active');
            root.querySelectorAll('.accordion-item').forEach((acc) => {
                acc.classList.remove('active');
                const h = acc.querySelector('.accordion-header');
                if (h) h.setAttribute('aria-expanded', 'false');
            });
            if (!isActive && item) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function applyEWalletFaq(page) {
    const accordion = document.getElementById('e-wallet-faq-accordion');
    const faqItems = page?.faqItems;
    if (!accordion || !Array.isArray(faqItems) || faqItems.length === 0) return;
    accordion.innerHTML = faqItems
        .map((f) => {
            const question = escapeHtml(f.question || f.title || '');
            const answerHtml =
                richTextToHtml(f.answer || f.body) ||
                (f.answerRich ? richTextToHtml(f.answerRich) : '') ||
                plainTextToParagraphsHtml(f.description || '');
            return `<div class="accordion-item">
                <button type="button" class="accordion-header" aria-expanded="false">
                    <span class="accordion-title">${question}</span>
                    <div class="accordion-icon-wrap"><i data-lucide="chevron-down" class="accordion-icon"></i></div>
                </button>
                <div class="accordion-content">
                    <div class="accordion-inner">${answerHtml ? `<div class="rich-text-body">${answerHtml}</div>` : ''}</div>
                </div>
            </div>`;
        })
        .join('');
    wireEWalletFaqAccordion(accordion);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: accordion });
}

function applyEWalletSectionText(page) {
    if (!page) return;
    const textMap = [
        ['e-wallet-operators-h2', page.topCasinosHeading],
        ['e-wallet-operators-intro', page.topCasinosIntro, 'rich'],
        ['e-wallet-operators-outro', page.topCasinosOutro, 'rich'],
        ['e-wallet-why-h2', page.whyHeading],
        ['e-wallet-why-intro', page.whyIntro, 'rich'],
        ['e-wallet-game-types-h2', page.gameTypesHeading],
        ['e-wallet-game-types-intro', page.gameTypesIntro, 'rich'],
        ['e-wallet-comparison-h2', page.comparisonHeading],
        ['e-wallet-comparison-intro', page.comparisonIntro, 'rich'],
        ['e-wallet-comparison-outro', page.comparisonOutro, 'rich'],
        ['e-wallet-deposits-h2', page.depositsHeading],
        ['e-wallet-deposits-intro', page.depositsIntro, 'rich'],
        ['e-wallet-deposits-outro', page.depositsOutro, 'rich'],
        ['e-wallet-how-to-h2', page.howToHeading],
        ['e-wallet-how-to-intro', page.howToIntro, 'rich'],
        ['e-wallet-how-to-outro', page.howToOutro, 'rich'],
        ['e-wallet-conclusion-h2', page.conclusionHeading],
        ['e-wallet-conclusion-body', page.conclusionBody, 'rich'],
        ['e-wallet-faq-h2', page.faqHeading],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function buildEWalletJsonLd(page, operators) {
    const itemListEl = document.getElementById('e-wallet-ld-itemlist');
    if (itemListEl && Array.isArray(operators) && operators.length > 0) {
        const items = operators.slice(0, 10).map((item, i) => {
            const attr = liveCasinoTopCasinoToAttr(item);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best E-Wallet Casinos in Malaysia 2026',
            itemListElement: items,
        });
    }
    const faqItems = page?.faqItems;
    const faqEl = document.getElementById('e-wallet-ld-faq');
    if (faqEl && Array.isArray(faqItems) && faqItems.length > 0) {
        faqEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((f) => ({
                '@type': 'Question',
                name: f.question || f.title || '',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.answer || f.body || richTextToPlainText(f.answerRich || f.body) || '',
                },
            })),
        });
    }
    const webEl = document.getElementById('e-wallet-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best E-Wallet Casinos Malaysia 2026',
            url: 'https://888reviews.com/ewallet',
            description:
                page.metaDescription ||
                'Compare the best e-wallet casinos in Malaysia for 2026: Touch \'n Go, DuitNow, GrabPay, and trusted payment methods.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initEWalletPage() {
    const listEl = document.getElementById('e-wallet-operator-list');
    if (!listEl) return;

    const page = await fetchEWalletPage();
    if (!page) return;

    applyEWalletMeta(page);
    applyEWalletHero(page);
    applyEWalletSectionText(page);
    applyEWalletListingMeta(page);
    applyEWalletOperators(page);
    applyEWalletWhyReasons(page);
    applyEWalletGameTypePicks(page);
    applyEWalletComparisonTable(page);
    applyEWalletDepositTable(page);
    applyEWalletHowToSteps(page);
    applyEWalletConclusion(page);
    applyEWalletFaq(page);
    buildEWalletJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 slot-page single type — nested component + relation populate. */
const SLOT_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[editorsChoice][populate][casino][populate]=logo' +
    '&populate[editorsChoice][populate][heroImage]=true' +
    '&populate[topSlotRows][populate][slot][populate]=coverImage' +
    '&populate[topSlotRows][populate][playAtCasino][populate]=logo' +
    '&populate[featuredSlotBonus][populate][casino][populate]=logo' +
    '&populate[featuredSlotBonus][populate][bonusOverride]=*' +
    '&populate[featuredSlotBonus][populate][features]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true' +
    '&populate[conclusionGuides][populate]=*' +
    '&populate[bestSlotsHeroImage]=true' +
    '&populate[providerRows][populate][playAtCasino][populate]=logo' +
    '&populate[editorsChoice][populate][specRows]=*' +
    '&populate[editorsChoice][populate][pros]=*' +
    '&populate[editorsChoice][populate][cons]=*';

const SLOT_PAGE_POPULATE_FALLBACK = 'populate=*';

const SLOT_PAGE_HIGHLIGHT_LABEL = 'Online slots highlight';

async function fetchSlotPage() {
    try {
        let res = await fetch(`${API_URL}/api/slot-page?${SLOT_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Slot page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/slot-page?${SLOT_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Slot page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Slot page CMS fetch failed:', e);
        return null;
    }
}

function getStrapiMediaDisplayUrl(field) {
    for (const raw of normalizeStrapiMediaToUrls(field)) {
        const r = resolveMediaUrl(raw);
        if (r) return r;
    }
    return '';
}

function slotTopCasinoToAttr(item, slugMap) {
    const casino = bonusHubEnrichedCasino(item?.casino, slugMap) || {};
    const merged = { ...casino };
    if (item?.highlight) {
        merged.MalaysiaHighlight = item.highlight;
        merged.malaysiaHighlight = item.highlight;
    }
    const override = item?.bonusOverride;
    if (override) {
        if (override.intro) merged.malaysiaBonusIntro = override.intro;
        if (override.amount) merged.malaysiaBonusAmount = override.amount;
        if (override.extra) merged.malaysiaBonusExtra = override.extra;
        const line = [override.intro, override.amount, override.extra].filter(Boolean).join(' ');
        if (line) {
            merged.MalaysiaBonusLine = line;
            merged.malaysiaBonusLine = line;
        }
    }
    return applyTopCasinoItemRatingOverride(merged, item);
}

function slotPageFeaturedToAttr(block, slugMap) {
    const casino = bonusHubEnrichedCasino(block?.casino, slugMap) || {};
    const merged = { ...casino };
    const override = block?.bonusOverride;
    if (override) {
        if (override.intro) merged.malaysiaBonusIntro = override.intro;
        if (override.amount) merged.malaysiaBonusAmount = override.amount;
        if (override.extra) merged.malaysiaBonusExtra = override.extra;
    }
    return merged;
}

function applySlotPageMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Slot Sites Malaysia 2026 | Top Online Slots | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best online slot sites in Malaysia for 2026: expert rankings, MYR bonuses, top slot games, and trusted payment methods. Independent reviews. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applySlotPageHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('slot-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('slot-hero-desc'), page.heroIntro, 'rich');
}

function applySlotPageListingMeta(page) {
    const bar = document.getElementById('slot-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('slot-listing-updated');
    const disclosureEl = document.getElementById('slot-listing-disclosure');
    const trustEl = document.getElementById('slot-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: bar });
}

function applySlotPageSectionText(page) {
    if (!page) return;
    const textMap = [
        ['slot-operators-h2', page.topCasinosHeading],
        ['slot-operators-intro', page.topCasinosIntro, 'rich'],
        ['slot-operators-outro', page.topCasinosOutro, 'rich'],
        ['slot-editors-choice-h2', page.editorsChoiceHeading],
        ['slot-best-slots-h2', page.bestSlotsHeading],
        ['slot-best-slots-intro', page.bestSlotsIntro, 'rich'],
        ['slot-bonus-h2', page.bonusesHeading],
        ['slot-bonus-intro', page.bonusesIntro, 'rich'],
        ['slot-providers-h2', page.providersHeading],
        ['slot-providers-intro', page.providersIntro, 'rich'],
        ['slot-conclusion-h2', page.conclusionHeading],
        ['slot-conclusion-body', page.conclusionBody, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function applySlotPageOperators(page, slugMap) {
    const listEl = document.getElementById('slot-page-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => {
            const enriched = {
                ...item,
                casino: bonusHubEnrichedCasino(item?.casino, slugMap) || item?.casino,
            };
            return renderLiveCasinoOperatorRow(enriched, item.rank || i + 1, {
                highlightLabel: SLOT_PAGE_HIGHLIGHT_LABEL,
            });
        })
        .join('');
}

function slotEditorsChoiceIconForLabel(label) {
    const l = String(label || '').toLowerCase();
    if (/license|gcb|curacao/.test(l)) return 'shield-check';
    if (/editor|top slots casino|top blackjack casino/.test(l)) return 'layout-grid';
    if (/highlight/.test(l)) return 'sparkles';
    if (/feedback|player/.test(l)) return 'messages-square';
    if (/slot type|featured slot|blackjack variant|featured blackjack/.test(l)) return 'gamepad-2';
    if (/provider/.test(l)) return 'layers';
    if (/payment/.test(l)) return 'credit-card';
    if (/betting|limit/.test(l)) return 'coins';
    if (/mobile|compat/.test(l)) return 'smartphone';
    return 'circle-dot';
}

function slotEditorsChoiceSpecSortKey(label) {
    const l = String(label || '').toLowerCase();
    if (/license|gcb|curacao/.test(l)) return 8;
    if (/top highlight/.test(l) || (l.includes('highlight') && !l.includes('casino'))) return 1;
    if (/player feedback|feedback/.test(l)) return 2;
    if (/featured slot|slot type/.test(l)) return 3;
    if (/top provider|provider/.test(l)) return 4;
    if (/payment/.test(l)) return 5;
    if (/betting|limit/.test(l)) return 6;
    if (/mobile|compat/.test(l)) return 7;
    return 50;
}

function slotEditorsChoiceIsLicenseLabel(label) {
    return /license|gcb|curacao/i.test(String(label || ''));
}

function renderSlotEditorsChoiceCard(label, valueHtml, options = {}) {
    const icon = options.icon || slotEditorsChoiceIconForLabel(label);
    const isLicense = options.isLicense || slotEditorsChoiceIsLicenseLabel(label);
    const cardClass = [
        'slot-editors-choice__card',
        options.variant ? `slot-editors-choice__card--${options.variant}` : '',
        isLicense ? 'slot-editors-choice__card--license' : '',
    ]
        .filter(Boolean)
        .join(' ');
    return `<div class="${cardClass}" role="listitem">
        <div class="slot-editors-choice__card-head">
            <span class="slot-editors-choice__card-icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <span class="slot-editors-choice__card-label">${escapeHtml(label)}</span>
        </div>
        <div class="slot-editors-choice__card-value">${valueHtml}</div>
    </div>`;
}

function renderSlotEditorsChoice(block, slugMap, options = {}) {
    if (!block) return '';
    const topCasinoLabel = options.topCasinoLabel || "Editor's Top Slots Casino";
    const uniformCards = options.uniformCards === true;
    const heroAltSuffix = options.heroAltSuffix || 'online slots Malaysia';
    const attr = bonusHubEnrichedCasino(block.casino, slugMap) || normalizeV5CasinoAttr(block.casino) || {};
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const heroUrl = getStrapiMediaDisplayUrl(block.heroImage);
    const heroHtml = heroUrl
        ? `<figure class="slot-editors-choice__hero"><img src="${escapeHtml(heroUrl)}" alt="${name} ${escapeHtml(heroAltSuffix)}" width="1000" height="429" loading="lazy" class="slot-editors-choice__hero-img"></figure>`
        : '';
    const introHtml = richTextToHtml(block.intro);
    const introBlock = introHtml
        ? `<div class="slot-editors-choice__intro">${introHtml}</div>`
        : '';

    const specRows = Array.isArray(block.specRows)
        ? block.specRows
              .slice()
              .sort(
                  (a, b) =>
                      slotEditorsChoiceSpecSortKey(a.label) - slotEditorsChoiceSpecSortKey(b.label),
              )
        : [];

    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="" class="slot-editors-choice__casino-logo" width="96" height="36" loading="lazy">`
        : '';
    const casinoPill = `<a href="${visitHref}" class="slot-editors-choice__casino-pill"${visitRel} aria-label="Visit ${name}">${logoHtml}<span class="slot-editors-choice__casino-name">${name}</span></a>`;
    const casinoTextLink = `<a href="${visitHref}" class="slot-editors-choice__card-text slot-editors-choice__card-link"${visitRel}>${name}</a>`;
    const gridCards = [];
    if (block.casino) {
        gridCards.push(
            renderSlotEditorsChoiceCard(topCasinoLabel, uniformCards ? casinoTextLink : casinoPill, {
                icon: 'layout-grid',
                variant: uniformCards ? undefined : 'casino',
            }),
        );
    }
    for (const row of specRows) {
        const label = row.label || '—';
        const value = escapeHtml(String(row.value || '—').trim());
        const isLicense = slotEditorsChoiceIsLicenseLabel(label);
        const valueHtml = isLicense
            ? `<span class="slot-editors-choice__license-badge">${value}</span>`
            : `<span class="slot-editors-choice__card-text">${value}</span>`;
        gridCards.push(renderSlotEditorsChoiceCard(label, valueHtml, { isLicense }));
    }

    const gridHtml =
        gridCards.length > 0
            ? `<div class="slot-editors-choice__grid" role="list">${gridCards.join('')}</div>`
            : '';

    const licenseNoteHtml = block.licenseNote
        ? `<div class="slot-editors-choice__pro-tip">${richTextToHtml(block.licenseNote) || `<p>${escapeHtml(String(block.licenseNote))}</p>`}</div>`
        : '';

    const pros = Array.isArray(block.pros) ? block.pros : [];
    const cons = Array.isArray(block.cons) ? block.cons : [];
    const prosHtml =
        pros.length > 0
            ? `<div class="slot-editors-choice__pros">
            <h3 class="slot-editors-choice__list-title">Pros:</h3>
            <ul class="slot-editors-choice__list">${pros.map((p) => `<li>${escapeHtml(p.label || '')}</li>`).join('')}</ul>
        </div>`
            : '';
    const consHtml =
        cons.length > 0
            ? `<div class="slot-editors-choice__cons">
            <h3 class="slot-editors-choice__list-title">Cons:</h3>
            <ul class="slot-editors-choice__list">${cons.map((c) => `<li>${escapeHtml(c.label || '')}</li>`).join('')}</ul>
        </div>`
            : '';
    const prosConsHtml =
        prosHtml || consHtml
            ? `<div class="slot-editors-choice__pros-cons">${prosHtml}${consHtml}</div>`
            : '';

    return `<article class="slot-editors-choice">
        ${introBlock}
        ${heroHtml}
        ${gridHtml}
        ${licenseNoteHtml}
        ${prosConsHtml}
    </article>`;
}

function applySlotEditorsChoice(page, slugMap) {
    const container = document.getElementById('slot-editors-choice');
    const block = page?.editorsChoice;
    if (!container) return;
    if (!block) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = renderSlotEditorsChoice(block, slugMap);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function formatSlotRtpValue(rtp) {
    if (rtp == null || rtp === '' || rtp === '—') return '—';
    const s = String(rtp).trim();
    return s.includes('%') ? s : `${s}%`;
}

function lookupCasinoByDisplayName(name, slugMap) {
    if (!name || !slugMap?.size) return null;
    const wanted = slugifyLabel(name);
    if (slugMap.has(wanted)) return slugMap.get(wanted);
    for (const [slug, attr] of slugMap) {
        const displayName = attr.Name || attr.name || '';
        if (slugifyLabel(displayName) === wanted) return attr;
        if (slugifyLabel(slug) === wanted) return attr;
    }
    return null;
}

function resolveSlotPlayCasino(casino, slugMap) {
    let attr = normalizeV5CasinoAttr(casino) || {};
    const slug = firstNonEmptyAttr(attr, ['Slug', 'slug']).toLowerCase();
    if (slug && slugMap?.get(slug)) {
        attr = { ...attr, ...slugMap.get(slug) };
    } else if (!getLogoUrl(attr)) {
        const name = attr.Name || attr.name || '';
        const found = lookupCasinoByDisplayName(name, slugMap);
        if (found) attr = { ...attr, ...found };
    }
    return attr;
}

function renderSlotTopGamesPlayCell(casino, slugMap) {
    const attr = resolveSlotPlayCasino(casino, slugMap);
    const casinoName = attr.Name || attr.name || '—';
    const nameEsc = escapeHtml(casinoName);
    const visitHref = casinoVisitSiteHref(attr);
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<span class="slot-top-games__play-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-hidden="true">${nameEsc}</span>`
        : `<span class="slot-top-games__play-text">${nameEsc}</span>`;
    if (visitHref && visitHref !== '#') {
        return `<a href="${escapeHtml(visitHref)}" class="slot-top-games__play-link"${visitRel} aria-label="Play at ${nameEsc}">${logoHtml}</a>`;
    }
    return logoHtml;
}

function renderSlotTopGameRow(row, index, slugMap) {
    const slot = row?.slot;
    const rank = row?.rank || index + 1;
    const slotName = slot?.name || slot?.Name || '—';
    const provider = slot?.providerName || '';
    const rtp = formatSlotRtpValue(slot?.rtp);
    const keyFeature = slot?.keyFeature || '—';
    const whyLoved = slot?.whyLoved || '—';
    const providerHtml = provider
        ? `<span class="slot-top-games__provider">${escapeHtml(provider)}</span>`
        : '';
    const playCell = renderSlotTopGamesPlayCell(row?.playAtCasino || { Name: row?.casinoName }, slugMap);
    return `<tr class="slot-top-games__row">
        <td class="slot-top-games__cell slot-top-games__cell--game" data-label="Slot game">
            <div class="slot-top-games__game">
                <span class="slot-top-games__rank" aria-hidden="true">${rank}.</span>
                <div class="slot-top-games__game-text">
                    <strong class="slot-top-games__title">${escapeHtml(slotName)}</strong>
                    ${providerHtml}
                </div>
            </div>
        </td>
        <td class="slot-top-games__cell slot-top-games__cell--rtp" data-label="RTP"><span class="slot-top-games__rtp">${escapeHtml(rtp)}</span></td>
        <td class="slot-top-games__cell slot-top-games__cell--feature" data-label="Key feature"><span class="slot-top-games__feature">${escapeHtml(keyFeature)}</span></td>
        <td class="slot-top-games__cell slot-top-games__cell--why" data-label="Why Malaysian players love it"><span class="slot-top-games__why">${escapeHtml(whyLoved)}</span></td>
        <td class="slot-top-games__cell slot-top-games__cell--play" data-label="Where to play">${playCell}</td>
    </tr>`;
}

function enhanceSlotTopGamesPlayCells(slugMap) {
    const tbody = document.getElementById('slot-top-games-tbody');
    if (!tbody || !slugMap?.size) return;
    tbody.querySelectorAll('.slot-top-games__cell--play').forEach((cell) => {
        if (cell.querySelector('.slot-top-games__play-logo')) return;
        const textEl = cell.querySelector('.slot-top-games__play-text');
        const name = textEl?.textContent?.trim();
        if (!name) return;
        const found = lookupCasinoByDisplayName(name, slugMap);
        cell.innerHTML = renderSlotTopGamesPlayCell(found || { Name: name }, slugMap);
    });
}

function applySlotTopGamesTable(page, slugMap) {
    const heroEl = document.getElementById('slot-best-slots-hero-image');
    const tbody = document.getElementById('slot-top-games-tbody');
    const heroUrl = getStrapiMediaDisplayUrl(page?.bestSlotsHeroImage);
    if (heroEl) {
        if (heroUrl) {
            heroEl.innerHTML = `<img src="${escapeHtml(heroUrl)}" alt="Best online slots casinos Malaysia" width="1000" height="335" loading="lazy" class="slot-best-slots-hero__img">`;
            heroEl.removeAttribute('aria-hidden');
        } else {
            heroEl.innerHTML = '';
            heroEl.setAttribute('aria-hidden', 'true');
        }
    }
    const rows = page?.topSlotRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    const validRows = rows.filter((r) => r?.slot || r?.playAtCasino);
    if (validRows.length === 0) return;
    tbody.innerHTML = validRows
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .map((row, i) => renderSlotTopGameRow(row, i, slugMap))
        .join('');
}

function renderSlotProviderRow(row, slugMap) {
    const provider = escapeHtml(row.providerName || row.provider || row.name || '—');
    const knownFor = escapeHtml(row.knownFor || row.known_for || '—');
    const mustPlay = escapeHtml(row.mustPlaySlot || row.mustPlay || row.slotName || '—');
    const playCell = renderSlotTopGamesPlayCell(row?.playAtCasino, slugMap);
    return `<tr class="slot-providers__row">
        <td class="slot-providers__cell slot-providers__cell--provider" data-label="Software provider"><span class="slot-providers__provider">${provider}</span></td>
        <td class="slot-providers__cell slot-providers__cell--known" data-label="Known for"><span class="slot-providers__known">${knownFor}</span></td>
        <td class="slot-providers__cell slot-providers__cell--slot" data-label="Must-play slot in Malaysia"><span class="slot-providers__slot">${mustPlay}</span></td>
        <td class="slot-providers__cell slot-providers__cell--play" data-label="Where to play">${playCell}</td>
    </tr>`;
}

function applySlotProvidersTable(page, slugMap) {
    const tbody = document.getElementById('slot-providers-tbody');
    const rows = page?.providerRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row) => renderSlotProviderRow(row, slugMap)).join('');
}

function applySlotBonusFeatured(page, slugMap) {
    const container = document.getElementById('slot-bonus-featured');
    const block = page?.featuredSlotBonus;
    if (!container || !block?.casino) return;
    const attr = slotPageFeaturedToAttr(block, slugMap);
    container.innerHTML = renderHomepageFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Bonus rating',
        defaultCta: block.ctaText || 'Claim Bonus!',
        offerLabel: block.bonusOverride?.intro || 'Welcome bonus',
    });
}

function renderSlotBottomTrio(page, slugMap) {
    return renderBonusBottomTrio(page, slugMap, { featuredHeadStrong: 'Malaysian Casino' });
}

function applySlotConclusion(page, slugMap) {
    const container = document.getElementById('slot-bottom-trio');
    if (!container || !page?.conclusionCta?.casino) return;
    container.innerHTML = renderSlotBottomTrio(page, slugMap);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function buildSlotPageJsonLd(page, topCasinos, slugMap) {
    const itemListEl = document.getElementById('slot-ld-itemlist');
    if (itemListEl && Array.isArray(topCasinos) && topCasinos.length > 0) {
        const items = topCasinos.slice(0, 10).map((item, i) => {
            const attr = slotTopCasinoToAttr(item, slugMap);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Online Slot Sites in Malaysia 2026',
            itemListElement: items,
        });
    }
    const webEl = document.getElementById('slot-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Slot Sites Malaysia 2026',
            url: 'https://888reviews.com/slots',
            description:
                page.metaDescription ||
                'Compare the best online slot sites in Malaysia for 2026: expert rankings, bonuses, and top games.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initSlotPage() {
    const listEl = document.getElementById('slot-page-operator-list');
    if (!listEl) return;

    let page = null;
    let casinoRows = null;
    try {
        [page, casinoRows] = await Promise.all([fetchSlotPage(), fetchBonusHubCasinos()]);
    } catch (e) {
        console.warn('Slot page CMS fetch failed:', e);
    }

    applySlotPageListingMeta(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!page) return;

    const slugMap = buildCasinoSlugMap(casinoRows);

    applySlotPageMeta(page);
    applySlotPageHero(page);
    applySlotPageSectionText(page);
    applySlotPageListingMeta(page);
    applySlotPageOperators(page, slugMap);
    applySlotEditorsChoice(page, slugMap);
    applySlotTopGamesTable(page, slugMap);
    enhanceSlotTopGamesPlayCells(slugMap);
    applySlotBonusFeatured(page, slugMap);
    applySlotProvidersTable(page, slugMap);
    applySlotConclusion(page, slugMap);
    buildSlotPageJsonLd(page, page.topCasinos, slugMap);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 blackjack-page single type — nested component + relation populate. */
const BLACKJACK_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[editorsChoice][populate][casino][populate]=logo' +
    '&populate[editorsChoice][populate][heroImage]=true' +
    '&populate[editorsChoice][populate][specRows]=*' +
    '&populate[editorsChoice][populate][pros]=*' +
    '&populate[editorsChoice][populate][cons]=*' +
    '&populate[categoryPicks][populate][casino][populate]=logo' +
    '&populate[variantRows][populate][playAtCasino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][casino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][bonusOverride]=*' +
    '&populate[featuredWelcomeBonus][populate][features]=*' +
    '&populate[bettingLimitRows][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionGuides][populate]=*' +
    '&populate[bonusCategories]=*';

const BLACKJACK_PAGE_POPULATE_FALLBACK = 'populate=*';

const BLACKJACK_PAGE_HIGHLIGHT_LABEL = 'Blackjack highlight';

async function fetchBlackjackPage() {
    try {
        let res = await fetch(`${API_URL}/api/blackjack-page?${BLACKJACK_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Blackjack page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/blackjack-page?${BLACKJACK_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Blackjack page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Blackjack page CMS fetch failed:', e);
        return null;
    }
}

function blackjackTopCasinoToAttr(item, slugMap) {
    return slotTopCasinoToAttr(item, slugMap);
}

function applyBlackjackMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Online Blackjack Casinos Malaysia 2026 | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best online blackjack casinos in Malaysia for 2026: 3:2 payouts, live dealer tables, MYR bonuses, and trusted payment methods. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyBlackjackHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('blackjack-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('blackjack-hero-desc'), page.heroIntro, 'rich');
}

function applyBlackjackListingMeta(page) {
    const bar = document.getElementById('blackjack-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('blackjack-listing-updated');
    const disclosureEl = document.getElementById('blackjack-listing-disclosure');
    const trustEl = document.getElementById('blackjack-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: bar });
}

function applyBlackjackSectionText(page) {
    if (!page) return;
    const textMap = [
        ['blackjack-operators-h2', page.topCasinosHeading],
        ['blackjack-operators-intro', page.topCasinosIntro, 'rich'],
        ['blackjack-operators-outro', page.topCasinosOutro, 'rich'],
        ['blackjack-editors-choice-h2', page.editorsChoiceHeading],
        ['blackjack-category-h2', page.categoryHeading],
        ['blackjack-category-intro', page.categoryIntro, 'rich'],
        ['blackjack-variants-h2', page.variantsHeading],
        ['blackjack-variants-intro', page.variantsIntro, 'rich'],
        ['blackjack-bonus-h2', page.bonusesHeading],
        ['blackjack-bonus-intro', page.bonusesIntro, 'rich'],
        ['blackjack-betting-limits-h2', page.bettingLimitsHeading],
        ['blackjack-betting-limits-intro', page.bettingLimitsIntro, 'rich'],
        ['blackjack-low-stakes-h3', page.lowStakesHeading],
        ['blackjack-low-stakes-body', page.lowStakesBody, 'rich'],
        ['blackjack-mid-stakes-h3', page.midStakesHeading],
        ['blackjack-mid-stakes-body', page.midStakesBody, 'rich'],
        ['blackjack-high-stakes-h3', page.highStakesHeading],
        ['blackjack-high-stakes-body', page.highStakesBody, 'rich'],
        ['blackjack-conclusion-h2', page.conclusionHeading],
        ['blackjack-conclusion-body', page.conclusionBody, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function applyBlackjackOperators(page, slugMap) {
    const listEl = document.getElementById('blackjack-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => {
            const enriched = {
                ...item,
                casino: bonusHubEnrichedCasino(item?.casino, slugMap) || item?.casino,
            };
            return renderLiveCasinoOperatorRow(enriched, item.rank || i + 1, {
                highlightLabel: BLACKJACK_PAGE_HIGHLIGHT_LABEL,
            });
        })
        .join('');
}

function applyBlackjackEditorsChoice(page, slugMap) {
    const container = document.getElementById('blackjack-editors-choice');
    const block = page?.editorsChoice;
    if (!container) return;
    if (!block) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = renderSlotEditorsChoice(block, slugMap, {
        topCasinoLabel: "Editor's Top Blackjack Casino",
        heroAltSuffix: 'online blackjack Malaysia',
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function renderBlackjackCategoryPick(pick, slugMap) {
    const attr = bonusHubEnrichedCasino(pick?.casino, slugMap) || normalizeV5CasinoAttr(pick?.casino) || {};
    const casinoName = escapeHtml(attr.Name || attr.name || 'Casino');
    const category = escapeHtml(pick.category || '');
    const bodyHtml = richTextToHtml(pick.body) || '';
    const keyFeature = escapeHtml(pick.keyFeature || '—');
    const bonusDetails = escapeHtml(pick.bonusDetails || '—');
    const ctaText = escapeHtml(pick.ctaText || `Play at ${casinoName}`);
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="" class="blackjack-category-pick__logo" width="120" height="48" loading="lazy">`
        : `<span class="blackjack-category-pick__logo-fallback" aria-hidden="true">${escapeHtml((casinoName.charAt(0) || 'C').toUpperCase())}</span>`;
    const bodyBlock = bodyHtml ? `<div class="blackjack-category-pick__body">${bodyHtml}</div>` : '';
    return `<article class="blackjack-category-pick">
        <header class="blackjack-category-pick__header">
            <h3 class="blackjack-category-pick__category">${category}</h3>
            <div class="blackjack-category-pick__brand">
                <a href="${visitHref}" class="blackjack-category-pick__logo-link"${visitRel} aria-label="Visit ${casinoName}">
                    <div class="blackjack-category-pick__logo-wrap">${logoHtml}</div>
                </a>
                <div class="blackjack-category-pick__brand-meta">
                    <p class="blackjack-category-pick__casino">${casinoName}</p>
                </div>
            </div>
        </header>
        ${bodyBlock}
        <dl class="blackjack-category-pick__specs">
            <div class="blackjack-category-pick__spec">
                <dt>Key feature</dt>
                <dd>${keyFeature}</dd>
            </div>
            <div class="blackjack-category-pick__spec">
                <dt>Bonus</dt>
                <dd>${bonusDetails}</dd>
            </div>
        </dl>
        <a href="${visitHref}" class="btn-play-here blackjack-category-pick__cta-btn"${visitRel}>${ctaText}</a>
    </article>`;
}

function applyBlackjackCategoryPicks(page, slugMap) {
    const container = document.getElementById('blackjack-category-picks');
    const picks = page?.categoryPicks;
    if (!container || !Array.isArray(picks) || picks.length === 0) return;
    container.innerHTML = picks.map((pick) => renderBlackjackCategoryPick(pick, slugMap)).join('');
}

function formatBlackjackRtpValue(rtp) {
    if (rtp == null || rtp === '' || rtp === '—') return '—';
    const s = String(rtp).trim();
    if (s.startsWith('~')) return s;
    return s.includes('%') ? `~${s}` : `~${s}%`;
}

function renderBlackjackVariantPlayCell(casino, slugMap) {
    const attr = resolveSlotPlayCasino(casino, slugMap);
    const casinoName = attr.Name || attr.name || '—';
    const nameEsc = escapeHtml(casinoName);
    const visitHref = casinoVisitSiteHref(attr);
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<span class="slot-top-games__play-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${nameEsc}">${nameEsc}</span>`
        : `<span class="slot-top-games__play-text">${nameEsc}</span>`;
    if (visitHref && visitHref !== '#') {
        return `<a href="${escapeHtml(visitHref)}" class="slot-top-games__play-link"${visitRel} aria-label="Play at ${nameEsc}">${logoHtml}</a>`;
    }
    return logoHtml;
}

function renderBlackjackVariantRow(row, index, slugMap) {
    const rank = index + 1;
    const variantName = escapeHtml(row?.variantName || '—');
    const provider = row?.provider ? escapeHtml(row.provider) : '';
    const rtp = escapeHtml(formatBlackjackRtpValue(row?.rtp));
    const description = escapeHtml(row?.description || '—');
    const providerHtml = provider
        ? `<span class="slot-top-games__provider">${provider}</span>`
        : '';
    const playCell = renderBlackjackVariantPlayCell(row?.playAtCasino, slugMap);
    return `<tr class="slot-top-games__row">
        <td class="slot-top-games__cell slot-top-games__cell--game" data-label="Blackjack variant">
            <div class="slot-top-games__game">
                <span class="slot-top-games__rank" aria-hidden="true">${rank}.</span>
                <div class="slot-top-games__game-text">
                    <strong class="slot-top-games__title">${variantName}</strong>
                    ${providerHtml}
                </div>
            </div>
        </td>
        <td class="slot-top-games__cell slot-top-games__cell--rtp" data-label="Typical RTP"><span class="slot-top-games__rtp">${rtp}</span></td>
        <td class="slot-top-games__cell slot-top-games__cell--why" data-label="Key feature"><span class="slot-top-games__why">${description}</span></td>
        <td class="slot-top-games__cell slot-top-games__cell--play" data-label="Where to play">${playCell}</td>
    </tr>`;
}

function applyBlackjackVariantsTable(page, slugMap) {
    const tbody = document.getElementById('blackjack-variants-tbody');
    const rows = page?.variantRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row, i) => renderBlackjackVariantRow(row, i, slugMap)).join('');
}

function renderBlackjackBettingLimitRow(row, slugMap) {
    const attr = bonusHubEnrichedCasino(row?.casino, slugMap) || normalizeV5CasinoAttr(row?.casino) || {};
    const name = escapeHtml(attr.Name || attr.name || '—');
    const logoUrl = getLogoUrl(attr);
    const casinoCell = logoUrl
        ? `<span class="blackjack-limits__casino"><img src="${escapeHtml(logoUrl)}" alt="${name}" class="blackjack-limits__logo" width="80" height="40" loading="lazy"><span class="sr-only">${name}</span></span>`
        : `<span class="blackjack-limits__casino-text">${name}</span>`;
    const minBet = escapeHtml(row?.minBet || '—');
    const maxBet = escapeHtml(row?.maxBet || '—');
    const bestFor = escapeHtml(row?.bestFor || '—');
    const ctaText = escapeHtml(row?.ctaText || 'Play Here');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    return `<tr>
        <td data-label="Casino">${casinoCell}</td>
        <td data-label="Min. bet">${minBet}</td>
        <td data-label="Max. bet">${maxBet}</td>
        <td data-label="Best for">${bestFor}</td>
        <td data-label="Play now"><a href="${visitHref}" class="blackjack-limits__cta"${visitRel}>${ctaText} &raquo;</a></td>
    </tr>`;
}

function applyBlackjackBettingLimitsTable(page, slugMap) {
    const tbody = document.getElementById('blackjack-betting-limits-tbody');
    const rows = page?.bettingLimitRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row) => renderBlackjackBettingLimitRow(row, slugMap)).join('');
}

function applyBlackjackBonusFeatured(page, slugMap) {
    const container = document.getElementById('blackjack-bonus-featured');
    const block = page?.featuredWelcomeBonus;
    if (!container || !block?.casino) return;
    const attr = slotPageFeaturedToAttr(block, slugMap);
    container.innerHTML = renderHomepageFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Bonus rating',
        defaultCta: block.ctaText || 'Claim Blackjack Bonus!',
        offerLabel: block.bonusOverride?.intro || 'Welcome bonus',
    });
}

function applyBlackjackBonusCategories(page) {
    const container = document.getElementById('blackjack-bonus-categories');
    const categories = page?.bonusCategories;
    if (!container || !Array.isArray(categories) || categories.length === 0) return;
    container.innerHTML = categories
        .map((cat) => {
            const heading = escapeHtml(cat.heading || cat.title || '');
            const bodyHtml = richTextToHtml(cat.body) || '';
            return `<div class="blackjack-bonus-category">
                <h3 class="blackjack-bonus-category__heading">${heading}</h3>
                ${bodyHtml ? `<div class="blackjack-bonus-category__body">${bodyHtml}</div>` : ''}
            </div>`;
        })
        .join('');
}

function applyBlackjackConclusion(page, slugMap) {
    const container = document.getElementById('blackjack-bottom-trio');
    if (!container || !page?.conclusionCta?.casino) return;
    container.innerHTML = renderBonusBottomTrio(page, slugMap, {
        featuredHeadStrong: 'Malaysian Online Blackjack Casino',
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function buildBlackjackPageJsonLd(page, topCasinos, slugMap) {
    const itemListEl = document.getElementById('blackjack-ld-itemlist');
    if (itemListEl && Array.isArray(topCasinos) && topCasinos.length > 0) {
        const items = topCasinos.slice(0, 10).map((item, i) => {
            const attr = blackjackTopCasinoToAttr(item, slugMap);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Online Blackjack Casinos in Malaysia 2026',
            itemListElement: items,
        });
    }
    const webEl = document.getElementById('blackjack-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Online Blackjack Casinos Malaysia 2026',
            url: 'https://888reviews.com/blackjack',
            description:
                page.metaDescription ||
                'Compare the best online blackjack casinos in Malaysia for 2026: live tables, bonuses, and trusted operators.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initBlackjackPage() {
    const listEl = document.getElementById('blackjack-operator-list');
    if (!listEl) return;

    let page = null;
    let casinoRows = null;
    try {
        [page, casinoRows] = await Promise.all([fetchBlackjackPage(), fetchBonusHubCasinos()]);
    } catch (e) {
        console.warn('Blackjack page CMS fetch failed:', e);
    }

    applyBlackjackListingMeta(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!page) return;

    const slugMap = buildCasinoSlugMap(casinoRows);

    applyBlackjackMeta(page);
    applyBlackjackHero(page);
    applyBlackjackSectionText(page);
    applyBlackjackListingMeta(page);
    applyBlackjackOperators(page, slugMap);
    applyBlackjackEditorsChoice(page, slugMap);
    applyBlackjackCategoryPicks(page, slugMap);
    applyBlackjackVariantsTable(page, slugMap);
    applyBlackjackBonusFeatured(page, slugMap);
    applyBlackjackBonusCategories(page);
    applyBlackjackBettingLimitsTable(page, slugMap);
    applyBlackjackConclusion(page, slugMap);
    buildBlackjackPageJsonLd(page, page.topCasinos, slugMap);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 baccarat-page single type — nested component + relation populate. */
const BACCARAT_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[guidePromo][populate][casino][populate]=logo' +
    '&populate[guidePromo][populate][bonusOverride]=*' +
    '&populate[guidePromo][populate][features]=*' +
    '&populate[sampleRoundPromo][populate][casino][populate]=logo' +
    '&populate[sampleRoundPromo][populate][bonusOverride]=*' +
    '&populate[sampleRoundPromo][populate][features]=*' +
    '&populate[gettingStartedPromo][populate][casino][populate]=logo' +
    '&populate[gettingStartedPromo][populate][bonusOverride]=*' +
    '&populate[gettingStartedPromo][populate][features]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true' +
    '&populate[conclusionGuides][populate]=*' +
    '&populate[conclusionExplore][populate]=*' +
    '&populate[sampleRoundSteps]=*' +
    '&populate[gettingStartedSteps]=*' +
    '&populate[variantItems]=*' +
    '&populate[faqItems]=*' +
    '&populate[ratingCriteria]=*' +
    '&populate[guideSections]=*';

const BACCARAT_PAGE_POPULATE_FALLBACK = 'populate=*';

const BACCARAT_PAGE_HIGHLIGHT_LABEL = 'Baccarat highlight';

const BACCARAT_CRITERIA_ICONS = ['shield-check', 'wallet', 'gift', 'layout-grid'];

const BACCARAT_GUIDE_ICONS = ['target', 'hash', 'coins', 'list-ordered', 'book-open'];

function baccaratGuideIconForHeading(heading, index) {
    const h = String(heading || '').toLowerCase();
    if (/goal|objective|simple|predict/.test(h)) return 'target';
    if (/card|value/.test(h)) return 'hash';
    if (/bet|payout|wager|commission/.test(h)) return 'coins';
    if (/step|round|sample/.test(h)) return 'list-ordered';
    return BACCARAT_GUIDE_ICONS[index % BACCARAT_GUIDE_ICONS.length];
}

function renderBaccaratGuideBlock(section, index) {
    const heading = escapeHtml(section.heading || section.title || '');
    const bodyHtml = richTextToHtml(section.body) || '';
    const icon = baccaratGuideIconForHeading(section.heading || section.title, index);
    const stepNum = String(index + 1).padStart(2, '0');
    const bodyBlock = bodyHtml
        ? `<div class="rich-text-body baccarat-guide-block__body">${bodyHtml}</div>`
        : section.description
          ? `<p class="baccarat-guide-block__body">${escapeHtml(section.description)}</p>`
          : '';
    return `<article class="baccarat-guide-block">
        <span class="baccarat-guide-block__step" aria-hidden="true">${stepNum}</span>
        <header class="baccarat-guide-block__head">
            <span class="baccarat-guide-block__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
            <h3 class="baccarat-guide-block__title">${heading}</h3>
        </header>
        ${bodyBlock}
    </article>`;
}

async function fetchBaccaratPage() {
    try {
        let res = await fetch(`${API_URL}/api/baccarat-page?${BACCARAT_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Baccarat page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/baccarat-page?${BACCARAT_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Baccarat page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Baccarat page CMS fetch failed:', e);
        return null;
    }
}

function baccaratTopCasinoToAttr(item, slugMap) {
    return slotTopCasinoToAttr(item, slugMap);
}

function applyBaccaratMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Baccarat Casinos Malaysia 2026 | Online Baccarat Guide | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best online baccarat casinos in Malaysia for 2026: live dealer tables, RNG games, MYR bonuses, and trusted payment methods. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyBaccaratHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('baccarat-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('baccarat-hero-desc'), page.heroIntro, 'rich');
}

function applyBaccaratListingMeta(page) {
    const bar = document.getElementById('baccarat-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('baccarat-listing-updated');
    const disclosureEl = document.getElementById('baccarat-listing-disclosure');
    const trustEl = document.getElementById('baccarat-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: bar });
}

function applyBaccaratSectionText(page) {
    if (!page) return;
    const textMap = [
        ['baccarat-operators-h2', page.topCasinosHeading],
        ['baccarat-operators-intro', page.topCasinosIntro, 'rich'],
        ['baccarat-operators-outro', page.topCasinosOutro, 'rich'],
        ['baccarat-rating-h2', page.ratingHeading],
        ['baccarat-rating-intro', page.ratingIntro, 'rich'],
        ['baccarat-rating-outro', page.ratingOutro, 'rich'],
        ['baccarat-beginner-h2', page.guideHeading],
        ['baccarat-beginner-intro', page.guideIntro, 'rich'],
        ['baccarat-sample-round-h2', page.sampleRoundHeading],
        ['baccarat-sample-round-intro', page.sampleRoundIntro, 'rich'],
        ['baccarat-variations-h2', page.variantsHeading],
        ['baccarat-variations-intro', page.variantsIntro, 'rich'],
        ['baccarat-real-money-h2', page.gettingStartedHeading],
        ['baccarat-real-money-intro', page.gettingStartedIntro, 'rich'],
        ['baccarat-faq-h2', page.faqHeading],
        ['baccarat-conclusion-h2', page.conclusionHeading],
        ['baccarat-conclusion-body', page.conclusionBody, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function applyBaccaratOperators(page, slugMap) {
    const listEl = document.getElementById('baccarat-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => {
            const enriched = {
                ...item,
                casino: bonusHubEnrichedCasino(item?.casino, slugMap) || item?.casino,
            };
            return renderLiveCasinoOperatorRow(enriched, item.rank || i + 1, {
                highlightLabel: BACCARAT_PAGE_HIGHLIGHT_LABEL,
            });
        })
        .join('');
}

function applyBaccaratRatingCriteria(page) {
    const container = document.getElementById('baccarat-rating-criteria');
    const criteria = page?.ratingCriteria;
    if (!container || !Array.isArray(criteria) || criteria.length === 0) return;
    container.innerHTML = criteria
        .map((c, i) => {
            const heading = escapeHtml(c.heading || c.title || '');
            const bodyHtml = richTextToHtml(c.body) || escapeHtml(c.description || '');
            const icon = BACCARAT_CRITERIA_ICONS[i % BACCARAT_CRITERIA_ICONS.length];
            return `<article class="live-casino-criteria-card slot-criteria-card baccarat-criteria-card" role="listitem">
                <div class="slot-criteria-card__head">
                    <span class="slot-criteria-card__icon" aria-hidden="true"><i data-lucide="${icon}"></i></span>
                    <h3 class="live-casino-criteria-card__title">${heading}</h3>
                </div>
                <div class="live-casino-criteria-card__body">${bodyHtml ? `<div class="rich-text-body">${bodyHtml}</div>` : ''}</div>
            </article>`;
        })
        .join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function applyBaccaratGuideSections(page) {
    const container = document.getElementById('baccarat-guide-sections');
    const sections = page?.guideSections;
    if (!container || !Array.isArray(sections) || sections.length === 0) return;
    container.innerHTML = sections.map((s, i) => renderBaccaratGuideBlock(s, i)).join('');
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function applyBaccaratPromo(containerId, block, slugMap, options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !block?.casino) {
        if (container) container.innerHTML = '';
        return;
    }
    const attr = slotPageFeaturedToAttr(block, slugMap);
    container.innerHTML = renderRouletteFeaturedOperatorRow(block, attr, {
        ratingLabel: options.ratingLabel || 'Casino rating',
        highlightLabel: options.highlightLabel || 'Highlights',
        defaultCta: block.ctaText || 'Play Here!',
    });
}

function applyBaccaratPayoutTable(page) {
    const container = document.getElementById('baccarat-payout-table-body');
    if (!container || !page?.payoutTableBody) return;
    setRichTextHtml(container, page.payoutTableBody);
}

function applyBaccaratSteps(containerId, steps) {
    const container = document.getElementById(containerId);
    if (!container || !Array.isArray(steps) || steps.length === 0) return;
    container.innerHTML = steps
        .map((s, i) => {
            const num = s.step != null ? s.step : i + 1;
            const title = escapeHtml(s.title || s.heading || '');
            const body = escapeHtml(s.body || s.description || '');
            return `<li class="roulette-checklist__step">
                <span class="roulette-checklist__num" aria-hidden="true">${num}</span>
                <div class="roulette-checklist__content">
                    <strong class="roulette-checklist__title">${title}</strong>
                    <p class="roulette-checklist__body">${body}</p>
                </div>
            </li>`;
        })
        .join('');
}

function applyBaccaratVariantItems(page) {
    const container = document.getElementById('baccarat-variant-items');
    const items = page?.variantItems;
    if (!container || !Array.isArray(items) || items.length === 0) return;
    container.innerHTML = items
        .map((item) => {
            const heading = escapeHtml(item.heading || item.title || '');
            const bodyHtml = richTextToHtml(item.body) || '';
            const fallback =
                !bodyHtml && item.description
                    ? `<p>${escapeHtml(item.description)}</p>`
                    : '';
            return `<article class="baccarat-variant-card">
                <h3 class="baccarat-variant-card__title">${heading}</h3>
                ${bodyHtml ? `<div class="rich-text-body baccarat-variant-card__body">${bodyHtml}</div>` : `<div class="baccarat-variant-card__body">${fallback}</div>`}
            </article>`;
        })
        .join('');
}

function applyBaccaratWageringBody(page) {
    const el = document.getElementById('baccarat-wagering-body');
    if (!el || !page?.wageringBody) return;
    setRichTextHtml(el, page.wageringBody);
}

function wireBaccaratFaqAccordion(root) {
    if (!root) return;
    root.querySelectorAll('.accordion-header').forEach((header) => {
        if (header.dataset.baccaratFaqWired) return;
        header.dataset.baccaratFaqWired = '1';
        header.addEventListener('click', () => {
            const item = header.closest('.accordion-item');
            const isActive = item && item.classList.contains('active');
            root.querySelectorAll('.accordion-item').forEach((acc) => {
                acc.classList.remove('active');
                const h = acc.querySelector('.accordion-header');
                if (h) h.setAttribute('aria-expanded', 'false');
            });
            if (!isActive && item) {
                item.classList.add('active');
                header.setAttribute('aria-expanded', 'true');
            }
        });
    });
}

function applyBaccaratFaq(page) {
    const accordion = document.getElementById('baccarat-faq-accordion');
    const faqItems = page?.faqItems;
    if (!accordion || !Array.isArray(faqItems) || faqItems.length === 0) return;
    accordion.innerHTML = faqItems
        .map((f) => {
            const question = escapeHtml(f.question || f.title || '');
            const answerHtml =
                richTextToHtml(f.answer || f.body) ||
                (f.answerRich ? richTextToHtml(f.answerRich) : '') ||
                plainTextToParagraphsHtml(f.description || '');
            return `<div class="accordion-item">
                <button type="button" class="accordion-header" aria-expanded="false">
                    <span class="accordion-title">${question}</span>
                    <div class="accordion-icon-wrap"><i data-lucide="chevron-down" class="accordion-icon"></i></div>
                </button>
                <div class="accordion-content">
                    <div class="accordion-inner">${answerHtml ? `<div class="rich-text-body">${answerHtml}</div>` : ''}</div>
                </div>
            </div>`;
        })
        .join('');
    wireBaccaratFaqAccordion(accordion);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: accordion });
}

function applyBaccaratConclusion(page, slugMap) {
    const container = document.getElementById('baccarat-bottom-trio');
    if (!container || !page?.conclusionCta?.casino) return;
    container.innerHTML = renderBonusBottomTrio(page, slugMap, {
        featuredHeadStrong: 'Malaysian Baccarat Casino',
    });
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function buildBaccaratPageJsonLd(page, topCasinos) {
    const itemListEl = document.getElementById('baccarat-ld-itemlist');
    if (itemListEl && Array.isArray(topCasinos) && topCasinos.length > 0) {
        const items = topCasinos.slice(0, 10).map((item, i) => {
            const attr = liveCasinoTopCasinoToAttr(item);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Baccarat Casinos in Malaysia 2026',
            itemListElement: items,
        });
    }
    const faqItems = page?.faqItems;
    const faqEl = document.getElementById('baccarat-ld-faq');
    if (faqEl && Array.isArray(faqItems) && faqItems.length > 0) {
        faqEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqItems.map((f) => ({
                '@type': 'Question',
                name: f.question || f.title || '',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.answer || f.body || richTextToPlainText(f.answerRich || f.body) || '',
                },
            })),
        });
    }
    const webEl = document.getElementById('baccarat-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Baccarat Casinos Malaysia 2026',
            url: 'https://888reviews.com/baccarat',
            description:
                page.metaDescription ||
                'Compare the best online baccarat casinos in Malaysia for 2026: live and RNG tables, bonuses, and trusted operators.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initBaccaratPage() {
    const listEl = document.getElementById('baccarat-operator-list');
    if (!listEl) return;

    let page = null;
    let casinoRows = null;
    try {
        [page, casinoRows] = await Promise.all([fetchBaccaratPage(), fetchBonusHubCasinos()]);
    } catch (e) {
        console.warn('Baccarat page CMS fetch failed:', e);
    }

    applyBaccaratListingMeta(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!page) return;

    const slugMap = buildCasinoSlugMap(casinoRows);

    applyBaccaratMeta(page);
    applyBaccaratHero(page);
    applyBaccaratSectionText(page);
    applyBaccaratListingMeta(page);
    applyBaccaratOperators(page, slugMap);
    applyBaccaratRatingCriteria(page);
    applyBaccaratGuideSections(page);
    applyBaccaratPromo('baccarat-guide-promo', page.guidePromo, slugMap);
    applyBaccaratPayoutTable(page);
    applyBaccaratSteps('baccarat-sample-round-steps', page.sampleRoundSteps);
    applyBaccaratPromo('baccarat-sample-round-promo', page.sampleRoundPromo, slugMap, {
        highlightLabel: 'Baccarat highlights',
    });
    applyBaccaratVariantItems(page);
    applyBaccaratSteps('baccarat-getting-started-steps', page.gettingStartedSteps);
    applyBaccaratPromo('baccarat-getting-started-promo', page.gettingStartedPromo, slugMap, {
        highlightLabel: 'Welcome bonus highlights',
    });
    applyBaccaratWageringBody(page);
    applyBaccaratFaq(page);
    applyBaccaratConclusion(page, slugMap);
    buildBaccaratPageJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 roulette-page single type — nested component + relation populate. */
const ROULETTE_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[rngGameRows][populate][playAtCasino][populate]=logo' +
    '&populate[liveGameRows][populate][playAtCasino][populate]=logo' +
    '&populate[featuredMobileCasinos][populate][casino][populate]=logo' +
    '&populate[featuredMobileCasinos][populate][bonusOverride]=*' +
    '&populate[featuredMobileCasinos][populate][features]=*' +
    '&populate[featuredWelcomeBonus][populate][casino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][bonusOverride]=*' +
    '&populate[featuredWelcomeBonus][populate][features]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true' +
    '&populate[bonusCategories]=*';

const ROULETTE_PAGE_POPULATE_FALLBACK = 'populate=*';

const ROULETTE_PAGE_HIGHLIGHT_LABEL = 'Roulette highlight';

async function fetchRoulettePage() {
    try {
        let res = await fetch(`${API_URL}/api/roulette-page?${ROULETTE_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Roulette page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/roulette-page?${ROULETTE_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Roulette page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Roulette page CMS fetch failed:', e);
        return null;
    }
}

function rouletteTopCasinoToAttr(item, slugMap) {
    return slotTopCasinoToAttr(item, slugMap);
}

function applyRouletteMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Online Roulette Malaysia 2026 | Live & Real Money Casinos | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best online roulette casinos in Malaysia for 2026: European, American, and live dealer tables, MYR bonuses, and trusted operators. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyRouletteHero(page) {
    if (!page) return;
    setHomepageText(document.getElementById('roulette-hero-h1'), page.heroHeading);
    setHomepageText(document.getElementById('roulette-hero-desc'), page.heroIntro, 'rich');
}

function applyRouletteListingMeta(page) {
    const bar = document.getElementById('roulette-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('roulette-listing-updated');
    const disclosureEl = document.getElementById('roulette-listing-disclosure');
    const trustEl = document.getElementById('roulette-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: bar });
}

function applyRouletteSectionText(page) {
    if (!page) return;
    const textMap = [
        ['roulette-operators-h2', page.topCasinosHeading],
        ['roulette-operators-intro', page.topCasinosIntro, 'rich'],
        ['roulette-operators-outro', page.topCasinosOutro, 'rich'],
        ['roulette-rating-intro', page.ratingIntro, 'rich'],
        ['roulette-rating-outro', page.ratingOutro, 'rich'],
        ['roulette-rng-h2', page.rngGamesHeading],
        ['roulette-rng-intro', page.rngGamesIntro, 'rich'],
        ['roulette-rng-outro', page.rngGamesOutro, 'rich'],
        ['roulette-live-h2', page.liveGamesHeading],
        ['roulette-live-intro', page.liveGamesIntro, 'rich'],
        ['roulette-live-outro', page.liveGamesOutro, 'rich'],
        ['roulette-mobile-h2', page.mobileHeading],
        ['roulette-mobile-intro', page.mobileIntro, 'rich'],
        ['roulette-mobile-outro', page.mobileOutro, 'rich'],
        ['roulette-bonus-h2', page.bonusesHeading],
        ['roulette-bonus-intro', page.bonusesIntro, 'rich'],
        ['roulette-conclusion-h2', page.conclusionHeading],
        ['roulette-conclusion-body', page.conclusionBody, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function applyRouletteOperators(page, slugMap) {
    const listEl = document.getElementById('roulette-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => {
            const enriched = {
                ...item,
                casino: bonusHubEnrichedCasino(item?.casino, slugMap) || item?.casino,
            };
            return renderLiveCasinoOperatorRow(enriched, item.rank || i + 1, {
                highlightLabel: ROULETTE_PAGE_HIGHLIGHT_LABEL,
            });
        })
        .join('');
}

function renderRoulettePlayCell(casino, slugMap) {
    const attr = resolveSlotPlayCasino(casino, slugMap);
    const casinoName = attr.Name || attr.name || '—';
    const nameEsc = escapeHtml(casinoName);
    const visitHref = casinoVisitSiteHref(attr);
    const visitRel = casinoVisitSiteIsExternal(attr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<span class="slot-top-games__play-logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${nameEsc}"></span>`
        : `<span class="slot-top-games__play-text">${nameEsc}</span>`;
    if (visitHref && visitHref !== '#') {
        return `<a href="${escapeHtml(visitHref)}" class="slot-top-games__play-link"${visitRel} aria-label="Play at ${nameEsc}">${logoHtml}</a>`;
    }
    return logoHtml;
}

function renderRouletteGameRow(row, index, slugMap) {
    const rank = index + 1;
    const gameName = escapeHtml(row?.gameName || '—');
    const rouletteType = escapeHtml(row?.rouletteType || '—');
    const software = escapeHtml(row?.software || '—');
    const minBet = escapeHtml(row?.minBet || '—');
    const maxBet = escapeHtml(row?.maxBet || '—');
    const rtp = escapeHtml(row?.rtp || '—');
    const playCell = renderRoulettePlayCell(row?.playAtCasino, slugMap);
    return `<tr class="roulette-games__row">
        <td class="roulette-games__cell roulette-games__cell--game" data-label="Roulette game">
            <div class="slot-top-games__game">
                <span class="slot-top-games__rank" aria-hidden="true">${rank}.</span>
                <div class="slot-top-games__game-text">
                    <strong class="slot-top-games__title">${gameName}</strong>
                </div>
            </div>
        </td>
        <td class="roulette-games__cell" data-label="Roulette type"><span class="roulette-games__type">${rouletteType}</span></td>
        <td class="roulette-games__cell" data-label="Software"><span class="roulette-games__software">${software}</span></td>
        <td class="roulette-games__cell" data-label="Min bet"><span class="roulette-games__bet">${minBet}</span></td>
        <td class="roulette-games__cell" data-label="Max bet"><span class="roulette-games__bet">${maxBet}</span></td>
        <td class="roulette-games__cell" data-label="RTP"><span class="slot-top-games__rtp">${rtp}</span></td>
        <td class="roulette-games__cell roulette-games__cell--play" data-label="Play at">${playCell}</td>
    </tr>`;
}

function applyRouletteRngTable(page, slugMap) {
    const tbody = document.getElementById('roulette-rng-tbody');
    const rows = page?.rngGameRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row, i) => renderRouletteGameRow(row, i, slugMap)).join('');
}

function applyRouletteLiveTable(page, slugMap) {
    const tbody = document.getElementById('roulette-live-tbody');
    const rows = page?.liveGameRows;
    if (!tbody || !Array.isArray(rows) || rows.length === 0) return;
    tbody.innerHTML = rows.map((row, i) => renderRouletteGameRow(row, i, slugMap)).join('');
}

function rouletteFeaturedBonusHtml(block) {
    const override = block?.bonusOverride || {};
    const intro = String(override.intro || '').trim();
    const amount = String(override.amount || '').trim();
    const extra = String(override.extra || '').trim();
    const introHtml = intro
        ? `<span class="malaysia-operator-row__field-label">${escapeHtml(intro)}</span>`
        : '';
    const amountHtml = amount
        ? `<strong class="malaysia-operator-row__bonus-amount">${escapeHtml(amount)}</strong>`
        : '';
    const extraHtml = extra
        ? `<span class="malaysia-operator-row__bonus-extra">${escapeHtml(extra)}</span>`
        : '';
    if (!introHtml && !amountHtml && !extraHtml) {
        return '<strong class="malaysia-operator-row__bonus-amount">—</strong>';
    }
    return `${introHtml}${amountHtml}${extraHtml}`;
}

function renderRouletteFeaturedOperatorRow(block, attr, options = {}) {
    const highlightLabel = options.highlightLabel || 'Highlights';
    const ratingLabel = options.ratingLabel || 'Casino rating';
    const defaultCta = options.defaultCta || 'Play Here!';

    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

    const score =
        block?.bonusRatingOverride != null ? Number(block.bonusRatingOverride) : ratingScoreFromAttr(attr);
    const ratingText = Number.isFinite(score)
        ? formatRatingSlashFive(score)
        : '—';

    const bonusHtml = rouletteFeaturedBonusHtml(block);
    const features = Array.isArray(block?.features)
        ? block.features.map((f) => f.label).filter(Boolean)
        : [];
    const highlightText = escapeHtml(features.length ? features.join(' · ') : '—');

    const ctaText = escapeHtml(block?.ctaText || defaultCta);
    const visitHref = escapeHtml(block?.ctaLinkOverride || casinoVisitSiteHref(attr));
    const visitRel =
        casinoVisitSiteIsExternal(attr) || block?.ctaLinkOverride
            ? ' rel="nofollow noopener" target="_blank"'
            : ' rel="nofollow noopener"';

    return `<article class="malaysia-operator-row malaysia-operator-row--featured" role="listitem">
        <div class="malaysia-operator-row__rank" aria-hidden="true">★</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">${escapeHtml(ratingLabel)}</span>
                <span class="malaysia-operator-row__rating-score">${ratingText}</span>
            </div>
            <div class="malaysia-operator-row__bonus">${bonusHtml}</div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">${escapeHtml(highlightLabel)}</span>
                <p><span class="malaysia-operator-row__highlight-tag">${highlightText}</span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>${ctaText}</a>
        </div>
    </article>`;
}

function applyRouletteMobileFeatured(page, slugMap, casinoRows) {
    const container = document.getElementById('roulette-mobile-featured');
    const raw = Array.isArray(page?.featuredMobileCasinos)
        ? page.featuredMobileCasinos.find((item) => item?.casino)
        : null;
    const block = raw ? enrichHomepageFeaturedBlock(raw, casinoRows) : null;
    if (!container || !block?.casino) return;
    const attr = slotPageFeaturedToAttr(block, slugMap);
    container.innerHTML = renderRouletteFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Casino rating',
        highlightLabel: 'Mobile highlights',
        defaultCta: block.ctaText || 'Play Here!',
    });
}

function applyRouletteBonusFeatured(page, slugMap, casinoRows) {
    const container = document.getElementById('roulette-bonus-featured');
    const block = page?.featuredWelcomeBonus
        ? enrichHomepageFeaturedBlock(page.featuredWelcomeBonus, casinoRows)
        : null;
    if (!container || !block?.casino) return;
    const attr = slotPageFeaturedToAttr(block, slugMap);
    container.innerHTML = renderRouletteFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Casino rating',
        highlightLabel: 'Bonus highlights',
        defaultCta: block.ctaText || 'Play Here!',
    });
}

function applyRouletteBonusCategories(page) {
    const container = document.getElementById('roulette-bonus-categories');
    const categories = page?.bonusCategories;
    if (!container || !Array.isArray(categories) || categories.length === 0) return;
    container.innerHTML = categories
        .map((cat) => {
            const heading = escapeHtml(cat.heading || cat.title || '');
            const bodyHtml = richTextToHtml(cat.body) || '';
            return `<div class="roulette-bonus-category">
                <h3 class="roulette-bonus-category__heading">${heading}</h3>
                ${bodyHtml ? `<div class="roulette-bonus-category__body">${bodyHtml}</div>` : ''}
            </div>`;
        })
        .join('');
}

function applyRouletteConclusion(page) {
    const container = document.getElementById('roulette-conclusion-card');
    const block = page?.conclusionCta;
    if (!container || !block?.casino) return;
    container.innerHTML = renderMalaysiaConclusionCard(block);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function buildRoulettePageJsonLd(page, topCasinos) {
    const itemListEl = document.getElementById('roulette-ld-itemlist');
    if (itemListEl && Array.isArray(topCasinos) && topCasinos.length > 0) {
        const items = topCasinos.slice(0, 10).map((item, i) => {
            const attr = rouletteTopCasinoToAttr(item);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Online Roulette Casinos in Malaysia 2026',
            itemListElement: items,
        });
    }
    const webEl = document.getElementById('roulette-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Online Roulette Malaysia 2026',
            url: 'https://888reviews.com/roulette',
            description:
                page.metaDescription ||
                'Compare the best online roulette casinos in Malaysia for 2026: live and RNG tables, bonuses, and trusted operators.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initRoulettePage() {
    const listEl = document.getElementById('roulette-operator-list');
    if (!listEl) return;

    let page = null;
    let casinoRows = null;
    try {
        [page, casinoRows] = await Promise.all([fetchRoulettePage(), fetchBonusHubCasinos()]);
    } catch (e) {
        console.warn('Roulette page CMS fetch failed:', e);
    }

    applyRouletteListingMeta(page);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    if (!page) return;

    const slugMap = buildCasinoSlugMap(casinoRows);

    applyRouletteMeta(page);
    applyRouletteHero(page);
    applyRouletteSectionText(page);
    applyRouletteListingMeta(page);
    applyRouletteOperators(page, slugMap);
    applyRouletteRngTable(page, slugMap);
    applyRouletteLiveTable(page, slugMap);
    applyRouletteMobileFeatured(page, slugMap, casinoRows);
    applyRouletteBonusFeatured(page, slugMap, casinoRows);
    applyRouletteBonusCategories(page);
    applyRouletteConclusion(page);
    buildRoulettePageJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 mobile-page single type — nested component + relation populate. */
const MOBILE_PAGE_POPULATE =
    'populate[topCasinos][populate][casino][populate]=logo' +
    '&populate[topCasinos][populate][bonusOverride]=*' +
    '&populate[featuredMobileBonus][populate][casino][populate]=logo' +
    '&populate[featuredMobileBonus][populate][bonusOverride]=*' +
    '&populate[featuredMobileBonus][populate][features]=*' +
    '&populate[recommendedApps][populate][casino][populate]=logo' +
    '&populate[recommendedApps][populate][providerLogo]=true' +
    '&populate[bestAppFeatured][populate][casino][populate]=logo' +
    '&populate[bestAppFeatured][populate][bonusOverride]=*' +
    '&populate[bestAppFeatured][populate][features]=*' +
    '&populate[bestAppGuides][populate][links]=*' +
    '&populate[bestAppMoreGuides][populate]=*';

const MOBILE_PAGE_POPULATE_FALLBACK = 'populate=*';

async function fetchMobilePage() {
    try {
        let res = await fetch(`${API_URL}/api/mobile-page?${MOBILE_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Mobile page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/mobile-page?${MOBILE_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Mobile page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Mobile page CMS fetch failed:', e);
        return null;
    }
}

function mobileTopCasinoToAttr(item) {
    return liveCasinoTopCasinoToAttr(item);
}

function renderMobileOperatorRow(item, listPos) {
    const attr = mobileTopCasinoToAttr(item);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const ratingHtml = malaysiaOperatorRatingHtml(attr, listPos);
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const bonusIntro = escapeHtml(bonusParts.intro || 'Bonus amount');
    const bonusAmount = escapeHtml(bonusParts.amount);
    const bonusExtra = bonusParts.extra ? escapeHtml(bonusParts.extra) : '';
    const highlight = escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${bonusExtra}</span>`
        : '';
    return `<article class="malaysia-operator-row${malaysiaOperatorRowClass(listPos)}" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="Play at ${name}"><span class="sr-only">Play at ${name}</span></a>
        <div class="malaysia-operator-row__rank" aria-hidden="true">${listPos}</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">Rating</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${bonusIntro}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">Mobile app highlight</span>
                <p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${highlight}</span></span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>Play Here!</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function applyMobileMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Casino Apps Malaysia 2026 | Top Mobile Gambling Sites | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best casino apps in Malaysia for 2026: iOS and Android mobile casinos, MYR bonuses, and trusted payment methods. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyMobileHero(page) {
    if (!page) return;
    /* mobile-page has no dedicated hero fields; section headings applied in applyMobileSectionText */
}

function applyMobileListingMeta(page) {
    const bar = document.getElementById('mobile-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('mobile-listing-updated');
    const disclosureEl = document.getElementById('mobile-listing-disclosure');
    const trustEl = document.getElementById('mobile-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyMobileOperators(page) {
    const listEl = document.getElementById('mobile-operator-list');
    if (!listEl) return;
    const topCasinos = page?.topCasinos;
    if (!Array.isArray(topCasinos) || topCasinos.length === 0) return;
    const rows = topCasinos
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows.map((item, i) => renderMobileOperatorRow(item, item.rank || i + 1)).join('');
}

function applyMobileBonusFeatured(page) {
    const container = document.getElementById('mobile-bonus-featured');
    const block = page?.featuredMobileBonus;
    if (!container || !block?.casino) return;
    const attr = normalizeV5CasinoAttr(block.casino);
    container.innerHTML = renderHomepageFeaturedOperatorRow(block, attr, {
        ratingLabel: 'Casino rating',
        defaultCta: block.ctaText || 'Claim Bonus!',
        offerLabel: block.bonusOverride?.intro || 'Welcome bonus',
    });
}

function renderMobileRecommendedAppRow(row) {
    const casinoAttr = normalizeV5CasinoAttr(row?.casino) || {};
    const casinoName = escapeHtml(casinoAttr.Name || casinoAttr.name || 'Casino');
    const provider = escapeHtml(row?.providerName || '—');
    const game = escapeHtml(row?.gameName || '—');
    const linkText = escapeHtml(row?.secureLinkText || `Visit ${casinoName}`);
    const visitHref = escapeHtml(casinoVisitSiteHref(casinoAttr));
    const visitRel = casinoVisitSiteIsExternal(casinoAttr)
        ? ' rel="nofollow noopener" target="_blank"'
        : ' rel="nofollow noopener"';
    const providerLogoUrl = row?.providerLogo?.url ? sameOriginMediaProxyUrl(row.providerLogo.url) : '';
    const casinoLogoUrl = getLogoUrl(casinoAttr);
    const providerCell = providerLogoUrl
        ? `<span class="mobile-recommended-apps-table__logo mobile-recommended-apps-table__logo--provider" style="background-image:url('${escapeHtml(providerLogoUrl)}')" role="img" aria-label="${provider}">${provider}</span>`
        : `<span class="mobile-recommended-apps-table__provider-text">${provider}</span>`;
    const casinoCell = casinoLogoUrl
        ? `<span class="mobile-recommended-apps-table__logo mobile-recommended-apps-table__logo--casino" style="background-image:url('${escapeHtml(casinoLogoUrl)}')" role="img" aria-label="${casinoName}">${casinoName}</span>`
        : `<span class="mobile-recommended-apps-table__casino-text">${casinoName}</span>`;
    return `<tr>
        <td data-label="Software provider">${providerCell}</td>
        <td data-label="Must-play game"><span class="mobile-recommended-apps-table__game">${game}</span></td>
        <td data-label="Play at">${casinoCell}</td>
        <td data-label="Secure link"><a href="${visitHref}" class="mobile-recommended-apps-table__link"${visitRel}>${linkText}</a></td>
    </tr>`;
}

function applyMobileRecommendedApps(page) {
    const tbody = document.getElementById('mobile-recommended-apps-tbody');
    const apps = page?.recommendedApps;
    if (!tbody || !Array.isArray(apps) || apps.length === 0) return;
    tbody.innerHTML = apps.map((row) => renderMobileRecommendedAppRow(row)).join('');
}

function mobileMoreGuideIconUrl(guide) {
    const field = guide?.icon;
    if (!field) return '';
    const raw = field?.url || strapiMediaAbsoluteUrl(field);
    return raw ? logoImgSrcForDisplay(raw) : '';
}

function renderMobileMoreGuideLink(guide) {
    const iconUrl = mobileMoreGuideIconUrl(guide);
    const iconHtml = iconUrl
        ? `<img src="${escapeHtml(iconUrl)}" alt="" width="46" height="46" loading="eager" decoding="async">`
        : `<i data-lucide="book-open" aria-hidden="true"></i>`;
    const label = guide?.label || guide?.title || guide?.name || '';
    const url = guide?.url || guide?.link || guide?.href || '#';
    return `<a href="${escapeHtml(url)}" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">${iconHtml}</span>
                    <span class="live-casino-bottom-trio__guide-label">${escapeHtml(label)}</span>
                </a>`;
}

function renderMobileFeaturedHeadHtml(page, block) {
    const sub = block?.subheading || page?.bestAppSubheading;
    const main = block?.heading || page?.bestAppHeading;
    if (sub && main) {
        return `<p class="live-casino-bottom-trio__head"><span>${escapeHtml(sub)}</span><strong>${escapeHtml(main)}</strong></p>`;
    }
    if (main) {
        const parts = String(main)
            .split(/\s*\|\s*|\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        if (parts.length >= 2) {
            return `<p class="live-casino-bottom-trio__head"><span>${escapeHtml(parts[0])}</span><strong>${escapeHtml(parts.slice(1).join(' '))}</strong></p>`;
        }
        return `<p class="live-casino-bottom-trio__head"><strong>${escapeHtml(main)}</strong></p>`;
    }
    return `<p class="live-casino-bottom-trio__head"><span>2026&rsquo;s Best</span><strong>Malaysian Mobile App</strong></p>`;
}

function renderMobileBottomTrio(page) {
    const block = page?.bestAppFeatured;
    const guides = page?.bestAppGuides;
    const moreGuides = Array.isArray(page?.bestAppMoreGuides) ? page.bestAppMoreGuides : [];

    let featuredHtml = '';
    if (block?.casino) {
        const attr = normalizeV5CasinoAttr(block.casino);
        const name = escapeHtml(attr.Name || attr.name || 'Casino');
        const logoUrl = getLogoUrl(attr);
        const logoHtml = logoUrl
            ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="live-casino-bottom-trio__logo" width="120" height="48" loading="lazy">`
            : `<span class="live-casino-bottom-trio__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

        const score =
            block.bonusRatingOverride != null ? Number(block.bonusRatingOverride) : ratingScoreFromAttr(attr);
        const ratingText = Number.isFinite(score)
            ? formatRatingSlashFive(score)
            : formatRatingScoreLine(attr, '5/5').replace(' / ', '/');
        const starsHtml = Number.isFinite(score) ? renderStars(score) : renderStars(attr);

        const ctaText = escapeHtml(block.ctaText || 'Download App!');
        const visitHref = escapeHtml(block.ctaLinkOverride || casinoVisitSiteHref(attr));
        const visitRel =
            casinoVisitSiteIsExternal(attr) || block.ctaLinkOverride
                ? ' rel="nofollow noopener" target="_blank"'
                : ' rel="nofollow noopener"';

        featuredHtml = `<article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--featured">
            ${renderMobileFeaturedHeadHtml(page, block)}
            <div class="live-casino-bottom-trio__featured-row">
                <div class="live-casino-bottom-trio__logo-box">${logoHtml}</div>
                <div class="live-casino-bottom-trio__rating-box">
                    <span class="live-casino-bottom-trio__rating-label">Casino Rating</span>
                    <div class="live-casino-bottom-trio__stars">${starsHtml}</div>
                    <span class="live-casino-bottom-trio__rating-score">${escapeHtml(ratingText)}</span>
                </div>
            </div>
            <a href="${visitHref}" class="live-casino-bottom-trio__cta"${visitRel}>${ctaText}</a>
        </article>`;
    }

    const cmsFeatures = Array.isArray(block?.features)
        ? block.features.map((f) => f.label).filter(Boolean)
        : [];
    const defaultFeatures = [
        'Top-rated mobile slots',
        'Best mobile bonuses',
        'In-depth app reviews',
    ];
    const bulletLabels =
        cmsFeatures.length >= 3
            ? cmsFeatures.slice(0, 3)
            : cmsFeatures.length
              ? [...cmsFeatures, ...defaultFeatures].slice(0, 3)
              : defaultFeatures;
    const bulletsHtml = bulletLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('');

    const exploreHeading = guides?.heading
        ? `<p class="live-casino-bottom-trio__head"><span>${escapeHtml(guides.subheading || 'Malaysia')}</span><strong>${escapeHtml(guides.heading)}</strong></p>`
        : `<p class="live-casino-bottom-trio__head"><span>Malaysia</span><strong>Online Casino Guides</strong></p>`;
    const exploreCta = guides?.ctaLink
        ? `<a href="${escapeHtml(guides.ctaLink)}" class="live-casino-bottom-trio__outline-btn">${escapeHtml(guides.ctaText || 'See All Malaysian Online Casinos')}</a>`
        : `<a href="/" class="live-casino-bottom-trio__outline-btn">See All Malaysian Online Casinos</a>`;

    const exploreHtml = `<article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--explore">
            ${exploreHeading}
            <ul class="live-casino-bottom-trio__bullets" role="list">${bulletsHtml}</ul>
            ${exploreCta}
        </article>`;

    let guidesCardHtml = '';
    if (moreGuides.length > 0) {
        const guidesHtml = moreGuides.map((g) => renderMobileMoreGuideLink(g)).join('');
        guidesCardHtml = `<article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--guides">
            <p class="live-casino-bottom-trio__head"><strong>${escapeHtml(page?.bestAppMoreGuidesHeading || 'More Guides')}</strong></p>
            <div class="live-casino-bottom-trio__guides">${guidesHtml}</div>
        </article>`;
    }

    const cards = [featuredHtml, exploreHtml, guidesCardHtml].filter(Boolean);
    if (!cards.length) return '';
    return `<div class="live-casino-bottom-trio__grid">${cards.join('')}</div>`;
}

function applyMobileConclusion(page) {
    const container = document.getElementById('mobile-conclusion-trio');
    if (!container) return;
    const html = renderMobileBottomTrio(page);
    if (!html) return;
    container.innerHTML = html;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function applyMobileSectionText(page) {
    if (!page) return;
    const textMap = [
        ['mobile-operators-h2', page.topCasinosHeading],
        ['mobile-operators-intro', page.topCasinosIntro, 'rich'],
        ['mobile-bonus-h2', page.mobileBonusesHeading],
        ['mobile-bonus-intro', page.mobileBonusesIntro, 'rich'],
        ['mobile-recommended-apps-intro', page.recommendedAppsIntro, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
    if (page.recommendedAppsHeading) {
        const spotlights = document.getElementById('mobile-provider-spotlights');
        const h3 = spotlights?.querySelector('h3');
        if (h3) setHomepageText(h3, page.recommendedAppsHeading);
    }
}

function buildMobileJsonLd(page, operators) {
    const itemListEl = document.getElementById('mobile-ld-itemlist');
    if (itemListEl && Array.isArray(operators) && operators.length > 0) {
        const items = operators.slice(0, 10).map((item, i) => {
            const attr = mobileTopCasinoToAttr(item);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topCasinosHeading || 'Best Casino Apps in Malaysia 2026',
            itemListElement: items,
        });
    }
    const webEl = document.getElementById('mobile-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Casino Apps Malaysia 2026',
            url: 'https://888reviews.com/mobile',
            description:
                page.metaDescription ||
                'Compare the best casino apps in Malaysia for 2026: mobile bonuses, MYR payments, and trusted operators.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function initMobilePage() {
    const listEl = document.getElementById('mobile-operator-list');
    if (!listEl) return;

    const page = await fetchMobilePage();
    if (!page) return;

    applyMobileMeta(page);
    applyMobileHero(page);
    applyMobileSectionText(page);
    applyMobileListingMeta(page);
    applyMobileOperators(page);
    applyMobileBonusFeatured(page);
    applyMobileRecommendedApps(page);
    applyMobileConclusion(page);
    buildMobileJsonLd(page, page.topCasinos);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/** Strapi v5 bonus-page single type — nested component + relation populate. */
const BONUS_PAGE_POPULATE =
    'populate[topBonuses][populate][casino][populate]=logo' +
    '&populate[topBonuses][populate][bonusOverride]=*' +
    '&populate[playStylePicks][populate][casino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][casino][populate]=logo' +
    '&populate[featuredWelcomeBonus][populate][bonusOverride]=*' +
    '&populate[featuredWelcomeBonus][populate][features]=*' +
    '&populate[featuredSpecializedBonus][populate][casino][populate]=logo' +
    '&populate[featuredSpecializedBonus][populate][bonusOverride]=*' +
    '&populate[featuredSpecializedBonus][populate][features]=*' +
    '&populate[conclusionCta][populate][casino][populate]=logo' +
    '&populate[conclusionCta][populate][bonusOverride]=*' +
    '&populate[conclusionCta][populate][features]=*' +
    '&populate[conclusionCta][populate][certificationLogos]=true' +
    '&populate[conclusionGuides][populate]=*';

const BONUS_PAGE_POPULATE_FALLBACK = 'populate=*';

async function fetchBonusPage() {
    try {
        let res = await fetch(`${API_URL}/api/bonus-page?${BONUS_PAGE_POPULATE}`);
        let json = await res.json();
        if (!res.ok || !json?.data) {
            if (res.status === 400 || res.status === 500) {
                console.warn('Bonus page CMS populate failed, retrying shallow:', json?.error?.message || res.status);
                res = await fetch(`${API_URL}/api/bonus-page?${BONUS_PAGE_POPULATE_FALLBACK}`);
                json = await res.json();
            }
        }
        if (!res.ok || !json?.data) {
            console.warn('Bonus page CMS:', json?.error?.message || res.status);
            return null;
        }
        return json.data;
    } catch (e) {
        console.warn('Bonus page CMS fetch failed:', e);
        return null;
    }
}

/** Merge bonus-page nested casino with full /api/casinos row; never let null affiliateLink wipe a real URL. */
function mergeBonusHubCasinoAttr(partialCasino, enriched) {
    const base = normalizeV5CasinoAttr(partialCasino) || {};
    if (!enriched) return base;
    const merged = { ...enriched, ...base };
    const affiliate = casinoAffiliateUrl(base) || casinoAffiliateUrl(enriched);
    if (affiliate) {
        merged.AffiliateLink = affiliate;
        merged.affiliateLink = affiliate;
    }
    return merged;
}

function bonusHubEnrichedCasino(casino, slugMap) {
    if (!casino) return null;
    const slug = firstNonEmptyAttr(casino, ['slug', 'Slug']).toLowerCase();
    const enriched = slug && slugMap?.size ? slugMap.get(slug) : null;
    return mergeBonusHubCasinoAttr(casino, enriched);
}

function bonusTopBonusToAttr(item, slugMap) {
    const casino = bonusHubEnrichedCasino(item?.casino, slugMap) || {};
    const merged = { ...casino };
    if (item?.highlight) {
        merged.MalaysiaHighlight = item.highlight;
        merged.malaysiaHighlight = item.highlight;
    }
    const override = item?.bonusOverride;
    if (override) {
        if (override.intro) merged.malaysiaBonusIntro = override.intro;
        if (override.amount) merged.malaysiaBonusAmount = override.amount;
        if (override.extra) merged.malaysiaBonusExtra = override.extra;
        const line = [override.intro, override.amount, override.extra].filter(Boolean).join(' ');
        if (line) {
            merged.MalaysiaBonusLine = line;
            merged.malaysiaBonusLine = line;
        }
    }
    return applyTopCasinoItemRatingOverride(merged, item);
}

function renderBonusOperatorRow(item, listPos, slugMap) {
    const attr = bonusTopBonusToAttr(item, slugMap);
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="malaysia-operator-row__logo" width="192" height="104" loading="lazy">`
        : `<span class="malaysia-operator-row__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const ratingHtml = malaysiaOperatorRatingHtml(attr, listPos);
    const bonusParts = malaysiaBonusPartsDisplay(attr);
    const bonusIntro = escapeHtml(bonusParts.intro || 'Bonus amount');
    const bonusAmount = escapeHtml(bonusParts.amount);
    const bonusExtra = bonusParts.extra ? escapeHtml(bonusParts.extra) : '';
    const highlight = escapeHtml(malaysiaHighlightDisplay(attr) || '—');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitLabel = escapeHtml(casinoVisitSiteLabel(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const bonusExtraHtml = bonusExtra
        ? `<span class="malaysia-operator-row__bonus-extra">${bonusExtra}</span>`
        : '';
    return `<article class="malaysia-operator-row${malaysiaOperatorRowClass(listPos)}" role="listitem">
        <a href="${visitHref}" class="malaysia-operator-row__overlay-link"${visitRel} aria-label="Claim bonus at ${name}"><span class="sr-only">Claim bonus at ${name}</span></a>
        <div class="malaysia-operator-row__rank" aria-hidden="true">${listPos}</div>
        <div class="malaysia-operator-row__logo-wrap">${logoHtml}<h3 class="sr-only">${name}</h3></div>
        <div class="malaysia-operator-row__stats">
            <div class="malaysia-operator-row__rating">
                <span class="malaysia-operator-row__field-label">Rating</span>
                ${ratingHtml}
            </div>
            <div class="malaysia-operator-row__bonus">
                <span class="malaysia-operator-row__field-label">${bonusIntro}</span>
                <strong class="malaysia-operator-row__bonus-amount">${bonusAmount}</strong>${bonusExtraHtml}
            </div>
            <div class="malaysia-operator-row__highlight">
                <span class="malaysia-operator-row__field-label">Bonus highlight</span>
                <p><span class="malaysia-operator-row__highlight-tag"><i data-lucide="check-circle-2" class="malaysia-operator-row__check" aria-hidden="true"></i><span>${highlight}</span></span></p>
            </div>
        </div>
        <div class="malaysia-operator-row__cta">
            <a href="${visitHref}" class="btn-play-here"${visitRel}>Claim Bonus!</a>
            <a href="${visitHref}" class="malaysia-operator-row__visit-link"${visitRel}><i data-lucide="globe" aria-hidden="true"></i><span>${visitLabel}</span></a>
        </div>
    </article>`;
}

function renderBonusPlayStyleRow(pick, slugMap, rowIndex = 0) {
    const attr = bonusHubEnrichedCasino(pick?.casino, slugMap) || {};
    const name = escapeHtml(attr.Name || attr.name || '—');
    const logoUrl = getLogoUrl(attr);
    const pickHtml = logoUrl
        ? `<span class="bonus-playstyle__logo" style="background-image:url('${escapeHtml(logoUrl)}')" role="img" aria-label="${name}">${name}</span>`
        : `<span class="bonus-playstyle__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;
    const categoryIcon = pick?.categoryIcon
        ? `<span class="bonus-playstyle__icon" aria-hidden="true">${escapeHtml(pick.categoryIcon)}</span>`
        : '';
    const category = escapeHtml(pick?.category || '—');
    const why = escapeHtml(pick?.whyItWins || '—');
    const details = escapeHtml(pick?.bonusDetails || '—');
    const ctaText = escapeHtml(pick?.ctaText || 'Claim Bonus');
    const visitHref = escapeHtml(casinoVisitSiteHref(attr));
    const visitRel = casinoVisitSiteIsExternal(attr) ? ' rel="nofollow noopener" target="_blank"' : ' rel="nofollow noopener"';
    const rowClass = rowIndex === 0 ? ' bonus-playstyle__row--top' : '';
    const iconWrap = categoryIcon
        ? `<span class="bonus-playstyle__icon-wrap">${categoryIcon}</span>`
        : '';
    return `<tr class="bonus-playstyle__row${rowClass}">
        <td data-label="Category">
            <span class="bonus-playstyle__category">${iconWrap}<span class="bonus-playstyle__category-label">${category}</span></span>
        </td>
        <td data-label="Our top pick">
            <span class="bonus-playstyle__pick">${pickHtml}</span>
        </td>
        <td data-label="Why it wins"><p class="bonus-playstyle__why">${why}</p></td>
        <td data-label="Bonus details"><span class="bonus-playstyle__details">${details}</span></td>
        <td data-label="Claim offer" class="bonus-playstyle__cta-cell">
            <a href="${visitHref}" class="bonus-playstyle__cta"${visitRel}>${ctaText}</a>
        </td>
    </tr>`;
}

function applyBonusHubMeta(page) {
    if (!page) return;
    const title =
        page.metaTitle || 'Best Casino Bonuses in Malaysia 2026 | Top Welcome Deals & Promos | 888reviews';
    const desc =
        page.metaDescription ||
        'Compare the best casino bonuses in Malaysia for 2026: welcome offers, free spins, and fair terms from licensed operators. Independent rankings. 18+ only.';
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    if (ogDesc) ogDesc.setAttribute('content', desc);
    if (twTitle) twTitle.setAttribute('content', title);
    if (twDesc) twDesc.setAttribute('content', desc);
}

function applyBonusHubListingMeta(page) {
    const bar = document.getElementById('bonus-listing-meta');
    if (!bar) return;
    const updatedEl = document.getElementById('bonus-listing-updated');
    const disclosureEl = document.getElementById('bonus-listing-disclosure');
    const trustEl = document.getElementById('bonus-listing-trust');
    const updatedRaw = page?.lastUpdated || page?.updatedAt || page?.publishedAt || '';
    if (updatedEl) {
        const formatted = formatListingUpdatedDate(updatedRaw);
        if (formatted) {
            updatedEl.textContent = formatted;
            updatedEl.dateTime = String(updatedRaw).slice(0, 10);
        }
    }
    const disclosureText = page?.advertiserDisclosure || page?.disclosureText;
    if (disclosureEl && disclosureText) {
        const linkMatch = String(disclosureText).match(/\|\s*Advertiser Disclosure/i);
        if (linkMatch) {
            const body = String(disclosureText).replace(/\|\s*Advertiser Disclosure/i, '').trim();
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(body)}</span><span class="malaysia-listing-meta__disclosure-sep" aria-hidden="true"> | </span><a href="/about" class="malaysia-listing-meta__disclosure-link">Advertiser Disclosure</a>`;
        } else {
            disclosureEl.innerHTML = `<span class="malaysia-listing-meta__disclosure-text">${escapeHtml(String(disclosureText))}</span>`;
        }
    }
    if (trustEl) {
        const apiBadges = page?.listingTrustBadges || page?.trustBadges;
        trustEl.innerHTML = renderMalaysiaListingTrustBadges(apiBadges);
    }
}

function applyBonusHubSectionText(page) {
    if (!page) return;
    const textMap = [
        ['bonus-operators-h2', page.topBonusesHeading],
        ['bonus-operators-intro', page.topBonusesIntro, 'rich'],
        ['bonus-operators-outro', page.topBonusesOutro, 'rich'],
        ['bonus-playstyle-h2', page.playStyleHeading],
        ['bonus-playstyle-intro', page.playStyleIntro, 'rich'],
        ['bonus-types-h2', page.typesHeading],
        ['bonus-types-intro', page.typesIntro, 'rich'],
        ['bonus-specialized-h2', page.specializedHeading],
        ['bonus-specialized-intro', page.specializedIntro, 'rich'],
        ['bonus-conclusion-h2', page.conclusionHeading],
        ['bonus-conclusion-body', page.conclusionBody, 'rich'],
    ];
    for (const [id, value, mode] of textMap) {
        if (value == null || value === '') continue;
        setHomepageText(document.getElementById(id), value, mode || 'text');
    }
}

function applyBonusHubOperators(page, slugMap) {
    const listEl = document.getElementById('bonus-page-operator-list');
    if (!listEl) return;
    const topBonuses = page?.topBonuses;
    if (!Array.isArray(topBonuses) || topBonuses.length === 0) return;
    const rows = topBonuses
        .slice()
        .sort((a, b) => (a.rank || 0) - (b.rank || 0))
        .slice(0, 10);
    listEl.innerHTML = rows
        .map((item, i) => renderBonusOperatorRow(item, item.rank || i + 1, slugMap))
        .join('');
}

function applyBonusHubPlayStyle(page, slugMap) {
    const tbody = document.getElementById('bonus-playstyle-tbody');
    const picks = page?.playStylePicks;
    if (!tbody || !Array.isArray(picks) || picks.length === 0) return;
    tbody.innerHTML = picks.map((pick, i) => renderBonusPlayStyleRow(pick, slugMap, i)).join('');
}

function applyBonusHubFeaturedBlocks(page, casinoRows) {
    const slugMap = buildCasinoSlugMap(casinoRows);
    const welcomeEl = document.getElementById('bonus-featured-welcome');
    const welcomeBlock = enrichHomepageFeaturedBlock(page?.featuredWelcomeBonus, casinoRows);
    if (welcomeEl && welcomeBlock?.casino) {
        const attr = bonusHubEnrichedCasino(welcomeBlock.casino, slugMap);
        welcomeEl.innerHTML = renderHomepageFeaturedOperatorRow(welcomeBlock, attr, {
            ratingLabel: 'Casino rating',
            defaultCta: welcomeBlock.ctaText || 'Claim bonus',
            offerLabel: welcomeBlock.bonusOverride?.intro || 'Welcome bonus',
        });
    }
    const specializedEl = document.getElementById('bonus-featured-specialized');
    const specializedBlock = enrichHomepageFeaturedBlock(page?.featuredSpecializedBonus, casinoRows);
    if (specializedEl && specializedBlock?.casino) {
        const attr = bonusHubEnrichedCasino(specializedBlock.casino, slugMap);
        specializedEl.innerHTML = renderHomepageFeaturedOperatorRow(specializedBlock, attr, {
            ratingLabel: 'Casino rating',
            defaultCta: specializedBlock.ctaText || 'Claim bonus',
            offerLabel: specializedBlock.bonusOverride?.intro || 'Specialized bonus',
        });
    }
}

function renderBonusBottomTrio(page, slugMap, options = {}) {
    const block = page?.conclusionCta;
    if (!block?.casino) return '';
    const featuredHeadStrong = options.featuredHeadStrong || 'Malaysian Casino Bonus';
    const attr = bonusHubEnrichedCasino(block.casino, slugMap) || {};
    const name = escapeHtml(attr.Name || attr.name || 'Casino');
    const logoUrl = getLogoUrl(attr);
    const logoHtml = logoUrl
        ? `<img src="${escapeHtml(logoUrl)}" alt="${name}" class="live-casino-bottom-trio__logo" width="120" height="48" loading="lazy">`
        : `<span class="live-casino-bottom-trio__logo-fallback" aria-hidden="true">${escapeHtml((name.charAt(0) || 'C').toUpperCase())}</span>`;

    const score =
        block.ratingOverride != null ? Number(block.ratingOverride) : ratingScoreFromAttr(attr);
    const ratingText = Number.isFinite(score)
        ? formatRatingSlashFive(score)
        : formatRatingScoreLine(attr, '5/5').replace(' / ', '/');
    const starsHtml = Number.isFinite(score) ? renderStars(score) : renderStars(attr);

    const ctaText = escapeHtml(block.ctaText || 'Visit Site!');
    const visitHref = escapeHtml(block.ctaLinkOverride || casinoVisitSiteHref(attr));
    const visitRel =
        casinoVisitSiteIsExternal(attr) || block.ctaLinkOverride
            ? ' rel="nofollow noopener" target="_blank"'
            : ' rel="nofollow noopener"';

    const cmsFeatures = Array.isArray(block.features)
        ? block.features.map((f) => f.label).filter(Boolean)
        : [];
    const defaultFeatures = [
        'Top-rated slot sites',
        'Exclusive welcome bonuses',
        'Complete operator reviews',
    ];
    const bulletLabels =
        cmsFeatures.length >= 3
            ? cmsFeatures.slice(0, 3)
            : cmsFeatures.length
              ? [...cmsFeatures, ...defaultFeatures].slice(0, 3)
              : defaultFeatures;
    const bulletsHtml = bulletLabels.map((label) => `<li>${escapeHtml(label)}</li>`).join('');

    const exploreHeading = page?.conclusionExplore?.heading || page?.conclusionExplore?.title;
    const exploreSub = page?.conclusionExplore?.subheading || page?.conclusionExplore?.subtitle;
    const exploreHeadHtml = exploreHeading
        ? `<p class="live-casino-bottom-trio__head"><span>${escapeHtml(exploreSub || 'Malaysia')}</span><strong>${escapeHtml(exploreHeading)}</strong></p>`
        : `<p class="live-casino-bottom-trio__head"><span>Malaysia</span><strong>Explore All Casino Types</strong></p>`;
    const exploreLink = page?.conclusionExplore?.linkUrl || page?.conclusionExplore?.url || '/';
    const exploreCta = page?.conclusionExplore?.ctaText || 'See All Malaysian Online Casinos';

    const guidesHeading = page?.conclusionGuidesHeading || 'More Guides';
    const guides = Array.isArray(page?.conclusionGuides) ? page.conclusionGuides : [];
    const guidesHtml = guides.length
        ? guides
              .map((g) => {
                  const iconUrl = g.icon?.url ? logoImgSrcForDisplay(g.icon.url) : '';
                  const iconInner = iconUrl
                      ? `<img src="${escapeHtml(iconUrl)}" alt="" width="46" height="46" loading="lazy">`
                      : `<i data-lucide="book-open" aria-hidden="true"></i>`;
                  return `<a href="${escapeHtml(g.url || '#')}" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">${iconInner}</span>
                    <span class="live-casino-bottom-trio__guide-label">${escapeHtml(g.label || '')}</span>
                </a>`;
              })
              .join('')
        : `<a href="/roulette" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">
                        <img src="/assets/img/icon/roulette-wheel-icon.webp" alt="" width="46" height="46" loading="lazy">
                    </span>
                    <span class="live-casino-bottom-trio__guide-label">Online Roulette</span>
                </a>
                <a href="/baccarat" class="live-casino-bottom-trio__guide">
                    <span class="live-casino-bottom-trio__guide-icon" aria-hidden="true">
                        <img src="/assets/img/icon/cards-icon.webp" alt="" width="46" height="46" loading="lazy">
                    </span>
                    <span class="live-casino-bottom-trio__guide-label">Online Baccarat</span>
                </a>`;

    return `<div class="live-casino-bottom-trio__grid">
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--featured">
            <p class="live-casino-bottom-trio__head"><span>2026&rsquo;s Best</span><strong>${escapeHtml(featuredHeadStrong)}</strong></p>
            <div class="live-casino-bottom-trio__featured-row">
                <div class="live-casino-bottom-trio__logo-box">${logoHtml}</div>
                <div class="live-casino-bottom-trio__rating-box">
                    <span class="live-casino-bottom-trio__rating-label">Casino Rating</span>
                    <div class="live-casino-bottom-trio__stars">${starsHtml}</div>
                    <span class="live-casino-bottom-trio__rating-score">${escapeHtml(ratingText)}</span>
                </div>
            </div>
            <a href="${visitHref}" class="live-casino-bottom-trio__cta"${visitRel}>${ctaText}</a>
        </article>
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--explore">
            ${exploreHeadHtml}
            <ul class="live-casino-bottom-trio__bullets" role="list">${bulletsHtml}</ul>
            <a href="${escapeHtml(exploreLink)}" class="live-casino-bottom-trio__outline-btn">${escapeHtml(exploreCta)}</a>
        </article>
        <article class="live-casino-bottom-trio__card live-casino-bottom-trio__card--guides">
            <p class="live-casino-bottom-trio__head"><strong>${escapeHtml(guidesHeading)}</strong></p>
            <div class="live-casino-bottom-trio__guides">${guidesHtml}</div>
        </article>
    </div>`;
}

function applyBonusHubConclusion(page, slugMap) {
    const container = document.getElementById('bonus-bottom-trio');
    if (!container || !page?.conclusionCta?.casino) return;
    container.innerHTML = renderBonusBottomTrio(page, slugMap);
    if (typeof lucide !== 'undefined') lucide.createIcons({ root: container });
}

function buildBonusHubJsonLd(page, operators, slugMap) {
    const itemListEl = document.getElementById('bonus-hub-ld-itemlist');
    if (itemListEl && Array.isArray(operators) && operators.length > 0) {
        const items = operators.slice(0, 10).map((item, i) => {
            const attr = bonusTopBonusToAttr(item, slugMap);
            return {
                '@type': 'ListItem',
                position: item.rank || i + 1,
                name: attr.Name || attr.name || 'Casino',
            };
        });
        itemListEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: page?.topBonusesHeading || 'Best Casino Bonuses in Malaysia 2026',
            itemListElement: items,
        });
    }
    const faqEl = document.getElementById('bonus-hub-ld-faq');
    const accordion = document.getElementById('bonus-faq-accordion');
    if (faqEl && accordion) {
        const questions = accordion.querySelectorAll('.accordion-item');
        const mainEntity = [...questions].map((item) => {
            const q = item.querySelector('.accordion-title')?.textContent?.trim() || '';
            const a = item.querySelector('.accordion-inner p')?.textContent?.trim() || '';
            return {
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
            };
        }).filter((f) => f.name);
        if (mainEntity.length) {
            faqEl.textContent = JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity,
            });
        }
    }
    const webEl = document.getElementById('bonus-hub-ld-webpage');
    if (webEl && page) {
        webEl.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: page.metaTitle || 'Best Casino Bonuses in Malaysia 2026',
            url: 'https://888reviews.com/bonus',
            description:
                page.metaDescription ||
                'Compare the best casino bonuses in Malaysia for 2026: welcome offers, free spins, and fair terms from licensed operators.',
            inLanguage: 'en-US',
            isPartOf: { '@type': 'WebSite', name: '888reviews', url: 'https://888reviews.com/' },
        });
    }
}

async function fetchBonusHubCasinos() {
    const attempts = [
        'populate=*&sort=rank:asc&pagination[limit]=100',
        'populate=*&sort=Rank:asc&pagination[limit]=100',
        'populate=*&pagination[limit]=100',
    ];
    for (const qs of attempts) {
        try {
            const res = await fetchCasinosWithBonusPopulate(qs);
            const json = await res.json();
            if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
                return json.data;
            }
        } catch (e) {
            console.warn('Bonus hub casino fetch attempt failed:', e);
        }
    }
    return null;
}

async function initBonusHubPage() {
    const listEl = document.getElementById('bonus-page-operator-list');
    if (!listEl) return;

    const [page, casinoRows] = await Promise.all([fetchBonusPage(), fetchBonusHubCasinos()]);
    if (!page) return;

    const slugMap = buildCasinoSlugMap(casinoRows);

    applyBonusHubMeta(page);
    applyBonusHubSectionText(page);
    applyBonusHubListingMeta(page);
    applyBonusHubOperators(page, slugMap);
    applyBonusHubPlayStyle(page, slugMap);
    applyBonusHubFeaturedBlocks(page, casinoRows);
    applyBonusHubConclusion(page, slugMap);
    buildBonusHubJsonLd(page, page.topBonuses, slugMap);

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function fetchMalaysiaHubCasinos() {
    /** v5 schema uses `rank`; legacy Malaysia fields (Markets, MalaysiaRank) may 400 if absent. */
    const attempts = [
        'populate=*&sort=rank:asc&pagination[limit]=11',
        'populate=*&sort=Rank:asc&pagination[limit]=11',
        'populate=*&sort=MalaysiaRank:asc&pagination[limit]=11&filters[Markets][$containsi]=malaysia',
        'populate=*&sort=Rank:asc&pagination[limit]=11&filters[Markets][$containsi]=malaysia',
    ];
    for (const qs of attempts) {
        try {
            const res = await fetchCasinosWithBonusPopulate(qs);
            const json = await res.json();
            if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
                return json.data;
            }
        } catch (e) {
            console.warn('Malaysia hub fetch attempt failed:', e);
        }
    }
    return null;
}

async function initMalaysiaHubPage() {
    const listEl = document.getElementById('malaysia-operator-list');
    const tbody = document.getElementById('malaysia-casino-table-body');
    const hasBonusSection = document.getElementById('malaysia-bonus-featured');
    const hasLiveSection = document.getElementById('malaysia-live-featured');
    const hasFeaturedSlots = document.getElementById('malaysia-featured-slots');
    if (!listEl && !tbody && !hasBonusSection && !hasLiveSection && !hasFeaturedSlots) return;

    const [homepage, casinoRows] = await Promise.all([fetchHomepage(), fetchMalaysiaHubCasinos()]);

    if (homepage) {
        applyHomepageFromCms(homepage);
        applyHomepageFeaturedSlots(homepage, casinoRows);
        applyHomepageBonus(homepage, casinoRows);
        applyHomepageLiveDealer(homepage, casinoRows);
        applyHomepageOfficialList(homepage, casinoRows);
        if (homepage.conclusionCta) {
            applyHomepageConclusionCta(
                enrichHomepageFeaturedBlock(homepage.conclusionCta, casinoRows),
            );
        }
    }
    applyHomepageListingMetaBar(homepage);

    const homepageRows = homepage ? buildHomepageOperatorRows(homepage, casinoRows) : null;
    const rows = homepageRows || casinoRows;
    if (!rows || rows.length === 0) return;

    if (listEl) {
        listEl.innerHTML = rows.map((c, i) => renderMalaysiaOperatorCard(c, i + 1)).join('');
    } else {
        tbody.innerHTML = rows.map((c, i) => renderMalaysiaTableRow(c, i + 1)).join('');
    }

    const summaryRows = casinoRows || rows;
    if (!homepage?.conclusionCta) {
        updateMalaysiaConclusionFromAttr(findMalaysiaEditorsPick(summaryRows));
    }
    updateMalaysiaSummaryTable(summaryRows);
    if (!homepage?.homepageBonus && !homepage?.liveDealerFeatured) {
        updateMalaysiaFeaturedTables(summaryRows);
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function appendHubListingFilters(qs, container) {
    if (!container) return { qs, hasHubFilters: false };
    let out = qs;
    let hasHubFilters = false;
    const hubMarket = container.dataset.hubMarket;
    const hubPayment = container.dataset.hubPayment;
    const hubLive = container.dataset.hubLive;
    const hubGame = container.dataset.hubGame;
    const hubMobile = container.dataset.hubMobile;
    if (hubMarket) {
        out += `&filters[Markets][$containsi]=${encodeURIComponent(hubMarket)}`;
        hasHubFilters = true;
    }
    if (hubPayment) {
        out += `&filters[MalaysiaPaymentTags][$containsi]=${encodeURIComponent(hubPayment)}`;
        hasHubFilters = true;
    }
    if (hubLive === 'true') {
        out += '&filters[HasLiveCasino][$eq]=true';
        hasHubFilters = true;
    }
    if (hubGame) {
        out += `&filters[LiveGameTypes][$containsi]=${encodeURIComponent(hubGame)}`;
        hasHubFilters = true;
    }
    if (hubMobile) {
        out += `&filters[MobilePlatform][$containsi]=${encodeURIComponent(hubMobile)}`;
        hasHubFilters = true;
    }
    return { qs: out, hasHubFilters };
}

// ============================================================
// Casinos Listing Page: Dynamic Strapi Integration
// Only runs when the #casinos-listing-container element exists
// ============================================================
function initCasinosListingPage() {
    const container = document.getElementById('casinos-listing-container');
    if (!container) return; // Not on the casinos listing page, bail out
    container.innerHTML = skeletonGridHtml('listing-card', 5);

    // --- State ---
    let currentPage = 1;
    let currentSort = 'Rank:asc';
    let currentPageSize = 5;
    let filterTierOne = false;
    /** Avoids first-paint jump; after that, scroll listing into view after each fetch. */
    let casinosListingFirstFetch = true;

    function renderCard(c, listPos) {
        const attr = attrFromCasinoEntry(c);
        const logoUrl = getLogoUrl(attr);

        const tierBadge = attr.IsTierOne
            ? `<span class="badge badge-light badge-sm">TIER ONE</span>` : '';

        const bonusAmt = casinoBonusAmountDisplay(attr);
        const bonus = bonusAmt
            ? `<div class="stat-col stat-col--bonus"><span class="stat-label-row"><i data-lucide="gift" class="stat-label-icon" aria-hidden="true"></i><span class="stat-label">Casino bonus</span></span><span class="stat-value primary">${escapeHtml(bonusAmt)}</span></div>`
            : `<div class="stat-col stat-col--bonus stat-col--empty"><span class="stat-label-row"><i data-lucide="gift" class="stat-label-icon" aria-hidden="true"></i><span class="stat-label">Casino bonus</span></span><span class="stat-value stat-value--muted">No offer on file</span></div>`;
        const payoutSpeed = casinoPayoutSpeedDisplay(attr);
        const gameCount = casinoGameCountDisplay(attr);
        const payout = payoutSpeed
            ? `<div class="stat-col stat-col--payout"><span class="stat-label-row"><i data-lucide="zap" class="stat-label-icon" aria-hidden="true"></i><span class="stat-label">Payout speed</span></span><span class="stat-value">${escapeHtml(payoutSpeed)}</span></div>`
            : '';
        const games = gameCount
            ? `<div class="stat-col stat-col--games"><span class="stat-label-row"><i data-lucide="layout-grid" class="stat-label-icon" aria-hidden="true"></i><span class="stat-label">Games count</span></span><span class="stat-value">${escapeHtml(gameCount)}</span></div>`
            : '';

        const reviewLink = casinoReviewPath(attr.Slug);
        const visitHref = escapeHtml(casinoVisitSiteHref(attr));
        const visitRel = casinoVisitSiteIsExternal(attr)
            ? ' target="_blank" rel="noopener noreferrer"'
            : '';

        return `
        <article class="listing-card">
            <div class="listing-card__review-panel">
                ${renderReviewRankPanelHtml({
                    listPos,
                    attr,
                    logoUrl,
                    isVerified: !!attr.IsTierOne,
                })}
            </div>
            <div class="card-content-area">
                <div class="card-top">
                    <div class="card-title-row">
                        <h3 class="casino-name">${attr.Name || ''}</h3>
                        ${tierBadge}
                    </div>
                    <div class="rating">
                        ${renderStars(attr)}
                        <span>${formatRatingScoreLine(attr)}</span>
                    </div>
                </div>
                <div class="card-stats">
                    ${bonus}${payout}${games}
                </div>
            </div>
            <div class="card-action-area">
                <a href="${visitHref}" class="btn btn-primary btn-block listing-visit-btn"${visitRel}><i data-lucide="external-link" aria-hidden="true"></i><span>VISIT SITE</span></a>
                <a href="${reviewLink}" class="read-review-link"><i data-lucide="arrow-right" aria-hidden="true"></i><span>READ REVIEW</span></a>
            </div>
        </article>`;
    }

    function renderPagination(meta) {
        const { page, pageCount, total } = meta.pagination;
        const paginationEl = document.getElementById('pagination-container');
        const pageNumbersEl = document.getElementById('page-numbers');
        const countEl = document.getElementById('results-count');

        if (countEl) countEl.textContent = total;

        if (!paginationEl) return;

        if (pageCount <= 1) {
            paginationEl.style.display = 'none';
            return;
        }
        paginationEl.style.display = 'flex';

        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        if (prevBtn) prevBtn.classList.toggle('disabled', page <= 1);
        if (nextBtn) nextBtn.classList.toggle('disabled', page >= pageCount);

        // Smart page numbers with ellipsis
        const range = [];
        for (let i = 1; i <= pageCount; i++) {
            if (i === 1 || i === pageCount || (i >= page - 1 && i <= page + 1)) range.push(i);
        }
        let numbersHtml = '';
        let prev = null;
        range.forEach(p => {
            if (prev !== null && p - prev > 1) numbersHtml += `<span class="ellipsis">…</span>`;
            numbersHtml += `<a href="#" class="page-num ${p === page ? 'active' : ''}" data-page="${p}">${p}</a>`;
            prev = p;
        });
        if (pageNumbersEl) {
            pageNumbersEl.innerHTML = numbersHtml;
            pageNumbersEl.querySelectorAll('.page-num').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    currentPage = parseInt(btn.dataset.page);
                    fetchAndRender({ scrollListing: true });
                });
            });
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    async function fetchAndRender(opts = {}) {
        const scrollListing = opts.scrollListing === true;
        const skipScroll = opts.skipScroll === true;
        if (scrollListing && !casinosListingFirstFetch && !skipScroll) {
            scrollListingAnchorIntoView('.listing-main');
        }

        const holdHeight = Math.max(container.offsetHeight, 200);
        container.style.minHeight = `${holdHeight}px`;
        container.innerHTML = skeletonGridHtml('listing-card', currentPageSize);

        let qs = `populate=*&sort=${currentSort}&pagination[page]=${currentPage}&pagination[pageSize]=${currentPageSize}`;
        if (filterTierOne) qs += `&filters[IsTierOne][$eq]=true`;
        const hubFilterResult = appendHubListingFilters(qs, container);
        qs = hubFilterResult.qs;

        const clearListingMinHeight = () => {
            container.style.minHeight = '';
        };

        async function fetchListing(queryString) {
            const res = await fetchCasinosWithBonusPopulate(queryString);
            const json = await res.json();
            return { res, json };
        }

        try {
            let { res, json } = await fetchListing(qs);
            if (!res.ok && hubFilterResult.hasHubFilters) {
                let fallbackQs = `populate=*&sort=${currentSort}&pagination[page]=${currentPage}&pagination[pageSize]=${currentPageSize}`;
                if (filterTierOne) fallbackQs += `&filters[IsTierOne][$eq]=true`;
                ({ res, json } = await fetchListing(fallbackQs));
            }
            if (!res.ok) {
                clearListingMinHeight();
                container.innerHTML = `<p style="text-align:center; padding: 60px; color: #64748b;">${apiErrorMessage(res.status, json, 'casinos')}</p>`;
                casinosListingFirstFetch = false;
                return;
            }
            const { data, meta } = json;

            if (!data || data.length === 0) {
                clearListingMinHeight();
                container.innerHTML = `<p style="text-align:center; padding: 60px; color: #64748b;">No casinos match your current filters.</p>`;
                const paginationEl = document.getElementById('pagination-container');
                if (paginationEl) paginationEl.style.display = 'none';
                const countEl = document.getElementById('results-count');
                if (countEl) countEl.textContent = '0';
                casinosListingFirstFetch = false;
                return;
            }

            clearListingMinHeight();
            const baseRank = (currentPage - 1) * currentPageSize;
            container.innerHTML = data.map((c, i) => renderCard(c, baseRank + i + 1)).join('');
            renderPagination(meta);
            if (typeof lucide !== 'undefined') lucide.createIcons();

            casinosListingFirstFetch = false;

        } catch (e) {
            console.error(e);
            clearListingMinHeight();
            container.innerHTML = `<p style="text-align:center; padding: 60px; color: #64748b;">${contentEmptyMessage('casinos')}</p>`;
            casinosListingFirstFetch = false;
        }
    }

    // --- Wire up sidebar filter controls ---
    const filterTierOneEl = document.getElementById('filter-tier-one');
    if (filterTierOneEl) {
        filterTierOneEl.addEventListener('change', (e) => {
            filterTierOne = e.target.checked;
            currentPage = 1;
            fetchAndRender();
        });
    }

    document.querySelectorAll('input[name="sort"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentSort = e.target.value;
            currentPage = 1;
            fetchAndRender();
        });
    });

    document.querySelectorAll('input[name="pageSize"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            currentPageSize = parseInt(e.target.value);
            currentPage = 1;
            fetchAndRender();
        });
    });

    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.preventDefault(); if (currentPage > 1) { currentPage--; fetchAndRender({ scrollListing: true }); } });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.preventDefault(); currentPage++; fetchAndRender({ scrollListing: true }); });

    initCasinosListingFilterDrawer();

    // Initial fetch
    fetchAndRender();
}

// ============================================================
// Casino Review Page: Dynamic Strapi Integration
// ============================================================

function normalizeCasinoRepeatable(field) {
    if (field == null) return [];
    if (Array.isArray(field)) return field;
    if (field.data && Array.isArray(field.data)) return field.data;
    return [];
}

/** Converts the /5 player rating average and total into the hero "Player Rating" chip. */
function bindPlayerRatingHeroListener() {
    if (bindPlayerRatingHeroListener._bound) return;
    bindPlayerRatingHeroListener._bound = true;
    document.addEventListener('player-reviews:summary', (ev) => {
        const d = (ev && ev.detail) || {};
        const avg = Number(d.avg);
        const total = Number(d.total) || 0;
        const scoreEl = document.getElementById('cr-player-score');
        const linkEl = document.getElementById('cr-player-reviews-link');
        if (scoreEl) {
            scoreEl.textContent = total > 0 && Number.isFinite(avg) ? formatRatingNumber(avg) : '-';
        }
        if (linkEl) {
            linkEl.textContent = `${total} review${total === 1 ? '' : 's'}`;
        }
        const pvScoreEl = document.getElementById('pv-hero-player-score');
        const pvLinkEl = document.getElementById('pv-hero-player-reviews-link');
        if (pvScoreEl) {
            pvScoreEl.textContent = total > 0 && Number.isFinite(avg) ? formatRatingNumber(avg) : '-';
        }
        if (pvLinkEl) {
            pvLinkEl.textContent = `${total} review${total === 1 ? '' : 's'}`;
        }
        const svScoreEl = document.getElementById('sv-hero-player-score');
        const svLinkEl = document.getElementById('sv-hero-player-reviews-link');
        if (svScoreEl) {
            svScoreEl.textContent = total > 0 && Number.isFinite(avg) ? formatRatingNumber(avg) : '-';
        }
        if (svLinkEl) {
            svLinkEl.textContent = `${total} review${total === 1 ? '' : 's'}`;
        }
        const pvSumPlayerNum = document.getElementById('pv-summary-player-num');
        const pvSumPlayerLink = document.getElementById('pv-summary-player-link');
        if (pvSumPlayerNum) {
            pvSumPlayerNum.textContent = total > 0 && Number.isFinite(avg) ? formatRatingNumber(avg) : '-';
        }
        if (pvSumPlayerLink) {
            pvSumPlayerLink.textContent = `${total} review${total === 1 ? '' : 's'}`;
        }
    });
}

/** Try several filter shapes (slug vs Slug, $eq vs $eqi) for homepage featured casino lookup. */
async function fetchCasinoBySlug(slug) {
    const pop = 'populate=*&pagination[limit]=10';
    const qsVariants = [
        `filters[Slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[Slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
    ];
    let last = { res: null, json: null };
    for (const qs of qsVariants) {
        try {
            const res = await fetch(`${API_URL}/api/casinos?${qs}`);
            let json;
            try {
                json = await res.json();
            } catch {
                continue;
            }
            last = { res, json };
            if (res.ok && json.data && json.data.length > 0) {
                return last;
            }
            if (res.status === 400 || res.status === 404) continue;
            if (!res.ok) break;
        } catch {
            continue;
        }
    }
    return last;
}

/** Attributes from a successful fetchCasinoBySlug result, or null. */
function casinoAttrFromFetchResult(result) {
    if (!result?.res?.ok || !result.json || !Array.isArray(result.json.data) || result.json.data.length === 0) {
        return null;
    }
    return attrFromCasinoEntry(result.json.data[0]);
}

function casinoSlugNormalized(attr) {
    return firstNonEmptyAttr(attr, ['Slug', 'slug', 'URLSlug', 'urlSlug']).trim().toLowerCase();
}

/** True when this entry is the homepage featured operator (BK8). */
function isHomeFeaturedCasinoAttr(attr) {
    if (!attr) return false;
    if (casinoSlugNormalized(attr) === HOME_FEATURED_CASINO_SLUG.toLowerCase()) return true;
    const name = String(attr.Name || '')
        .trim()
        .toLowerCase();
    return name === 'bk8' || /^bk8\b/.test(name) || /\bbk8\b/.test(name);
}

/** Fetch one slot entry by Slug (same filter variants as casino reviews). */
async function fetchSlotBySlug(slug) {
    const pop = 'populate=*&pagination[limit]=10';
    const qsVariants = [
        `filters[Slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[Slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
    ];
    let last = { res: null, json: null };
    for (const qs of qsVariants) {
        try {
            const res = await fetch(`${API_URL}/api/${SLOTS_API_COLLECTION}?${qs}`);
            let json;
            try {
                json = await res.json();
            } catch {
                continue;
            }
            last = { res, json };
            if (res.ok && json.data && json.data.length > 0) {
                return last;
            }
            if (res.status === 400 || res.status === 404) continue;
            if (!res.ok) break;
        } catch {
            continue;
        }
    }
    return last;
}

/**
 * Fetch one provider by slug. Strapi filter query strings vary by version/schema;
 * if filters return empty, we fall back to the same paged list as /providers.html
 * and match Slug (or slugified Name).
 */
async function fetchProviderBySlug(slug) {
    const wanted = decodeURIComponent(String(slug)).trim().toLowerCase();
    const pop = 'populate=*&pagination[pageSize]=10&pagination[page]=1';
    const qsVariants = [
        `filters[Slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[Slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eqi]=${encodeURIComponent(slug)}&${pop}`,
        `filters[slug][$eq]=${encodeURIComponent(slug)}&${pop}`,
    ];
    let last = { res: null, json: null };
    for (const qs of qsVariants) {
        try {
            const res = await fetch(`${API_URL}/api/providers?${qs}`);
            let json;
            try {
                json = await res.json();
            } catch {
                continue;
            }
            last = { res, json };
            if (res.ok && json.data && json.data.length > 0) {
                return last;
            }
            if (res.status === 400 || res.status === 404) continue;
            if (!res.ok) break;
        } catch {
            continue;
        }
    }

    function entryMatches(entry) {
        const attr = entry.attributes ?? entry;
        const sv = providerSlugValue(attr).toLowerCase();
        if (sv && sv === wanted) return true;
        const name = attr.Name ?? attr.name ?? '';
        if (wanted && name && slugifyLabel(name) === wanted) return true;
        return false;
    }

    try {
        let page = 1;
        const pageSize = 50;
        let pageCount = 1;
        do {
            const res = await fetch(
                `${API_URL}/api/providers?populate=*&sort=Rank:asc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`
            );
            const json = await res.json();
            last = { res, json };
            if (!res.ok) break;
            const rows = json.data || [];
            const found = rows.find((e) => entryMatches(e));
            if (found) {
                return { res, json: { data: [found], meta: json.meta } };
            }
            const meta = json.meta?.pagination;
            pageCount = meta?.pageCount ?? 1;
            page += 1;
        } while (page <= pageCount && page <= 100);
    } catch (e) {
        console.warn('fetchProviderBySlug list fallback failed', e);
    }
    return last;
}

async function initProviderDetailPage() {
    const mainEl = document.getElementById('provider-content');
    if (!mainEl || !document.getElementById('pv-title')) {
        return;
    }

    const slugFromPath = window.location.pathname.match(/^\/provider\/([^/]+)\/?$/);
    const slug = slugFromPath
        ? decodeURIComponent(slugFromPath[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showProviderError();
        return;
    }

    setDetailPageLoading(mainEl);
    try {
        bindPlayerRatingHeroListener();

        const { res, json } = await fetchProviderBySlug(slug);
        if (!res || !res.ok) {
            console.error(res ? apiErrorMessage(res.status, json) : 'No response');
            showProviderError();
            return;
        }
        const { data } = json;
        if (!data || data.length === 0) {
            showProviderError();
            return;
        }

        const entry = data[0];
        const attr = entry.attributes || entry;
        populateProviderDetailPage(attr);

        if (typeof window.PlayerReviews !== 'undefined' && window.PlayerReviews.render) {
            try {
                await window.PlayerReviews.render({
                    parentKey: 'provider',
                    slug,
                    documentId: entry.documentId || attr.documentId,
                    parentNumericId: entry.id != null ? entry.id : attr.id,
                    parentAttr: attr,
                });
            } catch (e) {
                console.warn('Player reviews failed to render:', e);
            }
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Failed to load provider:', e);
        showProviderError();
    } finally {
        clearDetailPageLoading(mainEl);
    }
}

/** Approx reading time from rich text block or HTML string (words/minute constant is editorial-friendly). */
function estimateReadingTimeFromRichText(richOrText) {
    if (richOrText == null) return 0;
    const text =
        typeof richOrText === 'string' && /<[^>]+>/.test(richOrText)
            ? richOrText.replace(/<[^>]+>/g, ' ')
            : richTextToPlainText(richOrText);
    const words = String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean).length;
    if (!words) return 0;
    return Math.max(1, Math.round(words / 220));
}

function formatFullDate(d) {
    try {
        return new Date(d).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return '';
    }
}

/**
 * Provider detail renderer: uses ONLY the CMS fields we actually store on the
 * Provider content type: Name, Slug, TierBadge, IsTopProvider, RatingScore,
 * Rank, GamePortfolioCount, FoundedYear, Headquarters, FlagshipTitles,
 * DossierLink, Excerpt, ReviewBody, updatedAt, SEOTitle, SEODescription,
 * CanonicalURL. Any field not present in the payload is shown as an em dash
 * (no fallback copy, no alias fields).
 */
function populateProviderDetailPage(attr) {
    const DASH = '-';
    const name = (attr.Name && String(attr.Name).trim()) || 'Provider';

    // <title>
    document.title = attr.SEOTitle ? String(attr.SEOTitle) : `${name} | 888reviews`;

    const excerptPlain = richTextToPlainText(attr.Excerpt ?? '');

    // <meta name="description">
    const metaDesc = document.getElementById('pv-meta-description');
    if (metaDesc) {
        const desc = attr.SEODescription ? String(attr.SEODescription) : excerptPlain;
        if (desc) metaDesc.setAttribute('content', desc.slice(0, 320));
    }

    // <link rel="canonical">
    const canonEl = document.getElementById('pv-canonical');
    if (canonEl) {
        const rawCanon = attr.CanonicalURL ? String(attr.CanonicalURL).trim() : '';
        if (rawCanon && /^https?:\/\//i.test(rawCanon)) {
            canonEl.href = rawCanon;
        } else {
            try {
                canonEl.href = new URL(window.location.pathname, getPublicSiteOrigin()).href;
            } catch {
                canonEl.removeAttribute('href');
            }
        }
    }

    // Breadcrumb + H1
    const bcCurrent = document.getElementById('pv-bc-current');
    if (bcCurrent) bcCurrent.textContent = name;
    document.getElementById('pv-title').textContent = name;

    // Lede: Excerpt only (no fabricated fallback)
    const summaryEl = document.getElementById('pv-summary');
    if (summaryEl) {
        summaryEl.textContent = excerptPlain;
        summaryEl.hidden = excerptPlain === '';
    }

    const tier = attr.TierBadge ? String(attr.TierBadge).trim() : '';
    const badgeTextEl = document.getElementById('pv-badge-text');
    if (badgeTextEl) {
        if (attr.IsTopProvider === true) {
            badgeTextEl.textContent = "Editor's choice";
        } else if (tier) {
            badgeTextEl.textContent = tier.toUpperCase();
        } else {
            badgeTextEl.textContent = 'Software studio';
        }
    }

    // Numeric / string values used by hero, facts strip, and summary aside
    const scoreFive = getCuratorScoreOutOfFive(attr);
    const scoreDisplay = scoreFive != null ? formatRatingNumber(scoreFive) : DASH;
    const scoreLine = scoreFive != null ? `${formatRatingNumber(scoreFive)} / 5` : DASH;

    const rankRaw = attr.Rank;
    const rankDisplay =
        rankRaw != null && String(rankRaw).trim() !== '' && !Number.isNaN(Number(rankRaw))
            ? `#${Number(rankRaw)}`
            : DASH;

    const portDisplay =
        attr.GamePortfolioCount != null && String(attr.GamePortfolioCount).trim() !== ''
            ? formatProviderPortfolioDisplay(attr.GamePortfolioCount)
            : DASH;

    const foundedDisplay =
        attr.FoundedYear != null && String(attr.FoundedYear).trim() !== ''
            ? String(attr.FoundedYear)
            : DASH;

    const hq = attr.Headquarters ? String(attr.Headquarters).trim() : '';
    const hqDisplay = hq || DASH;

    const foundedCombined =
        foundedDisplay !== DASH && hqDisplay !== DASH
            ? `${foundedDisplay} · ${hqDisplay}`
            : foundedDisplay !== DASH
              ? foundedDisplay
              : hqDisplay;

    const logoUrl = getProviderCardImageUrl(attr);
    const logoMatDark = providerLogoMatIsDark(attr);
    const heroLogoV2 = document.getElementById('pv-hero-logo-v2');
    const heroLogoWrap = document.getElementById('pv-hero-logo-wrap');
    const sumLogoMat = document.getElementById('pv-summary-logo-mat');
    const sumLogoImg = document.getElementById('pv-summary-logo-img');
    if (heroLogoV2 && heroLogoWrap) {
        heroLogoV2.alt = `${name} logo`;
        heroLogoV2.src = logoUrl || '';
        heroLogoWrap.classList.toggle('cr-hero-logo-v2--contain', Boolean(logoUrl) && !logoMatDark);
        heroLogoWrap.classList.toggle('pv-hero-logo--dark-mat', Boolean(logoUrl) && logoMatDark);
        if (!logoUrl) {
            heroLogoV2.removeAttribute('src');
            heroLogoWrap.classList.remove('cr-hero-logo-v2--contain', 'pv-hero-logo--dark-mat');
        }
        heroLogoV2.onerror = function () {
            this.onerror = null;
            this.removeAttribute('src');
            heroLogoWrap.classList.remove('cr-hero-logo-v2--contain', 'pv-hero-logo--dark-mat');
        };
    }
    if (sumLogoImg && sumLogoMat) {
        sumLogoImg.src = logoUrl;
        sumLogoImg.alt = `${name} logo`;
        sumLogoMat.classList.toggle('pc-image-wrap--mat-dark', logoMatDark);
    }

    const heroEditorialScore = document.getElementById('pv-hero-editorial-score');
    if (heroEditorialScore) heroEditorialScore.textContent = scoreDisplay;

    // Quick facts strip
    const factRank = document.getElementById('pv-fact-rank');
    if (factRank) factRank.textContent = rankDisplay;
    const factScore = document.getElementById('pv-fact-score');
    if (factScore) factScore.textContent = scoreLine;
    const factLibrary = document.getElementById('pv-fact-library');
    if (factLibrary) factLibrary.textContent = portDisplay;
    const factFounded = document.getElementById('pv-fact-founded');
    if (factFounded) factFounded.textContent = foundedCombined;

    // Signature games (derived from FlagshipTitles CSV; section hides when empty)
    const sigSection = document.getElementById('pv-signature-section');
    const sigGrid = document.getElementById('pv-signature-grid');
    const sigDesc = document.getElementById('pv-signature-desc');
    const titles = providerFlagshipTitleLines(attr, 12);
    if (sigSection && sigGrid) {
        if (titles.length > 0) {
            sigSection.hidden = false;
            sigGrid.innerHTML = titles.map((t) => `<li class="pv-signature-name">${escapeHtml(t)}</li>`).join('');
            if (sigDesc) {
                sigDesc.textContent = `${titles.length} flagship title${titles.length === 1 ? '' : 's'} most often associated with ${name}.`;
            }
        } else {
            sigSection.hidden = true;
            sigGrid.innerHTML = '';
            if (sigDesc) sigDesc.textContent = '';
        }
    }

    // Review body from ReviewBody. Section hides entirely when the field is empty.
    const reviewSection = document.getElementById('pv-review');
    const bodyEl = document.getElementById('pv-perspective-body');
    const rich = attr.ReviewBody ?? '';
    const hasReview = rich != null && String(rich).trim() !== '';
    if (reviewSection) reviewSection.hidden = !hasReview;
    if (bodyEl) {
        if (hasReview) {
            setRichTextHtml(bodyEl, rich);
        } else {
            bodyEl.innerHTML = '';
        }
    }

    const reviewMeta = document.getElementById('pv-review-meta');
    if (reviewMeta) {
        const parts = [];
        if (hasReview) {
            const mins = estimateReadingTimeFromRichText(rich);
            if (mins > 0) parts.push(`≈ ${mins} min read`);
        }
        const updatedStr = attr.updatedAt ? formatFullDate(attr.updatedAt) : '';
        if (updatedStr) parts.push(`Updated ${updatedStr}`);
        reviewMeta.textContent = parts.join(' · ');
    }

    // Sidebar summary card
    const summaryNum = document.getElementById('pv-summary-num');
    if (summaryNum) summaryNum.textContent = scoreDisplay;
    const summaryStars = document.getElementById('pv-summary-stars');
    if (summaryStars) summaryStars.innerHTML = scoreFive != null ? renderStars(attr) : '';
    const summaryRank = document.getElementById('pv-summary-rank');
    if (summaryRank) summaryRank.textContent = rankDisplay;
    const summaryPort = document.getElementById('pv-summary-portfolio');
    if (summaryPort) summaryPort.textContent = portDisplay;
    const summaryFounded = document.getElementById('pv-summary-founded');
    if (summaryFounded) summaryFounded.textContent = foundedDisplay;
    const summaryHq = document.getElementById('pv-summary-hq');
    if (summaryHq) summaryHq.textContent = hqDisplay;
    const summaryUpdated = document.getElementById('pv-summary-updated');
    if (summaryUpdated) {
        summaryUpdated.textContent = attr.updatedAt
            ? `Last updated ${formatFullDate(attr.updatedAt)}`
            : '';
    }

    // Primary CTA (hero + sidebar) both powered by DossierLink
    const dossierTrim = attr.DossierLink ? String(attr.DossierLink).trim() : '';
    const dossierUrl = /^https?:\/\//i.test(dossierTrim) ? dossierTrim : '';

    const actionsEl = document.getElementById('pv-actions');
    const dossierEl = document.getElementById('pv-dossier-link');
    if (actionsEl && dossierEl) {
        if (dossierUrl) {
            dossierEl.href = dossierUrl;
            actionsEl.hidden = false;
        } else {
            dossierEl.removeAttribute('href');
            actionsEl.hidden = true;
        }
    }

    const summaryCta = document.getElementById('pv-summary-cta');
    if (summaryCta) {
        if (dossierUrl) {
            summaryCta.href = dossierUrl;
            summaryCta.hidden = false;
        } else {
            summaryCta.removeAttribute('href');
            summaryCta.hidden = true;
        }
    }

    const pubOriginPv = getPublicSiteOrigin();
    const pageTitlePv = document.title;
    const descOgPv =
        (metaDesc && metaDesc.getAttribute('content')) || excerptPlain || '';
    let canonicalAbsPv = '';
    try {
        canonicalAbsPv = new URL(window.location.pathname, pubOriginPv).href;
    } catch {
        /* ignore */
    }
    const pvOgUrl = document.getElementById('pv-og-url');
    const pvOgTitle = document.getElementById('pv-og-title');
    const pvOgDesc = document.getElementById('pv-og-description');
    const pvOgImg = document.getElementById('pv-og-image');
    const pvTwTitle = document.getElementById('pv-twitter-title');
    const pvTwDesc = document.getElementById('pv-twitter-description');
    const pvTwImg = document.getElementById('pv-twitter-image');
    if (pvOgUrl && canonicalAbsPv) pvOgUrl.setAttribute('content', canonicalAbsPv);
    if (pvOgTitle) pvOgTitle.setAttribute('content', pageTitlePv);
    if (pvOgDesc && descOgPv) pvOgDesc.setAttribute('content', descOgPv.slice(0, 320));
    let shareImgPv = logoUrl && String(logoUrl).trim() ? String(logoUrl).trim() : '';
    if (shareImgPv && shareImgPv.startsWith('/')) shareImgPv = `${pubOriginPv}${shareImgPv}`;
    if (!shareImgPv) shareImgPv = `${pubOriginPv}/assets/img/888review-siteicon.webp`;
    if (pvOgImg) pvOgImg.setAttribute('content', shareImgPv);
    if (pvTwImg) pvTwImg.setAttribute('content', shareImgPv);
    if (pvTwTitle) pvTwTitle.setAttribute('content', pageTitlePv);
    if (pvTwDesc && descOgPv) pvTwDesc.setAttribute('content', descOgPv.slice(0, 320));
}

function showProviderError() {
    const main = document.getElementById('provider-content');
    const err = document.getElementById('provider-error');
    if (main) main.style.display = 'none';
    if (err) err.style.display = 'block';
}

function showSlotError() {
    const main = document.getElementById('slot-page-root');
    const err = document.getElementById('slot-error');
    if (main) main.style.display = 'none';
    if (err) err.style.display = 'block';
}

function populateSlotDetailPage(attr) {
    const title = attr.Title || attr.Name || 'Slot';

    const seoTitle = firstNonEmptyAttr(attr, ['SEOTitle', 'seoTitle']);
    document.title = seoTitle || `${title} | 888reviews`;

    const seoDesc = firstNonEmptyAttr(attr, ['SEODescription', 'seoDescription']);
    const metaDesc = document.getElementById('sv-meta-description');
    if (metaDesc && seoDesc) {
        metaDesc.setAttribute('content', seoDesc);
    }

    const canonEl = document.getElementById('sv-canonical');
    if (canonEl) {
        const rawCanon = firstNonEmptyAttr(attr, ['CanonicalURL', 'canonicalURL']);
        const trimmed = rawCanon ? String(rawCanon).trim() : '';
        if (trimmed && /^https?:\/\//i.test(trimmed)) {
            canonEl.href = trimmed;
        } else {
            try {
                canonEl.href = new URL(window.location.pathname, getPublicSiteOrigin()).href;
            } catch {
                canonEl.removeAttribute('href');
            }
        }
    }

    const h1 = document.getElementById('sv-title');
    if (h1) h1.textContent = title;

    const crumbEl = document.getElementById('sv-crumb-current');
    if (crumbEl) crumbEl.textContent = title;

    const badgeLine = document.getElementById('sv-badge-line');
    if (badgeLine) {
        const pName = slotProviderDisplayName(attr);
        badgeLine.textContent = pName ? `Slot review · ${pName}` : 'Slot review';
    }

    const cardImgUrl = getSlotCardImageUrl(attr);
    const imgAlt = firstNonEmptyAttr(attr, ['CoverImageAlt', 'coverImageAlt']) || title;

    const heroLogo = document.getElementById('sv-hero-logo-v2');
    if (heroLogo) {
        heroLogo.alt = imgAlt;
        heroLogo.src = cardImgUrl;
        heroLogo.dataset.fallback = DEFAULT_SLOT_CARD_IMAGE;
        heroLogo.onerror = function () {
            if (this.src !== this.dataset.fallback) {
                this.onerror = null;
                this.src = this.dataset.fallback;
            }
        };
    }

    const score5 = getCuratorScoreOutOfFive(attr);
    const edScoreEl = document.getElementById('sv-hero-editorial-score');
    if (edScoreEl) edScoreEl.textContent = score5 != null ? formatRatingNumber(score5) : '-';

    const excerptEl = document.getElementById('sv-excerpt');
    const excerpt = firstNonEmptyAttr(attr, ['Excerpt', 'excerpt']);
    if (excerptEl) {
        if (excerpt) {
            excerptEl.textContent = excerpt;
            excerptEl.hidden = false;
        } else {
            excerptEl.textContent = '';
            excerptEl.hidden = true;
        }
    }

    const hlLabel = firstNonEmptyAttr(attr, ['HighlightLabel', 'highlightLabel']);
    const hlQuote = firstNonEmptyAttr(attr, ['HighlightQuote', 'highlightQuote']);
    const hlWrap = document.getElementById('sv-highlight-wrap');
    const hlLabelEl = document.getElementById('sv-highlight-label');
    const hlQuoteEl = document.getElementById('sv-highlight-quote');
    if (hlWrap && hlLabelEl && hlQuoteEl) {
        if (hlLabel || hlQuote) {
            hlLabelEl.textContent = hlLabel || 'Editor highlight';
            hlQuoteEl.textContent = hlQuote || '';
            hlWrap.hidden = false;
        } else {
            hlWrap.hidden = true;
        }
    }

    const playBtn = document.getElementById('sv-play-btn');
    if (playBtn) {
        const url = slotPlayLinkUrl(attr);
        if (url) {
            playBtn.href = url;
            playBtn.style.display = '';
        } else {
            playBtn.style.display = 'none';
        }
    }

    const rtpEl = document.getElementById('sv-stat-rtp');
    if (rtpEl) rtpEl.textContent = formatSlotRtpDisplay(attr);
    const volEl = document.getElementById('sv-stat-vol');
    if (volEl) {
        const v = firstNonEmptyAttr(attr, ['Volatility', 'Variance', 'volatility']);
        volEl.textContent = v ? String(v).trim() : '-';
    }

    const reelsEl = document.getElementById('sv-stat-reels');
    if (reelsEl) reelsEl.textContent = formatSlotReelsDisplay(attr);

    const maxWinEl = document.getElementById('sv-stat-maxwin');
    if (maxWinEl) {
        const mw = firstNonEmptyAttr(attr, ['MaxWin', 'maxWin']);
        maxWinEl.textContent = mw ? String(mw).trim() : '-';
    }

    const themeEl = document.getElementById('sv-stat-theme');
    if (themeEl) {
        const th = firstNonEmptyAttr(attr, ['Theme', 'theme']);
        themeEl.textContent = th ? String(th).trim() : '-';
    }

    const lastRevEl = document.getElementById('sv-last-reviewed');
    if (lastRevEl) {
        const lr = firstNonEmptyAttr(attr, ['LastReviewedAt', 'lastReviewedAt']);
        if (lr) {
            const d = new Date(lr);
            const ok = !Number.isNaN(d.getTime());
            lastRevEl.textContent = ok
                ? `Last reviewed: ${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
                : `Last reviewed: ${lr}`;
            lastRevEl.hidden = false;
        } else {
            lastRevEl.textContent = '';
            lastRevEl.hidden = true;
        }
    }

    const bodyEl = document.getElementById('sv-review-body');
    if (bodyEl) {
        const raw = attr.ReviewBody ?? attr.reviewBody ?? '';
        if (raw != null && String(raw).trim() !== '') {
            setRichTextHtml(bodyEl, raw);
        } else {
            bodyEl.innerHTML = `<p>${escapeHtml(`Full analysis of ${title} will appear here soon.`)}</p>`;
        }
    }

    const prosUl = document.getElementById('sv-pros-list');
    if (prosUl) {
        const items = slotBenefitTexts(attr.Pros);
        prosUl.innerHTML = items.length
            ? items.map((t) => `<li><i data-lucide="check-circle-2"></i> ${escapeHtml(t)}</li>`).join('')
            : `<li><i data-lucide="minus-circle"></i> ${escapeHtml('No highlights listed yet.')}</li>`;
    }
    const consUl = document.getElementById('sv-cons-list');
    if (consUl) {
        const items = slotBenefitTexts(attr.Cons);
        consUl.innerHTML = items.length
            ? items.map((t) => `<li><i data-lucide="x-circle"></i> ${escapeHtml(t)}</li>`).join('')
            : `<li><i data-lucide="minus-circle"></i> ${escapeHtml('No drawbacks listed yet.')}</li>`;
    }

    const bonusBox = document.getElementById('sv-bonus-box');
    const featCont = document.getElementById('sv-bonus-features');
    if (bonusBox) bonusBox.style.display = 'none';
    if (featCont) featCont.innerHTML = '';

    const pubOriginSv = getPublicSiteOrigin();
    const pageTitleSv = document.title;
    const descOgSv = (seoDesc || excerpt || '').slice(0, 320);
    let canonicalAbsSv = '';
    try {
        canonicalAbsSv = new URL(window.location.pathname, pubOriginSv).href;
    } catch {
        /* ignore */
    }
    const svOgUrl = document.getElementById('sv-og-url');
    const svOgTitle = document.getElementById('sv-og-title');
    const svOgDesc = document.getElementById('sv-og-description');
    const svOgImg = document.getElementById('sv-og-image');
    const svTwTitle = document.getElementById('sv-twitter-title');
    const svTwDesc = document.getElementById('sv-twitter-description');
    const svTwImg = document.getElementById('sv-twitter-image');
    if (svOgUrl && canonicalAbsSv) svOgUrl.setAttribute('content', canonicalAbsSv);
    if (svOgTitle) svOgTitle.setAttribute('content', pageTitleSv);
    if (svOgDesc && descOgSv) svOgDesc.setAttribute('content', descOgSv);
    let shareImgSv = cardImgUrl || '';
    const shareLogo = document.getElementById('sv-hero-logo-v2');
    if (!shareImgSv && shareLogo && shareLogo.getAttribute('src')) shareImgSv = shareLogo.getAttribute('src');
    if (shareImgSv && shareImgSv.startsWith('/')) shareImgSv = `${pubOriginSv}${shareImgSv}`;
    if (!shareImgSv) shareImgSv = `${pubOriginSv}/assets/img/888review-siteicon.webp`;
    if (svOgImg) svOgImg.setAttribute('content', shareImgSv);
    if (svTwImg) svTwImg.setAttribute('content', shareImgSv);
    if (svTwTitle) svTwTitle.setAttribute('content', pageTitleSv);
    if (svTwDesc && descOgSv) svTwDesc.setAttribute('content', descOgSv);
}

/** Slot detail: toggles .is-stuck on the sticky verdict sidebar for extra top padding while pinned. */
function bindSlotVerdictSidebarStickyState() {
    const aside = document.querySelector(
        '.page-slot-detail .slot-content-split .provider-sidebar.slot-sidebar',
    );
    if (!aside) return;
    const mq = window.matchMedia('(min-width: 1025px)');
    const tick = () => {
        if (!mq.matches) {
            aside.classList.remove('is-stuck');
            return;
        }
        const topPx = parseFloat(getComputedStyle(aside).top);
        if (Number.isNaN(topPx)) {
            aside.classList.remove('is-stuck');
            return;
        }
        const { top } = aside.getBoundingClientRect();
        aside.classList.toggle('is-stuck', top <= topPx + 2);
    };
    window.addEventListener('scroll', tick, { passive: true });
    window.addEventListener('resize', tick);
    tick();
}

async function initSlotDetailPage() {
    if (!document.getElementById('sv-title')) return;

    const slugFromPath = window.location.pathname.match(/^\/slot\/([^/]+)\/?$/);
    const slug = slugFromPath
        ? decodeURIComponent(slugFromPath[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showSlotError();
        return;
    }

    const rootEl = document.getElementById('slot-page-root');
    setDetailPageLoading(rootEl);
    try {
        const { res, json } = await fetchSlotBySlug(slug);
        if (!res || !res.ok) {
            showSlotError();
            return;
        }
        const { data } = json;
        if (!data || data.length === 0) {
            showSlotError();
            return;
        }

        const entry = data[0];
        const attr = entry.attributes || entry;
        populateSlotDetailPage(attr);
        bindPlayerRatingHeroListener();

        if (typeof window.PlayerReviews !== 'undefined' && window.PlayerReviews.render) {
            try {
                await window.PlayerReviews.render({
                    parentKey: 'slot',
                    slug,
                    documentId: entry.documentId || attr.documentId,
                    parentNumericId: entry.id != null ? entry.id : attr.id,
                    parentAttr: attr,
                });
            } catch (e) {
                console.warn('Player reviews failed to render:', e);
            }
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

        bindSlotVerdictSidebarStickyState();
    } catch (e) {
        console.error('Failed to load slot:', e);
        showSlotError();
    } finally {
        clearDetailPageLoading(rootEl);
    }
}

scheduleBootApp();
