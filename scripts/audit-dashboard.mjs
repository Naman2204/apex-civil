/**
 * LIVE CONTROL AUDIT — Dashboard (apex-civil.vercel.app, QA session).
 * Clicks every dashboard control and checks actual behavior.
 * Usage: node scripts/audit-dashboard.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EVIDENCE = path.resolve("scripts/qa-evidence");
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const cdp = await ctx.newCDPSession(page);
const ev = (fn) => Promise.race([page.evaluate(fn), T(8000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ")), T(6000)]).catch(() => "");
const isDashboard = (t) => t.includes("Explore Topics");
const isSetup = (t) => /configure your exam/i.test(t);
const results = [];
const rec = (id, ctrl, expected, actual, status) => { results.push({ id, ctrl, expected, actual, status }); console.log(`${status === "PASS" ? "✅" : "❌"} [${id}] ${ctrl} — ${status} | ${actual}`); };
const clickText = (label, partial = false) => ev(([l, p]) => {
  const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l);
  if (el) { el.click(); return true; } return false;
}, [label, partial]);

// fresh dashboard
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3500);
const d0 = await body();
rec("D-00", "Dashboard view loaded", "Dashboard visible", d0.slice(0, 50), isDashboard(d0) ? "PASS" : "FAIL");

// --- DEAD controls: click, expect NO navigation ---
for (const [id, label] of [["D-01", "Edit Goal"], ["D-02", "Edit Target"], ["D-03", "Set Target Date"], ["D-04", "View All Topics"], ["D-05", "View All →"]]) {
  await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === label || x.textContent.includes(label)); if (el) { el.click(); return true; } return false; });
  await T(1800);
  const t = await body();
  const nav = isDashboard(t) ? "no navigation (stayed on dashboard)" : (isSetup(t) ? "NAVIGATED to exam setup" : t.slice(0, 60));
  rec(id, `"${label}"`, "Open its target view", nav, isDashboard(t) ? "FAIL" : "PASS");
}
// D-04 alternative: the "View All Topics" grid card (it's a distinct element; same label — covered above)
// Weak topics empty state check
const dWeak = await body();
rec("D-06", "Weak Topics card state", "Dynamic or empty state", dWeak.includes("No Data Yet") ? "empty state (dynamic)" : "has weak topics", dWeak.includes("No Data Yet") || dWeak.includes("%") ? "PASS" : "FAIL");

// --- WORKING controls ---
// Topic card → prefilled setup
await ev(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Railway Engineering") && x.textContent.includes("Questions")); if (el) { el.click(); return true; } return false; });
await T(3500);
let t = await body();
rec("D-07", "Topic card (Railway Engineering)", "Exam setup prefilled", isSetup(t) ? "setup + Railway" : t.slice(0, 70), isSetup(t) && t.includes("Railway Engineering") ? "PASS" : "FAIL");
// back to dashboard
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Start Simulation → setup
await clickText("Start Simulation", true);
await T(3500);
t = await body();
rec("D-08", "Start Simulation", "Opens exam setup", isSetup(t) ? "setup" : t.slice(0, 60), isSetup(t) ? "PASS" : "FAIL");
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Quick Practice → setup
await clickText("Quick Practice", true);
await T(3500);
t = await body();
rec("D-09", "Quick Practice (hero)", "Opens exam setup", isSetup(t) ? "setup" : t.slice(0, 60), isSetup(t) ? "PASS" : "FAIL");
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Configure Exam → setup
await clickText("Configure Exam", true);
await T(3500);
t = await body();
rec("D-10", "Configure Exam (hero)", "Opens exam setup", isSetup(t) ? "setup" : t.slice(0, 60), isSetup(t) ? "PASS" : "FAIL");
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Hardcoded progress verification: 0% bars present even though user HAS data
const progress = await ev(() => {
  const bars = [...document.querySelectorAll("button")].filter((b) => b.textContent.includes("0%") && /Questions/.test(b.textContent));
  return bars.length;
});
rec("D-11", "Topic card progress bars", "Reflect real progress", `found ${progress} topic cards showing hardcoded 0%`, progress >= 1 ? "FAIL (0% regardless of data)" : "PASS");

fs.writeFileSync("scripts/audit-dashboard-results.json", JSON.stringify(results, null, 2));
console.log(`\nDASHBOARD AUDIT: ${results.filter((r) => r.status === "PASS").length}/${results.length} PASS`);
process.exit(0);
