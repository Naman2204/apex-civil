import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const url = page.url();
const body = await Promise.race([
  page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 500)),
  new Promise((r) => setTimeout(() => r("(slow)"), 5000)),
]);
console.log("URL:", url);
console.log("BODY:", body);
await browser.close().catch(() => {});
process.exit(0);
