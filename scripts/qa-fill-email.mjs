/**
 * Fills the dedicated QA email into the REAL live sign-up form in the QA
 * Chrome window (CDP 9222). Human then solves Turnstile + email code.
 * Usage: node scripts/qa-fill-email.mjs diyeti1080@hutdot.com
 */
import { chromium } from "playwright";

const email = process.argv[2] || "diyeti1080@hutdot.com";
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil"));
if (!page) page = await ctx.newPage();

if (!page.url().includes("sign-up")) {
  await page.goto("https://apex-civil.vercel.app/sign-up", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
}

const emailField = page.getByLabel(/email address/i).first();
const n = await emailField.count().catch(() => 0);
if (!n) {
  console.log(JSON.stringify({ error: "email field not found; is a CAPTCHA or previous step shown?", url: page.url() }));
  await browser.close();
  process.exit(1);
}
await emailField.fill(email);
const filled = await emailField.inputValue();
const username = await page.getByLabel(/username/i).first().inputValue().catch(() => "");
const pwdLen = (await page.getByLabel(/password/i).first().inputValue().catch(() => "")).length;
await page.screenshot({ path: "scripts/qa-evidence/11-signup-email-filled.png" });
console.log(JSON.stringify({ url: page.url(), emailFilled: filled, username, passwordLength: pwdLen, next: "HUMAN: solve Turnstile, click Continue, enter email code" }, null, 2));
await browser.close();
