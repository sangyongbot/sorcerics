/* =====================================================================
   SOL / sorcerics — main.js
   One script for every page; each feature guards on element presence.
     · nav: theme swap + (home) centred -> sticky ride-up
     · home: logo intro timeline, curtain + scroll-scrubbed film,
             product-intro line, layers reveal
     · device: rotation scrub with travelling glow
     · order: tabs / gallery / FAQ / shipping form / ACC mode
     · library: rooms, scenarios, search, inline video
   ===================================================================== */
(() => {
  "use strict";

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = () => window.innerWidth <= 760;
  const page = document.body.dataset.page || "";
  const nav = document.getElementById("nav");
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  let lenis = null;

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  /* ------------------------------------------------------------------
     Smooth scroll (Lenis) + ScrollTrigger wiring
     ------------------------------------------------------------------ */
  function setupLenis() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    if (!window.Lenis || reduced) return;
    lenis = new Lenis({ lerp: 0.1 });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------
     Nav — colour follows the section under the wordmark; on the home
     page the whole bar starts vertically centred (deck p6) and moves up
     1:1 with the first scroll until it reaches its top position, where
     it stays fixed (sticky behaviour without leaving the root context).
     ------------------------------------------------------------------ */
  const navCtl = { shift0: 0, ride: page === "home", raf: 0 };
  const themed = $$("[data-theme]");

  function measureNav() {
    if (!nav || !navCtl.ride) return;
    const prev = nav.style.transform;
    nav.style.transform = "none";
    const r = $(".nav__brand", nav).getBoundingClientRect();
    navCtl.shift0 = Math.max(0, window.innerHeight / 2 - (r.top + r.height / 2));
    nav.style.transform = prev;
  }
  function updateNav() {
    navCtl.raf = 0;
    if (!nav) return;
    const y = window.scrollY || 0;
    const shift = navCtl.ride ? Math.max(0, navCtl.shift0 - y) : 0;
    nav.style.transform = shift > 0.5 ? `translate3d(0,${shift.toFixed(2)}px,0)` : "";
    const b = $(".nav__brand", nav).getBoundingClientRect();
    const sampleY = b.top + b.height / 2;
    let theme = "dark";
    for (const s of themed) {
      const r = s.getBoundingClientRect();
      if (r.top <= sampleY && r.bottom > sampleY) theme = s.dataset.theme || theme;
    }
    nav.classList.toggle("on-light", theme === "light");
  }
  const scheduleNav = () => { if (!navCtl.raf) navCtl.raf = requestAnimationFrame(updateNav); };

  /* ------------------------------------------------------------------
     Home · intro (deck p1-6). Time-based, not scroll-based.
     dot -> "Elevating the Art of Living" types out -> SOL -> sorcerics
     joins -> both slide to the edges, menu fades in at the centre.
     Any wheel / touch / key press skips to the end state.
     ------------------------------------------------------------------ */
  function setupIntro(done) {
    const intro = $("#intro");
    if (!intro) { done(); return; }
    const textEl = $("#introText"), dot = $("#introDot");
    const brand = $(".nav__brand", nav), maker = $(".nav__maker", nav), menu = $(".nav__menu", nav);
    if (!hasGsap || reduced) { intro.classList.add("is-done"); done(); return; }

    const W = window.innerWidth, u = W / 1366;
    const rb = brand.getBoundingClientRect(), rm = maker.getBoundingClientRect();
    const xCentre = W / 2 - rb.width / 2 - rb.left;                       // SOL alone, centred (p4)
    const gap = isMobile() ? 22 : 108 * u;                                // SOL … sorcerics (p5)
    const pairLeft = isMobile() ? (W - (rb.width + gap + rm.width)) / 2 : 641 * u;
    const xPairBrand = pairLeft - rb.left;
    const xPairMaker = pairLeft + rb.width + gap - rm.left;

    nav.classList.add("is-intro");
    gsap.set(brand, { x: xCentre, autoAlpha: 0 });
    gsap.set(maker, { x: xPairMaker, autoAlpha: 0 });
    gsap.set(menu, { autoAlpha: 0 });

    const text = "Elevating the Art of Living";
    const typer = { n: 0 };
    const html = document.documentElement;
    html.classList.add("is-locked");
    window.scrollTo(0, 0);
    if (lenis) lenis.stop();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      intro.classList.add("is-done");
      nav.classList.remove("is-intro");
      gsap.set([brand, maker, menu], { clearProps: "transform,opacity,visibility" });
      html.classList.remove("is-locked");
      if (lenis) lenis.start();
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      scheduleNav();
      done();
    };
    const tl = gsap.timeline({ paused: true, onComplete: finish });
    tl.fromTo(dot, { autoAlpha: 0, scale: 0.3 }, { autoAlpha: 1, scale: 1, duration: 0.55, ease: "power2.out" }, 0.2)
      .to(typer, { n: text.length, duration: 1.25, ease: "none",
        onUpdate: () => { textEl.textContent = text.slice(0, Math.round(typer.n)); } }, 0.8)
      .to(dot, { autoAlpha: 0, duration: 0.3 }, 2.35)
      .to(textEl, { autoAlpha: 0, duration: 0.45, ease: "power2.in" }, 2.55)
      .to(brand, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, 2.7)
      .to(brand, { x: xPairBrand, duration: 0.55, ease: "power3.inOut" }, 3.3)
      .to(maker, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 3.4)
      .to([brand, maker], { x: 0, duration: 0.95, ease: "expo.inOut" }, 4.05)
      .to(menu, { autoAlpha: 1, duration: 0.6, ease: "power2.out" }, 4.55);

    const skip = () => { if (!finished) tl.progress(1); };
    window.addEventListener("wheel", skip, { passive: true });
    window.addEventListener("touchstart", skip, { passive: true });
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    tl.play();
  }

  /* ------------------------------------------------------------------
     Home · film — 120-frame WebP sequence drawn to a canvas (cover fit,
     dpr-aware). Progressive load: frame 0 first, the rest stream in and
     draw() falls back to the nearest loaded frame.
     ------------------------------------------------------------------ */
  function setupFilm() {
    const canvas = $("#frameCanvas");
    if (!canvas) return null;
    const sticky = $("#filmSticky"), capA = $("#capA"), capB = $("#capB"), hint = $("#filmHint");
    const TOTAL = 120, CONC = 8;
    const small = window.innerWidth < 700 || window.innerWidth * (window.devicePixelRatio || 1) < 900;
    const dir = small ? "frames/sm" : "frames";
    const src = (i) => `${dir}/frame_${String(i + 1).padStart(4, "0")}.webp`;
    const ctx = canvas.getContext("2d", { alpha: false });
    const imgs = new Array(TOTAL), ok = new Array(TOTAL).fill(false);
    const st = { frame: 0 };
    let target = 0, drawn = -1, W = 0, H = 0;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = sticky.clientWidth; H = sticky.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function cover(img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      const w = img.naturalWidth * s, h = img.naturalHeight * s;
      ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    }
    function nearest(i) {
      if (ok[i]) return i;
      for (let d = 1; d < TOTAL; d++) {
        if (i - d >= 0 && ok[i - d]) return i - d;
        if (i + d < TOTAL && ok[i + d]) return i + d;
      }
      return -1;
    }
    function draw(i) {
      target = clamp(Math.round(i), 0, TOTAL - 1);
      const j = nearest(target);
      if (j < 0 || j === drawn) return;
      cover(imgs[j]); drawn = j;
    }
    function band(p, a, b, c, d) {
      if (p <= a || p >= d) return 0;
      if (p < b) return (p - a) / (b - a);
      if (p > c) return 1 - (p - c) / (d - c);
      return 1;
    }
    function overlay(p) {
      const a = band(p, 0.08, 0.16, 0.5, 0.6), b = band(p, 0.7, 0.8, 2, 3);
      if (capA) { capA.style.opacity = a; capA.style.transform = `translateY(${((1 - a) * 14).toFixed(1)}px)`; }
      if (capB) { capB.style.opacity = b; capB.style.transform = `translate(-50%, ${((1 - b) * 14).toFixed(1)}px)`; }
      if (hint) hint.style.opacity = p > 0.02 ? 0 : 1;
    }
    function render() { draw(st.frame); overlay(st.frame / (TOTAL - 1)); }
    function load(i) {
      return new Promise((res) => {
        if (imgs[i]) { res(ok[i]); return; }
        const im = new Image(); im.decoding = "async";
        im.onload = () => { ok[i] = true; if (Math.abs(i - target) <= 2) { drawn = -1; draw(target); } res(true); };
        im.onerror = () => res(false);
        im.src = src(i); imgs[i] = im;
      });
    }
    function loadRest() { let n = 1; const worker = async () => { while (n < TOTAL) await load(n++); }; for (let k = 0; k < CONC; k++) worker(); }

    size();
    load(0).then(() => { draw(0); overlay(0); });
    let rr = 0, lastW = window.innerWidth;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    window.addEventListener("resize", () => {
      const w = window.innerWidth, hOnly = w === lastW; lastW = w;
      if (hOnly && coarse) return;
      cancelAnimationFrame(rr);
      rr = requestAnimationFrame(() => { size(); drawn = -1; draw(target); });
    });
    return { st, TOTAL, render, load, draw, overlay, loadRest };
  }

  /* ------------------------------------------------------------------
     Scroll-driven features (GSAP ScrollTrigger)
     ------------------------------------------------------------------ */
  function setupScroll(film) {
    // Film scrub: the section starts behind the cover (margin-top -100vh),
    // so progress 0 is scroll 0 — the frames advance as the curtain lifts.
    if (film) {
      gsap.to(film.st, {
        frame: film.TOTAL - 1, ease: "none", onUpdate: film.render,
        scrollTrigger: { trigger: "#film", start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
    }

    // Product intro (deck p11-13): pinned for three viewport heights. The
    // deck's own arrow shapes are revealed along their centreline — first from
    // the price up to ORDER, then from "Discover More About Sol" to DEVICE.
    const pintro = $("#pintro");
    if (pintro && $("#arrowA") && !isMobile()) {
      const A = { g: $("#arrowA"), reveal: $("#arrowRevealA"), origin: $("#arrowA .pintro__origin"), target: $('.nav__menu a[href="order.html"]') };
      const B = { g: $("#arrowB"), reveal: $("#arrowRevealB"), origin: $("#arrowB .pintro__origin"), target: $(".nav__menu .nav__row--inline") };
      const ps = { p: 0 };
      const arrow = (ar, draw, vis) => {
        ar.reveal.style.strokeDashoffset = (1 - draw).toFixed(4);
        ar.g.style.opacity = vis.toFixed(3);
        ar.origin.style.opacity = (vis * clamp(draw * 8, 0, 1)).toFixed(3);
        if (ar.target) ar.target.classList.toggle("is-hint", vis > 0.5 && draw > 0.995);
      };
      const paint = () => {
        const p = ps.p;
        arrow(A, clamp((p - 0.05) / 0.30, 0, 1), 1 - clamp((p - 0.42) / 0.06, 0, 1));
        arrow(B, clamp((p - 0.52) / 0.32, 0, 1), clamp((p - 0.48) / 0.04, 0, 1));
      };
      paint();
      gsap.to(ps, { p: 1, ease: "none", onUpdate: paint,
        scrollTrigger: { trigger: pintro, start: "top top", end: "bottom bottom", scrub: 0.5 } });
    }

    // Layers: mint discs (deck p13) become the photo crops (p14) as they rise.
    $$(".layers__circle").forEach((c) => {
      gsap.fromTo(c, { "--veil": 1 }, { "--veil": 0, ease: "none",
        scrollTrigger: { trigger: c, start: "top 92%", end: "top 38%", scrub: true } });
    });

    // Device: rotation scrub (deck p29-32) — 5 renders + a travelling glow.
    const stage = $("#rotStage");
    const rot = stage ? $$(".dv__rot-img", stage) : [];
    const glow = $("#rotGlow");
    if (stage && rot.length && !isMobile()) {
      const keys = [[0.02, 0.42], [0.98, 0.48], [0.34, 0.98], [0.62, 0.02]];
      const rs = { p: 0 };
      const paint = () => {
        const idx = Math.round(rs.p * (rot.length - 1));
        rot.forEach((im, i) => { im.style.opacity = i === idx ? 1 : 0; });
        if (glow) {
          const seg = keys.length - 1, t = rs.p * seg, k = Math.min(seg - 1, Math.floor(t)), lt = t - k;
          const x = lerp(keys[k][0], keys[k + 1][0], lt), y = lerp(keys[k][1], keys[k + 1][1], lt);
          glow.style.transform = `translate3d(${(x * stage.clientWidth).toFixed(1)}px, ${(y * stage.clientHeight).toFixed(1)}px, 0)`;
        }
      };
      paint();
      gsap.to(rs, { p: 1, ease: "none", onUpdate: paint,
        scrollTrigger: { trigger: ".dv--rot", start: "top top", end: "bottom bottom", scrub: 0.5 } });
    }

    // Device 2 (deck p26-40 on one pinned stage): renders crossfade and drift
    // (parallax) while each chapter's copy fades in/out at its deck position.
    const stage2 = $("#dv2Stage");
    if (stage2 && !isMobile()) {
      const chs = $$(".ch", stage2).map((ch) => ({ vis: $(".ch__visual", ch), copy: $$(".dv__copy, .dv__col", ch) }));
      const N = chs.length, st2 = { p: 0 };
      const paint2 = () => {
        const c = st2.p * N, H = stage2.clientHeight;
        chs.forEach((ch, i) => {
          const d = c - (i + 0.5), ad = Math.abs(d);
          const vo = clamp((0.59 - ad) / 0.18, 0, 1);
          ch.vis.style.opacity = vo.toFixed(3);
          ch.vis.style.visibility = vo > 0.001 ? "visible" : "hidden";
          ch.vis.style.transform = `translate3d(0, ${(-d * H * 0.05).toFixed(1)}px, 0)`;
          const to = clamp((0.42 - ad) / 0.1, 0, 1);
          ch.copy.forEach((el) => { el.style.opacity = to.toFixed(3); el.style.transform = `translate3d(0, ${(-d * 28).toFixed(1)}px, 0)`; });
        });
      };
      paint2();
      gsap.to(st2, { p: 1, ease: "none", onUpdate: paint2,
        scrollTrigger: { trigger: "#dv2", start: "top top", end: "bottom bottom", scrub: 0.5 } });
    }

    // Reveals
    $$("[data-reveal]").forEach((el) => ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-in") }));

    window.addEventListener("load", () => ScrollTrigger.refresh());
  }

  function setupStatic(film) {
    $$("[data-reveal]").forEach((el) => el.classList.add("is-in"));
    if (film) film.load(Math.round(film.TOTAL * 0.45)).then(() => { film.draw(film.TOTAL * 0.45); film.overlay(0.3); });
    const rot = $$(".dv__rot-img");
    rot.forEach((im, i) => { im.style.opacity = i === 0 ? 1 : 0; });
    const first = $("#dv2Stage .ch");
    if (first) { const v = $(".ch__visual", first); v.style.opacity = 1; v.style.visibility = "visible"; $$(".dv__copy, .dv__col", first).forEach((el) => { el.style.opacity = 1; }); }
  }

  /* ------------------------------------------------------------------
     Order page
     ------------------------------------------------------------------ */
  function setupOrder() {
    const order = $(".order");
    if (!order) return;

    // SOL / ACC mode (deck p15 vs p22)
    const params = new URLSearchParams(location.search);
    const acc = params.get("p") === "acc" || location.hash === "#acc";
    order.classList.toggle("is-acc", acc);
    $$("[data-mode]").forEach((el) => { el.hidden = el.dataset.mode !== (acc ? "acc" : "sol"); });
    $$(".nav__sub a").forEach((a) => a.classList.toggle("is-active", (a.dataset.sub === "acc") === acc));
    document.title = acc ? "SOL — Order · Accessories" : "SOL — Order";

    // Tabs: Images / FAQ / Details
    const tabs = $$(".order__tabs button");
    const views = { images: $("#viewImages"), faq: $("#viewFaq"), details: $("#viewDetails") };
    const show = (name) => {
      tabs.forEach((t) => t.classList.toggle("is-on", t.dataset.tab === name));
      Object.entries(views).forEach(([k, v]) => v && v.classList.toggle("is-on", k === name));
    };
    tabs.forEach((t) => t.addEventListener("click", () => show(t.dataset.tab)));
    $$("[data-goto-tab]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); show(b.dataset.gotoTab); }));

    // Gallery
    const slides = $$(".order__slide"), dots = $$(".order__dots button");
    let cur = 0;
    const go = (n) => {
      cur = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-on", i === cur));
      dots.forEach((d, i) => d.classList.toggle("is-on", i === cur));
    };
    dots.forEach((d, i) => d.addEventListener("click", () => go(i)));
    $(".order__chev--prev")?.addEventListener("click", () => go(cur - 1));
    $(".order__chev--next")?.addEventListener("click", () => go(cur + 1));

    // FAQ accordion (one open at a time)
    $$(".faq__item").forEach((item) => {
      $(".faq__q", item)?.addEventListener("click", () => {
        const open = item.classList.contains("is-open");
        $$(".faq__item").forEach((i) => i.classList.remove("is-open"));
        if (!open) item.classList.add("is-open");
      });
    });

    // Details sub-tabs
    const cells = $$(".order__cell[data-set]");
    $$(".order__subtabs button").forEach((b) => b.addEventListener("click", () => {
      $$(".order__subtabs button").forEach((x) => x.classList.toggle("is-on", x === b));
      const set = b.dataset.set;
      cells.forEach((c) => { c.textContent = c.dataset[set] || c.dataset.utility || ""; });
    }));

    // Order Now -> shipping form (deck p21); no payment provider wired yet
    const ship = $("#ship");
    $("#buyBtn")?.addEventListener("click", () => {
      if (!ship) return;
      ship.classList.add("is-on");
      $("input", ship)?.focus({ preventScroll: true });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
    $("form", ship || document)?.addEventListener("submit", (e) => { e.preventDefault(); ship.classList.add("is-sent"); });
  }

  /* ------------------------------------------------------------------
     Library page
     ------------------------------------------------------------------ */
  function setupLibrary() {
    const lib = $(".lib");
    if (!lib) return;
    const rooms = $$(".lib__rooms button");
    const lists = $$(".lib__scenes");
    const pick = (room) => {
      rooms.forEach((r) => r.classList.toggle("is-on", r.dataset.room === room));
      lists.forEach((l) => { l.hidden = l.dataset.room !== room; });
    };
    rooms.forEach((r) => r.addEventListener("click", () => pick(r.dataset.room)));
    lists.forEach((l) => $$("button", l).forEach((b) => b.addEventListener("click", () => {
      $$("button", l).forEach((x) => x.classList.toggle("is-on", x === b));
    })));

    // Search: magnifier slides right, underline draws in; typing filters the list.
    const search = $("#libSearch"), input = $("#libSearchInput"), toggleBtn = $("#searchToggle");
    const filter = (q) => { q = q.trim().toLowerCase(); $$(".lib__scenes li").forEach((li) => { li.hidden = !!q && !li.textContent.toLowerCase().includes(q); }); };
    const open = (force) => {
      if (!search) return;
      const on = force ?? !search.classList.contains("is-open");
      search.classList.toggle("is-open", on);
      toggleBtn?.setAttribute("aria-expanded", String(on));
      if (on) setTimeout(() => input?.focus({ preventScroll: true }), 300);
      else if (input) { input.value = ""; filter(""); }
    };
    toggleBtn?.addEventListener("click", () => open());
    $("#searchTitle")?.addEventListener("click", () => open());
    input?.addEventListener("input", () => filter(input.value));
    input?.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });

    const box = $(".lib__video");
    $("#libPlay")?.addEventListener("click", () => {
      if (!box || box.classList.contains("is-playing")) return;
      const v = document.createElement("video");
      v.src = "assets/source.mp4"; v.autoplay = true; v.playsInline = true; v.controls = true; v.loop = true;
      box.appendChild(v); box.classList.add("is-playing");
      v.play().catch(() => {});
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */
  function boot() {
    setupLenis();
    measureNav(); updateNav();
    window.addEventListener("scroll", scheduleNav, { passive: true });
    if (lenis) lenis.on("scroll", scheduleNav);
    window.addEventListener("resize", () => { measureNav(); scheduleNav(); });

    setupOrder();
    setupLibrary();

    const film = setupFilm();
    if (film) film.loadRest();

    if (hasGsap && !reduced) {
      try { setupScroll(film); }
      catch (e) { console.error("scroll setup failed:", e); setupStatic(film); }
    } else {
      setupStatic(film);
    }

    if (page === "home") setupIntro(() => {});
    document.body.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
