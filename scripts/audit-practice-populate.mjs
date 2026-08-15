/**
 * Runs a 10-question practice exam (live) to populate history/bookmarks/
 * weak topics for the audit. Flags Q3. Attaches CDP 9222.
 * Usage: node scripts/audit-practice-populate.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const cdp = await ctx.newCDPSession(page);
const ev = (fn, arg, ms = 15000) => Promise.race([page.evaluate(fn, arg), T(ms)]).catch(() => null);
const shot = async (n) => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }).catch(() => ({})); if (data) fs.writeFileSync(path.join("scripts/qa-evidence", n), Buffer.from(data, "base64")); };

// 1. Dashboard → Quick Practice → setup
await ev((l) => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === l); if (el) el.click(); }, "Dashboard");
await T(3500);
await ev((l) => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes(l)); if (el) el.click(); }, "Quick Practice");
await T(3500);
// 2. Set chapter Highway Engineering (select) + count 10
await ev(() => {
  const sel = document.querySelector("select");
  if (sel) { const o = [...sel.options].find((x) => x.value === "Highway Engineering"); if (o) { sel.value = o.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
  const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10");
  if (b10) b10.click();
});
await T(1500);
// 3. Start
await ev((l) => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(l)); if (el) el.click(); }, "Start Exam Now");
await T(8000);
// 4. Answer all 10, flag Q3
for (let i = 0; i < 12; i++) {
  const q = await ev(() => { const m = document.body.innerText.match(/question (\d+) \/ (\d+)/i); return m ? { cur: +m[1], tot: +m[2] } : null; });
  if (!q) break;
  await ev(() => { const opts = [...document.querySelectorAll("button")].filter((b) => [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim())) && !b.disabled); if (opts.length) opts[0].click(); });
  await T(1500);
  if (q.cur === 3) { await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Flag")); if (b) b.click(); }); await T(1200); console.log("flagged Q3"); }
  if (q.cur === q.tot) break;
  await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
  await T(1200);
}
await shot("66-practice-q10-populate.png");
// 5. Finish
await ev((l) => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes(l)); if (el) el.click(); }, "Finish Practice");
await T(8000);
const res = await ev(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 220));
console.log("RESULT:", res);
await shot("67-practice-results-populate.png");
console.log("done");
process.exit(0);
