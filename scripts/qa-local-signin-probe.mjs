import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
});
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
page.on("console", (m) => console.log("  [console]", m.type(), m.text().slice(0, 160)));
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 160)));
page.on("requestfailed", (r) => console.log("  [requestfailed]", r.url().slice(0, 100), r.failure()?.errorText));
await page.goto(BASE + "/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(10000);

const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("BODY:", body.slice(0, 300));
const dump = await page.evaluate(() => ({
  inputs: [...document.querySelectorAll("input")].map((i) => ({ type: i.type, name: i.name, ph: i.placeholder })),
  buttons: [...document.querySelectorAll("button")].map((b) => b.textContent.trim().slice(0, 40)),
  iframes: [...document.querySelectorAll("iframe")].map((f) => f.src.slice(0, 80)),
}));
console.log(JSON.stringify(dump, null, 1));
await page.screenshot({ path: "/tmp/qa-signin-probe.png" });
await browser.close();
process.exit(0);
