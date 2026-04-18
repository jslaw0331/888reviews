document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();

    // Scroll reveal animation
    const revealElements = document.querySelectorAll('.reveal');
    
    // Check if browser supports IntersectionObserver
    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });

        // Add a slight delay to header elements to trigger animation on load smoothly
        setTimeout(() => {
            revealElements.forEach(el => revealObserver.observe(el));
        }, 100);
    } else {
        // Fallback for older browsers
        revealElements.forEach(el => el.classList.add('active'));
    }

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

/** Path to casino review page: /casino/{slug} */
function casinoReviewPath(slug) {
    if (!slug) return '#';
    return `/casino/${encodeURIComponent(slug)}`;
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

function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
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
    return coerceHttp(attr.AffiliateLink);
}

/** VISIT SITE: external URL when configured, else internal review so the control is never a useless `#`. */
function casinoVisitSiteHref(attr) {
    const ext = casinoAffiliateUrl(attr);
    if (ext) return ext;
    const slug = firstNonEmptyAttr(attr, ['Slug', 'slug', 'URLSlug', 'urlSlug']);
    return slug ? casinoReviewPath(slug) : '#';
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

/** Strapi Blocks: inline nodes (text, hard_break) to HTML. */
function strapiInlineToHtml(nodes) {
    if (!nodes || !Array.isArray(nodes)) return '';
    return nodes
        .map((node) => {
            if (!node) return '';
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
                        const href = escapeHtml(String(m.attrs.href));
                        t = `<a href="${href}" target="_blank" rel="noopener noreferrer">${t}</a>`;
                    }
                });
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
    const kids = node.content;
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
        case 'listItem':
            return `<li>${(kids || []).map(strapiBlockNodeToHtml).join('')}</li>`;
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

/**
 * Rich text from API: Blocks (object), HTML string, JSON string of blocks, or plain text.
 */
function richTextToHtml(raw) {
    if (raw == null) return '';
    if (typeof raw === 'object' && raw !== null && raw.type === 'doc') {
        return strapiBlocksToHtml(raw);
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
                    return '';
                })
                .join(' ');
        };
        return walk(raw.content).replace(/\s+/g, ' ').trim();
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
    return String(raw).replace(/\s+/g, ' ').trim();
}

/** Lucide icon name for data-lucide (alphanumeric + hyphens only). */
function safeLucideIcon(raw) {
    const s = String(raw || 'star')
        .trim()
        .toLowerCase();
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s) ? s : 'star';
}

function setReviewMetaDescription(attr) {
    const excerptPlain = richTextToPlainText(attr.ReviewExcerpt ?? attr.reviewExcerpt);
    const desc =
        firstNonEmptyAttr(attr, [
            'MetaDescription',
            'SEODescription',
            'seoDescription',
            'metaDescription',
        ]) ||
        excerptPlain ||
        (attr.Name ? `Expert review of ${attr.Name}: bonuses, games, payouts, and trust signals.` : '');
    const clipped = desc.length > 320 ? `${desc.slice(0, 317)}…` : desc;
    let meta = document.getElementById('cr-meta-description');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        meta.id = 'cr-meta-description';
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', clipped);
}

/** Self-referencing canonical and Open Graph tags for casino review detail pages (`review.html`). */
function setReviewCanonicalAndSocial(name) {
    const path = window.location.pathname || '/';
    const absBase = getPublicSiteOrigin();
    const canonicalAbs = `${absBase}${path.startsWith('/') ? path : `/${path}`}`;
    const canonEl = document.getElementById('cr-canonical');
    if (canonEl) canonEl.setAttribute('href', canonicalAbs);
    const ogUrl = document.getElementById('cr-og-url');
    if (ogUrl) ogUrl.setAttribute('content', canonicalAbs);

    const pageTitle = `${name} Review | 888reviews`;
    const ogTitle = document.getElementById('cr-og-title');
    if (ogTitle) ogTitle.setAttribute('content', pageTitle);

    const metaDesc = document.getElementById('cr-meta-description');
    const desc = metaDesc ? metaDesc.getAttribute('content') : '';
    const ogDesc = document.getElementById('cr-og-description');
    if (ogDesc && desc) ogDesc.setAttribute('content', desc);

    const twTitle = document.getElementById('cr-twitter-title');
    if (twTitle) twTitle.setAttribute('content', pageTitle);
    const twDesc = document.getElementById('cr-twitter-description');
    if (twDesc && desc) twDesc.setAttribute('content', desc);

    let imageAbs = `${absBase}/assets/img/888review-siteicon.png`;
    const heroImg = document.getElementById('cr-hero-img');
    const src = heroImg && heroImg.getAttribute('src');
    if (src && /^https?:\/\//i.test(src)) imageAbs = src;
    else if (src && src.startsWith('/')) imageAbs = `${absBase}${src}`;

    const ogImg = document.getElementById('cr-og-image');
    if (ogImg) ogImg.setAttribute('content', imageAbs);
    const twImg = document.getElementById('cr-twitter-image');
    if (twImg) twImg.setAttribute('content', imageAbs);
}

const DEFAULT_PROVIDER_CARD_IMAGE =
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop';

/** Max images in the “Inside the experience” gallery on casino review pages. */
const REVIEW_GALLERY_MAX_IMAGES = 3;

/** Casino review page: when hero/gallery are empty in the API or fail to load. */
const CASINO_REVIEW_PLACEHOLDER_IMAGES = [
    'https://images.unsplash.com/photo-1596838132731-dd50e6f54c9a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511193311914-0346f16efe90?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1542171221-39e1f579979c?w=1200&auto=format&fit=crop',
];

/** Build load order: API URL first, then every placeholder (deduped) so a bad link always has fallbacks after it. */
function galleryImageFallbackChain(primarySrc) {
    const out = [];
    const seen = new Set();
    for (const u of [primarySrc, ...CASINO_REVIEW_PLACEHOLDER_IMAGES]) {
        if (!u || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
    }
    return out;
}

/** After API URLs are injected, try each URL in the chain on error so broken media links never show the browser broken icon. */
function wireReviewGalleryImages(grid) {
    if (!grid) return;
    grid.querySelectorAll('img.cr-gallery-img').forEach((img) => {
        const first = img.getAttribute('src') || '';
        const chain = galleryImageFallbackChain(first);
        let idx = 0;
        img.addEventListener(
            'error',
            function onImgErr() {
                idx += 1;
                if (idx < chain.length) {
                    img.src = chain[idx];
                    return;
                }
                img.removeEventListener('error', onImgErr);
                img.classList.add('cr-gallery-img--empty');
                img.removeAttribute('src');
                img.alt = '';
            },
        );
    });
}

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

/** Gallery fields often named Gallery, Images, Screenshots, etc. */
function collectCasinoGalleryUrls(attr) {
    const fields = [
        attr.Gallery,
        attr.Images,
        attr.Screenshots,
        attr.ReviewImages,
        attr.ReviewGallery,
    ];
    const urls = [];
    const seen = new Set();
    for (const field of fields) {
        for (const u of normalizeStrapiMediaToUrls(field)) {
            const abs = resolveMediaUrl(u);
            if (abs && !seen.has(abs)) {
                seen.add(abs);
                urls.push(abs);
            }
        }
    }
    return urls;
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

function providerLogoMatIsDark(attr) {
    const slug = providerSlugValue(attr).toLowerCase();
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

/** Built from GET /api/bonuses so each casino slug/id maps to its Bonus entry (correct card + hero copy). */
let casinoBonusSlugMapCache = null;
let bonusesListRowsCache = null;

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
        const r = await fetch(`${API_URL}/api/config`, { cache: 'no-store' });
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

/** Rank badge classes + optional whole-card podium accent (top 3) */
function homeRankWrapClass(listPos) {
    if (listPos >= 1 && listPos <= 3) {
        return `tier-rank-wrap tier-rank-wrap--podium tier-rank-wrap--p${listPos}`;
    }
    return 'tier-rank-wrap';
}

function homeTierCardPodiumClass(listPos) {
    if (listPos >= 1 && listPos <= 3) {
        return ` tier-card--podium tier-card--podium-${listPos}`;
    }
    return '';
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
    return v.toFixed(1);
}

/** Line next to stars on cards: "4.7 / 5" or label text. */
function formatRatingScoreLine(attr, emptyFallback = '5.0 / 5.0') {
    const raw = attr.RatingScore ?? attr.ratingScore ?? attr.rating_score;
    const n = coerceToNumber(raw);
    if (n != null) {
        const v5 = normalizeToFiveStarScale(raw);
        if (v5 != null) return `${v5.toFixed(1)} / 5`;
    }
    const lab = attr.RatingLabel ?? attr.ratingLabel;
    if (lab != null && String(lab).trim() !== '') return ratingLabelToString(lab);
    return emptyFallback;
}

/** "4.9" + " / 5" split for typographic emphasis on provider cards. */
function formatRatingScoreLineRich(attr, emptyFallback = '5.0 / 5.0') {
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
    if (attrOrLabel != null && typeof attrOrLabel === 'object' && !Array.isArray(attrOrLabel)) {
        score = ratingScoreFromAttr(attrOrLabel);
    } else {
        score = parseRatingToFive(attrOrLabel);
    }
    const s = Number.isFinite(score) ? Math.max(0, Math.min(5, score)) : 0;
    const aria = `${s.toFixed(1)} out of 5 stars`;
    let units = '';
    for (let i = 1; i <= 5; i++) {
        const fillPct = Math.min(100, Math.max(0, (s - (i - 1)) * 100));
        const fp = Number.isFinite(fillPct) ? fillPct : 0;
        units += `<span class="star-unit"><span class="star-unit__track" aria-hidden="true">★</span><span class="star-unit__fill" style="width:${fp}%" aria-hidden="true">★</span></span>`;
    }
    return `<span class="stars-meter stars-meter--units" role="img" aria-label="${aria}">${units}</span>`;
}

function apiErrorMessage(status, json) {
    if (status === 401 || status === 403) {
        return 'API unauthorized. Check STRAPI_API_TOKEN and backend API permissions (Settings → API Tokens).';
    }
    if (json?.error || json?.details) {
        return String(json.error || json.details);
    }
    return `Request failed (${status || 'network'}). Ensure the backend API is reachable (STRAPI_API_URL) and run npm start (same port as this site).`;
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
    try {
        const res = await fetchCasinosWithBonusPopulate(
            `populate=*&sort=Rank:asc&pagination[limit]=${HOME_TIER_ONE_CASINOS_LIMIT}`,
        );
        const json = await res.json();
        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center; padding: 40px; color: #b91c1c;">${apiErrorMessage(res.status, json)}</p>`;
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
            const rankOrdinal = homeRankOrdinal(listPos);
            const logoUrl = getLogoUrl(attr);
            const prosConsHtml = renderCasinoProsConsHTML(attr.Pros, attr.Cons);
            const editorChip = attr.IsTierOne
                ? '<span class="tier-editor-chip">Editor\'s pick</span>'
                : '';
            const visitHref = escapeHtml(casinoVisitSiteHref(attr));
            const visitRel = casinoVisitSiteIsExternal(attr)
                ? ' target="_blank" rel="noopener noreferrer"'
                : '';
            return `
                <div class="tier-card tier-card--casino active${homeTierCardPodiumClass(listPos)}">
                    <div class="tier-rank-logo-col">
                        <div class="${homeRankWrapClass(listPos)}" aria-label="${rankOrdinal} of ${rows.length} on this list">
                            <span class="tier-rank-ordinal">${rankOrdinal}</span>
                        </div>
                        <div class="tier-logo-col">
                            <div class="tier-logo ${attr.LogoStyle}">
                                ${logoUrl ? `<img class="tier-logo-img" src="${logoUrl}" alt="${attr.Name}">` : `<span class="placeholder-text">${attr.Name}</span>`}
                                ${attr.IsTierOne ? '<div class="verified-icon-wrapper"><i data-lucide="check"></i></div>' : ''}
                            </div>
                        </div>
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
                    <div class="tier-bonus">
                        <span class="bonus-label">${escapeHtml(casinoBonusLabelDisplay(attr))}</span>
                        <h4 class="bonus-amount">${escapeHtml(casinoBonusAmountDisplay(attr))}</h4>
                        <div class="bonus-actions">
                            <a href="${visitHref}" class="btn btn-primary btn-block"${visitRel}>VISIT SITE</a>
                            <button type="button" class="info-btn" title="Bonus terms summary" aria-label="Bonus terms and conditions"><i data-lucide="info"></i></button>
                        </div>
                        <p class="terms bonus-terms">${escapeHtml(casinoBonusTermsDisplay(attr))}</p>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = html;
        wireTierProsConsExpand(container);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center; padding: 40px; color: #b91c1c;">Could not reach the API proxy. Run <code>npm start</code> and open this site at <code>http://localhost:3000</code>. Ensure the backend API is running.</p>';
    }
}

async function loadProviders() {
    const container = document.getElementById('providers-container');
    if (!container) return;
    try {
        const res = await fetch(
            `${API_URL}/api/providers?populate=*&sort=Rank:asc&pagination[limit]=${HOME_TOP_PROVIDERS_LIMIT}`
        );
        const json = await res.json();
        if (!res.ok) {
            container.innerHTML = `<p style="text-align:center; padding: 40px; color: #b91c1c;">${apiErrorMessage(res.status, json)}</p>`;
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
            const rankOrdinal = homeRankOrdinal(listPos);
            const pros = (attr.KeyStrengths || [])
                .map((x) => `<li class="pro"><i data-lucide="check-circle-2"></i> ${escapeHtml(x.Text || '')}</li>`)
                .join('');
            const icons = (attr.ExpertiseIcons || []).map((i) => `<i data-lucide="${escapeHtml(i.LucideIconName || 'circle')}"></i>`).join('');
            const logoUrl = getProviderCardImageUrl(attr);
            const badgeClass = providerTierBadgeClass(attr);
            const nameSafe = escapeHtml(attr.Name || '');
            const logoMatClass = providerLogoMatIsDark(attr) ? 'tier-logo--mat-dark' : 'tier-logo--mat-light';

            return `
                <div class="tier-card tier-card--provider active${homeTierCardPodiumClass(listPos)}">
                    <div class="tier-rank-logo-col">
                        <div class="${homeRankWrapClass(listPos)}" aria-label="${rankOrdinal} of ${rows.length} on this list">
                            <span class="tier-rank-ordinal">${rankOrdinal}</span>
                        </div>
                        <div class="tier-logo-col">
                            <div class="tier-logo ${logoMatClass}">
                                ${logoUrl ? `<img class="tier-logo-img" src="${escapeHtml(logoUrl)}" alt="${nameSafe}" loading="lazy" decoding="async">` : `<span class="placeholder-text">${nameSafe}</span>`}
                                ${attr.IsTopProvider ? '<div class="verified-icon-wrapper"><i data-lucide="check"></i></div>' : ''}
                            </div>
                        </div>
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
                    <div class="tier-bonus">
                        <span class="bonus-label">GAME PORTFOLIO</span>
                        <h4 class="bonus-amount">${escapeHtml(String(attr.GamePortfolioCount || '').trim())}</h4>
                        <div class="bonus-actions">
                            <a href="${attr.Slug ? escapeHtml(providerPath(attr.Slug)) : escapeHtml(String(attr.DossierLink || '#'))}" class="btn btn-outline btn-block" ${attr.Slug ? '' : 'target="_blank" rel="noopener noreferrer"'}>READ DOSSIER</a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        container.innerHTML = html;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p style="text-align:center; padding: 40px; color: #b91c1c;">Could not reach the API proxy. Run <code>npm start</code> and open this site at <code>http://localhost:3000</code>. Ensure the backend API is running.</p>';
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
        const res = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?${qs}`, { cache: 'no-store' });
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
            const res = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?${qs}`, { cache: 'no-store' });
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
            { cache: 'no-store' },
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

/**
 * Fetch /api/casinos with the given query string only.
 * Do not append populate[bonuses] etc. - Strapi returns 400 if those relations are not defined on the schema.
 * `populate=*` already loads first-level relations; use collectBonusLikeObjects() for nested bonus fields.
 */
async function fetchCasinosWithBonusPopulate(queryString) {
    return fetch(`${API_URL}/api/casinos?${queryString}`, { cache: 'no-store' });
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

    // Apply logo FIRST - even if other parts fail, the logo still shows.
    if (logoEl) {
        try { applyHeroLogoElement(logoEl, attr); }
        catch (err) { console.error('[hero] logo error:', err); }
    }

    if (!headlineEl || !heroLink) return;

    const name = String(attr.Name || '').trim();
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
        const labelLine = casinoBonusLabelDisplay(attr) || 'Welcome offer';
        if (labelEl) labelEl.textContent = labelLine.toUpperCase();
        headlineEl.textContent = name ? `${name} Welcome Bonus` : 'Welcome Bonus';
    } catch (err) { console.error('[hero] headline error:', err); }

    try {
        if (dekEl) {
            const terms = casinoBonusTermsDisplay(attr);
            dekEl.textContent =
                terms ||
                'Minimum deposit required with wagering requirements applied before withdrawal.';
        }
    } catch (err) { console.error('[hero] dek error:', err); }

    try {
        if (amountEl) {
            const amt = String(casinoBonusAmountDisplay(attr) || '').trim();
            if (amt) {
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

/** Sticky bonus column beside “Our Verdict” on casino review pages (review.html). */
function applyVerdictBonusSidebar(attr, bonusTag, bonusAmt, bonusDesc) {
    const aside = document.getElementById('cr-verdict-bonus-sidebar');
    const flow = document.getElementById('cr-verdict-flow');
    const nameEl = document.getElementById('cr-vb-name');
    const labelEl = document.getElementById('cr-vb-label');
    const amountEl = document.getElementById('cr-vb-amount');
    const termsEl = document.getElementById('cr-vb-terms');
    const ctaEl = document.getElementById('cr-vb-cta');
    if (!aside || !flow || !amountEl || !ctaEl) return;

    const terms = casinoBonusTermsDisplay(attr);
    const show =
        !!(String(bonusAmt || '').trim() ||
            String(bonusTag || '').trim() ||
            String(bonusDesc || '').trim() ||
            String(terms || '').trim());

    if (!show) {
        aside.hidden = true;
        return;
    }

    aside.removeAttribute('hidden');

    if (nameEl) {
        applySidebarBrandLogo(
            document.getElementById('cr-vb-logo-wrap'),
            document.getElementById('cr-vb-logo'),
            nameEl,
            attr,
        );
    }
    if (labelEl) {
        const line =
            String(bonusTag || '').trim() || casinoBonusLabelDisplay(attr);
        labelEl.textContent = line;
        labelEl.hidden = !line;
    }
    amountEl.textContent = String(bonusAmt || '').trim();
    amountEl.hidden = !amountEl.textContent;
    if (termsEl) {
        termsEl.textContent = terms || '';
        termsEl.hidden = !termsEl.textContent.trim();
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
                const bonusRes = await fetch(`${API_URL}/api/${BONUSES_API_COLLECTION}?populate=*&pagination[limit]=50`, { cache: 'no-store' });
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
// Guides index (/guides.html) - Strapi /api/posts (categories guide | strategy)
// ============================================================

const GUIDES_PAGE_SIZE = 6;
const GUIDES_PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=1000&auto=format&fit=crop';

async function fetchGuidesPageFallback(page, filterKey) {
    try {
        const chunkLimit = 100;
        let allData = [];
        let start = 0;
        for (let i = 0; i < 40; i++) {
            const res = await fetch(
                `${API_URL}/api/posts?populate=*&sort=publishedAt:desc&pagination[start]=${start}&pagination[limit]=${chunkLimit}`,
                { cache: 'no-store' },
            );
            const json = await res.json();
            if (!res.ok || !json || !Array.isArray(json.data)) break;
            const batch = json.data;
            if (batch.length === 0) break;
            allData.push(...batch);
            const total = json.meta?.pagination?.total;
            start += batch.length;
            if (typeof total === 'number' && start >= total) break;
        }
        if (allData.length === 0) {
            return {
                rows: [],
                meta: { pagination: { page: 1, pageSize: GUIDES_PAGE_SIZE, pageCount: 1, total: 0 } },
            };
        }
        let rows = allData.filter((row) => {
            const a = postEntryAttr(row);
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
        return {
            rows: [],
            meta: { pagination: { page: 1, pageSize: GUIDES_PAGE_SIZE, pageCount: 1, total: 0 } },
        };
    }
}

async function fetchGuidesPage(page, filterKey) {
    // Strapi often returns 400 for `filters[category][slug]`-style queries when the relation UID
    // in the deployed schema does not match these paths. Chunked unfiltered fetch + client-side filter is reliable.
    return fetchGuidesPageFallback(page, filterKey);
}

/** News index (/news.html): Strapi /api/posts (category news only). */
async function fetchNewsPageFallback(page) {
    const p = Math.max(1, Math.floor(Number(page)) || 1);
    try {
        const chunkLimit = 100;
        let allData = [];
        let start = 0;
        for (let i = 0; i < 40; i++) {
            const res = await fetch(
                `${API_URL}/api/posts?populate=*&sort=publishedAt:desc&pagination[start]=${start}&pagination[limit]=${chunkLimit}`,
                { cache: 'no-store' },
            );
            const json = await res.json();
            if (!res.ok || !json || !Array.isArray(json.data)) break;
            const batch = json.data;
            if (batch.length === 0) break;
            allData.push(...batch);
            const total = json.meta?.pagination?.total;
            start += batch.length;
            if (typeof total === 'number' && start >= total) break;
        }
        if (allData.length === 0) {
            return {
                rows: [],
                meta: { pagination: { page: 1, pageSize: GUIDES_PAGE_SIZE, pageCount: 1, total: 0 } },
            };
        }
        const rows = allData.filter((row) => postCategorySlugForFilter(postEntryAttr(row)) === 'news');
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
        return {
            rows: [],
            meta: { pagination: { page: 1, pageSize: GUIDES_PAGE_SIZE, pageCount: 1, total: 0 } },
        };
    }
}

async function fetchNewsPage(page) {
    return fetchNewsPageFallback(page);
}

function postEntryAttr(entry) {
    if (!entry) return null;
    return entry.attributes != null ? entry.attributes : entry;
}

function postSlugValue(attr) {
    return String(firstNonEmptyAttr(attr, ['slug', 'Slug']) || '').trim();
}

function postDetailHref(slug) {
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

function postAuthorAvatarUrl(attr) {
    const keys = ['author', 'Author'];
    for (const k of keys) {
        const raw = attr[k];
        if (raw == null) continue;
        const list = strapiRelationToAttrList(raw);
        for (const a of list) {
            const u = logoUrlFromMediaField(a?.avatar || a?.Avatar || a?.image || a?.Image);
            if (u) return logoImgSrcForDisplay(u);
        }
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
        const url = slug ? `${origin}${guideDetailPath(slug)}` : `${origin}/news`;
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

/** Latest guide/strategy posts for single-article sidebar (excludes current slug). */
async function fetchRecentGuideEntriesForSidebar(excludeSlug, want = 3) {
    const ex = String(excludeSlug || '').trim().toLowerCase();
    const out = [];
    let page = 1;
    const maxPages = 10;
    while (out.length < want && page <= maxPages) {
        const { rows } = await fetchGuidesPage(page, 'all');
        if (!rows || rows.length === 0) break;
        for (const row of rows) {
            const a = postEntryAttr(row);
            if (!a) continue;
            if (!postCategorySlugForFilter(a)) continue;
            const s = postSlugValue(a).toLowerCase();
            if (s && s === ex) continue;
            out.push(row);
            if (out.length >= want) break;
        }
        if (out.length >= want) break;
        if (rows.length < GUIDES_PAGE_SIZE) break;
        page += 1;
    }
    return out.slice(0, want);
}

/** Latest news posts for footer (same shape as guides). */
async function fetchRecentNewsEntriesForSidebar(excludeSlug, want = 3) {
    const ex = String(excludeSlug || '').trim().toLowerCase();
    const out = [];
    let page = 1;
    const maxPages = 10;
    while (out.length < want && page <= maxPages) {
        const { rows } = await fetchNewsPage(page);
        if (!rows || rows.length === 0) break;
        for (const row of rows) {
            const a = postEntryAttr(row);
            if (!a) continue;
            if (postCategorySlugForFilter(a) !== 'news') continue;
            const s = postSlugValue(a).toLowerCase();
            if (s && s === ex) continue;
            out.push(row);
            if (out.length >= want) break;
        }
        if (out.length >= want) break;
        if (rows.length < GUIDES_PAGE_SIZE) break;
        page += 1;
    }
    return out.slice(0, want);
}

async function fetchRecentCasinosForFooter(excludeSlug, want = 3) {
    const ex = String(excludeSlug || '').trim().toLowerCase();
    try {
        const res = await fetchCasinosWithBonusPopulate('populate=*&sort=Rank:asc&pagination[limit]=40');
        const json = await res.json();
        if (!res.ok || !json || !Array.isArray(json.data)) return [];
        const out = [];
        for (const row of json.data) {
            const attr = attrFromCasinoEntry(row);
            const s = casinoSlugNormalized(attr);
            if (s && s === ex) continue;
            out.push(row);
            if (out.length >= want) break;
        }
        return out;
    } catch (e) {
        console.warn('[footer casinos]', e);
        return [];
    }
}

async function fetchRecentSlotsForFooter(excludeSlug, want = 3) {
    const ex = String(excludeSlug || '').trim().toLowerCase();
    try {
        const res = await fetch(
            `${API_URL}/api/${SLOTS_API_COLLECTION}?populate=*&sort=${encodeURIComponent(SLOTS_LIST_SORT)}&pagination[limit]=40`,
            { cache: 'no-store' },
        );
        const json = await res.json();
        if (!res.ok || !json || !Array.isArray(json.data)) return [];
        const out = [];
        for (const row of json.data) {
            const attr = row.attributes || row;
            const s = String(slotSlugValue(attr) || '')
                .trim()
                .toLowerCase();
            if (s && s === ex) continue;
            out.push(row);
            if (out.length >= want) break;
        }
        return out;
    } catch (e) {
        console.warn('[footer slots]', e);
        return [];
    }
}

async function fetchRecentProvidersForFooter(excludeSlug, want = 3) {
    const ex = String(excludeSlug || '').trim().toLowerCase();
    try {
        const res = await fetch(`${API_URL}/api/providers?populate=*&sort=Rank:asc&pagination[limit]=40`, {
            cache: 'no-store',
        });
        const json = await res.json();
        if (!res.ok || !json || !Array.isArray(json.data)) return [];
        const out = [];
        for (const row of json.data) {
            const attr = row.attributes || row;
            const s = String(providerSlugValue(attr) || '')
                .trim()
                .toLowerCase();
            if (s && s === ex) continue;
            out.push(row);
            if (out.length >= want) break;
        }
        return out;
    } catch (e) {
        console.warn('[footer providers]', e);
        return [];
    }
}

function renderGuideSidebarCardHtml(row) {
    const attr = postEntryAttr(row);
    if (!attr) return '';
    const title = escapeHtml(postTitlePlain(attr));
    const slug = postSlugValue(attr);
    const href = escapeHtml(postDetailHref(slug));
    const img = escapeHtml(postCoverImageUrl(attr) || GUIDES_PLACEHOLDER_IMAGE);
    const cat = escapeHtml(postCategoryDisplayLabel(attr));
    const mins = postReadingMinutes(attr);
    const imgAlt = escapeHtml(postTitlePlain(attr));
    return `
    <li>
        <a href="${href}" class="gp-related-card">
            <div class="gp-related-card__img">
                <img src="${img}" alt="${imgAlt}" width="88" height="56" loading="lazy" decoding="async" />
            </div>
            <div class="gp-related-card__body">
                <span class="gp-related-card__cat">${cat}</span>
                <span class="gp-related-card__title">${title}</span>
                <span class="gp-related-card__meta">${mins} min read</span>
            </div>
        </a>
    </li>`;
}

/** Star icon + “4.3 / 5” (or label) for footer casino/provider cards; plain text when unrated. */
function renderFooterRatingMetaHtml(attr) {
    const line = formatRatingScoreLine(attr, '—');
    const safe = escapeHtml(line);
    if (line === '—') return safe;
    return `<span class="gp-related-card__meta-inner"><i data-lucide="star" class="gp-related-card__star" aria-hidden="true"></i><span>${safe}</span></span>`;
}

function renderFooterCasinoRelatedLi(row) {
    const attr = attrFromCasinoEntry(row);
    const name = escapeHtml(attr.Name || 'Casino');
    const slug = casinoSlugNormalized(attr);
    if (!slug) return '';
    const href = escapeHtml(casinoReviewPath(slug));
    const logo = getLogoUrl(attr);
    const imgSrc = logo ? escapeHtml(logo) : escapeHtml('/assets/img/888review-siteicon.png');
    const tier = attr.IsTierOne ? 'TIER ONE' : 'CASINO';
    const ratingMeta = renderFooterRatingMetaHtml(attr);
    return `
    <li>
        <a href="${href}" class="gp-related-card">
            <div class="gp-related-card__img">
                <img src="${imgSrc}" alt="${name}" width="88" height="56" loading="lazy" decoding="async" />
            </div>
            <div class="gp-related-card__body">
                <span class="gp-related-card__cat">${escapeHtml(tier)}</span>
                <span class="gp-related-card__title">${name}</span>
                <span class="gp-related-card__meta">${ratingMeta}</span>
            </div>
        </a>
    </li>`;
}

function renderFooterSlotRelatedLi(row) {
    const attr = row.attributes || row;
    const title = escapeHtml(attr.Name || attr.Title || 'Slot');
    const slug = slotSlugValue(attr);
    if (!slug) return '';
    const href = escapeHtml(slotDetailPath(slug));
    const imgUrl = escapeHtml(getSlotCardImageUrl(attr) || DEFAULT_SLOT_CARD_IMAGE);
    const prov = escapeHtml((slotProviderDisplayName(attr) || 'Slot').toUpperCase());
    const rtp = escapeHtml(formatSlotRtpDisplay(attr));
    return `
    <li>
        <a href="${href}" class="gp-related-card">
            <div class="gp-related-card__img">
                <img src="${imgUrl}" alt="${title}" width="88" height="56" loading="lazy" decoding="async" />
            </div>
            <div class="gp-related-card__body">
                <span class="gp-related-card__cat">${prov}</span>
                <span class="gp-related-card__title">${title}</span>
                <span class="gp-related-card__meta">RTP ${rtp}</span>
            </div>
        </a>
    </li>`;
}

function renderFooterProviderRelatedLi(row) {
    const attr = row.attributes || row;
    const name = escapeHtml(attr.Name || 'Provider');
    const slug = providerSlugValue(attr);
    if (!slug) return '';
    const href = escapeHtml(providerPath(slug));
    const img = escapeHtml(getProviderCardImageUrl(attr));
    const badge = escapeHtml(String(attr.TierBadge || 'PROVIDER').toUpperCase());
    const meta = renderFooterRatingMetaHtml(attr);
    return `
    <li>
        <a href="${href}" class="gp-related-card">
            <div class="gp-related-card__img">
                <img src="${img}" alt="${name}" width="88" height="56" loading="lazy" decoding="async" />
            </div>
            <div class="gp-related-card__body">
                <span class="gp-related-card__cat">${badge}</span>
                <span class="gp-related-card__title">${name}</span>
                <span class="gp-related-card__meta">${meta}</span>
            </div>
        </a>
    </li>`;
}

function applyFooterStripCopy(title, dek, ctaLabel, ctaHref, listAriaLabel) {
    const h2 = document.getElementById('footer-related-heading');
    const dekEl = document.querySelector('.footer-related-posts .footer-casino-reviews__dek');
    const cta = document.querySelector('.footer-related-posts__cta a');
    const ul = document.getElementById('footer-related-list');
    if (h2) h2.textContent = title;
    if (dekEl) dekEl.textContent = dek;
    if (cta) {
        cta.href = ctaHref;
        cta.textContent = '';
        cta.appendChild(document.createTextNode(`${ctaLabel} `));
        const i = document.createElement('i');
        i.setAttribute('data-lucide', 'arrow-right');
        cta.appendChild(i);
    }
    if (ul && listAriaLabel) ul.setAttribute('aria-label', listAriaLabel);
}

async function populateGuidePostRelatedSidebar(excludeSlug) {
    const ul = document.getElementById('gp-related-list');
    const section = document.querySelector('.gp-related-latest-section');
    if (!ul) return;
    ul.innerHTML =
        '<li class="gp-related-loading" role="status"><span class="gp-related-loading__text">Loading…</span></li>';
    try {
        const rows = await fetchRecentGuideEntriesForSidebar(excludeSlug, 3);
        if (rows.length === 0) {
            ul.innerHTML = '';
            if (section) {
                section.hidden = true;
                section.setAttribute('aria-hidden', 'true');
            }
            return;
        }
        if (section) {
            section.hidden = false;
            section.removeAttribute('aria-hidden');
        }
        ul.innerHTML = rows.map(renderGuideSidebarCardHtml).join('');
        if (typeof lucide !== 'undefined' && section) {
            lucide.createIcons({ root: section });
        }
    } catch (e) {
        console.warn('[guide post sidebar]', e);
        ul.innerHTML = '';
        if (section) {
            section.hidden = true;
            section.setAttribute('aria-hidden', 'true');
        }
    }
}

/** `/guide/my-slug` → slug to exclude from footer related list; otherwise empty. */
function currentGuideSlugFromPathForFooter() {
    try {
        const m = window.location.pathname.match(/^\/guide\/([^/]+)\/?/);
        return m ? decodeURIComponent(m[1]).trim().toLowerCase() : '';
    } catch {
        return '';
    }
}

/**
 * Footer strip: contextual “more” on single pages (casino / slot / provider / post),
 * otherwise three latest guides/strategies on pages that show this block.
 * @param {object|null} loadedGuidePostAttr — from initGuidePostPage when on /guide/:slug (avoids extra fetch for category).
 */
async function populateFooterRelatedPosts(loadedGuidePostAttr) {
    const strip = document.querySelector('.footer-related-posts');
    if (!strip) return;
    try {
        if (getComputedStyle(strip).display === 'none') return;
    } catch {
        return;
    }
    const ul = document.getElementById('footer-related-list');
    if (!ul) return;
    ul.setAttribute('aria-busy', 'true');
    ul.innerHTML =
        '<li class="gp-related-loading" role="status"><span class="gp-related-loading__text">Loading…</span></li>';

    const path = window.location.pathname;
    let rows = [];
    let mapFn = renderGuideSidebarCardHtml;

    try {
        const casinoM = path.match(/^\/casino\/([^/]+)\/?$/);
        const slotM = path.match(/^\/slot\/([^/]+)\/?$/);
        const providerM = path.match(/^\/provider\/([^/]+)\/?$/);
        const guideM = path.match(/^\/guide\/([^/]+)\/?$/);

        if (casinoM) {
            const ex = decodeURIComponent(casinoM[1]).trim().toLowerCase();
            applyFooterStripCopy(
                'More casinos',
                'Explore other operators from our editorial directory: rankings, bonuses, and review notes.',
                'Browse all casinos',
                '/casinos',
                'Related casinos',
            );
            rows = await fetchRecentCasinosForFooter(ex, 3);
            mapFn = renderFooterCasinoRelatedLi;
        } else if (slotM) {
            const ex = decodeURIComponent(slotM[1]).trim().toLowerCase();
            applyFooterStripCopy(
                'More slots',
                'Discover more titles from our slot review library: RTP, volatility, and provider notes.',
                'Browse all slots',
                '/slots',
                'Related slots',
            );
            rows = await fetchRecentSlotsForFooter(ex, 3);
            mapFn = renderFooterSlotRelatedLi;
        } else if (providerM) {
            const ex = decodeURIComponent(providerM[1]).trim().toLowerCase();
            applyFooterStripCopy(
                'More providers',
                'Compare studios and portfolios: flagship games, expertise, and editorial ratings.',
                'Browse all providers',
                '/providers',
                'Related providers',
            );
            rows = await fetchRecentProvidersForFooter(ex, 3);
            mapFn = renderFooterProviderRelatedLi;
        } else if (guideM) {
            const slug = decodeURIComponent(guideM[1]).trim().toLowerCase();
            let cat = '';
            if (loadedGuidePostAttr) {
                cat = postCategorySlugForFilter(loadedGuidePostAttr);
            } else {
                const { json } = await fetchPostBySlug(slug);
                const attr = json?.data?.[0] ? postEntryAttr(json.data[0]) : null;
                cat = attr ? postCategorySlugForFilter(attr) : '';
            }
            if (cat === 'news') {
                applyFooterStripCopy(
                    'Related news',
                    'More headlines and editor commentary from the 888reviews news desk.',
                    'Browse all news',
                    '/news',
                    'Related news',
                );
                rows = await fetchRecentNewsEntriesForSidebar(slug, 3);
                mapFn = renderGuideSidebarCardHtml;
            } else {
                applyFooterStripCopy(
                    'Related posts',
                    'More editorial picks from our library: guides, strategies, and how-tos you can read next.',
                    'Browse all guides',
                    '/guides',
                    'Related guides',
                );
                rows = await fetchRecentGuideEntriesForSidebar(slug, 3);
                mapFn = renderGuideSidebarCardHtml;
            }
        } else {
            applyFooterStripCopy(
                'Related posts',
                'More editorial picks from our library: guides, strategies, and how-tos you can read next.',
                'Browse all guides',
                '/guides',
                'Featured guides',
            );
            rows = await fetchRecentGuideEntriesForSidebar(currentGuideSlugFromPathForFooter(), 3);
            mapFn = renderGuideSidebarCardHtml;
        }

        rows = (rows || []).filter(Boolean);
        if (rows.length === 0) {
            ul.innerHTML = '';
            ul.hidden = true;
            ul.removeAttribute('aria-busy');
            return;
        }
        ul.hidden = false;
        ul.innerHTML = rows.map((r) => mapFn(r)).filter(Boolean).join('');
        ul.removeAttribute('aria-busy');
        if (typeof lucide !== 'undefined') lucide.createIcons({ root: strip });
    } catch (e) {
        console.warn('[footer related strip]', e);
        ul.innerHTML = '';
        ul.hidden = true;
        ul.removeAttribute('aria-busy');
    }
}

async function fetchPostBySlug(slug) {
    const raw = decodeURIComponent(String(slug)).trim();
    if (!raw) return { res: null, json: null };
    const pop = 'populate=*&pagination[limit]=1';
    const attempts = [
        `filters[slug][$eqi]=${encodeURIComponent(raw)}&${pop}`,
        `filters[slug][$eq]=${encodeURIComponent(raw)}&${pop}`,
        `filters[Slug][$eqi]=${encodeURIComponent(raw)}&${pop}`,
        `filters[Slug][$eq]=${encodeURIComponent(raw)}&${pop}`,
    ];
    for (const qs of attempts) {
        try {
            const res = await fetch(`${API_URL}/api/posts?${qs}`, { cache: 'no-store' });
            const json = await res.json();
            if (!res.ok || !json || !Array.isArray(json.data) || json.data.length === 0) continue;
            const attr = postEntryAttr(json.data[0]);
            if (!postCategorySlugForFilter(attr)) continue;
            return { res, json };
        } catch (e) {
            console.warn('[guide post] fetch failed:', e);
        }
    }
    return { res: null, json: null };
}

function showGuidePostError() {
    const err = document.getElementById('gp-error');
    const root = document.getElementById('gp-page-root');
    if (err) err.hidden = false;
    if (root) root.style.display = 'none';
    document.title = 'Guide not found | 888reviews';
}

function setGuideCanonicalAndOg(attr, slug, pageTitle, seoDesc) {
    const path = `/guide/${encodeURIComponent(String(slug).trim())}`;
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

function populateGuidePostPage(attr, slug) {
    const title = postTitlePlain(attr);
    const excerpt = postExcerptPlain(attr);
    const mins = postReadingMinutes(attr);
    const catLabel = postCategoryDisplayLabel(attr);
    const pillEl = document.getElementById('gp-pill');
    const readEl = document.getElementById('gp-read-time');
    const titleEl = document.getElementById('gp-title');
    const dekEl = document.getElementById('gp-dek');
    const dateEl = document.getElementById('gp-date');
    const authorNameEl = document.getElementById('gp-author-name');
    const authorImgEl = document.getElementById('gp-author-img');
    const heroImg = document.getElementById('gp-hero-img');
    const heroVisual = document.getElementById('gp-hero-visual');
    const bodyEl = document.getElementById('gp-body');
    const crumbEl = document.getElementById('gp-crumb-current');

    const pageTitle = `${title} | 888reviews`;
    document.title = pageTitle;
    const seoDesc =
        excerpt ||
        `Editorial ${catLabel.toLowerCase()}: ${title}. Always verify terms with licensed operators.`;

    setGuideCanonicalAndOg(attr, slug, pageTitle, seoDesc);

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
            dateEl.textContent = `${d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} · EDITORIAL`;
            dateEl.hidden = false;
        } else {
            dateEl.hidden = true;
        }
    } else if (dateEl) {
        dateEl.hidden = true;
    }

    const authorName = postAuthorLine(attr);
    if (authorNameEl) authorNameEl.textContent = authorName;
    if (authorImgEl) {
        authorImgEl.src = postAuthorAvatarUrl(attr);
        authorImgEl.alt = authorName;
    }

    const cover = postCoverImageUrl(attr);
    if (heroImg && heroVisual) {
        if (cover) {
            heroImg.src = cover;
            heroImg.alt = title;
            heroVisual.hidden = false;
        } else {
            heroVisual.hidden = true;
        }
    }

    const pubOriginGuide = getPublicSiteOrigin();
    const defaultShareImgGuide = `${pubOriginGuide}/assets/img/888review-siteicon.png`;
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
            } else {
                bodyEl.innerHTML = '';
            }
        } else {
            bodyEl.innerHTML = `<p>${escapeHtml(excerpt || 'Full article content will appear here when added in the CMS.')}</p>`;
        }
    }

    const root = document.getElementById('gp-page-root');
    if (root) {
        root.style.opacity = '1';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function initGuidePostPage() {
    if (!document.getElementById('gp-page-root')) return null;

    const slugFromPath = window.location.pathname.match(/^\/guide\/([^/]+)\/?$/);
    const slug = slugFromPath
        ? decodeURIComponent(slugFromPath[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showGuidePostError();
        return null;
    }

    try {
        const { res, json } = await fetchPostBySlug(slug);
        if (!res || !res.ok || !json || !json.data || json.data.length === 0) {
            showGuidePostError();
            return null;
        }
        const attr = postEntryAttr(json.data[0]);
        populateGuidePostPage(attr, slug);
        await populateGuidePostRelatedSidebar(slug);
        return attr;
    } catch (e) {
        console.error('[guide post]', e);
        showGuidePostError();
        return null;
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

    let currentPage = 1;
    try {
        const qp = parseInt(new URLSearchParams(window.location.search).get('page') || '', 10);
        if (!Number.isNaN(qp) && qp >= 1) currentPage = qp;
    } catch {
        /* ignore */
    }
    let currentFilter = 'all';
    try {
        const fp = new URLSearchParams(window.location.search).get('filter');
        if (fp === 'guide' || fp === 'strategy' || fp === 'all') {
            currentFilter = fp;
        }
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
            if (currentFilter === 'all') u.searchParams.delete('filter');
            else u.searchParams.set('filter', currentFilter);
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
        statusEl.hidden = false;
        statusEl.textContent = 'Loading guides…';
        if (wrap) wrap.style.display = 'none';
        try {
            let { rows, meta } = await fetchGuidesPage(currentPage, currentFilter);
            pageCount = resolvePageCount(meta);

            if (currentPage > pageCount) {
                currentPage = pageCount;
                setGuidesUrlPage();
                ({ rows, meta } = await fetchGuidesPage(currentPage, currentFilter));
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
                    statusEl.textContent =
                        'Guides could not be loaded from the CMS. Run the site with npm start and ensure STRAPI_API_URL is set, or add posts with category guide or strategy in Strapi.';
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
            statusEl.textContent =
                'We could not load guides right now. Please refresh, or try again after checking your connection.';
            if (wrap) wrap.style.display = 'none';
            guidesFirstFetch = false;
        }
    }

    const filterBtns = document.querySelectorAll('[data-guides-filter]');
    filterBtns.forEach((btn) => {
        const v = btn.getAttribute('data-guides-filter') || 'all';
        btn.classList.toggle('active', v === currentFilter);
        btn.addEventListener('click', () => {
            const next = btn.getAttribute('data-guides-filter') || 'all';
            currentFilter = next;
            currentPage = 1;
            setGuidesUrlPage();
            filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
            guidesFirstFetch = true;
            loadAndRender();
        });
    });

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
        statusEl.hidden = false;
        statusEl.textContent = 'Loading headlines…';
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
                    statusEl.textContent =
                        'News could not be loaded from the CMS. Run the site with npm start and ensure STRAPI_API_URL is set, or add posts with category news in Strapi.';
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
            statusEl.textContent =
                'We could not load news right now. Please refresh, or try again after checking your connection.';
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

function bonusCardCodeLabel(attr) {
    const raw = firstNonEmptyAttr(attr, ['BonusCode', 'bonusCode', 'PromoCode']);
    if (!raw || String(raw).trim() === '') return 'NO CODE REQUIRED';
    const s = String(raw).trim();
    if (/^no\s*code/i.test(s)) return 'NO CODE REQUIRED';
    return `CODE: ${s.toUpperCase().slice(0, 28)}`;
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
    const codeLabel = bonusCardCodeLabel(attr);
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

    const infoBtn = detailHref
        ? `<a href="${escapeHtml(detailHref)}" class="bc-info" aria-label="View full bonus terms and details"><i data-lucide="info"></i></a>`
        : `<span class="bc-info bc-info--muted" aria-hidden="true"><i data-lucide="info"></i></span>`;

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
            <div class="bc-header">
                <span class="bc-code">${escapeHtml(codeLabel)}</span>
                ${infoBtn}
            </div>
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

function initBonusesPage() {
    const grid = document.getElementById('bonuses-grid');
    if (!grid) return;

    (async () => {
        grid.innerHTML = '<p class="bonuses-grid-loading">Loading bonuses…</p>';
        try {
            await ensureCasinoBonusSlugMap();
            const list = [...(bonusesListRowsCache || [])].sort((a, b) => {
                const ta = bonusEntryAttr(a);
                const tb = bonusEntryAttr(b);
                const da = new Date(ta?.publishedAt || ta?.published_at || ta?.createdAt || 0).getTime();
                const db = new Date(tb?.publishedAt || tb?.published_at || tb?.createdAt || 0).getTime();
                return db - da;
            });
            if (list.length === 0) {
                grid.innerHTML =
                    '<p class="bonuses-grid-empty">No bonuses published yet.</p>';
                return;
            }
            grid.innerHTML = list.map((row, i) => renderBonusCardHtml(row, i)).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
            grid.querySelectorAll('.bonus-card.reveal').forEach((el, i) => {
                setTimeout(() => el.classList.add('active'), 60 + i * 90);
            });
        } catch (e) {
            console.error(e);
            grid.innerHTML =
                '<p class="bonuses-grid-error">Could not load bonuses. Run <code>npm start</code> and ensure the backend API is running (same origin as this site).</p>';
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

function populateBonusDetailPage(attr, slug) {
    const name = firstNonEmptyAttr(attr, ['Title', 'title']) || 'Casino bonus';
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

    const amountLine = firstNonEmptyAttr(attr, ['BonusAmount', 'bonusAmount']) || '';
    const amountEl = document.getElementById('bd-amount');
    if (amountEl) amountEl.textContent = amountLine;

    const descEl = document.getElementById('bd-desc');
    const descPlain = firstNonEmptyAttr(attr, ['Description', 'ShortDescription']) || '';
    if (descEl) {
        descEl.textContent = descPlain;
        descEl.style.display = descPlain ? '' : 'none';
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

    const titleEl = document.getElementById('bd-title');
    if (titleEl) titleEl.textContent = name;

    const vf = formatBonusDateDisplay(attr.ValidFrom || attr.validFrom);
    const exp = formatBonusDateDisplay(attr.ExpiryDate || attr.expiryDate);
    const datesEl = document.getElementById('bd-dates');
    if (datesEl) {
        if (vf || exp) {
            const parts = [];
            if (vf) parts.push(`Valid from ${vf}`);
            if (exp) parts.push(`Expires ${exp}`);
            datesEl.textContent = parts.join(' · ');
            datesEl.hidden = false;
        } else {
            datesEl.hidden = true;
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
        img.alt = name;
        img.hidden = false;
        const useLogo = heroIsLogo && !!heroUrl;
        frame.classList.toggle('bd-hero-frame--logo', useLogo);
        frame.classList.toggle('bd-hero-frame--cover', !useLogo);
        img.classList.toggle('bd-hero-img--logo', useLogo);
    }

    const pubOriginBonus = getPublicSiteOrigin();
    const defaultShareImgBonus = `${pubOriginBonus}/assets/img/888review-siteicon.png`;
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
    const relatedCasino = getRelatedCasinoFromBonus(attr);
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
                name: 'Casino bonuses',
                item: `${pub}/bonuses`,
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
        root.style.opacity = '1';
    } catch (e) {
        console.error('Failed to load bonus:', e);
        showBonusDetailError();
    }
}

async function bootApp() {
    try {
        await ensureStrapiPublicUrl();
    } catch (e) {
        console.warn('Content API public URL:', e);
    }
    try {
        await ensureCasinoBonusSlugMap();
    } catch (e) {
        console.warn('Bonus / casino map:', e);
    }
    await Promise.all([loadHomeFeaturedCasino(), loadCasinos(), loadProviders()]);
    initProvidersListingPage();
    initSlotsListingPage();
    initCasinosListingPage();
    initBonusesPage();
    initBonusDetailPage();
    initReviewPage();
    initProviderDetailPage();
    initSlotDetailPage();
    initGuidesPage();
    initNewsPage();
    const guidePostAttr = await initGuidePostPage();
    await populateFooterRelatedPosts(guidePostAttr);
}

function runBootApp() {
    bootApp().catch((e) => console.error(e));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runBootApp);
} else {
    runBootApp();
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
        grid.innerHTML =
            '<p style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #64748b;">Loading…</p>';

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
                grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #b91c1c;">${apiErrorMessage(res.status, json)}</p>`;
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
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #e11d48;">Could not reach the API. Run <code>npm start</code>.</p>`;
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
        grid.innerHTML =
            '<p style="grid-column: 1 / -1; text-align: center; padding: 48px; color: #64748b;">Loading…</p>';

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
                grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #b91c1c;">${apiErrorMessage(res.status, json)}</p>`;
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
            grid.innerHTML = `<p style="grid-column: 1 / -1; text-align:center; padding: 48px; color: #e11d48;">Could not load slots. Run <code>npm start</code> and open this site from the same address, or try again later.</p>`;
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
// Casinos Listing Page: Dynamic Strapi Integration
// Only runs when the #casinos-listing-container element exists
// ============================================================
function initCasinosListingPage() {
    const container = document.getElementById('casinos-listing-container');
    if (!container) return; // Not on the casinos listing page, bail out

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
        const logoHtml = logoUrl
            ? `<img src="${logoUrl}" alt="${attr.Name}" style="max-width:90%; max-height:90%; object-fit:contain;">`
            : `<span class="logo-text" style="color:#fff;font-size:0.7rem;font-weight:800;text-align:center;padding:4px;">${attr.Name || ''}</span>`;

        const tierBadge = attr.IsTierOne
            ? `<span class="badge badge-light badge-sm">TIER ONE</span>` : '';

        const bonusAmt = casinoBonusAmountDisplay(attr);
        const bonus = bonusAmt
            ? `<div class="stat-col stat-col--bonus"><span class="stat-label">CASINO BONUS</span><span class="stat-value primary">${escapeHtml(bonusAmt)}</span></div>`
            : '';
        const payoutSpeed = casinoPayoutSpeedDisplay(attr);
        const gameCount = casinoGameCountDisplay(attr);
        const payout = payoutSpeed
            ? `<div class="stat-col"><span class="stat-label">PAYOUT SPEED</span><span class="stat-value">${escapeHtml(payoutSpeed)}</span></div>` : '';
        const games = gameCount
            ? `<div class="stat-col"><span class="stat-label">GAMES COUNT</span><span class="stat-value">${escapeHtml(gameCount)}</span></div>` : '';

        const reviewLink = casinoReviewPath(attr.Slug);
        const visitHref = escapeHtml(casinoVisitSiteHref(attr));
        const visitRel = casinoVisitSiteIsExternal(attr)
            ? ' target="_blank" rel="noopener noreferrer"'
            : '';

        const rankOrdinal = homeRankOrdinal(listPos);

        return `
        <article class="listing-card">
            <div class="listing-card__rank" aria-label="Rank ${listPos} in this list">
                <span class="listing-card__rank-ordinal">${rankOrdinal}</span>
            </div>
            <div class="card-logo-area">
                <div class="casino-logo-circle luxury-dark" style="background:#0f172a;">
                    ${logoHtml}
                </div>
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
                <a href="${visitHref}" class="btn btn-primary btn-block"${visitRel}>VISIT SITE</a>
                <a href="${reviewLink}" class="read-review-link">READ REVIEW</a>
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
        container.innerHTML = `<p style="text-align:center; padding: 60px; color: #64748b;">Loading…</p>`;

        let qs = `populate=*&sort=${currentSort}&pagination[page]=${currentPage}&pagination[pageSize]=${currentPageSize}`;
        if (filterTierOne) qs += `&filters[IsTierOne][$eq]=true`;

        const clearListingMinHeight = () => {
            container.style.minHeight = '';
        };

        try {
            const res = await fetchCasinosWithBonusPopulate(qs);
            const json = await res.json();
            if (!res.ok) {
                clearListingMinHeight();
                container.innerHTML = `<p style="text-align:center; padding: 60px; color: #e11d48;">${apiErrorMessage(res.status, json)}</p>`;
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
            container.innerHTML = `<p style="text-align:center; padding: 60px; color: #e11d48;">Could not reach the API proxy. Run <code>npm start</code> and open <code>http://localhost:3000</code>.</p>`;
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

function casinoProsConsLine(item) {
    if (item == null) return '';
    if (typeof item === 'string') return item.trim();
    const o = item.attributes != null ? item.attributes : item;
    return String(o.Text ?? o.text ?? '').trim();
}

/** Render single casino review (`review.html` /cr-page). All visible copy from Strapi entry `attr`. */
function renderCasinoReviewPage(attr) {
    const name = attr.Name || 'Casino';
    document.title = `${name} Review | 888reviews`;
    setReviewMetaDescription(attr);

    const crumbName = document.getElementById('cr-crumb-name');
    if (crumbName) crumbName.textContent = name;

    /* Hero: body */
    const nameEl = document.getElementById('cr-name');
    if (nameEl) nameEl.textContent = name;

    const sloganEl = document.getElementById('cr-slogan');
    if (sloganEl) {
        const s = attr.HeroSlogan != null ? String(attr.HeroSlogan).trim() : '';
        sloganEl.textContent = s;
    }

    const excerptEl = document.getElementById('cr-excerpt');
    if (excerptEl) {
        excerptEl.textContent =
            richTextToPlainText(attr.ReviewExcerpt ?? attr.reviewExcerpt) || '';
    }

    const badgeTextEl = document.getElementById('cr-badge-text');
    if (badgeTextEl) {
        badgeTextEl.textContent = attr.IsTierOne ? "Editor's Choice" : 'Review';
    }

    /* Hero: media / editor photo in left column; logo-only uses inline heading logo (no big tile) */
    const heroImg = document.getElementById('cr-hero-img');
    const heroVisual = document.getElementById('cr-hero-visual');
    const heroGrid = document.getElementById('cr-hero-grid');
    const headingEl = document.getElementById('cr-heading');
    const headingLogo = document.getElementById('cr-heading-logo');
    const headingLogoWrap = document.getElementById('cr-heading-logo-wrap');
    const heroResolved = casinoHeroImageUrl(attr);
    const fallback = CASINO_REVIEW_PLACEHOLDER_IMAGES[0];
    const heroHasEditorPhoto = hasHeroEditorImage(attr);
    const logoInlineMode = !heroHasEditorPhoto && !!heroResolved;

    if (heroImg) {
        heroImg.alt = `${name}`;
        heroImg.dataset.fallback = fallback;

        if (logoInlineMode && headingLogo && headingLogoWrap) {
            if (heroVisual) heroVisual.hidden = true;
            heroGrid?.classList.add('cr-hero-grid--no-media');
            heroImg.removeAttribute('src');
            if (heroVisual) heroVisual.classList.remove('cr-hero-visual--logo');
            headingLogo.src = logoImgSrcForDisplay(heroResolved);
            headingLogo.alt = name ? `${name} logo` : 'Casino logo';
            headingLogo.referrerPolicy = 'no-referrer';
            headingLogoWrap.hidden = false;
            headingEl?.classList.add('cr-heading--with-logo');
            headingLogo.onerror = () => {
                headingLogoWrap.hidden = true;
                headingEl?.classList.remove('cr-heading--with-logo');
                if (heroVisual) heroVisual.hidden = false;
                heroGrid?.classList.remove('cr-hero-grid--no-media');
                heroImg.src = heroResolved || fallback;
                if (heroVisual) {
                    heroVisual.classList.toggle(
                        'cr-hero-visual--logo',
                        !heroHasEditorPhoto && !!heroResolved,
                    );
                }
                heroImg.onerror = function () {
                    if (this.src !== this.dataset.fallback) {
                        this.onerror = null;
                        this.src = this.dataset.fallback;
                        if (heroVisual) heroVisual.classList.remove('cr-hero-visual--logo');
                    }
                };
            };
        } else {
            if (heroVisual) heroVisual.hidden = false;
            heroGrid?.classList.remove('cr-hero-grid--no-media');
            if (headingLogoWrap) headingLogoWrap.hidden = true;
            headingEl?.classList.remove('cr-heading--with-logo');
            heroImg.src = heroResolved || fallback;
            if (heroVisual) {
                heroVisual.classList.toggle(
                    'cr-hero-visual--logo',
                    !heroHasEditorPhoto && !!heroResolved,
                );
            }
            heroImg.onerror = function () {
                if (this.src !== this.dataset.fallback) {
                    this.onerror = null;
                    this.src = this.dataset.fallback;
                    if (heroVisual) heroVisual.classList.remove('cr-hero-visual--logo');
                }
            };
        }
    }

    /* Hero CTA (inline ad under Casino Information is a static sample in HTML) */
    const playEl = document.getElementById('cr-play');
    const affUrl = casinoAffiliateUrl(attr);
    if (playEl) {
        playEl.href = affUrl || '#';
        if (affUrl) {
            playEl.target = '_blank';
            playEl.setAttribute('rel', 'noopener noreferrer sponsored');
        } else {
            playEl.removeAttribute('target');
            playEl.setAttribute('rel', 'noopener noreferrer sponsored');
        }
    }

    const termsBtn = document.getElementById('cr-terms');
    if (termsBtn) {
        const termsUrl = casinoTermsUrl(attr);
        if (termsUrl) {
            termsBtn.href = termsUrl;
            termsBtn.target = '_blank';
            termsBtn.rel = 'noopener noreferrer';
            termsBtn.style.display = '';
        } else {
            termsBtn.style.display = 'none';
        }
    }

    /* Sidebar: score ring (0-5 scale) */
    const score5 = getCuratorScoreOutOfFive(attr);
    const scoreEl = document.getElementById('cr-score');
    if (scoreEl) {
        scoreEl.textContent = score5 != null ? score5.toFixed(1) : '-';
    }

    const ringFill = document.getElementById('cr-ring-fill');
    if (ringFill) {
        const circumference = 2 * Math.PI * 52;
        ringFill.style.strokeDasharray = circumference.toFixed(2);
        if (score5 != null) {
            const pct = Math.min(Math.max(score5 / 5, 0), 1);
            requestAnimationFrame(() => {
                ringFill.style.strokeDashoffset = (circumference * (1 - pct)).toFixed(2);
            });
        } else {
            ringFill.style.strokeDashoffset = circumference.toFixed(2);
        }
    }

    const starsEl = document.getElementById('cr-stars');
    if (starsEl) {
        starsEl.innerHTML = score5 != null ? renderStars(attr) : '';
    }

    /* Bonus copy for verdict sidebar (hero bonus card removed) */
    const bonusAmt = casinoBonusAmountDisplay(attr);
    const bonusTag =
        firstNonEmptyAttr(attr, ['BonusHeading', 'WelcomePackageLabel', 'bonusHeading']) ||
        casinoBonusLabelDisplay(attr);
    const bonusDesc =
        (attr.BonusLabel != null ? String(attr.BonusLabel).trim() : '') ||
        firstNonEmptyAttr(collectBonusLikeObjects(attr)[0] || {}, ['Description', 'Subtitle', 'ShortDescription']) ||
        '';

    applyVerdictBonusSidebar(attr, bonusTag, bonusAmt, bonusDesc);

    /* Info panel (quick facts) */
    populateInfoItem('cr-info-license', 'cr-val-license', firstNonEmptyAttr(attr, [
        'License', 'LicenseInfo', 'GamblingLicense', 'license',
    ]));
    populateInfoItem('cr-info-founded', 'cr-val-founded', firstNonEmptyAttr(attr, [
        'Founded', 'YearFounded', 'EstablishedYear', 'founded',
    ]));
    populateInfoItem('cr-info-owner', 'cr-val-owner', firstNonEmptyAttr(attr, [
        'Owner', 'Operator', 'OperatorName', 'CompanyName', 'owner',
    ]));
    populateInfoItem('cr-info-games', 'cr-val-games', casinoGameCountDisplay(attr));
    populateInfoItem('cr-info-payout', 'cr-val-payout', casinoPayoutSpeedDisplay(attr));
    populateInfoItem('cr-info-mindeposit', 'cr-val-mindeposit', firstNonEmptyAttr(attr, [
        'MinDeposit', 'MinimumDeposit', 'minDeposit',
    ]));
    populateInfoItem('cr-info-languages', 'cr-val-languages', casinoLanguagesDisplay(attr));

    const payValEl = document.getElementById('cr-val-payments');
    const payWrap = document.getElementById('cr-info-payments');
    if (payValEl && payWrap) {
        const chipsHtml = renderCasinoPaymentChipsHtml(attr);
        if (chipsHtml) {
            payValEl.innerHTML = chipsHtml;
            payWrap.hidden = false;
        }
    }

    /* Analysis */
    const analysisSection = document.getElementById('cr-analysis-section');
    const rawCards = normalizeCasinoRepeatable(attr.AnalysisCards);
    if (analysisSection && rawCards.length > 0) {
        analysisSection.hidden = false;
        showNavTab('cr-nav-analysis');
        const tEl = document.getElementById('cr-analysis-title');
        const dEl = document.getElementById('cr-analysis-dek');
        if (tEl) tEl.textContent = firstNonEmptyAttr(attr, ['AnalysisSectionTitle', 'analysisSectionTitle']) || 'Analysis';
        if (dEl) dEl.textContent = firstNonEmptyAttr(attr, ['AnalysisSectionDek', 'AnalysisSectionSubtitle', 'analysisSectionDek']) || '';
        const grid = document.getElementById('cr-analysis-grid');
        if (grid) {
            grid.innerHTML = rawCards.map((raw) => {
                const c = raw.attributes != null ? raw.attributes : raw;
                const icon = safeLucideIcon(c.Icon ?? c.icon);
                const score = escapeHtml(c.Score != null ? String(c.Score) : '');
                const title = escapeHtml(c.Title != null ? String(c.Title) : '');
                const desc = escapeHtml(c.Desc != null ? String(c.Desc) : c.Description != null ? String(c.Description) : '');
                return `<div class="cr-ac-card">
                    <div class="cr-ac-top">
                        <div class="cr-ac-icon"><i data-lucide="${icon}"></i></div>
                        <div class="cr-ac-score">${score}</div>
                    </div>
                    <h3 class="cr-ac-title">${title}</h3>
                    <p class="cr-ac-desc">${desc}</p>
                </div>`;
            }).join('');
        }
    } else if (analysisSection) {
        analysisSection.hidden = true;
    }

    /* Gallery */
    const galSection = document.getElementById('cr-gallery-section');
    const galleryUrls = collectCasinoGalleryUrls(attr).slice(0, REVIEW_GALLERY_MAX_IMAGES);
    if (galSection && galleryUrls.length > 0) {
        galSection.hidden = false;
        showNavTab('cr-nav-gallery');
        const gh = document.getElementById('cr-gallery-title');
        const gd = document.getElementById('cr-gallery-dek');
        if (gh) gh.textContent = firstNonEmptyAttr(attr, ['GallerySectionTitle', 'gallerySectionTitle']) || 'Gallery';
        if (gd) gd.textContent = firstNonEmptyAttr(attr, ['GallerySectionDek', 'GallerySectionSubtitle', 'gallerySectionDek']) || '';
        const galleryGrid = document.getElementById('cr-gallery-grid');
        if (galleryGrid) {
            const safeName = escapeHtml(name);
            galleryGrid.innerHTML = galleryUrls.map((src, i) => {
                const safeSrc = escapeHtml(src);
                return `<figure class="cr-gallery-item"><img src="${safeSrc}" alt="${safeName} - ${i + 1}" class="cr-gallery-img" loading="lazy" decoding="async"></figure>`;
            }).join('');
            wireReviewGalleryImages(galleryGrid);
        }
    } else if (galSection) {
        galSection.hidden = true;
    }

    /* Verdict / article body */
    const verdictEl = document.getElementById('cr-verdict-title');
    if (verdictEl) {
        verdictEl.textContent =
            firstNonEmptyAttr(attr, ['VerdictTitle', 'ReviewVerdictTitle', 'verdictTitle']) || 'Our Verdict';
    }
    const reviewMain = attr.ReviewBody ?? attr.reviewBody ?? firstNonEmptyAttr(attr, ['ReviewBodyCopy', 'reviewBodyCopy']);
    setRichTextHtml(document.getElementById('cr-body-top'), reviewMain ?? '');
    const bottomRaw = attr.ReviewBodyBottom ?? attr.VerdictBottom ?? attr.SecondaryReviewBody ?? attr.reviewBodyBottom ?? '';
    const bottomHost = document.getElementById('cr-body-bottom');
    const bottomPanel = document.getElementById('cr-panel-bottom');
    setRichTextHtml(bottomHost, bottomRaw);
    const secondaryWrap = document.getElementById('cr-verdict-secondary-wrap');
    if (bottomPanel) {
        const hasBottom = !!(bottomHost && bottomHost.innerHTML.trim());
        bottomPanel.hidden = !hasBottom;
        if (secondaryWrap) secondaryWrap.hidden = !hasBottom;
    }

    /* Pros / Cons */
    const prosLines = normalizeCasinoRepeatable(attr.Pros).map(casinoProsConsLine).filter(Boolean);
    const consLines = normalizeCasinoRepeatable(attr.Cons).map(casinoProsConsLine).filter(Boolean);
    const pcWrap = document.getElementById('cr-pros-cons');
    const colPros = document.getElementById('cr-col-pros');
    const colCons = document.getElementById('cr-col-cons');
    const prosList = document.getElementById('cr-pros-list');
    const consList = document.getElementById('cr-cons-list');
    if (pcWrap && prosList && consList && colPros && colCons) {
        if (prosLines.length === 0 && consLines.length === 0) {
            pcWrap.hidden = true;
        } else {
            pcWrap.hidden = false;
            showNavTab('cr-nav-proscons');
            colPros.hidden = prosLines.length === 0;
            colCons.hidden = consLines.length === 0;
            prosList.innerHTML = prosLines
                .map((t) => `<li><i data-lucide="check-circle-2"></i> ${escapeHtml(t)}</li>`)
                .join('');
            consList.innerHTML = consLines
                .map((t) => `<li><i data-lucide="x-circle"></i> ${escapeHtml(t)}</li>`)
                .join('');
        }
    }

    /* Trust badges */
    const trustSection = document.getElementById('cr-trust-section');
    const trustInner = document.getElementById('cr-trust-badges');
    const badgeRows = normalizeCasinoRepeatable(attr.TrustBadges);
    if (trustSection && trustInner) {
        if (badgeRows.length > 0) {
            trustSection.hidden = false;
            trustInner.innerHTML = badgeRows
                .map((raw) => {
                    const b = raw.attributes != null ? raw.attributes : raw;
                    const icon = safeLucideIcon(b.Icon ?? b.icon);
                    const label = escapeHtml(b.Label != null ? String(b.Label) : '');
                    return `<div class="cr-trust-item"><i data-lucide="${icon}"></i><span>${label}</span></div>`;
                })
                .join('');
        } else {
            trustSection.hidden = true;
            trustInner.innerHTML = '';
        }
    }

    setReviewCanonicalAndSocial(name);

    /* Section nav: active-state tracking on scroll */
    initSectionNavScrollSpy();
}

function populateInfoItem(wrapId, valId, value) {
    const wrap = document.getElementById(wrapId);
    const valEl = document.getElementById(valId);
    if (!wrap || !valEl) return;
    if (value) {
        valEl.textContent = value;
        wrap.hidden = false;
    }
}

function showNavTab(id) {
    const li = document.getElementById(id);
    if (li) li.hidden = false;
}

function initSectionNavScrollSpy() {
    const nav = document.getElementById('cr-section-nav');
    if (!nav) return;
    const links = nav.querySelectorAll('.cr-nav-links a');
    if (links.length === 0) return;

    const sectionIds = Array.from(links).map((a) => a.getAttribute('href').replace('#', '')).filter(Boolean);
    const headerOffset = () => {
        const h = document.getElementById('main-header');
        return (h ? h.offsetHeight : 64) + nav.offsetHeight + 8;
    };

    links.forEach((a) => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById(a.getAttribute('href').replace('#', ''));
            if (target) {
                window.scrollTo({ top: target.offsetTop - headerOffset() + 4, behavior: 'smooth' });
            }
        });
    });

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const scrollY = window.scrollY + headerOffset();
            let current = sectionIds[0];
            for (const id of sectionIds) {
                const el = document.getElementById(id);
                if (el && el.offsetTop <= scrollY) current = id;
            }
            links.forEach((a) => {
                a.classList.toggle('active', a.getAttribute('href') === '#' + current);
            });
            ticking = false;
        });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/** Try several filter shapes (slug vs Slug, $eq vs $eqi) so /casino/w88 matches stored slug casing, etc. */
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

/**
 * Match URL slug to a Strapi casino row when filters[Slug] fails (schema/version quirks).
 */
function casinoRowMatchesSlug(entry, wantedRaw) {
    const wanted = decodeURIComponent(String(wantedRaw))
        .trim()
        .toLowerCase();
    if (!wanted) return false;
    const attr = attrFromCasinoEntry(entry);
    if (!attr) return false;
    const slugVal = firstNonEmptyAttr(attr, ['Slug', 'slug', 'URLSlug', 'urlSlug'])
        .trim()
        .toLowerCase();
    if (slugVal === wanted) return true;
    if (slugVal.startsWith(`${wanted}-`) || slugVal.startsWith(`${wanted}_`)) return true;
    const name = String(attr.Name || attr.name || '').trim();
    if (name && slugifyLabel(name) === wanted) return true;
    const esc = wanted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${esc}\\b`, 'i').test(name);
}

/**
 * Filter by slug, then scan ranked casino pages (same idea as fetchProviderBySlug).
 */
async function fetchCasinoBySlugWithListFallback(slug) {
    const first = await fetchCasinoBySlug(slug);
    if (casinoAttrFromFetchResult(first)) {
        return first;
    }

    try {
        let page = 1;
        const pageSize = 50;
        let pageCount = 1;
        do {
            const qs = `populate=*&sort=Rank:asc&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;
            const res = await fetchCasinosWithBonusPopulate(qs);
            const json = await res.json();
            if (!res.ok || !json.data?.length) {
                return first;
            }
            const found = json.data.find((e) => casinoRowMatchesSlug(e, slug));
            if (found) {
                return { res, json: { data: [found], meta: json.meta } };
            }
            const meta = json.meta?.pagination;
            pageCount = meta?.pageCount ?? 1;
            page += 1;
        } while (page <= pageCount && page <= 100);
    } catch (e) {
        console.warn('fetchCasinoBySlug list fallback failed', e);
    }
    return first;
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

/** Sets --cr-header-height on :root so .cr-hero-section min-height matches the sticky header. */
function syncReviewHeroLayout() {
    const header = document.getElementById('main-header');
    const h = header && header.offsetHeight > 0 ? header.offsetHeight : 80;
    document.documentElement.style.setProperty('--cr-header-height', `${h}px`);
}

async function initReviewPage() {
    const reviewWrap = document.getElementById('cr-page');
    if (!reviewWrap || !document.getElementById('cr-name')) {
        return;
    }

    syncReviewHeroLayout();
    if (!window.__reviewHeroLayoutBound) {
        window.__reviewHeroLayoutBound = true;
        window.addEventListener('resize', syncReviewHeroLayout, { passive: true });
        window.addEventListener('load', syncReviewHeroLayout, { passive: true });
    }

    const slugFromPath = window.location.pathname.match(/^\/casino\/([^/]+)\/?$/);
    const slug = slugFromPath
        ? decodeURIComponent(slugFromPath[1])
        : new URLSearchParams(window.location.search).get('slug');

    if (!slug) {
        showReviewError();
        return;
    }

    if (reviewWrap) {
        reviewWrap.dataset.casinoSlug = slug;
    }

    try {
        const { res, json } = await fetchCasinoBySlugWithListFallback(slug);
        if (!res || !res.ok) {
            console.error(res ? apiErrorMessage(res.status, json) : 'No response');
            showReviewError();
            return;
        }
        const { data } = json;

        if (!data || data.length === 0) {
            showReviewError();
            return;
        }

        const attr = attrFromCasinoEntry(data[0]);
        renderCasinoReviewPage(attr);

        if (typeof lucide !== 'undefined') lucide.createIcons();
        syncReviewHeroLayout();
        reviewWrap.style.opacity = '1';
    } catch (e) {
        console.error('Failed to load review:', e);
        showReviewError();
    }
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

    try {
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

        const attr = data[0].attributes || data[0];
        populateProviderDetailPage(attr);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (e) {
        console.error('Failed to load provider:', e);
        showProviderError();
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
 * Provider detail renderer — uses ONLY the CMS fields we actually store on the
 * Provider content type: Name, Slug, TierBadge, IsTopProvider, RatingScore,
 * Rank, GamePortfolioCount, FoundedYear, Headquarters, FlagshipTitles,
 * DossierLink, Excerpt, ReviewBody, updatedAt, SEOTitle, SEODescription,
 * CanonicalURL. Any field not present in the payload is shown as an em dash
 * (no fallback copy, no alias fields).
 */
function populateProviderDetailPage(attr) {
    const DASH = '—';
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

    // Chips: TierBadge + IsTopProvider
    const tierChip = document.getElementById('pv-tier-chip');
    const tier = attr.TierBadge ? String(attr.TierBadge).trim() : '';
    if (tierChip) {
        if (tier) {
            tierChip.textContent = tier.toUpperCase();
            tierChip.hidden = false;
        } else {
            tierChip.hidden = true;
        }
    }
    const topChip = document.getElementById('pv-top-chip');
    if (topChip) topChip.hidden = attr.IsTopProvider !== true;

    // Numeric / string values used by hero, facts strip, and summary aside
    const scoreFive = getCuratorScoreOutOfFive(attr);
    const scoreDisplay = scoreFive != null ? scoreFive.toFixed(1) : DASH;
    const scoreLine = scoreFive != null ? `${scoreFive.toFixed(1)} / 5` : DASH;

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

    // Hero score card + sidebar summary: logos (Cover / Hero / fallback from getProviderCardImageUrl)
    const logoUrl = getProviderCardImageUrl(attr);
    const logoMatDark = providerLogoMatIsDark(attr);
    const heroLogoMat = document.getElementById('pv-hero-score-logo-mat');
    const heroLogoImg = document.getElementById('pv-hero-score-logo-img');
    const sumLogoMat = document.getElementById('pv-summary-logo-mat');
    const sumLogoImg = document.getElementById('pv-summary-logo-img');
    if (heroLogoImg && heroLogoMat) {
        heroLogoImg.src = logoUrl;
        heroLogoImg.alt = `${name} logo`;
        heroLogoMat.classList.toggle('pc-image-wrap--mat-dark', logoMatDark);
    }
    if (sumLogoImg && sumLogoMat) {
        sumLogoImg.src = logoUrl;
        sumLogoImg.alt = `${name} logo`;
        sumLogoMat.classList.toggle('pc-image-wrap--mat-dark', logoMatDark);
    }

    // Hero score card
    const scoreNumEl = document.getElementById('pv-score-num');
    if (scoreNumEl) scoreNumEl.textContent = scoreDisplay;
    const scoreStars = document.getElementById('pv-score-stars');
    if (scoreStars) {
        scoreStars.innerHTML = scoreFive != null ? renderStars(attr) : '';
    }
    const rankEl = document.getElementById('pv-rank');
    if (rankEl) rankEl.textContent = rankDisplay;
    const portEl = document.getElementById('pv-portfolio');
    if (portEl) portEl.textContent = portDisplay;
    const foundedEl = document.getElementById('pv-founded');
    if (foundedEl) foundedEl.textContent = foundedDisplay;
    const hqEl = document.getElementById('pv-headquarters');
    if (hqEl) hqEl.textContent = hqDisplay;

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
    if (!shareImgPv) shareImgPv = `${pubOriginPv}/assets/img/888review-siteicon.png`;
    if (pvOgImg) pvOgImg.setAttribute('content', shareImgPv);
    if (pvTwImg) pvTwImg.setAttribute('content', shareImgPv);
    if (pvTwTitle) pvTwTitle.setAttribute('content', pageTitlePv);
    if (pvTwDesc && descOgPv) pvTwDesc.setAttribute('content', descOgPv.slice(0, 320));
}

function showReviewError() {
    const main = document.getElementById('cr-page');
    const err = document.getElementById('cr-error');
    if (main) main.style.display = 'none';
    if (err) {
        err.style.display = 'block';
        if (typeof lucide !== 'undefined') lucide.createIcons({ nameAttr: 'data-lucide' });
    }
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

    const providerLine = document.getElementById('sv-provider-line');
    if (providerLine) {
        const p = slotProviderDisplayName(attr);
        providerLine.textContent = p ? p.toUpperCase() : 'PROVIDER TBC';
    }

    const heroImg = document.getElementById('sv-hero-image');
    if (heroImg) {
        const src = getSlotCardImageUrl(attr);
        heroImg.src = src;
        const alt = firstNonEmptyAttr(attr, ['CoverImageAlt', 'coverImageAlt']) || title;
        heroImg.alt = alt;
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
    let shareImgSv = '';
    if (heroImg && heroImg.getAttribute('src')) shareImgSv = heroImg.getAttribute('src');
    if (shareImgSv && shareImgSv.startsWith('/')) shareImgSv = `${pubOriginSv}${shareImgSv}`;
    if (!shareImgSv) shareImgSv = `${pubOriginSv}/assets/img/888review-siteicon.png`;
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

        const attr = data[0].attributes || data[0];
        populateSlotDetailPage(attr);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const slotRoot = document.getElementById('slot-page-root');
        if (slotRoot) {
            slotRoot.querySelectorAll('.reveal:not(.active)').forEach((el) => el.classList.add('active'));
        }
        bindSlotVerdictSidebarStickyState();
    } catch (e) {
        console.error('Failed to load slot:', e);
        showSlotError();
    }
}

