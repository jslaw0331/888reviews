/**
 * Player reviews: list + aggregate summary + JSON-LD for casino / slot / provider pages.
 * Depends on Strapi `reviews` collection and GET /api/reviews via server proxy.
 *
 * Strapi admin prerequisites:
 * - Settings → Users & Permissions → Public: enable `review.find` and `review.findOne`
 *   (REST URL is plural: `/api/reviews`, not `/api/review`.)
 * - If your collection uses another API ID, add:
 *   <meta name="player-reviews-api" content="your-plural-name"> in the page head.
 * - `Status` filter uses value `Approved` (case-sensitive). Adjust filters if your enum differs.
 * - Default new reviews to `draft` in the content-type so nothing auto-publishes.
 */
(function () {
    'use strict';

    const PAGE_SIZE = 5;
    const SUMMARY_PAGE_SIZE = 100;

    const PR_EMPTY_TITLE = 'No reviews yet';
    const PR_EMPTY_DEK = '';
    const PR_ERROR_TITLE = PR_EMPTY_TITLE;
    const PR_ERROR_DEK = PR_EMPTY_DEK;

    /** @type {{ id: string, label: string }[]} */
    const SORT_OPTIONS = [
        { id: 'newest', label: 'Newest' },
        { id: 'oldest', label: 'Oldest' },
        { id: 'most_liked', label: 'Most Liked' },
        { id: 'highest_rated', label: 'Highest Rated' },
        { id: 'lowest_rated', label: 'Lowest Rated' },
    ];

    /** Strapi REST `sort=` value (single field). */
    function sortQueryFor(sortId) {
        const map = {
            newest: 'PostedAt:desc',
            oldest: 'PostedAt:asc',
            most_liked: 'HelpfulCount:desc',
            highest_rated: 'RatingScore:desc',
            lowest_rated: 'RatingScore:asc',
        };
        return map[sortId] || map.newest;
    }

    function getPostedTime(attr) {
        const p = attr.PostedAt || attr.postedAt || attr.publishedAt || attr.createdAt;
        const t = p ? new Date(p).getTime() : 0;
        return Number.isFinite(t) ? t : 0;
    }

    function getRatingVal(attr) {
        const r = Number(attr.RatingScore ?? attr.ratingScore);
        return Number.isFinite(r) ? r : null;
    }

    function getHelpfulVal(attr) {
        return Number(attr.HelpfulCount ?? attr.helpfulCount ?? 0) || 0;
    }

    /** Client-side ordering when the full list was loaded for the summary. */
    function sortAttrs(attrs, sortId) {
        const copy = attrs.slice();
        const byPostedDesc = (a, b) => getPostedTime(b) - getPostedTime(a);
        const byPostedAsc = (a, b) => getPostedTime(a) - getPostedTime(b);

        switch (sortId) {
            case 'newest':
                copy.sort(byPostedDesc);
                break;
            case 'oldest':
                copy.sort(byPostedAsc);
                break;
            case 'most_liked':
                copy.sort((a, b) => getHelpfulVal(b) - getHelpfulVal(a) || byPostedDesc(a, b));
                break;
            case 'highest_rated':
                copy.sort((a, b) => {
                    const ra = getRatingVal(a);
                    const rb = getRatingVal(b);
                    if (ra == null && rb == null) return byPostedDesc(a, b);
                    if (ra == null) return 1;
                    if (rb == null) return -1;
                    return rb - ra || byPostedDesc(a, b);
                });
                break;
            case 'lowest_rated':
                copy.sort((a, b) => {
                    const ra = getRatingVal(a);
                    const rb = getRatingVal(b);
                    if (ra == null && rb == null) return byPostedAsc(a, b);
                    if (ra == null) return 1;
                    if (rb == null) return -1;
                    return ra - rb || byPostedAsc(a, b);
                });
                break;
            default:
                copy.sort(byPostedDesc);
        }
        return copy;
    }

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

    const API_BASE = getApiBaseUrl();

    function escapeHtml(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function initial(name) {
        const s = String(name || '').trim();
        return s ? s[0].toUpperCase() : '?';
    }

    function formatFullDate(iso) {
        try {
            return new Date(iso).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    }

    function relativeDate(iso) {
        if (!iso) return '';
        const then = new Date(iso).getTime();
        if (!Number.isFinite(then)) return '';
        const diff = Math.max(0, Date.now() - then);
        const day = 86400000;
        if (diff < day) return 'today';
        if (diff < 2 * day) return 'yesterday';
        if (diff < 30 * day) {
            const d = Math.round(diff / day);
            return `${d} day${d === 1 ? '' : 's'} ago`;
        }
        if (diff < 365 * day) {
            const m = Math.round(diff / (30 * day));
            return `${m} month${m === 1 ? '' : 's'} ago`;
        }
        const y = Math.round(diff / (365 * day));
        return `${y} year${y === 1 ? '' : 's'} ago`;
    }

    function clampScore(v) {
        const n = Number(v);
        if (!Number.isFinite(n)) return null;
        return Math.max(0, Math.min(5, n));
    }

    /** Whole numbers without decimals (5 not 5.0); uses script.js helper when available. */
    function formatRatingDisplay(value) {
        if (typeof formatRatingNumber === 'function') return formatRatingNumber(value);
        const n = Number(value);
        if (!Number.isFinite(n)) return '';
        const rounded = Math.round(n * 10) / 10;
        return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    }

    /** Same star meter markup as script.js renderStars (0–5). */
    function renderStarsMeter(score5) {
        const s = Number.isFinite(score5) ? Math.max(0, Math.min(5, score5)) : 0;
        const aria = `${formatRatingDisplay(s)} out of 5 stars`;
        let units = '';
        for (let i = 1; i <= 5; i++) {
            const fillPct = Math.min(100, Math.max(0, (s - (i - 1)) * 100));
            const fp = Number.isFinite(fillPct) ? fillPct : 0;
            units += `<span class="star-unit"><span class="star-unit__track" aria-hidden="true">★</span><span class="star-unit__fill" style="width:${fp}%" aria-hidden="true">★</span></span>`;
        }
        return `<span class="stars-meter stars-meter--units" role="img" aria-label="${escapeHtml(aria)}">${units}</span>`;
    }

    function avatarUrlFromAttr(attr) {
        const av = attr.Avatar ?? attr.avatar;
        if (!av) return '';

        const data = av.data != null ? av.data : av;
        const node = Array.isArray(data) ? data[0] : data;
        if (!node) return '';

        const a = node.attributes != null ? node.attributes : node;
        const formats = a.formats || {};
        const raw =
            (formats.thumbnail && formats.thumbnail.url) ||
            (formats.small && formats.small.url) ||
            a.url ||
            '';
        if (!raw) return '';

        if (/^https?:\/\//i.test(raw)) {
            return raw.includes('/uploads/') ? raw : `/api/media-proxy?url=${encodeURIComponent(raw)}`;
        }
        return raw;
    }

    /**
     * Strapi REST collection path (plural). Optional override:
     * <meta name="player-reviews-api" content="reviews"> or comma-separated fallbacks.
     */
    function reviewApiEndpoints() {
        if (typeof document !== 'undefined') {
            const m = document.querySelector('meta[name="player-reviews-api"]');
            const raw = m && m.getAttribute('content');
            if (raw && String(raw).trim()) {
                return String(raw)
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
        }
        return ['reviews'];
    }

    /**
     * Build ordered query attempts: Strapi v4/v5 differ on relation filters (documentId vs id) and enum casing.
     * Each filter is tried with and without populate[Avatar] so a bad populate does not block the whole list.
     */
    function collectQueryAttempts(
        parentKey,
        slug,
        documentId,
        parentNumericId,
        page,
        pageSize,
        populateAvatar,
        sortStr,
    ) {
        const attempts = [];
        const pop = populateAvatar ? 'populate[Avatar]=*' : '';
        const sortPag = [
            `sort=${encodeURIComponent(sortStr || 'PostedAt:desc')}`,
            `pagination[page]=${page}`,
            `pagination[pageSize]=${pageSize}`,
        ];

        const statusPairs = [
            ['Status', 'Approved'],
            ['Status', 'approved'],
            ['status', 'Approved'],
            ['status', 'approved'],
        ];

        function pushAttempt(filterParts) {
            const base = [...filterParts, ...sortPag];
            if (populateAvatar && pop) {
                attempts.push([...base, pop].join('&'));
            }
            attempts.push(base.join('&'));
        }

        for (const [field, val] of statusPairs) {
            const st = `filters[${field}][$eq]=${encodeURIComponent(val)}`;
            if (documentId) {
                pushAttempt([st, `filters[${parentKey}][documentId][$eq]=${encodeURIComponent(documentId)}`]);
            }
            if (parentNumericId != null && parentNumericId !== '') {
                const n = Number(parentNumericId);
                if (Number.isFinite(n)) {
                    pushAttempt([st, `filters[${parentKey}][id][$eq]=${encodeURIComponent(n)}`]);
                }
            }
            if (slug) {
                pushAttempt([st, `filters[${parentKey}][Slug][$eqi]=${encodeURIComponent(slug)}`]);
                pushAttempt([st, `filters[${parentKey}][slug][$eqi]=${encodeURIComponent(slug)}`]);
            }
        }

        return [...new Set(attempts)];
    }

    async function fetchReviewsJson(
        parentKey,
        slug,
        documentId,
        parentNumericId,
        page,
        pageSize,
        populateAvatar,
        sortStr,
    ) {
        const queryStrings = collectQueryAttempts(
            parentKey,
            slug,
            documentId,
            parentNumericId,
            page,
            pageSize,
            populateAvatar,
            sortStr || 'PostedAt:desc',
        );
        if (queryStrings.length === 0) {
            console.warn('[player-reviews] Missing slug, documentId, and parentNumericId');
            return null;
        }

        let lastStatus = 0;
        let lastBody = '';
        let attemptIndex = 0;
        const endpoints = reviewApiEndpoints();

        for (const endpoint of endpoints) {
            for (const qs of queryStrings) {
                attemptIndex += 1;
                try {
                    const url = `${API_BASE}/api/${endpoint}?${qs}`;
                    const res = await fetch(url);
                    if (res.ok) {
                        const json = await res.json();
                        if (json && Array.isArray(json.data)) {
                            return json;
                        }
                        console.warn('[player-reviews] Unexpected JSON shape from', endpoint);
                        continue;
                    }
                    lastStatus = res.status;
                    try {
                        lastBody = (await res.text()).slice(0, 280);
                    } catch {
                        lastBody = '';
                    }
                    if (res.status !== 404 || attemptIndex <= 2) {
                        console.warn('[player-reviews]', endpoint, res.status, lastBody || '(no body)');
                    }
                } catch (e) {
                    console.warn('[player-reviews] fetch failed:', e && e.message ? e.message : e);
                }
            }
        }

        if (lastStatus) {
            console.warn(
                '[player-reviews] All attempts failed. Last status:',
                lastStatus,
                lastBody,
                '(Set <meta name="player-reviews-api" content="your-strapi-plural"> if the API ID differs.)',
            );
        }
        return null;
    }

    function entryToAttr(entry) {
        if (!entry) return null;
        if (entry.attributes == null) {
            return { ...entry };
        }
        const inner = { ...entry.attributes };
        if (inner.id == null && entry.id != null) inner.id = entry.id;
        if (inner.documentId == null && entry.documentId != null) inner.documentId = entry.documentId;
        return inner;
    }

    async function fetchAllAttrsForSummary(parentKey, slug, documentId, parentNumericId) {
        const all = [];
        let page = 1;
        let total = Infinity;

        while (all.length < total) {
            const json = await fetchReviewsJson(
                parentKey,
                slug,
                documentId,
                parentNumericId,
                page,
                SUMMARY_PAGE_SIZE,
                false,
                'PostedAt:desc',
            );
            if (!json || !Array.isArray(json.data)) {
                break;
            }
            const meta = json.meta && json.meta.pagination;
            if (meta && typeof meta.total === 'number') {
                total = meta.total;
            }
            for (const row of json.data) {
                const a = entryToAttr(row);
                if (a) all.push(a);
            }
            if (json.data.length === 0) break;
            page += 1;
            if (page > 100) {
                console.warn('[player-reviews] summary pagination stopped at 100 pages');
                break;
            }
        }
        return all;
    }

    function computeSummary(attrs) {
        const scores = [];
        const buckets = [0, 0, 0, 0, 0];

        for (const a of attrs) {
            const r = Number(a.RatingScore ?? a.ratingScore);
            if (!Number.isFinite(r)) continue;
            scores.push(r);
            const f = Math.floor(r);
            if (f < 1) {
                buckets[0] += 1;
            } else if (f > 5) {
                buckets[4] += 1;
            } else {
                buckets[f - 1] += 1;
            }
        }

        const total = scores.length;
        const avg = total > 0 ? scores.reduce((x, y) => x + y, 0) / total : 0;

        return { avg, total, buckets, allCount: attrs.length };
    }

    function parentProductName(parentAttr) {
        if (!parentAttr || typeof parentAttr !== 'object') return 'Product';
        const n = parentAttr.Name ?? parentAttr.name ?? parentAttr.Title ?? parentAttr.title;
        const s = n != null ? String(n).trim() : '';
        return s || 'Product';
    }

    function reviewBodyForSchema(attr) {
        const pros = String(attr.Pros || attr.pros || '').trim();
        const cons = String(attr.Cons || attr.cons || '').trim();
        if (pros && cons) return `${pros}\n\n${cons}`;
        return pros || cons || '';
    }

    function injectJsonLd(parentAttr, summary, reviewEntries) {
        const prev = document.getElementById('player-reviews-jsonld');
        if (prev) prev.remove();

        if (!summary || summary.total <= 0) {
            return;
        }

        const name = parentProductName(parentAttr);
        const product = {
            '@context': 'https://schema.org',
            '@type': 'Product',
            name,
            aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: formatRatingDisplay(summary.avg),
                bestRating: '5',
                ratingCount: String(summary.total),
            },
        };

        const reviews = (reviewEntries || []).slice(0, 10).map((attr) => {
            const author = String(attr.DisplayName || attr.displayName || 'Anonymous').trim();
            const posted = attr.PostedAt || attr.postedAt || attr.publishedAt || attr.createdAt;
            const score = clampScore(attr.RatingScore ?? attr.ratingScore);
            const body = reviewBodyForSchema(attr);
            const rev = {
                '@type': 'Review',
                author: { '@type': 'Person', name: author },
                datePublished: posted ? String(posted).slice(0, 10) : undefined,
                reviewBody: body || undefined,
            };
            if (score != null) {
                rev.reviewRating = {
                    '@type': 'Rating',
                    ratingValue: formatRatingDisplay(score),
                    bestRating: '5',
                };
            }
            return rev;
        });
        if (reviews.length > 0) {
            product.review = reviews;
        }

        const script = document.createElement('script');
        script.id = 'player-reviews-jsonld';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(product);
        document.head.appendChild(script);
    }

    function renderSummaryEl(summary, els) {
        const { summaryWrap, avgEl, starsEl, totalEl, barsEl } = els;
        if (!summaryWrap || !avgEl || !starsEl || !totalEl || !barsEl) return;

        if (summary.total <= 0) {
            summaryWrap.hidden = true;
            summaryWrap.classList.remove('pr-summary--has-data');
            avgEl.textContent = '';
            starsEl.innerHTML = '';
            totalEl.textContent = '';
            barsEl.innerHTML = '';
            return;
        }

        summaryWrap.hidden = false;
        summaryWrap.removeAttribute('hidden');
        summaryWrap.classList.add('pr-summary--has-data');
        avgEl.textContent = formatRatingDisplay(summary.avg);
        starsEl.innerHTML = renderStarsMeter(summary.avg);
        totalEl.textContent = `Based on ${summary.total} player rating${summary.total === 1 ? '' : 's'}`;

        /** buckets[0]=1★ … buckets[4]=5★; display 5★ first */
        barsEl.innerHTML = [4, 3, 2, 1, 0]
            .map((i) => {
                const label = String(i + 1);
                const count = summary.buckets[i] || 0;
                const pct = summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;
                const w = summary.total > 0 ? (count / summary.total) * 100 : 0;
                return `<li class="pr-bar-row">
          <span class="pr-bar-label">${label} star${label === '1' ? '' : 's'}</span>
          <span class="pr-bar-track" role="presentation"><span class="pr-bar-fill" style="width:${w}%"></span></span>
          <span class="pr-bar-pct">${pct}%</span>
        </li>`;
            })
            .join('');
    }

    function renderItem(attr) {
        const name = attr.DisplayName || attr.displayName || 'Anonymous';
        const score = clampScore(attr.RatingScore ?? attr.ratingScore);
        const pros = String(attr.Pros || attr.pros || '').trim();
        const cons = String(attr.Cons || attr.cons || '').trim();
        const posted = attr.PostedAt || attr.postedAt || attr.publishedAt || attr.createdAt;
        const verified = !!(attr.VerifiedPlayer ?? attr.verifiedPlayer);
        const helpful = Number(attr.HelpfulCount ?? attr.helpfulCount ?? 0) || 0;
        const avatar = avatarUrlFromAttr(attr);

        const dateTitle = formatFullDate(posted);
        const dateText = relativeDate(posted);

        const avatarHtml = avatar
            ? `<img class="pr-avatar pr-avatar--img" src="${escapeHtml(avatar)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">`
            : `<div class="pr-avatar" aria-hidden="true">${escapeHtml(initial(name))}</div>`;

        const scoreHtml =
            score != null
                ? `<span class="pr-score"><i data-lucide="star"></i>${formatRatingDisplay(score)}/5</span>`
                : '';

        const verifiedHtml = verified
            ? `<span class="pr-verified"><i data-lucide="badge-check"></i> Verified</span>`
            : '';

        return `
            <li class="pr-item">
                <header class="pr-head">
                    ${avatarHtml}
                    <div class="pr-id">
                        <span class="pr-name">${escapeHtml(name)}${verifiedHtml}</span>
                        <span class="pr-date" ${dateTitle ? `title="${escapeHtml(dateTitle)}"` : ''}>${escapeHtml(dateText)}</span>
                    </div>
                    ${scoreHtml}
                </header>
                ${pros ? `<p class="pr-line pr-line--pro"><i data-lucide="thumbs-up"></i><span>${escapeHtml(pros)}</span></p>` : ''}
                ${cons ? `<p class="pr-line pr-line--con"><i data-lucide="thumbs-down"></i><span>${escapeHtml(cons)}</span></p>` : ''}
                <div class="pr-actions">
                    <button type="button" class="pr-helpful" disabled aria-disabled="true">
                        <i data-lucide="thumbs-up"></i> Helpful (${helpful})
                    </button>
                </div>
            </li>
        `;
    }

    function hidePrEmpty(emptyEl) {
        if (!emptyEl) return;
        emptyEl.hidden = true;
        emptyEl.setAttribute('hidden', '');
    }

    function showPrEmpty(emptyEl, message, titleText) {
        if (!emptyEl) return;
        const dek = emptyEl.querySelector('.pr-empty__dek') || emptyEl.querySelector('p');
        if (dek && message) dek.textContent = message;
        const titleEl = emptyEl.querySelector('.pr-empty__title');
        if (titleEl) {
            if (titleText) {
                titleEl.textContent = titleText;
            } else {
                const def = titleEl.getAttribute('data-pr-empty-default-title');
                if (def) titleEl.textContent = def;
            }
        }
        emptyEl.hidden = false;
        emptyEl.removeAttribute('hidden');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ root: emptyEl });
        }
    }

    function showEmptyState(els, message) {
        const { section, empty, list, summaryWrap, countEl } = els;
        const prev = document.getElementById('player-reviews-jsonld');
        if (prev) prev.remove();

        const sortRoot = document.getElementById('pr-sort');
        if (sortRoot) {
            sortRoot.hidden = true;
            sortRoot.setAttribute('hidden', '');
        }

        const pag = document.getElementById('pr-pagination-wrap');
        if (pag) {
            pag.style.display = 'none';
        }

        if (empty) {
            showPrEmpty(empty, message || PR_ERROR_DEK, PR_ERROR_TITLE);
        }
        if (list) list.innerHTML = '';
        if (summaryWrap) {
            summaryWrap.hidden = true;
            summaryWrap.classList.remove('pr-summary--has-data');
            const a = document.getElementById('pr-summary-avg');
            const st = document.getElementById('pr-summary-stars');
            const tt = document.getElementById('pr-summary-total');
            const br = document.getElementById('pr-summary-bars');
            if (a) a.textContent = '';
            if (st) st.innerHTML = '';
            if (tt) tt.textContent = '';
            if (br) br.innerHTML = '';
        }
        if (countEl) countEl.textContent = '';
        if (section) {
            section.hidden = false;
            section.removeAttribute('hidden');
        }
    }

    /** Same pager UI as slots/providers (`updateListingPagerDom` from script.js). */
    function syncPlayerReviewsPager(currentPage, totalPages, totalReviews) {
        const wrap = document.getElementById('pr-pagination-wrap');
        const prevBtn = document.getElementById('pr-btn-prev');
        const nextBtn = document.getElementById('pr-btn-next');
        const pageNumbersEl = document.getElementById('pr-page-numbers');
        const pageInput = document.getElementById('pr-page-input');
        const pageTotalHint = document.getElementById('pr-page-total-hint');
        if (!wrap || !prevBtn || !nextBtn) return;
        if (typeof updateListingPagerDom !== 'function') {
            wrap.style.display = 'none';
            console.warn('[player-reviews] updateListingPagerDom missing; load script.js before player-reviews.js');
            return;
        }
        if (!totalReviews) {
            wrap.style.display = 'none';
            return;
        }
        updateListingPagerDom(
            wrap,
            totalPages,
            currentPage,
            prevBtn,
            nextBtn,
            pageNumbersEl,
            pageInput,
            pageTotalHint,
        );
    }

    function setSortToolbarVisible(visible) {
        const sortRoot = document.getElementById('pr-sort');
        if (!sortRoot) return;
        sortRoot.hidden = !visible;
        if (visible) {
            sortRoot.removeAttribute('hidden');
        } else {
            sortRoot.setAttribute('hidden', '');
        }
    }

    function buildSortDropdownHtml() {
        const opts = SORT_OPTIONS.map(
            (o) =>
                `<li class="pr-sort__opt" role="option" tabindex="-1" data-value="${escapeHtml(o.id)}" aria-selected="false">
          <span class="pr-sort__opt-label">${escapeHtml(o.label)}</span>
          <i data-lucide="check" class="pr-sort__check" aria-hidden="true"></i>
        </li>`,
        ).join('');
        return `
      <button type="button" class="pr-sort__trigger" id="pr-sort-trigger" aria-expanded="false" aria-haspopup="listbox" aria-controls="pr-sort-menu" aria-label="Sort reviews">
        <span class="pr-sort__trigger-label" id="pr-sort-label">Newest</span>
        <i data-lucide="chevron-down" class="pr-sort__chev" aria-hidden="true"></i>
      </button>
      <ul class="pr-sort__menu" id="pr-sort-menu" role="listbox" aria-labelledby="pr-sort-trigger" hidden>${opts}</ul>
    `;
    }

    function updateSortOptionStates(root, sortId) {
        const label = root.querySelector('.pr-sort__trigger-label');
        const opt = SORT_OPTIONS.find((o) => o.id === sortId);
        if (label && opt) {
            label.textContent = opt.label;
        }
        root.querySelectorAll('.pr-sort__opt').forEach((li) => {
            const sel = li.getAttribute('data-value') === sortId;
            li.setAttribute('aria-selected', sel ? 'true' : 'false');
            li.classList.toggle('pr-sort__opt--selected', sel);
        });
    }

    /**
     * @param {HTMLElement} section
     * @param {(sortId: string) => void} onSelect
     */
    function ensureSortToolbar(section, onSelect) {
        const panel = section.querySelector('.pr-reviews-panel');
        const h3 = panel && panel.querySelector('#pr-panel-heading');
        if (!panel || !h3) {
            return null;
        }

        let head = panel.querySelector('.pr-panel-head');
        if (!head) {
            head = document.createElement('div');
            head.className = 'pr-panel-head';
            h3.before(head);
            head.appendChild(h3);
        }

        let root = document.getElementById('pr-sort');
        if (!root) {
            root = document.createElement('div');
            root.id = 'pr-sort';
            root.className = 'pr-sort';
            root.setAttribute('hidden', '');
            root.innerHTML = buildSortDropdownHtml();
            head.appendChild(root);
        } else if (root.parentElement !== head) {
            head.appendChild(root);
        }

        if (root.dataset.prSortBound === '1') {
            return root;
        }
        root.dataset.prSortBound = '1';

        const trigger = root.querySelector('#pr-sort-trigger');
        const menu = root.querySelector('#pr-sort-menu');
        if (!trigger || !menu) return root;

        function closeMenu() {
            root.classList.remove('pr-sort--open');
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            root.classList.add('pr-sort--open');
            menu.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
        }

        function toggleMenu() {
            if (menu.hidden) {
                openMenu();
            } else {
                closeMenu();
            }
        }

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        menu.addEventListener('click', (e) => {
            const li = e.target && e.target.closest && e.target.closest('.pr-sort__opt');
            if (!li) return;
            const v = li.getAttribute('data-value');
            if (!v) return;
            e.stopPropagation();
            closeMenu();
            onSelect(v);
        });

        if (root.dataset.prSortDocBound !== '1') {
            root.dataset.prSortDocBound = '1';
            document.addEventListener('click', (e) => {
                if (menu.hidden) return;
                if (!root.contains(e.target)) closeMenu();
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !menu.hidden) closeMenu();
            });
        }

        return root;
    }

    /**
     * @param {{ parentKey: string, slug: string, documentId?: string, parentNumericId?: number|string, parentAttr?: object }} opts
     */
    async function render(opts) {
        const parentKey = opts.parentKey;
        const slug = opts.slug || '';
        const documentId = opts.documentId || '';
        const parentNumericId = opts.parentNumericId;
        const parentAttr = opts.parentAttr || {};

        const section = document.getElementById('pr-section');
        const list = document.getElementById('pr-list');
        const empty = document.getElementById('pr-empty');
        const countEl = document.getElementById('pr-count');
        const summaryWrap = document.getElementById('pr-summary');
        const avgEl = document.getElementById('pr-summary-avg');
        const starsEl = document.getElementById('pr-summary-stars');
        const totalEl = document.getElementById('pr-summary-total');
        const barsEl = document.getElementById('pr-summary-bars');

        if (!section || !list) {
            return;
        }

        const els = {
            section,
            empty,
            list,
            summaryWrap,
            countEl,
            avgEl,
            starsEl,
            totalEl,
            barsEl,
        };

        if (!documentId && !slug && (parentNumericId == null || parentNumericId === '')) {
            console.warn('[player-reviews] render: missing slug, documentId, and parentNumericId');
            showEmptyState(els, PR_ERROR_DEK);
            return;
        }

        section.hidden = false;
        section.removeAttribute('hidden');

        let summaryData = { avg: 0, total: 0, buckets: [0, 0, 0, 0, 0] };
        let allAttrsFromSummary = [];
        let currentSort = 'newest';
        let sortedForList = [];
        let currentPage = 1;
        let totalReviews = 0;
        let totalPages = 1;

        function showNoReviewsEmpty() {
            list.innerHTML = '';
            showPrEmpty(empty, PR_EMPTY_DEK, PR_EMPTY_TITLE);
            if (countEl) countEl.textContent = '';
            syncPlayerReviewsPager(1, 1, 0);
            injectJsonLd(parentAttr, { total: 0, avg: 0 }, []);
            setSortToolbarVisible(false);
        }

        function dispatchSummaryEvent() {
            try {
                document.dispatchEvent(
                    new CustomEvent('player-reviews:summary', {
                        detail: {
                            parentKey,
                            avg: summaryData.avg,
                            total: summaryData.total,
                            buckets: summaryData.buckets,
                        },
                    }),
                );
            } catch (_) {
                /* CustomEvent not supported; harmless to skip. */
            }
        }

        async function refreshSummaryCache() {
            try {
                allAttrsFromSummary = await fetchAllAttrsForSummary(
                    parentKey,
                    slug,
                    documentId,
                    parentNumericId,
                );
                summaryData = computeSummary(allAttrsFromSummary);
                sortedForList = sortAttrs(allAttrsFromSummary, currentSort);
                renderSummaryEl(summaryData, {
                    summaryWrap,
                    avgEl,
                    starsEl,
                    totalEl,
                    barsEl,
                });
                dispatchSummaryEvent();
            } catch (e) {
                console.warn('[player-reviews] summary fetch failed:', e && e.message ? e.message : e);
            }
        }

        showNoReviewsEmpty();

        function finishListRender(items, page) {
            if (!items || items.length === 0) {
                showNoReviewsEmpty();
                return;
            }

            hidePrEmpty(empty);
            list.innerHTML = items.map(renderItem).join('');

            if (countEl) {
                countEl.textContent = totalReviews > 0 ? `(${totalReviews})` : '';
            }

            syncPlayerReviewsPager(currentPage, totalPages, totalReviews);

            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            if (page === 1) {
                injectJsonLd(parentAttr, summaryData, items.slice(0, 10));
                if (allAttrsFromSummary.length === 0) {
                    void refreshSummaryCache();
                }
            }

            setSortToolbarVisible(totalReviews > 0);
        }

        async function loadPage(requestedPage) {
            let p = Math.max(1, Number(requestedPage) || 1);

            if (allAttrsFromSummary.length > 0) {
                totalReviews = allAttrsFromSummary.length;

                if (totalReviews === 0) {
                    showNoReviewsEmpty();
                    return;
                }

                totalPages = Math.max(1, Math.ceil(totalReviews / PAGE_SIZE));
                if (p > totalPages) p = totalPages;
                currentPage = p;

                const start = (currentPage - 1) * PAGE_SIZE;
                const items = sortedForList.slice(start, start + PAGE_SIZE);
                finishListRender(items, currentPage);
                return;
            }

            const json = await fetchReviewsJson(
                parentKey,
                slug,
                documentId,
                parentNumericId,
                p,
                PAGE_SIZE,
                true,
                sortQueryFor(currentSort),
            );
            if (!json || !Array.isArray(json.data)) {
                showEmptyState(els, PR_ERROR_DEK);
                return;
            }

            const meta = json.meta && json.meta.pagination;
            if (meta && typeof meta.total === 'number') {
                totalReviews = meta.total;
            } else {
                totalReviews = json.data.length;
            }
            if (meta && typeof meta.pageCount === 'number' && meta.pageCount > 0) {
                totalPages = meta.pageCount;
            } else {
                totalPages = Math.max(1, Math.ceil(totalReviews / PAGE_SIZE));
            }

            currentPage = meta && typeof meta.page === 'number' ? meta.page : p;
            if (currentPage > totalPages) currentPage = totalPages;

            const items = json.data.map(entryToAttr).filter(Boolean);

            if (items.length === 0) {
                showNoReviewsEmpty();
                return;
            }

            finishListRender(items, currentPage);
        }

        if (!section.dataset.prListingPagerBound) {
            section.dataset.prListingPagerBound = '1';
            const firstBtn = document.getElementById('pr-btn-first');
            const prevBtn = document.getElementById('pr-btn-prev');
            const nextBtn = document.getElementById('pr-btn-next');
            const lastBtn = document.getElementById('pr-btn-last');
            const pageNumbersEl = document.getElementById('pr-page-numbers');
            const pageInput = document.getElementById('pr-page-input');
            const pageGoBtn = document.getElementById('pr-page-go');

            function navigateToReviewPage(p) {
                const n = Math.max(1, Math.min(totalPages, Math.floor(Number(p))));
                if (n === currentPage) return;
                void loadPage(n);
            }

            if (typeof bindListingPagerGoto === 'function') {
                bindListingPagerGoto(pageNumbersEl, pageInput, pageGoBtn, navigateToReviewPage);
            }

            if (firstBtn) {
                firstBtn.addEventListener('click', () => {
                    if (currentPage > 1) void loadPage(1);
                });
            }
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) void loadPage(currentPage - 1);
                });
            }
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) void loadPage(currentPage + 1);
                });
            }
            if (lastBtn) {
                lastBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) void loadPage(totalPages);
                });
            }
        }

        const sortRoot = ensureSortToolbar(section, (sortId) => {
            const r = document.getElementById('pr-sort');
            void (async () => {
                currentSort = sortId;
                sortedForList = sortAttrs(allAttrsFromSummary, currentSort);
                currentPage = 1;
                if (r) updateSortOptionStates(r, currentSort);
                await loadPage(1);
            })();
        });
        if (sortRoot) {
            updateSortOptionStates(sortRoot, currentSort);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        try {
            await loadPage(1);
        } catch (e) {
            console.warn('[player-reviews] loadPage failed:', e && e.message ? e.message : e);
            showEmptyState(els, PR_ERROR_DEK);
            return;
        }

        if (empty && empty.hidden && list && !list.children.length) {
            showNoReviewsEmpty();
        }
    }

    window.PlayerReviews = { render };
})();
