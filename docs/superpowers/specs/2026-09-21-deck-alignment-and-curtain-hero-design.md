# Deck alignment + curtain hero — Design (2026-09-21)

Source of truth: `~/Downloads/new web ongoing.pdf` (44 screens, 1366×768 pt) and
the feedback list from the 26Q3 web sync. Reference site: scoutmotors.com.

## Layout system
- One deck point = `--u = 100vw / 1366`. Every desktop measurement is the deck
  value × `--u` (type: nav 8, body 13, headings 25, giant title 164.9; positions
  such as copy block at x55 / y429). Type is floored (10/13/22 px) for legibility.
- Satoshi (the deck's typeface) is self-hosted in `fonts/`.
- The SOL / sorcerics wordmarks are the designer's outlined vectors, extracted
  from deck page 6 into `assets/wordmarks.svg` and inlined into each page by
  `scripts/inject_wordmarks.py`.
- Product renders are the deck's own embedded images (`product/sol-*.webp`,
  white → transparent), placed with the deck's image boxes.
- Below 760 px the deck coordinates are replaced by a stacked flow (the deck has
  no mobile design).

## Home
1. **Cover** (deck p1–6): time-based intro — mint dot → "Elevating the Art of
   Living" types out → SOL → sorcerics joins → both slide to the corners while
   the menu fades in, all on the vertical centre line. Any wheel/touch/key skips.
2. **Nav**: fixed, z-index 1100 (Chakra "sticky" tier); `<main>` is an isolated
   stacking context so nothing on the page can out-stack it. On the home page
   the nav starts centred and translates up 1:1 with scroll until it reaches the
   top (sticky behaviour without leaving the root context).
3. **Curtain + film** (Scout Motors pattern): the cover is a normal-flow 100svh
   block with a higher z-index; the film section starts with `margin-top:
   -100svh`, so its `position: sticky` canvas is already behind the cover and
   the 120-frame scrub begins at scroll 0 as the curtain lifts.
   `--film-len` (default 4 viewport heights) sets the scrub length.
4. Product intro (p10–13) and Layers (p14) follow the deck coordinates.

## Device (p24–41)
Photo hero (478 pt) → FUTURE IS HERE → dual lenses (200°/25MP) → think of next
→ dimensions → rotation scrub (5 renders, travelling mint glow) → be everywhere
(intro / wall mount / cable on wall / shelf) → atmosphere → craftsmanship.

## Order (p15–22)
Stage 981×594 at (37,149); panel at x1089 with Images/FAQ/Details tabs. One
finish only (Light Grey); "Order Now" reveals the shipping form; payment
provider not wired (Shopify vs Stripe undecided). `?p=acc` shows the
accessories placeholder (tape measure / apparel / diffuser — reference only).

## Library (p42–44)
Rooms → scenario lists, search reveal, inline video (assets/source.mp4), two
circular crops of the lounge photo.

## Verification
`scripts/shoot.mjs` (Playwright) screenshots every page at 1440×900 and 390×844
across scroll depths and reports console errors / failed requests.
