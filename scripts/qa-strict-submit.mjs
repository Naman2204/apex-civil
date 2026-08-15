/**
 * Continues the running strict exam: jump to last question, answer, submit.
 * Usage: node scripts/qa-strict-submit.mjs
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

// Jump to Q25 via palette (number buttons inside the palette grid)
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.trim() === "25" && !/time/i.test(el.textContent)); if (x) x.click(); });
await T(2500);
console.log("after jump:", /question 25/i.test(await body()) ? "Q25 reached" : (await body()).slice(0, 100));

// Answer last question
await ev(() => { const opts = [...document.querySelectorAll("button")].filter((b) => [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim()))); if (opts.length) opts[0].click(); });
await T(1500);
await shot("30c-strict-q25-answered.png");

// Submit
await ev(() => { const x = [...document.querySelectorAll("button")].find((el) => el.textContent.includes("Submit Exam")); if (x) { x.click(); return true; } return false; });
await T(9000);
const res = await body();
console.log("STRICT RESULTS:", res.slice(0, 420));
await shot("31-strict-results.png");
console.log("done");
process.exit(0);
