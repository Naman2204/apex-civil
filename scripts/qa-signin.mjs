/**
 * Signs the QA account back in through the REAL Clerk UI (CDP 9222).
 * Email+password form only — never the Google button.
 * Usage: node scripts/qa-signin.mjs
 */
import { chromium } from "playwright";
import fs from "fs";

const T = (ms) => new Promise((r) => setTimeout(r, ms));
const creds = JSON.parse(fs.readFileSync("/tmp/apex-qa-creds.json", "utf8"));

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];

await page.goto("https://apex-civil.vercel.app/sign-in", { waitUntil: "domcontentloaded", timeout: 45000 });
await T(3500);

// If Clerk already shows both fields (remembered account), fill them.
const emailField = page.getByLabel(/email address or username/i);
const ecount = await emailField.count().catch(() => 0);
if (ecount) {
  await emailField.fill(creds.username);
  await T(1000);
  const pwdField = page.getByLabel(/password/i).first();
  const pcount = await pwdField.count().catch(() => 0);
  if (pcount) {
    await pwdField.fill(creds.password);
    await T(800);
    // Click the credential-form Continue (NOT Continue with Google)
    await page.getByRole("button", { name: "Continue", exact: true }).click().catch(() => {});
  } else {
    await page.getByRole("button", { name: "Continue", exact: true }).click().catch(() => {});
    await T(2500);
    await page.getByLabel(/password/i).first().fill(creds.password).catch(() => {});
    await T(800);
    await page.getByRole("button", { name: "Continue", exact: true }).click().catch(() => {});
  }
}
await T(6000);
const url = page.url();
const cookies = await ctx.cookies("https://apex-civil.vercel.app");
const session = cookies.find((c) => c.name === "__session");
const body = await Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 180)), T(6000)]).catch(() => "");
console.log(JSON.stringify({
  url: url.replace("https://apex-civil.vercel.app", ""),
  hasSession: !!session,
  body: body.slice(0, 140),
  needsVerification: /verif|code|device|factor/i.test(body) && url.includes("sign-in"),
}, null, 2));
if (session) {
  const payload = JSON.parse(Buffer.from(session.value.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
  fs.writeFileSync("/tmp/apex-qa-clerkid.json", JSON.stringify({ clerkId: payload.sub, email: "diyeti1080@hutdot.com" }));
  console.log("clerkId:", payload.sub);
}
process.exit(0);
