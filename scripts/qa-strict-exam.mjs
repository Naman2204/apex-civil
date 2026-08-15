/**
 * STRICT EXAM (live) — timer, mark-for-review, palette, negative marking, submit.
 * Everything raced against hard timeouts incl. screenshots.
 * Usage: node scripts/qa-strict-exam.mjs
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

const ev = (fn) => Promise.race([page.evaluate(fn), T(10000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim()), T(6000)]).catch(() => "");
async function shot(n) {
  const ok = await Promise.race([
    cdp.send("Page.captureScreenshot", { format: "png" }).then(({ data }) => { fs.writeFileSync(path.join(EVIDENCE, n), Buffer.from(data, "base64")); return true; }),
    T(12000).then(() => false),
  ]);
  console.log(`  📸 ${n}: ${ok ? "captured" : "TIMEOUT"}`);
}

console.log("current:", (await body()).slice(0, 60));
if (/exam completed|results/i.test(await body())) {
  await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => /take another exam/i.test(el.textContent)); if (x) x.click(); });
  await T(3000);
} else {
  await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.includes("Simulate Exam")); if (x) x.click(); });
  await T(3000);
}
console.log("setup:", /configure your exam/i.test(await body()) ? "OK" : (await body()).slice(0, 80));

await ev(() => { const m = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (m) m.click(); });
await T(1200);
await ev(() => { [...document.querySelectorAll("button")].filter((x) => x.textContent.trim() === "5").forEach((b) => b.click()); });
await T(1200);
await shot("30-strict-setup.png");
console.log("configured:", (await body()).slice(0, 120));

await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.includes("Start Exam Now")); if (x) x.click(); });
await T(9000);
const s1 = await body();
const timer = s1.match(/(\d+):(\d\d)/);
console.log("strict running:", timer ? `timer ${timer[0]}` : s1.slice(0, 100));
await shot("30-strict-q1.png");

await ev(() => { const opts = [...document.querySelectorAll("button")].filter((b) => [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim()))); if (opts.length) opts[0].click(); });
await T(1500);
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Next Question"); if (x) x.click(); });
await T(1500);
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "Review"); if (x) x.click(); });
await T(1200);
console.log("marked Q2 for review");
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "5"); if (x) x.click(); });
await T(2000);
const s5 = await body();
console.log("palette jump:", /question 5/i.test(s5) ? "Q5 reached" : s5.slice(0, 100));
await shot("30b-strict-q5-palette.png");
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.includes("Submit Exam")); if (x) x.click(); });
await T(8000);
const res = await body();
console.log("STRICT RESULTS:", res.slice(0, 400));
await shot("31-strict-results.png");
console.log("done");
process.exit(0);
