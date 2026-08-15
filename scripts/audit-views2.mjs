/**
 * LIVE CONTROL AUDIT — re-test raced checks + mobile Performance rows.
 * Usage: node scripts/audit-views2.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const cdp = await ctx.newCDPSession(page);
const ev = (fn) => Promise.race([page.evaluate(fn), T(9000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ")), T(7000)]).catch(() => "");
const rec = (id, ctrl, ok, actual, note = "") => console.log(`${ok ? "✅" : "❌"} [${id}] ${ctrl} — ${ok ? "PASS" : "FAIL"}${note ? " (" + note + ")" : ""} | ${actual}`);
const nav = (label) => ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === label); if (el) el.click(); });
const shot = async (n) => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }).catch(() => ({})); if (data) fs.writeFileSync(path.join("scripts/qa-evidence", n), Buffer.from(data, "base64")); };

// ---- Topics filter (target the MAIN-area input, not header search) ----
await nav("Topics"); await T(5000);
const t0 = await body();
rec("V-03", "Topics view renders", t0.includes("Topics & Chapters"), t0.slice(0, 50));
await ev(() => {
  const input = [...document.querySelectorAll("main input, .max-w-\\[1600px\\] input")].find((i) => /search/i.test(i.placeholder));
  if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "geo"); input.dispatchEvent(new Event("input", { bubbles: true })); return true; }
  return false;
});
await T(2500);
let t = await body();
const geoOnly = t.includes("Geotechnical Engineering") && !t.includes("Railway Engineering");
rec("V-03b", "Topics filter 'geo'", geoOnly, "geo-only cards: " + geoOnly);
await shot("60-topics-filter-geo.png");
await ev(() => {
  const input = [...document.querySelectorAll("main input")].find((i) => /search/i.test(i.placeholder));
  if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "zzz"); input.dispatchEvent(new Event("input", { bubbles: true })); }
});
await T(2000);
t = await body();
rec("V-04b", "Topics filter no-result", t.includes("No topics found"), t.includes("No topics found") ? "message shown" : "missing");
await shot("61-topics-filter-noresult.png");

// ---- Weak Topics render + controls ----
await nav("Weak Topics"); await T(5000);
t = await body();
rec("V-06b", "Weak Topics view renders", t.includes("Weak Topics Analysis"), t.slice(0, 50));

// ---- Performance desktop + mobile row affordance ----
await nav("Performance"); await T(5000);
t = await body();
rec("V-09b", "Performance view renders", t.includes("Performance History"), t.slice(0, 50));
const desktopRows = await ev(() => {
  const rows = [...document.querySelectorAll("div")].filter((d) => /cursor-pointer/.test(d.className) && /Score|Question|Attempt/.test(d.textContent));
  return rows.map((r) => ({ cls: typeof r.onclick === "function", hasOnClick: r.onclick !== null || r.getAttribute("onclick") !== null || r.closest("[onclick]") !== null }));
});
rec("V-10b", "Performance rows (desktop)", "Not clickable (no handler)", JSON.stringify(desktopRows.slice(0, 2)), desktopRows.every((r) => !r.hasOnClick) ? "no handler" : "has handler");
// Mobile viewport: check "View Details" row affordance
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true }).catch(() => {});
await T(2000);
const mobileRows = await ev(() => {
  const el = [...document.querySelectorAll("div")].find((d) => /View Details/.test(d.textContent));
  if (!el) return null;
  const btn = el.closest("div,button");
  return { hasOnClick: btn ? (btn.onclick !== null || btn.getAttribute("onclick") !== null || btn.querySelector("[onclick]") !== null) : null, text: el.textContent.trim().slice(0, 40) };
});
rec("V-10c", "Performance 'View Details' (mobile)", "Row clickable → detail view", JSON.stringify(mobileRows), mobileRows && !mobileRows.hasOnClick ? "FAIL (no handler)" : "PASS");
await shot("62-performance-mobile.png");
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }).catch(() => {});
await T(1500);

// ---- Settings render + Reset Data + goal controls ----
await nav("Settings"); await T(5000);
t = await body();
rec("V-11b", "Settings view renders", t.includes("Daily Question Goal"), t.includes("Daily Question Goal") ? "rendered" : t.slice(0, 60));
const goalBtns = await ev(() => { const btns = [...document.querySelectorAll("button")]; return { minus: btns.some((b) => b.textContent.trim() === "-"), plus: btns.some((b) => b.textContent.trim() === "+") }; });
rec("V-13b", "Daily goal +/- present", goalBtns?.minus && goalBtns?.plus, JSON.stringify(goalBtns), (goalBtns?.minus && goalBtns?.plus) ? "PASS" : "FAIL");
const resetBtn = await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Reset Data")); if (el) return { hasOnClick: el.onclick !== null || el.getAttribute("onclick") !== null, html: el.outerHTML.slice(0, 160) }; return null; });
rec("V-12b", "'Reset Data' has handler?", !(resetBtn && resetBtn.hasOnClick), JSON.stringify(resetBtn ? { hasOnClick: resetBtn.hasOnClick } : "not found"), resetBtn && !resetBtn.hasOnClick ? "FAIL (no handler)" : "PASS");
await shot("63-settings-reset-dead.png");

// ---- Bookmarks empty state ----
await nav("Bookmarks"); await T(5000);
t = await body();
rec("V-14b", "Bookmarks empty state", t.includes("No bookmarks yet"), t.includes("No bookmarks yet") ? "empty" : t.slice(0, 60), t.includes("No bookmarks yet") ? "PASS" : "FAIL");

// restore to dashboard
await nav("Dashboard"); await T(4000);
console.log("\nviews2 done");
process.exit(0);
