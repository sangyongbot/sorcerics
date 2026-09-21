# Scroll-Scrub Landing (scoutmotors-style) — Design

Date: 2026-09-11

## Goal

A single static landing page where a source video plays forward as the user
scrolls down and reverses as they scroll up — the scroll-driven hero effect on
[scoutmotors.com](https://www.scoutmotors.com/) — followed by a couple of
scout-style parallax content sections.

## Reference: how Scout Motors does it

Built by Locomotive studio. Stack detected: **GSAP (ScrollTrigger, `scrub`)** +
**Lenis** (smooth scroll) + Swiper. The hero is not a scrubbed `<video>`; it is an
**image sequence** (`viewfinder-01.jpg`…) drawn frame-by-frame, driven by scroll
progress. Apple's "AirPods" scroll technique. `scrub` makes the sequence reverse
automatically when scrolling up — no manual direction detection needed.

## Chosen approach

**Image-sequence canvas scrub.** Slice the video into JPG frames, preload them,
draw the scroll-mapped frame to a full-viewport `<canvas>`. This reverses far more
smoothly than seeking a `<video>` element.

- Stack: single static `index.html` + `styles.css` + `main.js`. GSAP,
  ScrollTrigger, Lenis loaded from CDN. No build step.

## Source video

`.superset/attachments/*3.mp4` — 1280×720, 24fps, 10s, **240 frames**, h264.
Content is one continuous transformation: bright white studio (a woman walks in) →
furnished living room, lamp lit (day) → dark night bedroom (near-black). A calm,
cinematic day→evening→night arc that suits a scroll narrative. An AI-gen sparkle
watermark is baked into the bottom-right; left as-is for this build.

## Components

1. **Frame extraction** (`scripts/slice.sh`) — ffmpeg → `frames/frame_0001..0240.jpg`,
   native res, `-q:v 3`. ~6.6MB total (content is mostly flat white/black so frames
   are small, so all 240 are kept for the smoothest possible scrub).

2. **Preloader** — load all 240 `Image`s, show a `%` counter, fade out when done,
   then initialise scroll. Full preload guarantees any frame is ready when scrubbing
   backward to an arbitrary position.

3. **Hero scrub** — a tall trigger (`end: "+=400%"`, i.e. 4 viewport-heights of
   scroll → 240 frames) with `pin` on the sticky canvas container and `scrub`.
   A GSAP tween drives a `{ frame }` proxy 0 → 239; `onUpdate` draws that frame to
   canvas (cover-fit, devicePixelRatio-aware). Scroll up ⇒ frame index decreases ⇒
   reverse playback, handled entirely by `scrub`.

4. **Hero overlay text** — driven off the same frame progress `p = frame/239` so
   copy is perfectly synced to the visuals. Text color adapts to the day→night arc
   (dark text over the bright early frames, light text once the scene darkens near
   the end). Nav wordmark uses `mix-blend-mode: difference` to stay legible over any
   background. Scroll hint fades after the user starts scrolling.

5. **Content sections below** — 2 parallax panels + footer, on a dark background
   that the night-time end of the hero flows into. Headlines fade/translate in;
   a block uses `yPercent` parallax. Copy is evocative placeholder text about a
   home moving through the day (easy to swap later).

## Scroll engine integration

Lenis for inertial smooth scroll, wired to ScrollTrigger the standard way:
`lenis.on('scroll', ScrollTrigger.update)` and `gsap.ticker.add(t => lenis.raf(t*1000))`
with `lagSmoothing(0)`.

## Responsiveness & fallbacks

- Canvas resizes with the window and redraws the current frame; cover-fit preserves
  aspect ratio on any viewport.
- `prefers-reduced-motion: reduce`: skip pin/scrub, show one representative frame
  statically, let sections simply appear. No scroll-hijacked animation.

## File structure

```
index.html
styles.css
main.js
scripts/slice.sh
frames/frame_0001.jpg .. frame_0240.jpg
docs/superpowers/specs/2026-09-11-scroll-scrub-landing-design.md
```

## Verification

Serve locally and drive a real browser: confirm frames advance on scroll-down and
reverse on scroll-up, the hero pins and releases cleanly, sections reveal, and
layout holds on resize.

## Revision — 2026-09-11 (performance + review hardening)

Shipped changes after first-cut feedback ("loading is very slow") and an adversarial
multi-dimension review:

- **Frames are now WebP, not JPG**, decimated to **120 frames** (12fps) at **1152px**
  wide — ~1.3MB total (was ~6.6MB JPG @ 240 frames). A second **640px set in
  `frames/sm/`** (~784KB) is generated for phones/small screens. ffmpeg here lacks
  libwebp, so `scripts/slice.sh` extracts PNG then converts with `cwebp`. The source
  video is copied to `assets/source.mp4` so re-slicing survives attachment cleanup.
- **Progressive loading** replaces the all-or-nothing preload: frame 0 is fetched
  first and shown immediately (loader hides at ~140ms), the rest stream in order in
  the background, and `drawFrame` falls back to the nearest already-loaded frame when
  a target hasn't arrived. `main.js` picks `frames/sm` when
  `innerWidth < 700 || innerWidth*dpr < 900`.
- **Dev server** `scripts/serve.mjs` (Node, HTTP/1.1 keep-alive, correct WebP MIME,
  `immutable` cache for `/frames/`) — Python's `http.server` closes the connection
  per request, which made the many small frame requests slow locally.
- **iOS Safari / mobile**: hero sticky uses `100svh` (fallback `100vh`);
  `ScrollTrigger.config({ ignoreMobileResize: true })`; `onResize` ignores
  height-only changes on touch (toolbar show/hide) and refreshes before re-sizing
  the canvas.
- **Legibility**: a light plate (`.hero__scrim--day`) sits behind the dark day
  captions and fades before night; captions also carry a soft text-shadow.
- **Robustness/a11y**: fallback guard also checks `!window.ScrollTrigger` and wraps
  `setupScroll()` in try/catch → static fallback; `:focus-visible` outlines added;
  canvas gets `role="img"` + `aria-label`; mobile stacks heading before image on
  both panels.
