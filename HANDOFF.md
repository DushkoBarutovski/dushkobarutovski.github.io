# Portfolio Site — Handoff

Last verified: direct read-through of every file in this folder, this session.
Everything below describes what is actually in the code right now — not what was intended,
requested, or assumed along the way.

## 1. What this project is

A 3-page static portfolio site (vanilla HTML/CSS/JS, no build step, no framework):

- **`index.html`** — landing page with a "coverflow" carousel of projects and a dynamic,
  slowly panning background slideshow.
- **`project.html`** — a single reusable template for every project's detail page, driven
  by a `?id=...` query parameter. Renders display in a full-bleed viewer with an optional
  fullscreen ("lightbox") mode.
- **`about.html`** — About + Contact (static form, not wired to a backend).

Dark mode, the circular-offset math, and the image-fallback helper are shared across all
three pages via `site.js`. Each page also loads its own dedicated external script
(`carousel.js`, `project.js`, or `about.js`) — there are no inline `<script>` blocks
anywhere in the project.

## 2. File structure

```
portfolio-site/
├── index.html          Landing page markup + inline SVG chromatic-aberration filter
├── project.html         Project detail page markup (single template for all projects)
├── about.html            About/Contact page markup
├── style.css              All styles for all 3 pages (958 lines)
├── data.js                 Single source of truth: the PROJECTS array (73 lines)
├── site.js                   Shared: dark mode, footer year, circular-offset math,
│                              image-with-fallback helper — loaded on every page (93 lines)
├── carousel.js                Landing page: coverflow cards + background slideshow (177 lines)
├── project.js                  Project page: render viewer, thumbnail picker, info panel,
│                              magnifier, fullscreen/fit-width (325 lines, largest file)
├── about.js                About page: contact form submit handler, placeholder only (14 lines)
├── fonts/
│   ├── LeagueSpartan-VariableFont_wght.woff   Primary — self-hosted, all weights in one file
│   ├── LeagueSpartan-VariableFont_wght.ttf    Fallback for the rare browser that can't use WOFF
│   └── OFL.txt                                  SIL Open Font License — keep alongside the font files
└── images/
    ├── README.txt          Checklist of expected image filenames
    └── (no actual image files yet — see Known Issues)
```

Cache-busting: every `<link>`/`<script>` tag uses a `?v=N` query string. Current versions,
verified across all three HTML files:

| File | Version |
|---|---|
| `style.css` | `?v=28` |
| `data.js` | `?v=2` |
| `site.js` | `?v=2` |
| `carousel.js` | `?v=5` |
| `project.js` | `?v=14` |
| `about.js` | `?v=2` |

**Any time a file is edited, its version number must be bumped in every HTML file that
references it**, or browsers may keep serving a cached copy — this has been the cause of
several "my change didn't show up" issues earlier in the project.

## 3. Features (verified present in code)

### Site-wide
- Dark/light mode toggle (`site.js`), persisted to `localStorage`, falls back to OS
  preference, degrades gracefully if storage is unavailable.
- Design tokens as CSS custom properties (`--color-bg`, `--color-text`, etc.), redefined
  under `:root[data-theme="dark"]`.
- Shared image-fallback helper (`createProjectImage` in `site.js`): any project image that
  fails to load shows a labeled placeholder box instead of a broken-image icon.
- Typography: self-hosted League Spartan (variable font, one file covers every weight),
  loaded via `@font-face` in `style.css` from `fonts/`. Both `--font-body` and
  `--font-heading` point to it — the site briefly used Google Fonts' CDN version first,
  then switched to self-hosting from the person's own font files.

### Landing page (`index.html` / `carousel.js`)
- Coverflow carousel: selected card centered and scaled 1.3×, others shrink/fade with
  distance (`getCircularOffset`, shared from `site.js`), positions wrap circularly (last
  project sits beside the first).
- Click a side card to bring it to center; click the centered card (or the "More" button)
  to go to its project page.
- Prev/Next arrow buttons and Left/Right arrow-key navigation.
- The "Project Name" title crossfades (fade out, swap text, fade in, ~250ms) whenever the
  selected project changes, instead of snapping instantly. Skipped for reduced-motion,
  where it's an immediate text swap instead.
- Background slideshow: cycles the selected project's hero render + its 2nd/3rd renders
  (`renders[1]`, `renders[2]` — the 1st render is intentionally skipped). A panning image
  holds 2s after finishing its pan before crossfading to the next; an image whose aspect
  ratio already matches the viewport skips panning and holds 4s instead. Reduced-motion
  users get the 4s hold for every image (no panning attempted). Every project switch does
  a synchronous hard-removal of any existing `<img>` in the backdrop before starting the
  new project's slideshow, and the crossfade cleanup fades out *every* leftover image
  (`querySelectorAll`, not just the first match) — both added specifically to fix ghosting
  from rapid switching (see Recent Fixes).
- Chromatic aberration on the background image via an inline SVG filter
  (`#chromatic-aberration`, defined in `index.html`), red/blue channels offset ∓3px,
  recombined with a "screen" blend.
- Pan animation is a single one-way pass (`from`/`to` keyframes, `forwards` fill mode) that
  holds at its end position — not a back-and-forth loop.
- "More" button styled as an outlined pill (no fill, uses `.btn` + `.view-project-btn`,
  not `.btn-primary`), matching the carousel arrows.

### Project detail page (`project.html` / `project.js`)
- Render viewer fills all available vertical space via a flex layout (`.render-stage`),
  not a hardcoded height.
- Vertical "coverflow" thumbnail picker on desktop (same math as the landing carousel,
  vertical instead of horizontal); collapses to a plain horizontal scrollable strip under
  700px, since hover-based effects don't translate to touch.
- Selected thumbnail drops its edge fade and gets a thin outline instead of relying on
  scale/opacity alone.
- Blurred-backdrop fill behind any render that doesn't perfectly fill the viewer
  (portrait or landscape) — a stand-in for "matching colours" using a blurred copy of the
  same image. Applies regardless of image orientation. Dimmed to `brightness(0.735)` so it
  stays clearly secondary to the actual render. (Chromatic aberration was briefly added
  here and then removed — the landing page background is the only place that effect is
  still used.)
- Info panel ("Story" / "About this render"): hidden by default, reveals on hover of a
  small handle button (`#info-handle`), click toggles a `.locked` class on `#info-toggle`
  to keep it open without hovering. **Its locked/unlocked state is independent of
  fullscreen — opening or closing fullscreen does not touch it** (only fit-width and the
  magnifier reset on fullscreen close; see Known Issues).
- Magnifier: toggle button (`#magnifier-toggle`) shows a floating circular lens on hover.
  Magnification is derived from the ratio of native image resolution to displayed size
  (not a fixed zoom level), clamped so the lens never shows past the image's real edges,
  with a thin crosshair at lens center. Lens is `position: fixed` so it tracks the true
  viewport correctly in both normal and fullscreen view. **Currently unreachable outside
  fullscreen — see Known Issues.**
- Fullscreen ("lightbox") view: click the render (or Enter/Space when it's focused) to
  expand it to fill the browser window; header, footer, heading, thumbnail stack, and info
  toggle all hide. Close via the × button or Escape.
- Fit-width toggle (fullscreen only, `#viewer-fit-toggle`): switches the render between
  "fit entirely on screen" (default) and "fill screen width, scroll for height" (with
  `overscroll-behavior: contain` so that inner scroll can't chain to the page). Clicking
  the expanded image itself also toggles this once already fullscreen — the button still
  works too, and both stay in sync through the same function.
- Closing fullscreen (Escape or ×) resets fit-width and the magnifier to off, and forces
  `window.scrollTo(0, 0)` to guard against scroll drift.
- Arrow-key render switching (Up/Down) calls `preventDefault()` so the page doesn't scroll
  at the same time.

### About page (`about.html` / `about.js`)
- Static About section (photo placeholder + bio text, both marked "replace this").
- Contact form: client-side only, shows a "not connected yet" message on submit, does not
  send anywhere.

## 4. Known issues (verified, not yet fixed)

1. **Magnifier toggle button is unreachable outside fullscreen.**
   In `project.html`, `#magnifier-toggle` is a child of `.viewer-controls`. In `style.css`,
   `.viewer-controls` is `display: none` by default and only becomes `display: flex` under
   `body.image-expanded` (fullscreen). A `display: none` parent hides all descendants
   regardless of the child's own `position`/`display` — so even though `.magnifier-toggle`
   has its own independent `position: absolute` rule intended to place it in the normal
   view (next to the info button, at `top: calc(50% - 52px); right: 1.5rem;`), it never
   actually renders there, because its parent is hidden. In fullscreen, `.viewer-controls`
   becomes visible and the button works correctly there.
   **Net effect: the magnifier can currently only be turned on while already in
   fullscreen — it cannot be reached from the normal view at all.**
   *Likely fix: move `#magnifier-toggle` in `project.html` out of `.viewer-controls` to be
   a sibling of it (a direct child of `.render-stage`, which is what its own dedicated CSS
   already assumes), keeping the existing `body.image-expanded .magnifier-toggle` override
   that repositions it next to the other controls while fullscreen.*

2. **Info panel lock state is inconsistent with the other two toggles on fullscreen
   close.** `setExpanded(false)` explicitly resets fit-width (`setFitWidth(false)`) and the
   magnifier (`magnifierToggle.click()` if on), but never touches `#info-toggle`'s
   `.locked` class. If a visitor locks the info panel open, then opens and closes
   fullscreen, the info panel is still locked open afterward — unlike the other two modes,
   which always start fresh. Not necessarily wrong (the info panel is less visually
   disruptive to leave open than a full-screen zoom mode), but it's an asymmetry worth a
   deliberate decision rather than leaving as an accident of what was and wasn't wired up.

3. **No real project images exist yet.** `images/` contains only `README.txt` — every
   render and hero image currently displays as a labeled placeholder box via the fallback
   in `site.js`. Expected/by design, not a bug, but worth listing since it limits how much
   of the visual design (blurred backdrops, magnifier, aspect-ratio detection) can actually
   be evaluated until real files are added.

4. **Placeholder copy throughout.** All project names ("Project One"–"Five"), stories,
   render descriptions (`data.js`), the About bio and photo (`about.html`), and the social
   link URLs (`href="#"`) are still placeholder content.

## 5. Recent fixes (this session, verified in current code)

- **Backdrop slideshow ghosting**: crossfade cleanup previously used
  `querySelector('img')` (first match only); rapid project switching could outpace the
  1.2s fade-out and strand extra images at full opacity. Changed to `querySelectorAll`
  (cleans up every leftover image, not just one), plus `updateBackdrop()` now does a
  synchronous hard-removal of all existing images the instant a project changes, rather
  than relying on the fade timer.
- **Magnifier lens fullscreen positioning**: lens was `position: absolute` relative to
  `.render-stage`, whose layout could drift out of alignment with the fullscreen viewer.
  Changed to `position: fixed`, so it tracks raw viewport coordinates directly — correct
  in both normal and fullscreen with no offset math needed.
- **Magnifier toggle reachability (fullscreen only)**: its z-index (3) was below the
  fullscreen viewer's (1000), so the image painted over it. Raised to 1001 while
  `body.image-expanded` — this made it clickable, but the follow-up fix below is what
  actually got it visually aligned with its siblings.
- **Magnifier toggle alignment (fullscreen only)**: even after the z-index fix, the button
  still carried `position: absolute` from its normal-view rule, which pulled it out of
  `.viewer-controls`'s flex row. Manually-computed `top`/`right` offsets were then being
  measured against `.viewer-controls`'s own small box (its real parent) rather than the
  viewport, landing it lower and further left than the close/fit-width buttons. Fixed by
  switching it to `position: static` while fullscreen, so flexbox aligns it with its
  siblings automatically instead of relying on manual offset math.
  (This fixed reachability and alignment *inside* fullscreen; Known Issue #1 above is a
  separate, still-open problem with reachability *outside* fullscreen.)
- **Fullscreen scroll drift ("image shifts under the banner")**: `setExpanded()` now
  forces `window.scrollTo(0, 0)` on both open and close; `overscroll-behavior: contain`
  added to the fit-width viewer to stop its internal scroll from chaining to the page.
- **Escape now resets both toggles**: closing fullscreen via Escape or × turns off both
  fit-width and the magnifier (previously only fit-width reset).
- **Landscape backdrop blur bug**: the render-page blurred-backdrop fill was only wired up
  for portrait images; landscape renders with any letterboxing showed plain background
  instead. Now applies regardless of orientation.
- **Pan animation**: changed from an infinite back-and-forth loop to a single one-way pass
  that holds at its end position (`forwards` fill mode), so it lines up cleanly with the
  slideshow advancing to the next image.

## 6. Exact next steps

In priority order:

1. **Fix the magnifier-toggle nesting bug** (Known Issue #1) — a one-element markup move
   in `project.html`, no CSS logic changes needed since the fullscreen-specific override
   rule already exists and is correct.
2. **Decide on the info-panel reset behavior** (Known Issue #2) — either add it to
   `setExpanded(false)` for consistency with fit-width/magnifier, or leave it and note the
   decision so it isn't mistaken for an oversight later.
3. **Add real project images** to `images/`, matching the filenames listed in
   `images/README.txt` (or update the paths in `data.js` to match whatever filenames are
   used instead).
4. **Replace placeholder copy**: project names/stories/render descriptions in `data.js`,
   the About bio and photo in `about.html`, and the social link URLs.
5. **Decide on a contact form backend** (e.g., Formspree or EmailJS, both mentioned
   in-code as suggestions in `about.js`) — the form currently only shows a placeholder
   success message and sends nothing.
6. **Deploy**: no hosting/deployment step has happened yet in this project; the site is
   still local files only.
