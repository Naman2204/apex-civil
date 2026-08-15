/**
 * UI SIGN-UP TEST — drives the real local /sign-up page (Clerk <SignUp />)
 * exactly as a user would: fills username + email + password and submits.
 * Captures the validation message the form shows.
 */
import { chromium } from "playwright";
import "dotenv/config";

const BASE = "http://localhost:3000";
const T = (ms) => new Promise((r) => setTimeout(r, ms));

async function trySignUp(password, { expectHint } = {}) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on("console", (m) => consoleMsgs.push(m.text().slice(0, 160)));
  await page.goto(BASE + "/sign-up", { waitUntil: "domcontentloaded", timeout: 45000 });
  await T(4000);
  const bodyText = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());

  // Fill the Clerk form: username, email, password.
  const stamp = Date.now().toString(36);
  await page.getByLabel(/username/i).first().fill(`pwui_${stamp}`);
  await page.getByLabel(/email/i).first().fill(`pwui_${stamp}@example.com`);
  const pwInput = page.getByLabel(/password/i).first();
  await pwInput.fill(password);

  // Show the hint text the form displays for the typed password.
  await T(1500);
  const hint = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
  const buttonsBefore = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent.trim()).filter(Boolean));

  // Submit via the exact "Continue" button (Clerk sign-up primary), NOT
  // "Continue with Google".
  const submitted = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const btn = btns.find((b) => b.textContent.trim() === "Continue" && !b.disabled) || btns.find((b) => /^continue$/i.test(b.textContent.trim()));
    if (btn) { btn.click(); return btn.textContent.trim(); }
    return null;
  });
  await T(6000);
  const after = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
  const frames = page.frames().map((f) => f.url()).filter((u) => /turnstile|recaptcha|challenges/.test(u));
  await browser.close();

  // Find the password-related message.
  const m = after.match(/password[^.]{0,100}/i);
  console.log(`\n[password: ${password.length} chars] submit button: ${submitted || "none"}`);
  console.log(`  buttons before submit: ${JSON.stringify(buttonsBefore.slice(0, 6))}`);
  console.log(`  captcha frames: ${frames.length ? frames.join(" | ") : "none"}`);
  console.log(`  password-related text: ${m ? m[0].slice(0, 140) : "(none)"}`);
  console.log(`  body after submit (${after.length} chars): ${after.slice(0, 400)}`);
  return { bodyAfter: after, hint, buttonsBefore, frames };
  
}

const { bodyAfter } = await trySignUp("Abcdef12");
const shows15 = /must be 15|15 characters|at least 15/i.test(bodyAfter);
console.log(`\nUI shows 15-character requirement: ${shows15}`);
process.exit(0);
