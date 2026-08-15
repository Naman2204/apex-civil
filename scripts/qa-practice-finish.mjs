/**
 * Completes the running practice exam (Q1..Q10), bookmarks Q2, finishes,
 * captures results. Attaches to QA Chrome (CDP 9222).
 * Usage: node scripts/qa-practice-finish.mjs
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
const shot = async (n) => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(path.join(EVIDENCE, n), Buffer.from(data, "base64")); };

const ev = (fn) => Promise.race([page.evaluate(fn), T(8000)]).catch(() => null);

const getQ = () => ev(() => {
  const m = document.body.innerText.match(/question (\d+) \/ (\d+)/i);
  return m ? { cur: +m[1], tot: +m[2] } : null;
});
const clickOption = () => ev(() => {
  const opts = [...document.querySelectorAll("button")].filter((b) =>
    [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim())) && !b.disabled
  );
  if (opts.length) { opts[0].click(); return true; }
  return false;
});

for (let i = 0; i < 14; i++) {
  const q = await getQ();
  if (!q) { console.log("no question state — aborting loop"); break; }
  const answered = await clickOption();
  await T(1800);
  if (q.cur === 2) {
    await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Flag")); if (b) b.click(); });
    await T(1200);
    console.log(`Q${q.cur}: answered=${answered} + BOOKMARKED`);
  } else {
    console.log(`Q${q.cur}: answered=${answered}`);
  }
  if (q.cur === q.tot) break;
  await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
  await T(1500);
}
await shot("23-practice-q10.png");

await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Finish Practice")); if (b) { b.click(); return true; } return false; });
await T(8000);
const res = await ev(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 900));
console.log("RESULTS SCREEN:", res);
await shot("24-practice-results.png");
console.log("done");
process.exit(0);
