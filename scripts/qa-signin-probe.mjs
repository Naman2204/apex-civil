import { chromium } from "playwright";
import fs from "fs";
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const creds = JSON.parse(fs.readFileSync("/tmp/apex-qa-creds.json", "utf8"));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
await page.goto("https://apex-civil.vercel.app/sign-in", { waitUntil: "domcontentloaded", timeout: 45000 });
await T(3000);
const info = await page.evaluate(() => {
  const inputs = [...document.querySelectorAll("input")];
  return inputs.map((i) => ({ type: i.type, placeholder: i.placeholder, value: i.value, aria: i.getAttribute("aria-label"), id: i.id }));
});
console.log(JSON.stringify(info, null, 1));
const emailField = page.getByLabel(/email address or username/i);
console.log("emailField count:", await emailField.count());
if (await emailField.count()) {
  await emailField.fill(creds.email);
  await T(800);
  const val = await emailField.inputValue();
  console.log("after fill, value =", JSON.stringify(val));
}
await browser.close().catch(() => {});
process.exit(0);
