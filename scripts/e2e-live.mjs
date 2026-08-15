/**
 * E2E test suite for the LIVE Apex Civil Exam Portal (https://apex-civil.vercel.app)
 * Runs against the production deployment using system Chrome via Playwright.
 *
 * Usage: node scripts/e2e-live.mjs [--headed] [--keep-open]
 */
import { chromium } from "playwright";

const LIVE = "https://apex-civil.vercel.app";
const HEADED = process.argv.includes("--headed");
const KEEP_OPEN = process.argv.includes("--keep-open");

let passed = 0;
let failed = 0;
const failures = [];

function report(name, ok, extra = "") {
  if (ok) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`  ❌ ${name}${extra ? " — " + extra : ""}`);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: !HEADED,
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  });
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 200)));

  // ============ 1. LANDING PAGE ============
  console.log("\n[1] Landing page (/):");
  const res = await page.goto(LIVE + "/", { waitUntil: "networkidle", timeout: 45000 });
  report("loads with HTTP 200", res?.status() === 200, `got ${res?.status()}`);
  await page.waitForTimeout(1500);

  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  report("brand 'ApexCivil' visible", body.includes("ApexCivil"));
  report("subtitle 'PREMIUM EXAM PORTAL'", /PREMIUM EXAM PORTAL/i.test(body));
  report("hero copy with '8,000+' questions", body.includes("8,000+") && body.includes("Civil Engineering questions"));
  report("'Sign In to Continue' button", await page.getByRole("button", { name: /sign in to continue/i }).count() === 1);
  report("no JS console errors on landing", consoleErrors.length === 0, consoleErrors.join(" | "));
  report("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));
  await page.screenshot({ path: "/tmp/live-01-landing.png" });

  // ============ 2. SIGN-IN MODAL ============
  console.log("\n[2] Sign-in modal:");
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  const modalText = await page.locator('[role="dialog"]').innerText();
  report("modal opens with 'Sign in to ApexCivil'", modalText.includes("Sign in to ApexCivil"));
  report("Google OAuth option present", /continue with google/i.test(modalText));
  report("email/username field present", await page.getByLabel(/email address or username/i).count() === 1);
  report("'Don't have an account? Sign up' link", /sign up/i.test(modalText));

  // Validation: submit empty
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(800);
  const modalAfterEmpty = await page.locator('[role="dialog"]').innerText();
  report("empty submit keeps modal functional (no crash)", modalAfterEmpty.includes("Sign in to ApexCivil"), "");
  // Note: Clerk v6 reveals the password step instead of blocking on empty identifier.
  if (modalAfterEmpty.includes("Password")) console.log("   ℹ️ empty submit advanced form to password step (Clerk behavior)");

  // Unknown email -> "Couldn't find your account"
  await page.getByLabel(/email address or username/i).fill("no.such.user.apex.xyz@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(2500);
  const modalAfterEmail = await page.locator('[role="dialog"]').innerText();
  report("unknown email -> 'Couldn't find your account'", /couldn'?t find your account/i.test(modalAfterEmail), JSON.stringify(modalAfterEmail.slice(-160)));
  await page.screenshot({ path: "/tmp/live-02-signin-modal.png" });

  // Switch to sign-up inside the modal
  await page.locator('[role="dialog"]').getByRole("link", { name: /sign up/i }).click();
  await page.waitForTimeout(2000);
  const modalSignUp = await page.locator('[role="dialog"]').innerText();
  report("modal switches to sign-up", /create your account/i.test(modalSignUp), JSON.stringify(modalSignUp.slice(0, 120)));
  // Close modal
  await page.locator('[role="dialog"]').getByRole("button", { name: /close/i }).click().catch(() => {});
  await page.waitForTimeout(800);

  // ============ 3. SIGN-IN PAGE ============
  console.log("\n[3] /sign-in page:");
  const r2 = await page.goto(LIVE + "/sign-in", { waitUntil: "networkidle", timeout: 45000 });
  report("loads with HTTP 200", r2?.status() === 200, `got ${r2?.status()}`);
  await page.waitForSelector('[role="dialog"], .cl-signInRoot, [class*="cl-"]', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const signInText = await page.locator("body").innerText();
  report("renders Clerk sign-in UI", /sign in|continue with google|email/i.test(signInText));
  await page.screenshot({ path: "/tmp/live-03-signin-page.png" });

  // ============ 4. SIGN-UP PAGE ============
  console.log("\n[4] /sign-up page:");
  const r3 = await page.goto(LIVE + "/sign-up", { waitUntil: "networkidle", timeout: 45000 });
  report("loads with HTTP 200", r3?.status() === 200, `got ${r3?.status()}`);
  await page.waitForTimeout(2500);
  const signUpText = await page.locator("body").innerText();
  report("renders 'Create your account'", /create your account/i.test(signUpText));
  report("username field", await page.getByLabel(/username/i).count() === 1);
  report("email field", await page.getByLabel(/email address/i).count() === 1);
  report("password field", await page.getByLabel(/password/i, { exact: false }).count() >= 1);
  report("Google option", /continue with google/i.test(signUpText));

  // Password policy is enforced client-side (short password → error, no CAPTCHA needed).
  // Minimum password length is configured in the Clerk Dashboard (User & authentication →
  // Password → Update password requirements) — the assertion matches the configured value.
  await page.getByLabel(/username/i).fill("testuser_apex");
  await page.getByLabel(/email address/i).fill("test.user@example.com");
  await page.getByLabel(/password/i).first().fill("Short1!"); // 7 chars — below the 8-char minimum
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(1800);
  const signUpAfter = await page.locator("body").innerText();
  report("password policy enforced (min 8 chars)", /password must contain 8/i.test(signUpAfter), JSON.stringify(signUpAfter.slice(-180)));

  // Cloudflare Turnstile gates actual sign-up submission (fresh load, valid data, no CAPTCHA solve)
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  await page.getByLabel(/username/i).fill("testuser_apex");
  await page.getByLabel(/email address/i).fill("test.user@example.com");
  await page.getByLabel(/password/i).first().fill("ThisIsAStrongPassword123!");
  const postsBefore = [];
  page.on("response", (r) => { if (r.url().includes("/v1/sign_ups") && r.request().method() === "POST") postsBefore.push(r.status()); });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(2500);
  const turnstileFrames = page.frames().map((f) => f.url()).filter((u) => /turnstile|recaptcha/i.test(u));
  report("sign-up gated by Cloudflare Turnstile", turnstileFrames.length > 0, JSON.stringify(turnstileFrames.slice(0, 1)));
  report("no sign-up API call without solving CAPTCHA", postsBefore.length === 0, JSON.stringify(postsBefore));
  await page.screenshot({ path: "/tmp/live-04-signup-page.png" });

  // ============ 5. ROUTE MATRIX ============
  console.log("\n[5] Route matrix (browser behavior):");
  const publicRoutes = [["/", 200], ["/sign-in", 200], ["/sign-up", 200]];
  for (const [path, expected] of publicRoutes) {
    const r = await page.goto(LIVE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    report(`${path} → ${expected}`, r?.status() === expected, `got ${r?.status()}`);
  }
  const protectedRoutes = ["/dashboard", "/exam", "/bookmarks", "/practice"];
  for (const path of protectedRoutes) {
    const r = await page.goto(LIVE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    const redirected = page.url().startsWith(LIVE + "/sign-in");
    report(`${path} → redirects unauthenticated users to /sign-in`, redirected, `final ${r?.status()} at ${page.url()}`);
  }

  // ============ 6. RESPONSIVE / MOBILE ============
  console.log("\n[6] Mobile viewport (375px):");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(LIVE + "/", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(1200);
  const mBody = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  report("landing renders on mobile", mBody.includes("ApexCivil") && mBody.includes("Sign In to Continue"));
  const signInBtn = page.getByRole("button", { name: /sign in to continue/i });
  const box = await signInBtn.boundingBox();
  report("sign-in button within viewport width", box && box.x >= 0 && box.x + box.width <= 375, JSON.stringify(box));
  await page.screenshot({ path: "/tmp/live-05-mobile.png" });

  // ============ SUMMARY ============
  console.log("\n=================== SUMMARY ===================");
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  if (failures.length) console.log("FAILURES:\n  - " + failures.join("\n  - "));
  if (consoleErrors.length) console.log("CONSOLE ERRORS:\n  - " + consoleErrors.join("\n  - "));
  if (pageErrors.length) console.log("PAGE ERRORS:\n  - " + pageErrors.join("\n  - "));

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(2);
});
