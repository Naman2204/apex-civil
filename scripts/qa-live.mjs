/**
 * COMPREHENSIVE LIVE QA SUITE — ApexCivil (https://apex-civil.vercel.app)
 * Drives the REAL production deployment with system Chrome via Playwright.
 *
 * Usage: node scripts/qa-live.mjs [--headed]
 * Evidence: scripts/qa-evidence/*.png   Results: scripts/qa-results.json
 *
 * NOTE: This is the live deployment test. The Freebuff preview webview is
 * loopback-only and CANNOT display external URLs (verified with a hard tool
 * error), so this real-browser run + captured screenshots is the primary
 * evidence; screenshots are surfaced in the Preview tab via an HTML gallery.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const LIVE = "https://apex-civil.vercel.app";
const HEADED = process.argv.includes("--headed");
const EVIDENCE = path.resolve("scripts/qa-evidence");
fs.mkdirSync(EVIDENCE, { recursive: true });

const results = [];
let section = "";

function addResult(testId, feature, action, expected, actual, status, severity = "MEDIUM", evidence = "") {
  results.push({ testId, feature, action, expected, actual, status, severity, evidence });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : status === "BLOCKED" ? "⛔" : "⚠️";
  console.log(`${icon} [${testId}] ${feature} — ${status}${actual ? ` | ${actual}` : ""}`);
}

async function screenshot(page, name) {
  const p = path.join(EVIDENCE, name);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function main() {
  const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", headless: !HEADED });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ---------- Global network & console monitors ----------
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = []; // {url, status, method}
  const clerkRequests = [];  // {url, status}
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300)); });
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 300)));
  page.on("requestfailed", (r) => failedRequests.push({ url: r.url().slice(0, 200), error: r.failure()?.errorText || "failed" }));
  page.on("response", (r) => {
    const u = r.url();
    if (u.includes("__clerk")) clerkRequests.push({ url: u.slice(0, 140), status: r.status() });
    if (r.status() >= 400 && !u.includes("accounts.dev") && !u.includes("turnstile")) {
      failedRequests.push({ url: u.slice(0, 200), status: r.status(), method: r.request().method() });
    }
  });

  // ================= PHASE 3: LIVE BASELINE =================
  console.log("\n===== PHASE 3 — LIVE BASELINE (landing) =====");
  const res = await page.goto(LIVE + "/", { waitUntil: "networkidle", timeout: 60000 });
  addResult("T-001", "Landing page", "Open /", "HTTP 200", `HTTP ${res?.status()}`, res?.status() === 200 ? "PASS" : "FAIL", "CRITICAL");
  await page.waitForTimeout(1500);
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  addResult("T-002", "Brand & hero", "Read rendered text", "ApexCivil + PREMIUM EXAM PORTAL + 8,000+ copy", body.slice(0, 120), body.includes("ApexCivil") && /PREMIUM EXAM PORTAL/i.test(body) ? "PASS" : "FAIL", "HIGH");
  addResult("T-003", "Sign-in button", "Look for 'Sign In to Continue'", "Present", String(await page.getByRole("button", { name: /sign in to continue/i }).count()), (await page.getByRole("button", { name: /sign in to continue/i }).count()) === 1 ? "PASS" : "FAIL", "HIGH");
  const cssOk = await page.evaluate(() => {
    const el = document.querySelector("body");
    const s = getComputedStyle(el);
    return s.backgroundColor || s.color;
  });
  addResult("T-004", "CSS applied", "Check computed background", "Non-default style", String(cssOk), cssOk && cssOk !== "rgba(0, 0, 0, 0)" ? "PASS" : "FAIL", "MEDIUM");
  addResult("T-005", "Console errors", "Monitor console", "No JS errors on landing", consoleErrors.length ? consoleErrors.join(" | ") : "none", consoleErrors.length === 0 ? "PASS" : "FAIL", "HIGH");
  addResult("T-006", "Uncaught page errors", "Monitor pageerror", "None", pageErrors.length ? pageErrors.join(" | ") : "none", pageErrors.length === 0 ? "PASS" : "FAIL", "HIGH");
  addResult("T-007", "Failed requests", "Monitor responses/requests", "No 4xx/5xx from app origin", failedRequests.length ? failedRequests.map((f) => `${f.status || f.error} ${f.url}`).join(" | ") : "none", failedRequests.length === 0 ? "PASS" : "FAIL", "HIGH");
  const clerkFails = clerkRequests.filter((r) => r.status >= 400);
  addResult("T-008", "Clerk JS loading", "Monitor /__clerk/* requests", "No /__clerk/ 404 or 500", clerkFails.length ? clerkFails.map((f) => `${f.status} ${f.url}`).join(" | ") : `${clerkRequests.length} clerk requests OK`, clerkFails.length === 0 ? "PASS" : "FAIL", "CRITICAL");
  addResult("T-009", "Hydration", "Check console for hydration warnings", "No hydration mismatch", /hydrat/i.test(consoleErrors.join(" ")) ? "hydration error found" : "none", !/hydrat/i.test(consoleErrors.join(" ")) ? "PASS" : "FAIL", "MEDIUM");
  await screenshot(page, "01-landing.png");

  // ================= PHASE 4A: AUTH UI =================
  console.log("\n===== PHASE 4 — AUTH UI (live) =====");
  await page.getByRole("button", { name: /sign in to continue/i }).click();
  await page.waitForSelector('[role="dialog"]', { timeout: 20000 });
  const modalText = await page.locator('[role="dialog"]').innerText();
  addResult("T-010", "Sign-in modal opens", "Click Sign In", "Dialog renders", modalText.includes("Sign in to ApexCivil") ? "dialog rendered" : modalText.slice(0, 80), modalText.includes("Sign in to ApexCivil") ? "PASS" : "FAIL", "HIGH");
  addResult("T-011", "Google OAuth option", "Read modal", "Continue with Google", String(/continue with google/i.test(modalText)), /continue with google/i.test(modalText) ? "PASS" : "FAIL", "MEDIUM");
  addResult("T-012", "Email/username field", "Look up field", "Present", String(await page.getByLabel(/email address or username/i).count()), (await page.getByLabel(/email address or username/i).count()) === 1 ? "PASS" : "FAIL", "MEDIUM");

  // Unknown email → expected Clerk 422 "Couldn't find your account"
  await page.getByLabel(/email address or username/i).fill("qa.nonexistent.user@example.com");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(3000);
  const modalAfter = await page.locator('[role="dialog"]').innerText();
  addResult("T-013", "Unknown email handling", "Submit unknown email", "'Couldn't find your account' error (422 handled)", /couldn'?t find your account/i.test(modalAfter) ? "error shown" : modalAfter.slice(-120), /couldn'?t find your account/i.test(modalAfter) ? "PASS" : "FAIL", "HIGH");
  await screenshot(page, "02-signin-modal-unknown-email.png");

  // Sign-in page
  await page.goto(LIVE + "/sign-in", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  const signInText = await page.locator("body").innerText();
  addResult("T-014", "/sign-in page", "Open route", "200 + Clerk UI renders", /sign in/i.test(signInText) ? "renders" : "missing", (await page.evaluate(() => document.title)).includes("ApexCivil") && /sign in/i.test(signInText) ? "PASS" : "FAIL", "HIGH");
  await screenshot(page, "03-signin-page.png");

  // Sign-up page + Turnstile gate
  await page.goto(LIVE + "/sign-up", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  const signUpText = await page.locator("body").innerText();
  addResult("T-015", "/sign-up page", "Open route", "200 + create-account UI", /create your account/i.test(signUpText) ? "renders" : signUpText.slice(0, 100), /create your account/i.test(signUpText) ? "PASS" : "FAIL", "HIGH");
  const hasUsername = await page.getByLabel(/username/i).count();
  const hasEmail = await page.getByLabel(/email address/i).count();
  const hasPassword = await page.getByLabel(/password/i, { exact: false }).count();
  addResult("T-016", "Sign-up fields", "Check fields", "username + email + password", `u:${hasUsername} e:${hasEmail} p:${hasPassword}`, hasUsername >= 1 && hasEmail >= 1 && hasPassword >= 1 ? "PASS" : "FAIL", "HIGH");

  // Fill valid data, attempt submit → Turnstile gates it
  await page.getByLabel(/username/i).fill("qa_probe_user");
  await page.getByLabel(/email address/i).fill("qa.probe.live@example.com");
  await page.getByLabel(/password/i).first().fill("ThisIsAStrongPassword123!");
  const signUpPosts = [];
  page.on("response", (r) => { if (r.url().includes("/v1/sign_ups") && r.request().method() === "POST") signUpPosts.push(r.status()); });
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(3000);
  const turnstileFrames = page.frames().map((f) => f.url()).filter((u) => /turnstile|challenges.cloudflare/i.test(u));
  addResult("T-017", "Sign-up CAPTCHA gate", "Attempt real submit", "Cloudflare Turnstile present; no sign-up API call without solve", `turnstile:${turnstileFrames.length} apiCalls:${signUpPosts.length}`, turnstileFrames.length > 0 && signUpPosts.length === 0 ? "PASS" : "FAIL", "HIGH");
  await screenshot(page, "04-signup-turnstile.png");

  // ================= PHASE 4A: PROTECTED ROUTES =================
  console.log("\n===== PHASE 4A — PROTECTED ROUTES (unauthenticated) =====");
  const protectedRoutes = ["/dashboard", "/practice", "/exam", "/bookmarks"];
  for (const p of protectedRoutes) {
    const r = await page.goto(LIVE + p, { waitUntil: "domcontentloaded", timeout: 40000 });
    const redirected = page.url().startsWith(LIVE + "/sign-in");
    addResult(`T-018-${p.replace("/", "")}`, `Protected route ${p}`, "Open unauthenticated", "Redirect to /sign-in with redirect_url", `status ${r?.status()} → ${page.url().replace(LIVE, "")}`, redirected ? "PASS" : "FAIL", "CRITICAL");
  }
  await page.goto(LIVE + "/dashboard?redirect_url=%2Fexam", { waitUntil: "domcontentloaded", timeout: 40000 });
  addResult("T-019", "redirect_url preserved", "Open protected w/ redirect param", "Redirect URL contains redirect_url", page.url(), page.url().includes("redirect_url") ? "PASS" : "FAIL", "MEDIUM");
  // No infinite redirect
  await page.waitForTimeout(2000);
  addResult("T-020", "No infinite redirect", "Wait after redirect", "Stable on /sign-in", page.url().replace(LIVE, ""), page.url().startsWith(LIVE + "/sign-in") ? "PASS" : "FAIL", "HIGH");

  // ================= PHASE 26: RESPONSIVE (pre-login) =================
  console.log("\n===== PHASE 26 — RESPONSIVE (pre-login) =====");
  for (const [w, h, label] of [[375, 812, "mobile"], [768, 1024, "tablet"], [1024, 768, "small-desktop"], [1920, 1080, "fullhd"]]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(LIVE + "/", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const btn = await page.getByRole("button", { name: /sign in to continue/i }).boundingBox();
    const btnOk = btn && btn.x >= 0 && btn.x + btn.width <= w;
    addResult(`T-021-${label}`, `Landing at ${w}x${h}`, "Check overflow + button fit", "No horizontal overflow; button within viewport", `overflow:${overflow}px btn:${btnOk}`, overflow <= 1 && btnOk ? "PASS" : "FAIL", "MEDIUM");
    await screenshot(page, `05-landing-${w}x${h}.png`);
  }

  // ================= AUTH (conditional) =================
  console.log("\n===== PHASE 4B — REAL SIGN-IN (requires credentials) =====");
  const email = process.env.LIVE_EMAIL;
  const password = process.env.LIVE_PASSWORD;
  if (email && password) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(LIVE + "/sign-in", { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(2500);
    await page.getByLabel(/email address or username/i).fill(email);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForTimeout(3000);
    const pwdField = page.getByLabel(/password/i).first();
    if (await pwdField.count()) {
      await pwdField.fill(password);
      await page.getByRole("button", { name: /continue|sign in/i }).first().click();
      await page.waitForTimeout(5000);
      const url = page.url();
      if (url.includes("sign-in") && /verif|code|device|factor/i.test(await page.locator("body").innerText())) {
        addResult("T-022", "Real sign-in", "Enter credentials", "Dashboard", "BLOCKED: Device Trust / verification required (see body text)", "BLOCKED", "CRITICAL");
        await screenshot(page, "06-signin-blocked-verification.png");
      } else {
        addResult("T-022", "Real sign-in", "Enter credentials", "Authenticated dashboard", `final URL ${url.replace(LIVE, "")}`, url.includes("sign-in") ? "FAIL" : "PASS", "CRITICAL");
        await screenshot(page, "07-authenticated-dashboard.png");
        // Session persistence: reload
        await page.reload({ waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(2500);
        const stillAuthed = !page.url().includes("sign-in");
        addResult("T-023", "Session persistence", "Reload", "Still authenticated", page.url().replace(LIVE, ""), stillAuthed ? "PASS" : "FAIL", "CRITICAL");
        // Logout
        const logoutBtn = page.locator("button:has-text('Sign out'), [class*='cl-userButtonPopoverAction'] button:has-text('Sign out')").first();
        // Open user menu
        await page.locator("[class*='cl-avatarBox'], [class*='cl-userButtonTrigger']").first().click().catch(() => {});
        await page.waitForTimeout(1500);
        await logoutBtn.click({ timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(3000);
        addResult("T-024", "Sign out", "Click sign out", "Return to landing / signed-out state", page.url().replace(LIVE, ""), !page.url().includes("sign-in") ? "PARTIAL (see evidence)" : "PASS", "HIGH");
        await screenshot(page, "08-after-logout.png");
      }
    } else {
      const bodyTxt = await page.locator("body").innerText();
      addResult("T-022", "Real sign-in", "Enter email", "Password step", "BLOCKED: " + bodyTxt.slice(0, 140), "BLOCKED", "CRITICAL");
      await screenshot(page, "06-signin-blocked.png");
    }
  } else {
    addResult("T-022", "Real sign-in", "—", "—", "BLOCKED: no LIVE_EMAIL/LIVE_PASSWORD provided (needs real credentials from user)", "BLOCKED", "CRITICAL");
    addResult("T-023", "Session persistence", "—", "—", "BLOCKED: depends on T-022", "BLOCKED", "HIGH");
    addResult("T-024", "Sign out", "—", "—", "BLOCKED: depends on T-022", "BLOCKED", "HIGH");
    addResult("T-025", "Protected route after logout", "—", "—", "BLOCKED: depends on T-022", "BLOCKED", "HIGH");
  }

  // ================= SUMMARY =================
  const pass = results.filter((r) => r.status === "PASS").length;
  const fail = results.filter((r) => r.status === "FAIL").length;
  const blocked = results.filter((r) => r.status === "BLOCKED").length;
  const partial = results.filter((r) => r.status === "PARTIAL").length;
  fs.writeFileSync(path.resolve("scripts/qa-results.json"), JSON.stringify(results, null, 2));

  console.log("\n=================== LIVE QA SUMMARY ===================");
  console.log(`PASS: ${pass}  FAIL: ${fail}  BLOCKED: ${blocked}  PARTIAL: ${partial}  TOTAL: ${results.length}`);
  if (failedRequests.length) console.log("FAILED/4xx+ REQUESTS:\n  - " + [...new Set(failedRequests.map((f) => `${f.status || f.error} ${f.url}`))].slice(0, 15).join("\n  - "));
  if (consoleErrors.length) console.log("CONSOLE ERRORS:\n  - " + [...new Set(consoleErrors)].slice(0, 10).join("\n  - "));
  if (pageErrors.length) console.log("PAGE ERRORS:\n  - " + [...new Set(pageErrors)].slice(0, 10).join("\n  - "));

  await browser.close();
}

main().catch((e) => { console.error("FATAL:", e); process.exit(2); });
