import { chromium } from "playwright";
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const info = await Promise.race([
  page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter((b) => b.textContent.trim().length < 40 && b.textContent.trim().length > 0);
    return btns.slice(0, 12).map((b) => ({
      txt: b.textContent.trim().replace(/\s+/g, " "),
      spans: [...b.querySelectorAll("span")].map((s) => s.textContent.trim()),
      disabled: b.disabled,
    }));
  }),
  T(6000).then(() => "SLOW"),
]);
console.log(JSON.stringify(info, null, 1));
await browser.close().catch(() => {});
process.exit(0);
