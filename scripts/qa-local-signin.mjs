/**
 * Sign in to the local dev server via the real Clerk UI form.
 * Usage: node scripts/qa-local-signin.mjs <username> <password> [--screenshot path]
 */
import { chromium } from "playwright";

const BASE = "http://localhost:3000";
const username = process.argv[2];
const password = process.argv[3];
const shot = process.argv[process.argv.indexOf("--screenshot") + 1];

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  [console.error]", m.text().slice(0, 200)); });

await page.goto(BASE + "/sign-in", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(6000);

const idInput = page.locator('input[name="identifier"]');
const pwInput = page.locator('input[name="password"]');
if (await idInput.count()) await idInput.fill(username);
if (await pwInput.count()) await pwInput.fill(password);
await page.waitForTimeout(500);

const buttons = page.locator("button");
const n = await buttons.count();
let clicked = false;
for (let i = n - 1; i >= 0; i--) {
  const t = (await buttons.nth(i).innerText()).trim();
  if (t === "Continue" && !/google/i.test(t)) { await buttons.nth(i).click(); clicked = true; break; }
}
if (!clicked) console.log("  ⚠️ no Continue button found");
await page.waitForTimeout(8000);

const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("url:", page.url());
console.log("BODY:", body.slice(0, 200));
const authed = /Master Civil Engineering|Quick Practice|Dashboard/.test(body);
console.log("AUTHENTICATED:", authed);
if (!authed) {
  const err = body.match(/incorrect|invalid|error|wrong[^.]*/i);
  console.log("error:", err ? err[0] : "none");
}
if (shot) await page.screenshot({ path: shot });

if (authed) {
  // Save the authenticated state for reuse.
  await ctx.storageState({ path: "/tmp/qa-local-auth-state.json" });
  console.log("auth state saved to /tmp/qa-local-auth-state.json");
}
await browser.close();
process.exit(authed ? 0 : 1);
