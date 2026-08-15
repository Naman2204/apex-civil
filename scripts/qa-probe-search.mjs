import { chromium } from "playwright";
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
log("connected");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil"));
log("page url: " + page.url());

await page.goto("https://apex-civil.vercel.app/", { waitUntil: "domcontentloaded", timeout: 45000 });
log("goto done");
await page.waitForTimeout(3000);
log("waited 3s");

const hasDialog = await page.evaluate(() => !!document.querySelector("[role=dialog], [class*='cl-modal']")).catch((e) => "ERR " + e.message);
log("dialog present: " + hasDialog);

const input = page.getByPlaceholder(/search topics/i);
log("input count: " + (await input.count()));
await input.fill("highway");
log("filled");
await page.waitForTimeout(4000);
const btns = await page.locator('div[class*="top-full"] button').count().catch((e) => "ERR " + e.message);
log("dropdown buttons: " + btns);
const texts = await page.evaluate(() => [...document.querySelectorAll('div[class*="top-full"] button')].map((b) => b.textContent.trim())).catch((e) => "ERR " + e.message);
log("dropdown texts: " + JSON.stringify(texts));

log("clicking highway via evaluate...");
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('div[class*="top-full"] button')].find((x) => x.textContent.includes("Highway Engineering"));
  if (b) { b.click(); return "clicked"; }
  return "not found";
}).catch((e) => "ERR " + e.message);
log("click result: " + clicked);
await page.waitForTimeout(4000);
const body = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 200)).catch((e) => "ERR " + e.message);
log("body after click: " + body);
log("done");
process.exit(0);
