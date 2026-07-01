# Strapi schema — Malaysia hub fields

Apply these fields to the **casinos** collection type in Strapi. The frontend in `public/assets/js/script.js` already reads them when present.

## Required for Malaysia table (`/malaysia`)

| Field | Strapi type | Example | Used by |
|-------|-------------|---------|---------|
| `Markets` | JSON or Enumeration (multiple) | `["malaysia","global"]` | Hub filters, table fetch |
| `MalaysiaRank` | Integer | `1` | Sort on Malaysia hub |
| `MalaysiaHighlight` | Text | `Best casino mobile app` | Table highlight column |
| `MalaysiaBonusLine` | Text | `188% up to RM1,288` | Table bonus column |
| `AffiliateLink` | Text / URL (existing) | `https://…` | Visit-site CTAs |
| `CategoryFlags` | JSON | see below | Summary table + conclusion CTA |

### `CategoryFlags` JSON shape

```json
{
  "editorsPick": true,
  "bestPayout": false,
  "bestSlots": false,
  "bestLive": false,
  "fastestPayout": false,
  "bestMobile": false
}
```

Only one casino should have each flag set to `true` for clean summary-table mapping.

## Sub-hub listing filters

| Field | Strapi type | Example | Used by |
|-------|-------------|---------|---------|
| `MalaysiaPaymentTags` | JSON | `["ewallet","touch-n-go"]` | `/malaysia/ewallet`, `/malaysia/touch-n-go` |
| `HasLiveCasino` | Boolean | `true` | Live game hubs |
| `LiveGameTypes` | JSON | `["blackjack","roulette"]` | Live game hubs |
| `MobilePlatform` | JSON | `["ios","android"]` | Mobile hubs |

## Optional (Phase 5 CMS editorial)

Single type **`malaysia-hub-page`** with repeatable rich-text blocks for long-form SEO sections on `/malaysia`.

## Frontend fetch queries

- Main hub: `filters[Markets][$containsi]=malaysia&sort=MalaysiaRank:asc&pagination[limit]=11`
- E-wallet sub-hub: adds `filters[MalaysiaPaymentTags][$containsi]=ewallet`
- Touch 'n Go sub-hub: adds `filters[MalaysiaPaymentTags][$containsi]=touch-n-go`

If Strapi returns 400 (field missing), the frontend falls back to unfiltered listings or keeps hardcoded HTML table rows.
