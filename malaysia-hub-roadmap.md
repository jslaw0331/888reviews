# Malaysia Hub — Future Updates Roadmap

Living checklist for the Malaysia market hub and related pages.  
Reference structure: https://www.bestonlinecasino.com/malaysia/  
Production hub URL: https://888reviews.com/ (canonical Malaysia hub)

## Explicit non-goals

- Do **not** build an API or scraper to pull content from bestonlinecasino.com or any third-party site
- Do **not** copy competitor wording verbatim — mirrored structure with original 888reviews copy

---

## Phase 1 — Static long-form hub (v1)

- [x] Long-form Malaysia hub (now served at `/` via `public/index.html`)
- [x] Static hardcoded top-11 casino table
- [x] Mirrored editorial copy (888reviews voice)
- [x] FAQ + Breadcrumb + ItemList JSON-LD
- [x] Sitemap includes `/` and `/ewallet` (legacy `/malaysia*` URLs redirect)
- [x] 301 redirects from `/casinos/malaysia/*` and `/malaysia*` to current routes
- [x] Scoped CSS under `.page-malaysia`

**Primary files:** `public/index.html`, `public/assets/css/styles.css`, `server.js`, `server-seo.js`

---

## Phase 2 — Backend / CMS integration

### Strapi schema (casinos collection)

| Field | Type | Purpose |
|-------|------|---------|
| `Markets` | JSON array or multi-enum | e.g. `malaysia`, `sg`, `global` |
| `MalaysiaRank` | integer | Sort order on Malaysia hub table |
| `MalaysiaHighlight` | string | Table highlight column |
| `MalaysiaBonusLine` | string | MYR/USD bonus headline for Malaysia |
| `MalaysiaPaymentTags` | JSON array | e.g. `ewallet`, `touch-n-go`, `crypto` |
| `CategoryFlags` | JSON component | `editorsPick`, `bestPayout`, `bestSlots`, `bestLive`, `fastestPayout`, `bestMobile` |
| `AffiliateLink` | string (existing) | Visit-site CTA URL |
| `HasLiveCasino` | boolean | Sub-hub live filter |
| `LiveGameTypes` | JSON array | e.g. `blackjack`, `roulette`, `baccarat` |
| `MobilePlatform` | JSON array | e.g. `ios`, `android` |

### Frontend (implemented in `script.js`)

- [x] `initMalaysiaHubPage()` — replaces `#malaysia-casino-table-body` when Strapi returns data
- [x] `appendHubListingFilters()` — reads `data-hub-market`, `data-hub-payment`, etc.
- [x] Summary table + featured bonus/live tables update from `CategoryFlags`
- [x] Podium styling and logo fallback on table rows
- [ ] Populate Strapi with Malaysia-tagged casinos matching table columns
- [ ] Remove hardcoded `<tbody>` rows once CMS data is verified in production

**Backend schema reference:** [`docs/strapi-malaysia-schema.md`](docs/strapi-malaysia-schema.md)

### Optional CMS single-type (Phase 5)

- `malaysia-hub-page` single-type for long SEO prose blocks

---

## Phase 3 — Sub-hubs

- [x] `/ewallet` — `public/malaysia-ewallet.html`
- [x] Touch 'n Go content folded into e-wallet hub (`/touch-n-go` → `/ewallet`)
- [x] 301 from `/casinos/malaysia/ewallet`, `/malaysia/ewallet`, `/malaysia/touch-n-go`
- [x] Retired legacy `public/casinos-malaysia*.html`, `malaysia.html`, `malaysia-touch-n-go.html`

---

## Phase 4 — Internal linking

- [x] Sitewide inbound links point at `/` (hub) and `/ewallet`
- [x] Contextual cross-links on Malaysia hub body sections

**Files updated:** payment pages, mobile, real-money pages, Malaysia hub pages

---

## Phase 5 — SEO and content maintenance

### Quarterly review checklist

- [ ] Refresh year in title/H1 when calendar rolls (2026 → 2027)
- [ ] Update progressive jackpot dollar amounts
- [ ] Review Malaysia legal/regulatory table
- [ ] Verify affiliate disclosures and CTA URLs
- [ ] Run heading hierarchy + word-count audit per `seo-task.md`
- [ ] Validate JSON-LD in Google Rich Results Test (BreadcrumbList, FAQPage, ItemList)
- [ ] Confirm `/` indexed with correct Malaysia hub canonical

### Schema (implemented)

- [x] BreadcrumbList
- [x] FAQPage
- [x] ItemList for top-11 table
- [x] WebPage

---

## Phase 6 — Assets and polish

- [x] QR placeholder SVG at `public/assets/img/malaysia-qr-placeholder.svg`
- [x] Trust badge SVGs in `public/assets/img/trust/`
- [x] Podium styling on rank 1–3 table rows
- [x] Operator logo fallback initials in comparison table (Strapi logos when available)
- [ ] Replace QR with real operator deep link when affiliate URL confirmed
- [ ] Replace `#` CTAs with production affiliate URLs

---

## URL map

| URL | File / behavior |
|-----|-----------------|
| `/` | `public/index.html` (Malaysia casino hub) |
| `/ewallet` | `public/malaysia-ewallet.html` |
| `/malaysia` | 301 → `/` |
| `/malaysia/ewallet` | 301 → `/ewallet` |
| `/malaysia/touch-n-go` | 301 → `/ewallet` |
| `/touch-n-go` | 301 → `/ewallet` |

## Legacy redirects

| From | To |
|------|-----|
| `/casinos/malaysia` | `/` |
| `/casinos/malaysia/ewallet` | `/ewallet` |
| `/casinos/malaysia/touch-n-go` | `/ewallet` |
| `/malaysia` | `/` |
| `/malaysia/ewallet` | `/ewallet` |
| `/malaysia/touch-n-go` | `/ewallet` |
