# 888 Reviews — Brand & Design System

> Source of truth for visual language, spacing, typography, and component rules.
> All tokens live in `assets/css/styles.css` under `:root`. Never hardcode values that already exist as a token.

---

## 1. Brand Principles

- **Editorial, not casino-arcade.** Premium, calm, confident. Serif headlines (Playfair Display), clean sans body (Inter).
- **Cyan-led, not rainbow.** One primary accent (`--primary`, logo cyan). Everything else is slate neutrals.
- **Surface over decoration.** Use whitespace, shadow, and radius to separate surfaces — not borders, gradients, or color blocks.
- **Modular & DRY.** Any pattern used on ≥ 2 pages must be a named, reusable block (class + optional partial in `/components`).
- **Accessibility first.** Minimum 4.5:1 contrast for body, 3:1 for large text. All interactive elements have visible `:focus-visible` and a hit area ≥ 40×40 px.

---

## 2. Color

All colors are CSS variables. Do **not** use raw hex in new code.

| Token              | Hex       | Use                                              |
| ------------------ | --------- | ------------------------------------------------ |
| `--primary`        | `#33beb3` | Primary CTA bg, active nav, link accent          |
| `--primary-hover`  | `#2aa197` | Hover state only                                 |
| `--text-main`      | `#0f172a` | Body text, headings                              |
| `--text-muted`     | `#475569` | Secondary copy, meta                             |
| `--text-light`     | `#94a3b8` | Fine print, disabled, timestamps                 |
| `--bg-body`        | `#f8fafc` | Page background                                  |
| `--bg-card`        | `#ffffff` | Cards, panels, drawers                           |
| `--border`         | `#e2e8f0` | Standard borders                                 |
| `--border-light`   | `#f1f5f9` | Subtle dividers, card outlines on light bg       |
| `--success`        | `#059669` | Positive badges, verified                        |
| `--danger`         | `#e11d48` | Error, destructive                               |

**Rules**

- One accent per view. Do not mix cyan with unrelated brand colors.
- Gradients only on featured CTAs (`linear-gradient(135deg, var(--primary), var(--primary-hover))`). Never on full sections.
- Never tint body text with primary. Links go primary on hover only.

---

## 3. Typography

Fonts:

```css
--font-serif: 'Playfair Display', serif;  /* H1, H2, large display numbers */
--font-sans: 'Inter', sans-serif;         /* Everything else */
```

### 3.1 Hierarchy (strict — do not invent new sizes)

| Level                | Font   | Size                                | Weight | Letter-spacing | Use                                   |
| -------------------- | ------ | ----------------------------------- | ------ | -------------- | ------------------------------------- |
| Display / H1         | Serif  | `clamp(3rem, 5.5vw, 5rem)`          | 600    | `-0.03em`      | One per page, hero only               |
| H2 — section title   | Serif  | `clamp(2rem, 3.5vw, 2.75rem)`       | 600    | `-0.02em`      | Section headers                       |
| H3 — card / block    | Sans   | `1.25rem`                           | 600    | `-0.01em`      | Card titles, subsection headings      |
| H4 — inline block    | Sans   | `1.05rem`                           | 600    | `-0.005em`     | Small blocks inside cards             |
| Body large / lead    | Sans   | `1.1rem – 1.15rem`                  | 400    | normal         | Hero sub, section intro               |
| Body                 | Sans   | `1rem`                              | 400    | normal         | Default paragraph                     |
| Body small           | Sans   | `0.875rem`                          | 400–500| normal         | Meta, card copy                       |
| Caption              | Sans   | `0.8rem`                            | 500    | normal         | Timestamps, helper text               |
| Fine print           | Sans   | `0.7rem`                            | 500    | normal         | Terms, disclaimers                    |
| Eyebrow / kicker     | Sans   | `0.65rem – 0.7rem`                  | 800    | `0.08–0.12em`  | UPPERCASE label above a title         |

- **Line height:** 1.05 for H1, 1.15–1.25 for H2/H3, 1.55–1.7 for body.
- **Never** use `font-size` outside the ladder above. If you need a one-off, add it to the ladder first.
- Use `<em>` inside H1/H2 for serif italic emphasis — do not simulate with `font-style` inline.

### 3.2 Page heading rule

Exactly one `h1` per page. Every named section uses `h2` with an optional kicker:

```html
<div class="section-header center">
  <span class="eyebrow">Top picks</span>
  <h2>Trusted casinos, ranked</h2>
  <p>One paragraph of context, max ~160 chars.</p>
</div>
```

---

## 4. Spacing Scale

A single 4 px-based scale. Use these values — not arbitrary numbers.

| Token name  | px   | Typical use                                       |
| ----------- | ---- | ------------------------------------------------- |
| `space-0`   | 0    | Reset                                             |
| `space-1`   | 4    | Icon-to-label, tight chips                        |
| `space-2`   | 8    | Small gaps, tag spacing                           |
| `space-3`   | 12   | Compact gap, button icon gap                      |
| `space-4`   | 16   | Default gap, control padding                      |
| `space-5`   | 20   | Card inner gap                                    |
| `space-6`   | 24   | Between stacked blocks inside a card              |
| `space-7`   | 32   | Grid gap, between cards                           |
| `space-8`   | 40   | Card inner padding                                |
| `space-9`   | 48   | Sub-section separation                            |
| `space-10`  | 64   | Below a section header                            |
| `space-11`  | 80   | Compact section vertical padding                  |
| `space-12`  | 100  | Standard section vertical padding                 |
| `space-13`  | 120  | Flagship / hero-adjacent section padding          |

### 4.1 Section vertical rhythm

| Section density   | Desktop padding (`padding-y`) | Mobile (`≤768px`) |
| ----------------- | ----------------------------- | ----------------- |
| Flagship          | 120                           | 64                |
| Standard          | 100                           | 64                |
| Compact           | 80                            | 56                |
| Dense / inline    | 56–64                         | 40–48             |

Rule: **never stack two 120 px sections back-to-back** — alternate 120 / 80 for rhythm.

### 4.2 Container

```css
--container-max-width: 1240px;
```

- One `.container` per section, directly inside the `<section>`.
- Content never exceeds 1240 px. Long-form reading columns cap at 720–780 px.
- Horizontal page gutter: `max(20px, env(safe-area-inset-left, 20px))`.

### 4.3 Section header spacing

- `margin-bottom: 64px` desktop / `36px` mobile.
- `max-width: 640px` (left-aligned) or centered via `.section-header.center`.

---

## 5. Border Radius

Radius conveys hierarchy — larger = more prominent / more content.

| Token          | Value  | Use                                                                 |
| -------------- | ------ | ------------------------------------------------------------------- |
| `--radius-sm`  | 6 px   | **Buttons**, chips, small inputs, icon tiles                        |
| `--radius-md`  | 10 px  | Cards, list items, inputs, dropdown menus, media thumbnails         |
| `--radius-lg`  | 16 px  | Hero card, elevated panels, modals, image tiles, feature blocks     |
| `--radius-xl`  | 24 px  | Marquee / full-bleed feature surfaces                               |
| Pill           | 100 px | Badges, tag chips, rating pills                                     |
| Capsule        | 999 px | Large pill CTAs (e.g. hero `claim-link--visit`)                     |
| Circle         | 50 %   | Avatars, icon-only circular buttons (`.icon-btn` 44×44)             |

### 5.1 Button radius rule

- Standard `.btn` = **`--radius-sm` (6 px)**. This is the default.
- `.btn.btn-pill` = **999 px capsule**. Reserved for:
  - Hero primary CTA
  - Single standout CTA in a section footer
  - Sticky / floating action
- Never mix pill and square buttons in the same action row.

### 5.2 Nesting rule

A child element's radius must be **≤** its parent's radius. Example:

- Card `--radius-lg` (16) may contain a button `--radius-sm` (6). ✅
- A pill button inside a `--radius-sm` chip is forbidden. ❌

---

## 6. Elevation (Shadow)

Shadows, not borders, carry hierarchy on light surfaces.

| Token            | Use                                                                  |
| ---------------- | -------------------------------------------------------------------- |
| `--shadow-sm`    | Resting state for standard cards                                     |
| `--shadow-md`    | Inputs with focus, sticky chips, subtle lift                         |
| `--shadow-lg`    | Card `:hover`, modals, dropdowns                                     |
| `--shadow-xl`    | Hero card, top-of-stack overlays                                     |
| `--shadow-inner` | Wells, inset fields                                                  |

Rule: **never combine a large shadow with a heavy border.** Pick elevation *or* outline.

---

## 7. Buttons — the canonical system

All buttons inherit from `.btn`. Everything else is a **variant** + optional **size** + optional **width**. Do not create bespoke button classes per page.

### 7.1 Base

```
.btn
  padding: 16px 32px
  font-size: 0.875rem
  font-weight: 600
  border-radius: var(--radius-sm)
  text-transform: uppercase
  letter-spacing: 0.06em
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1)
```

### 7.2 Variants (pick exactly one)

| Class            | Role                                  | Appearance                                                        |
| ---------------- | ------------------------------------- | ----------------------------------------------------------------- |
| `.btn-primary`   | Primary action (max 1 per view)       | Cyan fill, white text, cyan glow shadow, lifts `-2px` on hover    |
| `.btn-outline`   | Secondary action                      | Transparent, `1.5px` border, neutral hover                        |
| `.btn-ghost`     | Tertiary / in-content link action     | No border, no fill; hover tint background                         |
| `.btn-danger`    | Destructive                           | `--danger` fill, white text                                       |
| `.claim-link`    | Specialized hero / offer CTA          | Gradient cyan, larger, `--radius-md`, optional `.claim-link--visit` = 999 px pill |

### 7.3 Sizes

| Modifier      | Padding       | Font       | Use                                  |
| ------------- | ------------- | ---------- | ------------------------------------ |
| *(default)*   | `16px 32px`   | `0.875rem` | Hero, section CTA                    |
| `.btn-small`  | `12px 24px`   | `0.75rem`  | Header, in-card actions, filters     |
| `.btn-block`  | full width    | inherited  | Mobile nav, sidebar, forms           |

### 7.4 Shapes

- Default (square-ish): `--radius-sm` = 6 px.
- `.btn-pill`: `border-radius: 999px` — hero / featured CTAs only.

### 7.5 Action-row rules

- Max **2** buttons side by side on desktop, **1** primary + **1** secondary.
- Exactly **one** `.btn-primary` per section.
- Mobile: stack vertically, both become `.btn-block` at `≤640 px`.
- Icon inside a button: `gap: 10px`, icon size `18–20 px`, icon color inherits.

### 7.6 States (all variants must implement)

- `:hover` — lift `translateY(-2px)` + upgrade shadow one step.
- `:active` — `translateY(0)` + reset shadow.
- `:focus-visible` — `outline: 2px solid var(--primary); outline-offset: 2px`.
- `[disabled]` — `opacity: 0.5`, `cursor: not-allowed`, remove hover transform.

---

## 8. Component Hierarchy & DRY Rules

### 8.1 Layered responsibility

```
page (e.g. casinos.html)
 └── section (semantic block — hero, verticals, faq…)
      └── .container (width + gutter)
           └── .section-header  +  component(s)
                                   └── card / grid / list / panel
```

- A page is **composition only**. Pages must not contain novel styles — only structural markup and section classes.
- A section describes purpose, not visuals (`.home-criteria`, `.top-providers`), and is styled via component classes inside.

### 8.2 DRY rules

1. **Two uses = abstract it.** If a pattern appears on ≥ 2 pages, it must become a shared class (and, for repeated markup, a partial in `/components`).
2. **One component, many variants.** Extend via modifier classes (e.g. `.vertical-card.large`, `.hero-card--simple`), never a renamed copy.
3. **Tokens only.** Inside component CSS, use variables: radius, shadow, color, font. Raw px/hex is a code smell.
4. **Page-scoped overrides are last resort.** Prefix with `.page-<name>` (e.g. `.page-bonuses .bonuses-faq`). Never reach into another component's internals.
5. **No inline styles** for brand values (color, radius, padding). Inline is allowed only for dynamic values (e.g. progress width from JS).
6. **One section header style.** Always use `.section-header` / `.section-header.center`. Do not re-implement.

### 8.3 Shared partials

Keep these in `/components` and include via the existing loader:

- `components/header.html`
- `components/footer.html`
- `components/sidebar.html`

Before creating a new partial, check if an existing one can take a variant modifier.

---

## 9. Cards

All cards follow the same anatomy:

```
.card
  bg: var(--bg-card)
  border: 1px solid var(--border-light)
  border-radius: var(--radius-md)
  box-shadow: var(--shadow-sm)
  padding: 40px           /* 28px 22px on mobile */
  :hover  → translateY(-6px) + --shadow-lg + border #cbd5e1
```

Rules:

- Card radius is **always** `--radius-md`, unless the card is the hero or feature panel (`--radius-lg`).
- Hover lift max `-6px` for cards, `-4px` for CTAs, `-2px` for buttons.
- Inside a card, nested media uses `--radius-sm`.

### 9.1 Grids

- Default grid gap (desktop): `32px` (`space-7`).
- Mobile: `14–16px`.
- Columns: 3 (desktop) → 2 (tablet 480–767) → 1 (<480).

---

## 10. Badges & Tags

```
.badge
  padding: 6px 12px
  border-radius: 100px
  font-size: 0.7rem
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.06em
```

Variants: `.badge-light` (neutral), `.badge-green` (success), `.badge-warn`, `.badge-danger`.
Never use a `.btn` as a badge or vice versa.

---

## 11. Forms & Inputs

- Input height: `44px` min (touch target).
- Radius: `--radius-md`.
- Border: `1px solid var(--border)`; focus: `2px solid var(--primary)` outline with `outline-offset: 2px`.
- Padding: `12px 14px`.
- Label: sans, `0.875rem`, `600`, `margin-bottom: 6px`.
- Helper text: `0.8rem`, `--text-muted`. Error text: `0.8rem`, `--danger`.

---

## 12. Motion

- Standard transition: `all 0.25s ease-out`.
- Premium CTA / hero: `all 0.3s cubic-bezier(0.16, 1, 0.3, 1)`.
- Respect `prefers-reduced-motion` — disable transforms and hover translate.
- No animation longer than `400ms` on hover; no infinite animations except loaders.

---

## 13. Breakpoints

| Name    | Max width |
| ------- | --------- |
| xs      | `480px`   |
| sm      | `640px`   |
| md      | `768px`   |
| lg      | `900px`   |
| xl      | `1024px`  |
| 2xl     | `1100px`  |

Use a mobile-first mindset, but existing CSS is desktop-first with `max-width` queries — match what the section already uses.

---

## 14. Content & Voice

- Title Case for H1 / H2; sentence case for H3 and buttons label copy (except legal / nav).
- CTAs are verbs: "Claim bonus", "Browse casinos", "Read review". Avoid "Click here".
- Numbers: use digits (`4.8`, `100+`). Ratings always to one decimal.
- Never stack two CTAs with the same label on the same screen.

---

## 15. Authoring Checklist (before shipping a page or section)

- [ ] H1 appears exactly once, uses the H1 token.
- [ ] Every heading follows the type ladder; no custom `font-size`.
- [ ] All spacing values map to the scale in §4.
- [ ] All radii use `--radius-*` or an approved pill/circle.
- [ ] All colors use CSS variables — no raw hex.
- [ ] Section vertical padding matches the density table (§4.1).
- [ ] Exactly one `.btn-primary` per view.
- [ ] Any pattern reused elsewhere has been promoted to a shared class / partial.
- [ ] Hover, focus-visible, active, and disabled states implemented for every interactive element.
- [ ] Mobile (`≤768px`) reviewed: spacing reduced, grid collapses, buttons full-width where appropriate.
- [ ] `prefers-reduced-motion` respected.
- [ ] Images have `width`, `height`, `alt`, and appropriate `loading` / `decoding`.
