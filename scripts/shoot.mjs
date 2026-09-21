// Playwright visual check: screenshots of every page at desktop + mobile
// widths and several scroll depths, plus console errors / failed requests.
//
//   NODE_PATH=<dir with playwright> node scripts/shoot.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.argv[2] || "http://127.0.0.1:8123";
const OUT = process.argv[3] || "/tmp/sorcerics_shots";
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const problems = [];

async function run(name, viewport, steps) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 800, hasTouch: viewport.width < 800 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") problems.push(`[${name}] console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`[${name}] pageerror: ${e.message}`));
  page.on("requestfailed", (r) => problems.push(`[${name}] failed: ${r.url()} ${r.failure()?.errorText}`));
  page.on("response", (r) => { if (r.status() >= 400) problems.push(`[${name}] ${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/${steps.url}`, { waitUntil: "networkidle" });
  await sleep(steps.settle || 800);
  let n = 0;
  for (const s of steps.shots) {
    if (s.wait) await sleep(s.wait);
    if (s.scroll !== undefined) {
      await page.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y); }, s.scroll);
      await sleep(s.after || 900);
    }
    if (s.eval) await page.evaluate(s.eval);
    if (s.evalAfter) await sleep(s.evalAfter);
    const file = `${OUT}/${name}_${String(++n).padStart(2, "0")}_${s.label}.png`;
    await page.screenshot({ path: file, fullPage: !!s.full });
    const y = await page.evaluate(() => Math.round(window.scrollY));
    console.log(`${name} ${s.label} scrollY=${y}`);
  }
  await ctx.close();
}

const vh = (f) => `Math.round(innerHeight * ${f})`;
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

await run("home", desktop, { url: "index.html", settle: 300, shots: [
  { label: "intro_t1", wait: 900 },
  { label: "intro_t2", wait: 1200 },
  { label: "intro_t3", wait: 1300 },
  { label: "intro_done", wait: 2200 },
  { label: "curtain_40", scroll: 360 },
  { label: "film_15", scroll: 900 + 0.15 * 3600 },
  { label: "film_45", scroll: 900 + 0.45 * 3600 },
  { label: "film_85", scroll: 900 + 0.85 * 3600 },
  { label: "pintro", scroll: 4500 },
  { label: "layers", scroll: 5400 },
  { label: "bottom", scroll: 99999 },
] });

await run("device", desktop, { url: "device.html", shots: [
  { label: "top" },
  { label: "future", scroll: 504 },
  { label: "dual", scroll: 504 + 900 },
  { label: "next", scroll: 504 + 1800 },
  { label: "dims", scroll: 504 + 2700 },
  { label: "rot_a", scroll: 504 + 3600 + 300 },
  { label: "rot_b", scroll: 504 + 3600 + 2200 },
  { label: "every", scroll: 504 + 3600 + 3600 },
  { label: "mount", scroll: 504 + 3600 + 4500 },
  { label: "wall", scroll: 504 + 3600 + 5400 },
  { label: "shelf", scroll: 504 + 3600 + 6300 },
  { label: "atmo", scroll: 504 + 3600 + 7200 },
  { label: "craft", scroll: 504 + 3600 + 8100 },
] });

await run("order", desktop, { url: "order.html", shots: [
  { label: "images" },
  { label: "faq", eval: "document.querySelector('[data-tab=faq]').click(); document.querySelector('.faq__q').click()", evalAfter: 700 },
  { label: "details", eval: "document.querySelector('[data-tab=details]').click()", evalAfter: 600 },
  { label: "ship", eval: "document.querySelector('[data-tab=images]').click(); document.getElementById('buyBtn').click()", evalAfter: 500 },
] });
await run("order_acc", desktop, { url: "order.html?p=acc", shots: [{ label: "acc" }] });

await run("library", desktop, { url: "library.html", shots: [
  { label: "top" },
  { label: "search", eval: "document.getElementById('searchToggle').click()", evalAfter: 300 },
  { label: "scrolled", scroll: 320 },
] });
await run("wiki", desktop, { url: "wiki.html", shots: [{ label: "top" }] });
await run("careers", desktop, { url: "careers.html", shots: [{ label: "top" }] });

await run("m_home", mobile, { url: "index.html", settle: 300, shots: [
  { label: "intro_done", wait: 5600 },
  { label: "film", scroll: 844 + 0.4 * 3376 },
  { label: "pintro", scroll: 844 * 5 + 100 },
  { label: "full", scroll: 0, full: true },
] });
await run("m_device", mobile, { url: "device.html", shots: [{ label: "full", full: true }] });
await run("m_order", mobile, { url: "order.html", shots: [{ label: "full", full: true }] });
await run("m_library", mobile, { url: "library.html", shots: [{ label: "full", full: true }] });

await browser.close();
console.log("\nproblems:", problems.length);
problems.slice(0, 40).forEach((p) => console.log("  ! " + p));
