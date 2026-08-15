import { chromium } from "playwright";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const dialogs = [];
page.on("dialog", async (d) => { dialogs.push(d.message().slice(0, 120)); await d.dismiss().catch(() => {}); });
// Try a fast evaluate — blocks if a dialog is open
const ok = await Promise.race([
  page.evaluate(() => "alive").then((v) => v).catch((e) => "ERR " + e.message),
  new Promise((r) => setTimeout(() => r("TIMEOUT (dialog open?)"), 4000)),
]);
console.log("evaluate:", ok);
console.log("dialogs seen:", JSON.stringify(dialogs));
await browser.close().catch(() => {});
process.exit(0);
