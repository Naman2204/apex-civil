/**
 * Probe local sign-up flow on the local dev server (localhost:3000).
 * Usage: node scripts/qa-local-probe.mjs
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const username = "localqa_probe_" + Date.now().toString(36);
const email = username + "@example.com";
const password = "LocalProbePassword123!";

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  [console.error]", m.text().slice(0, 150)); });
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 150)));

console.log("BASE:", BASE);
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2500);
let body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("landing has ApexCivil:", body.includes("ApexCivil"));
console.log("landing has Sign In to Continue:", body.includes("Sign In to Continue"));

// Go to sign-up page directly
await page.goto(BASE + "/sign-up", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(3500);
body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("sign-up page text (first 200):", body.slice(0, 200));

// Fill the form (Clerk test instance: no Turnstile)
const fill = async (label, value) => {
  const el = page.getByLabel(label, { exact: false }).first();
  if (await el.count()) { await el.fill(value); return true; }
  return false;
};
await fill(/username/i, username);
await fill(/email address/i, email);
await fill(/password/i, password);
await page.waitForTimeout(500);

// Submit
const cont = page.getByRole("button", { name: /continue/i }).first();
if (await cont.count()) {
  await cont.click();
  await page.waitForTimeout(5000);
} else {
  console.log("no continue button found");
}

body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("after submit (first 500):", body.slice(0, 500));
const url = page.url();
console.log("url:", url);
console.log("has verification prompt:", /verify|code|email/i.test(body) && /code|verification|confirm/i.test(body));
console.log("has error:", /error|invalid|already/i.test(body) ? body.match(/error|invalid|already[^.]*/i)?.[0] : "none");
const inputs = await page.evaluate(() => [...document.querySelectorAll("input")].map((i) => ({ type: i.type, name: i.name, ph: i.placeholder })));
console.log("inputs:", JSON.stringify(inputs));
const bodyHtml = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " "));
console.log("body2:", bodyHtml.slice(0, 400));

await page.screenshot({ path: "/tmp/qa-probe-signup.png" });
await browser.close();
process.exit(0);
