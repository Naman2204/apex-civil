/**
 * Drives the REAL live Clerk sign-up flow in the QA Chrome window (CDP 9222).
 * Fills username + password; leaves email for the human (they must read the
 * verification code). Human solves Turnstile + enters the email code.
 *
 * Usage: node scripts/qa-create-account.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import crypto from "crypto";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil"));
if (!page) page = await ctx.newPage();

await page.goto("https://apex-civil.vercel.app/sign-up", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);

// Wait for the Clerk sign-up form
await page.getByLabel(/username/i).first().waitFor({ timeout: 20000 }).catch(() => {});

const suffix = crypto.randomInt(1000, 9999);
const username = `apex_qa_e2e_${suffix}`;
const password = `Apex#Qa${suffix}xYz!2026`;

const hasUsername = (await page.getByLabel(/username/i).count()) > 0;
const hasEmail = (await page.getByLabel(/email address/i).count()) > 0;
const hasPassword = (await page.getByLabel(/password/i, { exact: false }).count()) > 0;

if (hasUsername) await page.getByLabel(/username/i).fill(username);
if (hasPassword) await page.getByLabel(/password/i).first().fill(password);

fs.writeFileSync("/tmp/apex-qa-creds.json", JSON.stringify({
  username, password, email: "(set by user in window)", createdAt: new Date().toISOString(),
  signupUrl: "https://apex-civil.vercel.app/sign-up",
}, null, 2));
fs.chmodSync("/tmp/apex-qa-creds.json", 0o600);

await page.screenshot({ path: "scripts/qa-evidence/10-signup-prefilled.png" });
console.log(JSON.stringify({
  username, hasUsername, hasEmail, hasPassword,
  emailFieldFilled: hasEmail ? (await page.getByLabel(/email address/i).inputValue().catch(() => "")) : "n/a",
  credsFile: "/tmp/apex-qa-creds.json (0600, password NOT printed in chat)",
  status: "awaiting human: email + Turnstile + verification code",
}, null, 2));

await browser.close();
