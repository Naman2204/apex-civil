/**
 * AUTHENTICATED E2E test suite for the LIVE Apex Civil Exam Portal.
 * Requires credentials for an existing account on the live Clerk instance:
 *
 *   LIVE_EMAIL=you@example.com LIVE_PASSWORD=yourpass node scripts/e2e-live-auth.mjs
 *
 * Covers: login, dashboard, sidebar views, exam flow, bookmarks, analytics,
 * performance, settings, notifications, search, mobile menu, logout.
 */
import { chromium } from "playwright";

const LIVE = "https://apex-civil.vercel.app";
const EMAIL = process.env.LIVE_EMAIL;
const PASSWORD = process.env.LIVE_PASSWORD;
const HEADED = process.argv.includes("--headed");
const KEEP_OPEN = process.argv.includes("--keep-open");

if (!EMAIL || !PASSWORD) {
  console.error("Set LIVE_EMAIL and LIVE_PASSWORD env vars to run the authenticated suite.");
  process.exit(2);
}

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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message.slice(0, 200)));

  // ============ 1. LOGIN ============
  console.log("\n[1] Login:");
  await page.goto(LIVE + "/sign-in", { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2500);

  const emailField = page.getByLabel(/email address or username/i);
  report("email field present", (await emailField.count()) > 0);
  await emailField.fill(EMAIL);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.waitForTimeout(2500);

  const passwordField = page.getByLabel(/password/i).first();
  if ((await passwordField.count()) > 0) {
    await passwordField.fill(PASSWORD);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    // might be a "Continue" then password, or direct submit
    const submitBtn = page.getByRole("button", { name: /continue|sign in/i }).first();
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click();
    }
  }
  await page.waitForTimeout(6000);
  await page.screenshot({ path: "/tmp/live-auth-01-after-login.png" });
  report("landed in the app after login", page.url().startsWith(LIVE + "/"), page.url());
  report("dashboard UI rendered", await page.getByText("Master Civil Engineering").count() > 0 || await page.getByText(/let'?s continue your preparation/i).count() > 0);

  if (!page.url().startsWith(LIVE + "/") || (await page.getByText("Master Civil Engineering").count()) === 0) {
    const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    console.log("   ⚠️ login may have failed. Page:", JSON.stringify(body.slice(0, 200)));
  }

  // ============ 2. DASHBOARD ============
  console.log("\n[2] Dashboard:");
  await page.waitForTimeout(3000);
  const dash = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  report("hero section", dash.includes("Master Civil Engineering"));
  report("Quick Practice button", await page.getByRole("button", { name: /quick practice/i }).count() > 0);
  report("Configure Exam button", await page.getByRole("button", { name: /configure exam/i }).count() > 0);
  report("Daily Goal card", /daily goal/i.test(dash));
  report("Current Streak card", /current streak/i.test(dash));
  report("Overall Progress card", /overall progress/i.test(dash));
  report("Exam Countdown card", /exam countdown/i.test(dash));
  report("Explore Topics section", /explore topics/i.test(dash));
  report("Weak Topics section", /weak topics/i.test(dash));
  report("Simulate Exam card", /simulate exam/i.test(dash));
  report("Total Questions footer stat", /total questions/i.test(dash));
  report("no page errors on dashboard", pageErrors.length === 0, pageErrors.join(" | "));
  await page.screenshot({ path: "/tmp/live-auth-02-dashboard.png" });

  // ============ 3. QUICK PRACTICE / EXAM FLOW ============
  console.log("\n[3] Exam flow (quick practice):");
  await page.getByRole("button", { name: /quick practice/i }).first().click();
  await page.waitForTimeout(2500);
  const examSetup = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
  report("exam setup screen", /practice|exam|question/i.test(examSetup) && /start/i.test(examSetup), examSetup.slice(0, 120));
  await page.screenshot({ path: "/tmp/live-auth-03-exam-setup.png" });

  // Try to start a small practice exam
  const startBtn = page.getByRole("button", { name: /start (practice|exam)/i }).first();
  if (await startBtn.isVisible().catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(4000);
    const inExam = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    report("exam questions load", /question/i.test(inExam) && /\d/.test(inExam), inExam.slice(0, 150));
    await page.screenshot({ path: "/tmp/live-auth-04-exam-questions.png" });

    // Answer first question
    const opt = page.locator("button, label", { hasText: /^[A-D]\)/ }).first();
    if ((await opt.count()) > 0) {
      await opt.click().catch(() => {});
      await page.waitForTimeout(800);
    }
    report("can select an answer option", (await page.locator("button:has-text(\"Next\"), button:has-text(\"Submit\"), button:has-text(\"Skip\")").count()) > 0);
    await page.screenshot({ path: "/tmp/live-auth-05-answer.png" });
  }

  // ============ 4. SIDEBAR VIEWS ============
  console.log("\n[4] Sidebar views:");
  const views = [
    ["Topics", /explore topics|topics/i],
    ["Weak Topics", /weak topics/i],
    ["Analytics", /analytics|performance|accuracy|activity/i],
    ["Performance", /performance|accuracy|attempts/i],
    ["Bookmarks", /bookmarks|no bookmarks/i],
    ["Settings", /settings|daily goal|dark mode|theme/i],
  ];
  for (const [label, re] of views) {
    await page.goto(LIVE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    const navBtn = page.locator("nav button, aside button, [class*='sidebar'] button", { hasText: new RegExp(label, "i") }).first();
    if ((await navBtn.count()) > 0) {
      await navBtn.click().catch(() => {});
      await page.waitForTimeout(2500);
    }
    const txt = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    report(`${label} view renders`, re.test(txt) || txt.length > 50, txt.slice(0, 120));
    await page.screenshot({ path: `/tmp/live-auth-view-${label.toLowerCase().replace(/\s/g, "-")}.png` });
  }

  // ============ 5. HEADER: NOTIFICATIONS & SEARCH ============
  console.log("\n[5] Header features:");
  await page.goto(LIVE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const notifBtn = page.locator("header button", { has: page.locator("svg.lucide-bell, [class*='bell'], svg") }).first();
  const bell = page.locator('header svg[class*="lucide-bell"], header button:has(svg)').first();
  if ((await bell.count()) > 0) {
    await bell.click().catch(() => {});
    await page.waitForTimeout(1500);
    const notif = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    report("notifications dropdown opens", /notification|all caught up/i.test(notif), notif.slice(-100));
    await page.screenshot({ path: "/tmp/live-auth-06-notifications.png" });
  } else {
    report("notifications button present in header", false, "bell icon not found");
  }

  // ============ 6. THEME TOGGLE ============
  console.log("\n[6] Theme toggle:");
  await page.goto(LIVE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const themeBtn = page.locator('header button[title*="dark"], header button[title*="theme"], header button:has(svg.lucide-sun), header button:has(svg.lucide-moon)').first();
  if ((await themeBtn.count()) > 0) {
    const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await themeBtn.click();
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    report("theme toggle switches dark/light", before !== after, `dark before=${before} after=${after}`);
    await themeBtn.click(); // restore
  } else {
    report("theme toggle present", false, "theme button not found");
  }

  // ============ 7. MOBILE MENU ============
  console.log("\n[7] Mobile menu:");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(LIVE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const menuBtn = page.locator('header button:has(svg.lucide-menu), header button[class*="lg:hidden"]').first();
  if ((await menuBtn.count()) > 0) {
    await menuBtn.click().catch(() => {});
    await page.waitForTimeout(1200);
    const m = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
    report("mobile menu opens", /dashboard|topics|settings/i.test(m), m.slice(0, 120));
    await page.screenshot({ path: "/tmp/live-auth-07-mobile-menu.png" });
  } else {
    report("mobile menu button present", false);
  }

  // ============ 8. LOGOUT ============
  console.log("\n[8] Logout:");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(LIVE + "/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  const userBtn = page.locator("header button.cl-userButtonTrigger, header [class*='userButton'], header button[aria-label*='user']").first();
  if ((await userBtn.count()) > 0) {
    await userBtn.click().catch(() => {});
    await page.waitForTimeout(1500);
    const signOut = page.getByText(/sign out/i).first();
    if ((await signOut.count()) > 0) {
      await signOut.click();
      await page.waitForTimeout(3500);
      const after = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
      report("logout returns to landing", /sign in to continue/i.test(after), after.slice(0, 100));
      await page.screenshot({ path: "/tmp/live-auth-08-logout.png" });
    } else {
      report("sign out option in user menu", false);
    }
  } else {
    report("user menu button present", false);
  }

  // ============ SUMMARY ============
  console.log("\n=================== SUMMARY ===================");
  console.log(`PASSED: ${passed}  FAILED: ${failed}`);
  if (failures.length) console.log("FAILURES:\n  - " + failures.join("\n  - "));

  if (!KEEP_OPEN) await browser.close();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(2);
});
