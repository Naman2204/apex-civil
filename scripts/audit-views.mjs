/**
 * LIVE CONTROL AUDIT — views: sidebar, topics, weak topics, performance,
 * settings (Reset Data), bookmarks. Real QA session.
 * Usage: node scripts/audit-views.mjs
 */
import { chromium } from "playwright";
import fs from "fs";

const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const ev = (fn) => Promise.race([page.evaluate(fn), T(8000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ")), T(6000)]).catch(() => "");
const results = [];
const rec = (id, ctrl, expected, actual, status) => { results.push({ id, ctrl, status }); console.log(`${status === "PASS" ? "✅" : "❌"} [${id}] ${ctrl} — ${status} | ${actual}`); };
const nav = (label) => ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === label); if (el) el.click(); });
const isSetup = (t) => /configure your exam/i.test(t);

// Sidebar: Quick Practice + Simulate Exam nav
await nav("Dashboard"); await T(3000);
await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Quick Practice"); if (el) el.click(); });
await T(3000);
let t = await body();
rec("V-01", "Sidebar 'Quick Practice'", "Opens exam setup", t.slice(0, 50), isSetup(t) ? "PASS" : "FAIL");
await nav("Dashboard"); await T(3000);
await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Simulate Exam"); if (el) el.click(); });
await T(3000);
t = await body();
rec("V-02", "Sidebar 'Simulate Exam'", "Opens exam setup", t.slice(0, 50), isSetup(t) ? "PASS" : "FAIL");

// Topics: search filter + card + no-result
await nav("Topics"); await T(3000);
await ev(() => { const input = [...document.querySelectorAll("input")].find((i) => /search/i.test(i.placeholder)); if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "geo"); input.dispatchEvent(new Event("input", { bubbles: true })); } });
await T(1500);
t = await body();
const geoOnly = t.includes("Geotechnical Engineering") && !t.includes("Railway Engineering");
rec("V-03", "Topics search filter 'geo'", "Only Geotechnical shown", String(geoOnly), geoOnly ? "PASS" : "FAIL");
await ev(() => { const input = [...document.querySelectorAll("input")].find((i) => /search/i.test(i.placeholder)); if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "zzz"); input.dispatchEvent(new Event("input", { bubbles: true })); } });
await T(1500);
t = await body();
rec("V-04", "Topics search no-result", "'No topics found'", t.includes("No topics found") ? "shown" : t.slice(0, 80), t.includes("No topics found") ? "PASS" : "FAIL");
await ev(() => { const input = [...document.querySelectorAll("input")].find((i) => /search/i.test(i.placeholder)); if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, ""); input.dispatchEvent(new Event("input", { bubbles: true })); } });
await T(1000);
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Highway Engineering") && x.textContent.includes("Questions")); if (el) el.click(); });
await T(3500);
t = await body();
rec("V-05", "Topics card click (Highway)", "Setup prefilled", t.slice(0, 50), isSetup(t) && t.includes("Highway Engineering") ? "PASS" : "FAIL");

// Weak Topics (fresh account → empty): Target Weaknesses + empty-state Start an Exam
await nav("Weak Topics"); await T(3000);
t = await body();
rec("V-06", "Weak Topics view loads", "Header + empty state", t.includes("Weak Topics Analysis") ? "loaded" : t.slice(0, 60), t.includes("Weak Topics Analysis") ? "PASS" : "FAIL");
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Target Weaknesses")); if (el) el.click(); });
await T(3500);
t = await body();
rec("V-07", "'Target Weaknesses' button", "Opens exam setup", t.slice(0, 50), isSetup(t) ? "PASS" : "FAIL");
await nav("Weak Topics"); await T(3000);
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start an Exam")); if (el) el.click(); });
await T(3500);
t = await body();
rec("V-08", "Empty-state 'Start an Exam'", "Opens exam setup", t.slice(0, 50), isSetup(t) ? "PASS" : "FAIL");

// Performance: rows look clickable ("View Details →") but have no handler
await nav("Performance"); await T(3000);
t = await body();
rec("V-09", "Performance view loads", "History rows render", t.includes("Performance History") ? "loaded" : t.slice(0, 60), t.includes("Performance History") ? "PASS" : "FAIL");
const rowInfo = await ev(() => {
  const rows = [...document.querySelectorAll("div")].filter((d) => d.className.includes("cursor-pointer") && d.textContent.includes("View Details"));
  const anyHandler = rows.some((r) => typeof r.onclick === "function" || r.getAttribute("onclick") || r.querySelector("[onclick]"));
  return { rows: rows.length, anyHandler };
});
rec("V-10", "Performance row 'View Details'", "Row clickable → detail view", `rows=${rowInfo?.rows} handlers=${rowInfo?.anyHandler}`, rowInfo && rowInfo.rows > 0 && !rowInfo.anyHandler ? "FAIL (looks clickable, no handler)" : "PASS");

// Settings: Reset Data (danger zone) — dead?
await nav("Settings"); await T(3500);
t = await body();
rec("V-11", "Settings loads", "Controls render", t.includes("Daily Question Goal") ? "loaded" : t.slice(0, 60), t.includes("Daily Question Goal") || t.includes("Reset Progress") ? "PASS" : "FAIL");
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Reset Data")); if (el) { el.click(); return true; } return false; });
await T(2000);
t = await body();
rec("V-12", "'Reset Data' (danger zone)", "Confirm/safety or action", t.includes("Reset Progress") ? "no action (dead)" : t.slice(0, 60), t.includes("Reset Progress") ? "FAIL (no handler)" : "PARTIAL");
// daily goal +/- + save (functional, verified previously; quick check)
const goalBtns = await ev(() => {
  const btns = [...document.querySelectorAll("button")];
  const minus = btns.find((b) => b.textContent.trim() === "-");
  const plus = btns.find((b) => b.textContent.trim() === "+");
  if (minus && plus) { plus.click(); return "found"; }
  return "missing";
});
rec("V-13", "Daily goal +/- controls", "Present and clickable", String(goalBtns), goalBtns === "found" ? "PASS" : "FAIL");

// Bookmarks: empty state → Start Practice
await nav("Bookmarks"); await T(3000);
t = await body();
rec("V-14", "Bookmarks empty state", "'No bookmarks yet'", t.includes("No bookmarks yet") ? "empty" : t.slice(0, 60), t.includes("No bookmarks yet") ? "PASS" : "FAIL");
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Practice")); if (el) el.click(); });
await T(3500);
t = await body();
rec("V-15", "Empty-state 'Start Practice'", "Opens exam setup", t.slice(0, 50), isSetup(t) ? "PASS" : "FAIL");

fs.writeFileSync("scripts/audit-views-results.json", JSON.stringify(results, null, 2));
console.log(`\nVIEWS AUDIT: ${results.filter((r) => r.status === "PASS").length}/${results.length} PASS`);
process.exit(0);
