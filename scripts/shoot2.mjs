// Focused visual checks for: home pinned product-intro arrows, Device 2 stage
// chapters, library search animation, DEVICE 1 / 2 nav row.
//   node scripts/shoot2.mjs [baseUrl] [outDir]
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:8123";
const OUT = process.argv[3] || "/tmp/sorcerics_shots2";
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch();
const problems = [];

async function open(name, url, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: viewport.width < 800, hasTouch: viewport.width < 800 });
  const page = await ctx.newPage();
  page.on("console", (m) => { if (m.type() === "error") problems.push(`[${name}] console: ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`[${name}] pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) problems.push(`[${name}] ${r.status()} ${r.url()}`); });
  await page.goto(`${BASE}/${url}`, { waitUntil: "networkidle" });
  await sleep(500);
  return { page, ctx };
}
const scrollTo = async (page, y) => { await page.evaluate((y) => { window.__lenis ? window.__lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y); }, y); await sleep(900); };
const shot = (page, name) => page.screenshot({ path: `${OUT}/${name}.png` });

// Home: skip the intro, then walk through the pinned product intro (starts at 5 x vh)
{
  const { page, ctx } = await open("home", "index.html");
  await page.keyboard.press("Space"); await sleep(600);
  const vh = 900, pintroTop = await page.evaluate(() => document.getElementById("pintro").getBoundingClientRect().top + scrollY);
  console.log("pintro top", pintroTop);
  for (const [label, p] of [["a20", 0.2], ["a36", 0.4], ["a_hold", 0.45], ["b60", 0.62], ["b_done", 0.95]]) {
    await scrollTo(page, pintroTop + p * 2 * vh); await shot(page, `home_pintro_${label}`);
    const st = await page.evaluate(() => ({ a: getComputedStyle(document.getElementById("arrowA")).opacity, ra: document.getElementById("arrowRevealA").style.strokeDashoffset, b: getComputedStyle(document.getElementById("arrowB")).opacity, rb: document.getElementById("arrowRevealB").style.strokeDashoffset, hintOrder: document.querySelector('.nav__menu a[href="order.html"]').classList.contains("is-hint"), hintDevice: document.querySelector(".nav__row--inline").classList.contains("is-hint") }));
    console.log(`  ${label} p=${p}`, JSON.stringify(st));
  }
  await ctx.close();
}

// Device 2: chapter centres
{
  const { page, ctx } = await open("device2", "device2.html");
  const top = await page.evaluate(() => document.getElementById("dv2").getBoundingClientRect().top + scrollY);
  const N = 13, range = N * 900 - 900;
  for (const i of [0, 1, 2, 4, 6, 8, 9, 10, 12]) {
    await scrollTo(page, top + ((i + 0.5) / N) * range); await shot(page, `dv2_ch${String(i + 1).padStart(2, "0")}`);
  }
  await scrollTo(page, top + (1.0 / N) * range); await shot(page, "dv2_boundary_1_2");
  await scrollTo(page, 0); await shot(page, "dv2_top");
  await ctx.close();
}

// Library: search closed / opening / open + filter
{
  const { page, ctx } = await open("library", "library.html");
  await shot(page, "lib_search_closed");
  await page.click("#searchToggle"); await sleep(150); await shot(page, "lib_search_opening");
  await sleep(700); await shot(page, "lib_search_open");
  await page.keyboard.type("bed"); await sleep(300); await shot(page, "lib_search_filter");
  const line = await page.evaluate(() => getComputedStyle(document.querySelector(".lib__search-line")).backgroundColor);
  console.log("underline colour (focused):", line);
  await ctx.close();
}

// Mobile spot checks
{
  const { page, ctx } = await open("m_device2", "device2.html", { width: 390, height: 844 });
  await page.screenshot({ path: `${OUT}/m_dv2_full.png`, fullPage: true });
  await ctx.close();
  const { page: p2, ctx: c2 } = await open("m_library", "library.html", { width: 390, height: 844 });
  await p2.click("#searchToggle"); await sleep(700); await shot(p2, "m_lib_search_open");
  await c2.close();
}

await browser.close();
console.log("problems:", problems.length); problems.slice(0, 20).forEach((p) => console.log("  ! " + p));
