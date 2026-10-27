# Header — V3.2

## Purpose
Shared, sticky, bilingual navigation header mounted on every page via `src/layouts/Layout.astro`. It exposes the site's top-level destinations and a compact, Kelvin-inspired segmented section-progress navigator on the homepage. No logo is rendered.

## Three-zone physical layout (fixed, LTR)
The header is a single slim bar with three deterministic physical zones that never reorder when the locale switches between English (`en`) and Persian (`fa`).

| Zone | Physical position | Contents |
|------|-------------------|----------|
| Left | Left | Language switcher (`EN / فا`), Theme toggle (icon) |
| Center | Center | Compact segmented progress strip + current-section label + integrated dropdown (homepage); compact Blog label on blog routes |
| Right | Right | Two top-level destinations: Home and Blog; optional Résumé download |

## Direction / localization isolation
- The `<html>` element keeps `dir="rtl"` for Persian and `dir="ltr"` for English (set in `Layout.astro`).
- The header's structural container sets `dir="ltr"` explicitly, so flex/grid items are **never** reordered by the document's RTL direction.
- Individual Persian labels render natively via the Unicode bidirectional algorithm inside the LTR container; no flex mirroring.
- Zone order, physical positions, and header height are identical in both languages.

## Markup / files
- Header markup: `src/components/layout/Navbar.astro`
- Mounted in: `src/layouts/Layout.astro` (`<Navbar lang={lang} translationId={Astro.props.translationId} />`)
- Language switcher: `src/components/ui/LanguageSwitcher.astro` (compact pills)
- Theme toggle: `src/components/ui/ThemeToggle.astro` (toggles `.dark` class, existing mechanism)
- Sticky offset custom property: `src/styles/global.css` (`.tracked-section { scroll-margin-top: var(--nav-offset, 7rem) }`)

## Sticky behavior — root cause and fix
### Root cause
`src/styles/global.css` previously declared `html, body { overflow-x: hidden; position: relative; }`. Setting `overflow-x` alone implicitly forces `overflow-y: auto` on **both** `html` and `body` (a CSS quirk), creating two independent vertical scroll containers. `document.scrollingElement` resolved to `html`, but the header's sticky scroll container was `body`, which does not move — so `position: sticky; top: 0` on the header never activated and the header rode up off the viewport as the page scrolled.

### Fix
`src/styles/global.css` now separates the containers:
- `html`: `overflow-x: hidden; overflow-y: auto;` — the single vertical scroll container.
- `body`: `overflow: visible;` — not a scroll container.

This makes `document.scrollingElement` (`html`) the sticky scroll container for the header. `document.documentElement.style.setProperty('--nav-offset', ...)` is still set by measuring the rendered header height (load + resize) and applied as `scroll-margin-top` via `.tracked-section` so anchor navigation never hides a heading behind the header.

### Sticky acceptance (browser-verified)
- Header remains at viewport top (`headerTop ≈ 0`) from 0% → 100% scroll on homepage and blog routes.
- Sticky preserved after anchor navigation and after internal navigation (theme/language switch).
- `position: sticky; top: 0; z-index: z-[60]` retained — no JS-driven position changes.

## Compact segmented progress navigation (V3.2, homepage only)
### Registered sections (real DOM ids)
- `start` — Hero
- `about` — About
- `experience` — Professional experience
- `journey` — Structured journey timeline
- `skills` — Skills
- `contact` — Contact panel
- `projects` — Structured project grid
- `blog` — Blog call to action

Only sections that actually render on the homepage are registered. The navigator is not rendered on blog indexes, category archives, or articles.

### Appearance
The center navigator is a compact row of thin separated horizontal lines — one line per real homepage section — plus a current-section label immediately to the right. It replaces the previous thick full-width progress track.

Target desktop dimensions:
- Strip width: ~280px (`w-[220px] sm:w-[220px] md:w-[280px]`)
- Segment height: 3px (`h-[3px]`)
- Gap between segments: 5px (`gap-[5px]`)
- Current-section label: right of the strip, `min-w-[110px]`, `text-[10px]`
- Strip is hidden below the `sm` breakpoint (600px); the center collapses to the label only on mobile to avoid horizontal overflow.

### Segment width calculation (proportional)
Each segment's width represents its section's share of the page's scrollable range, measured from real DOM positions:

```
scrollableDistance = documentHeight - viewportHeight   (clamped ≥ 1)
sectionLength_i    = top(section[i+1]) - top(section[i])   (last section: docHeight - top(last))
proportion_i       = sectionLength_i / sum(all sectionLengths)
segmentWidth_i     = clamp(proportion_i * (stripWidth - gaps), minWidth, …)
```

Widths are re-measured on `load` and `resize`. A longer section renders a visibly longer line. Equal/fixed widths are avoided; NaN/negative widths are clamped.

### Whole-page fill calculation (continuous, never resets)
Global page progress drives a per-segment fill drawn with `transform: scaleX()` from the left:

```
progressPercent = clamp(scrollY / scrollableDistance * 100, 0, 100)
segStartPct     = clamp(sectionStart / scrollableDistance * 100, 0, 100)
segEndPct       = clamp(sectionEnd   / scrollableDistance * 100, 0, 100)
segmentFill     = clamp((progressPercent - segStartPct) / (segEndPct - segStartPct), 0, 1)
```

- 0% at page top → 100% at page bottom, monotonic.
- Progress never resets at section boundaries; completed segments stay filled, the current segment partially fills.

### Current-section label
Placed immediately to the right of the strip as part of the same `<button>` control:
- Two-digit section number (accent color) + small separator + localized section title (muted).
- Example: `01 · Home` / `03 · مهارت‌ها`.
- Numbering is 1-based, generated from actual section order (never hardcoded).
- A `min-width` on the label prevents layout shift when switching between English and Persian.

### Dropdown
A compact floating panel anchored under the strip and **centered under the strip** (not the header):
- Width: ~288px desktop (~228px tablet), matching the strip.
- Placed immediately below the control row, visually centered under the strip at desktop/tablet widths and centered under the label on mobile.
- Border radius ~16px (`rounded-[16px]`), subtle border, soft shadow, light/dark panels.
- Rows ~40px high; each row shows two-digit index, localized title, and a tiny proportional line on the right.
- The current row is emphasized (weight + accent color + subtle bg).

### Interactions (single cohesive control)
The strip and current-section label form ONE interactive `<button id="progress-control">` — no separate dropdown button, no chevron, no competing popovers.

- **Hover**: hovering the strip **or** the label opens the dropdown beneath the strip (short delay to avoid flicker). The dropdown stays open while the pointer is inside it.
- **Focus**: focusing the control opens the dropdown; Escape closes it; outside click closes it.
- **Touch**: tapping the control opens/closes the dropdown.
- **Click**: selecting a row closes the dropdown, smooth-scrolls to the section respecting `--nav-offset`, updates the URL hash (`history.pushState`), and updates the active label / progress. `prefers-reduced-motion` is respected.
- `aria-expanded` / `aria-controls` / `role="menu"` / `role="menuitem"` exposed; focus-visible rings.

### Rendering method
One flex row of segment tracks, each with a local fill derived from global progress vs. its interval, cumulative boundaries, native CSS transforms. No canvas, no charting library. Measurements and scroll updates are `requestAnimationFrame`-throttled and use passive listeners.

## Page-specific behavior
- Homepage: full compact segmented progress navigator (mandatory).
- Blog indexes, category archives, and articles: no progress navigator; compact Blog label.
- Blog articles keep their existing table of contents.

## Right-side navigation + résumé
- Links: Home and Blog — resolve via localized routes. Homepage section navigation is in the progress dropdown. Active area is marked with `aria-current="page"`.
- Résumé: distinct download button at the far right (`/resume/${lang}.pdf`, `download` attribute). Hidden when `resume.enabled` or `profile.visible` is false. The localized résumé routes also redirect directly to the generated PDF.

## Mobile / tablet
- Below `sm` (600px): the segment strip is hidden; the center shows only the current-section label (which still opens the dropdown on tap). Left zone keeps language + theme; right zone link group replaced by a menu button.
- At `sm` and above: the compact segmented strip renders.
- Mobile menu (`#mobile-menu`) contains Home and Blog + résumé download (when available) + language switcher. Touch-friendly targets.
- No horizontal overflow on any breakpoint.

## Accessibility
- `aria-label`, `aria-expanded`, `aria-controls`, `aria-current`, `role="menu"`/`role="menuitem"`.
- Focus-visible rings, keyboard activation (focus), Escape to close, outside-click to close.
- Skip-to-content link retained (`#main-content`).
- `prefers-reduced-motion` respected via global CSS (`transition-duration: 0.01ms`).

## Validation
- `npm run check` (`astro check`): 0 errors.
- `npm run build` (`astro build` + pagefind): success.
- `npm run test` (content:validate, content:check-links, test:static): pass.
- Browser tests via Chrome CDP: all compact-strip / proportional-fill / dropdown / sticky / EN/FA / mobile-tablet assertions pass.

## Screenshots
Desktop dropdown-open captures: `/tmp/kilo/screenshot-v32-en.png`, `/tmp/kilo/screenshot-v32-fa.png`.

## Known limitations
- Résumé button hidden until `content/resume/config.json` `enabled` and `content/profile.json` `visible` are both true and PDFs are generated.
- Progress navigator is homepage-scoped; blog routes show a compact Blog label.
- On mobile (< sm) the segment strip is hidden to prevent horizontal overflow; the label remains.
