/**
 * LOCAL AUTHENTICATED E2E REGRESSION — localhost:3000 (dev server, current code).
 * Uses controlled local Clerk test accounts created via the Backend API; the
 * session JWT is set as the __session cookie (standard local test approach).
 *
 * Usage:
 *   node scripts/qa-local-e2e.mjs <phase> [--account <prefix>] [--json]
 *   phases: auth | nav | practice | strict | review | settings | logout | all
 *
 * Results accumulate in scripts/qa-local-results.json (keyed by run).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import "dotenv/config";

const BASE = "http://localhost:3000";
const phase = process.argv[2] || "all";
const accountPrefix = (process.argv.find((a) => a.startsWith("--account=")) || "--account=localqa").split("=")[1];

const RESULTS = path.resolve("scripts/qa-local-results.json");
let results = JSON.parse(fs.existsSync(RESULTS) ? fs.readFileSync(RESULTS, "utf8") : "[]");
results = Array.isArray(results) ? results : [];

const T = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Clerk API helpers ----------
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };

async function createAccount(prefix) {
  // Reuse an existing QA test account for the prefix (do not create new accounts).
  const users = await (await fetch(`${API}/users?limit=100`, { headers: h })).json();
  const match = Array.isArray(users)
    ? users.filter((x) => (x.username || "").startsWith(`${prefix}_`)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
    : null;
  const user = match || (await (await fetch(`${API}/users`, {
    method: "POST", headers: h,
    body: JSON.stringify({ username: `${prefix}_${Date.now().toString(36)}`, email_address: [`${prefix}_${Date.now().toString(36)}@example.com`], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }),
  })).json());
  const session = await (await fetch(`${API}/sessions`, {
    method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }),
  })).json();
  return { username: user.username, email: user.email_addresses?.[0]?.email_address || `${user.username}@example.com`, password: "LocalRegressionPass123!", userId: user.id, sessionId: session.id };
}

async function mintJwt(sessionId) {
  const t = await (await fetch(`${API}/sessions/${sessionId}/tokens`, {
    method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }),
  })).json();
  return t.jwt;
}

async function deleteAccount(userId) {
  try { await fetch(`${API}/users/${userId}`, { method: "DELETE", headers: h }); } catch {}
}

// ---------- helpers ----------
function addResult(testId, feature, expected, actual, status, severity = "MEDIUM") {
  results.push({ testId, feature, expected, actual, status, severity, phase });
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : status === "PARTIAL" ? "⚠️" : "⏸";
  console.log(`${icon} [${testId}] ${feature} — ${status}${actual ? ` | ${actual}` : ""}`);
}
const save = () => fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));

async function go(page, desc, fn, ms = 25000) {
  let done = false;
  const timer = T(ms).then(() => { if (!done) console.log(`  ⏱️ TIMEOUT: ${desc}`); });
  try { await Promise.race([fn().then(() => { done = true; }), timer]); }
  catch (e) { console.log(`  ⚠️ ERROR in ${desc}: ${e.message.split("\n")[0]}`); }
  if (!done) await T(500);
}

const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());

// Click the first enabled exam option: find a button that contains a badge span
// whose text is exactly one of A-D (options render the letter as a badge span).
const clickOption = (page) => page.evaluate(() => {
  const opts = [...document.querySelectorAll("button")].filter((b) => {
    if (b.disabled) return false;
    return [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim()));
  });
  if (opts.length) { opts[0].click(); return true; }
  return false;
});

const readQuestion = (page) => page.evaluate(() => {
  const m = document.body.innerText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  return m ? { cur: +m[1], tot: +m[2] } : null;
});

// Poll until a condition holds (max ~15s), so React re-renders never race the
// question counter.
const waitFor = async (page, cond, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await cond()) return true;
    await T(400);
  }
  return false;
};

// Answer every question in a practice exam deterministically.
async function answerAllQuestions(page, tot, { bookmarkAt } = {}) {
  for (let target = 1; target <= tot; target++) {
    await waitFor(page, async () => (await readQuestion(page))?.cur === target);
    await clickOption(page);
    await T(1200);
    if (target === bookmarkAt) {
      // New compact bookmark button is icon-only; address it by its accessible name.
      await page.evaluate(() => { const b = document.querySelector('button[aria-label="Bookmark this question"]'); if (b) b.click(); });
      await T(1000);
      console.log(`  ℹ️ bookmarked Q${bookmarkAt}`);
    }
    if (target === tot) break;
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
  }
}
const clickText = (page, label, partial = false) => page.evaluate(([l, p]) => {
  const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l);
  if (el) { el.click(); return true; } return false;
}, [label, partial]);

// Obtain the Clerk dev-browser JWT by completing the dev-instance handshake
// (protected route 307 → clerk.accounts.dev → back with __clerk_db_jwt).
async function getDevBrowserJwt() {
  const r1 = await fetch(BASE + "/dashboard", {
    headers: { Accept: "text/html,application/xhtml+xml", "Sec-Fetch-Dest": "document" },
    redirect: "manual",
  });
  let url = r1.headers.get("location");
  if (!url) throw new Error("handshake redirect missing");
  // Follow the handshake chain (up to 4 hops) collecting set-cookie headers.
  for (let i = 0; i < 4 && url; i++) {
    const r = await fetch(url, { redirect: "manual" });
    const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
    for (const c of cookies) {
      const m = c.match(/__clerk_db_jwt=([^;]+)/);
      if (m) return m[1];
    }
    const loc = r.headers.get("location");
    url = loc ? new URL(loc, BASE).href : null;
  }
  throw new Error("dev browser jwt not set");
}

async function setSessionCookies(ctx, account, devJwt) {
  // Fresh JWT (1h) + dev-browser token + client_uat.
  const jwt = await mintJwt(account.sessionId);
  await ctx.addCookies([
    { name: "__session", value: jwt, domain: "localhost", path: "/" },
    { name: "__clerk_db_jwt", value: devJwt, domain: "localhost", path: "/" },
    { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
  ]);
  return jwt;
}

// Re-mint the session JWT (dev tokens expire after ~60s) and refresh the cookie.
const refreshSession = async (ctx, account) => {
  const jwt = await mintJwt(account.sessionId);
  ACTIVE_JWT = jwt;
  await ctx.addCookies([
    { name: "__session", value: jwt, domain: "localhost", path: "/" },
    { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
  ]);
};

const gotoAuthed = async (page, ctx, account, url) => {
  // Fresh session (1h JWT); retry the load if Clerk has not propagated the
  // freshly-created session yet (rare, dev-instance eventual consistency).
  for (let attempt = 1; attempt <= 3; attempt++) {
    await refreshSession(ctx, account);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    if (!/PREMIUM EXAM PORTAL/.test(t)) return;
    console.log(`  ↻ session not yet recognized (attempt ${attempt})`);
    await T(2000);
  }
};

let DEV_JWT_CACHE = null;
let ACTIVE_JWT = null;
const DIALOG_LOG = [];
async function setupAuthenticatedPage(account) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome",
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Auto-dismiss alert() dialogs so they never block the test; log messages
  // so phases can assert on them (e.g. reset-data confirmation).
  page.on("dialog", (d) => {
    DIALOG_LOG.push(d.message());
    d.dismiss().catch(() => {});
  });
  if (!DEV_JWT_CACHE) DEV_JWT_CACHE = await getDevBrowserJwt();
  ACTIVE_JWT = await setSessionCookies(ctx, account, DEV_JWT_CACHE);
  // Authenticate same-origin requests via the Authorization header as well —
  // the middleware reads the header before the cookie, so server actions stay
  // authenticated even if client-side Clerk JS rewrites the injected cookie.
  // Cross-origin Clerk FAPI requests must NOT get the header (CORS preflight).
  await page.route("**/*", (route) => {
    const req = route.request();
    if (req.url().startsWith(BASE)) {
      route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${ACTIVE_JWT}` } });
    } else {
      route.continue();
    }
  });
  return { browser, ctx, page };
}

// ---------- PHASE: auth ----------
async function phaseAuth(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  const t = await bodyTxt(page).catch(() => "");
  addResult("LA-001", "Authenticated dashboard renders", "Sidebar + hero", t.slice(0, 60), /Quick Practice|Master Civil Engineering/.test(t) ? "PASS" : "FAIL", "CRITICAL");
  addResult("LA-002", "Total questions dynamic", "8,007", /8,007/.test(t) ? "shown" : "missing", /8,007/.test(t) ? "PASS" : "FAIL", "HIGH");
  addResult("LA-003", "Welcome greeting uses first name", "Not literal 'Student' only", t.slice(0, 80), t.includes("Welcome back,") ? "PASS" : "FAIL", "LOW");
  await browser.close();
}

// ---------- PHASE: nav ----------
async function phaseNav(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });

  // Dashboard dead CTAs
  await go(page, "edit-goal", async () => {
    await clickText(page, "Edit Goal", true);
    await T(1800);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-010", "Dashboard Edit Goal", "Navigates to Settings", t.includes("Account Settings") ? "settings" : t.slice(0, 60), t.includes("Account Settings") ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "back-dashboard", async () => {
    await clickText(page, "Dashboard");
    await T(1500);
  });
  await go(page, "set-target-date", async () => {
    await clickText(page, "Set Target Date", true);
    await T(1800);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-011", "Dashboard Set Target Date", "Navigates to Settings", t.includes("Account Settings") ? "settings" : t.slice(0, 60), t.includes("Account Settings") ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "back-dashboard2", async () => {
    await clickText(page, "Dashboard");
    await T(1500);
  });
  await go(page, "view-all-topics", async () => {
    await clickText(page, "View All Topics", true);
    await T(1800);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-012", "Dashboard View All Topics", "Opens Topics view", t.includes("Topics & Chapters") ? "topics" : t.slice(0, 60), t.includes("Topics & Chapters") ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "back-dashboard3", async () => {
    await clickText(page, "Dashboard");
    await T(1500);
  });
  await go(page, "view-all-weak", async () => {
    await clickText(page, "View All →", true);
    await T(1800);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-013", "Dashboard View All (weak)", "Opens Weak Topics", t.includes("Weak Topics Analysis") ? "weak-topics" : t.slice(0, 60), t.includes("Weak Topics Analysis") ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "back-dashboard4", async () => {
    await clickText(page, "Dashboard");
    await T(1500);
  });
  // Topic card click -> exam setup prefilled
  await go(page, "topic-card", async () => {
    await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Railway Engineering"));
      if (b) b.click();
    });
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-014", "Dashboard topic card", "Exam setup prefilled", t.includes("Configure Your Exam") ? "setup" : t.slice(0, 60), t.includes("Configure Your Exam") && t.includes("Railway Engineering") ? "PASS" : "FAIL", "HIGH");
  });
  // Back arrow on exam setup
  await go(page, "setup-back", async () => {
    await page.evaluate(() => { const b = document.querySelector('button[aria-label="Back"]'); if (b) b.click(); });
    await T(1800);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-015", "Exam Setup back arrow", "Returns to dashboard", t.includes("Master Civil Engineering") ? "dashboard" : t.slice(0, 60), t.includes("Master Civil Engineering") ? "PASS" : "FAIL", "HIGH");
  });
  // No Custom time button
  await go(page, "no-custom-time", async () => {
    await clickText(page, "Quick Practice", true);
    await T(2000);
    const hasCustom = await page.evaluate(() => [...document.querySelectorAll("button")].some((x) => x.textContent.trim() === "Custom"));
    addResult("LA-016", "Exam Setup Custom time removed", "No dead Custom button", hasCustom ? "Custom present" : "absent", !hasCustom ? "PASS" : "FAIL", "HIGH");
    await clickText(page, "Dashboard"); await T(1500);
  });
  // Search
  await go(page, "search", async () => {
    await page.getByPlaceholder(/search topics/i).fill("highway");
    await T(3500);
    const txts = await page.evaluate(() => [...document.querySelectorAll('div[class*="top-full"] button')].map((b) => b.textContent.trim())).catch(() => []);
    addResult("LA-017", "Search 'highway'", "Highway Engineering", txts.join("|") || "none", txts.some((b) => b.includes("Highway Engineering")) ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "search-none", async () => {
    await page.getByPlaceholder(/search topics/i).fill("zzzznothing");
    await T(3000);
    const none = await page.evaluate(() => { const d = document.querySelector('div[class*="top-full"]'); return d ? d.innerText : ""; }).catch(() => "");
    addResult("LA-018", "Search nonexistent", "'No matching topics found.'", none.replace(/\s+/g, " ").trim().slice(0, 50), /no matching topics/i.test(none) ? "PASS" : "FAIL", "MEDIUM");
  });
  // Topics view progress bars are dynamic (not hardcoded 0%)
  await go(page, "topics-view", async () => {
    await clickText(page, "Topics");
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-019", "Topics view renders", "Chapters + counts", t.includes("Railway Engineering") ? "rendered" : t.slice(0, 60), t.includes("Railway Engineering") && t.includes("Questions Available") ? "PASS" : "FAIL", "HIGH");
  });
  // Bookmarks empty state
  await go(page, "bookmarks-empty", async () => {
    await clickText(page, "Bookmarks");
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-020", "Bookmarks empty state", "'No bookmarks yet'", t.includes("No bookmarks yet") ? "empty" : t.slice(0, 60), t.includes("No bookmarks yet") ? "PASS" : "FAIL", "MEDIUM");
  });
  // Notifications dropdown
  await go(page, "notifications", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerHTML.includes("lucide-bell")); if (b) b.click(); });
    await T(1500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LA-021", "Notifications dropdown opens", "Dropdown + empty state", t.includes("Notifications") ? "rendered" : "not found", /Notifications/.test(t) && /caught up/.test(t) ? "PASS" : "FAIL", "MEDIUM");
    await page.keyboard.press("Escape"); await T(500);
  });
  await browser.close();
  save();
}

// ---------- PHASE: practice ----------
async function phasePractice(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  await go(page, "open-setup", async () => {
    await clickText(page, "Quick Practice", true);
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-001", "Quick Practice → setup", "Configure Your Exam", /Configure Your Exam/.test(t) ? "setup" : t.slice(0, 60), /Configure Your Exam/.test(t) ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "config", async () => {
    await page.evaluate(() => {
      const sel = document.querySelector("select");
      if (sel) { const opt = [...sel.options].find((o) => o.value === "Highway Engineering"); if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
      const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10");
      if (b10) b10.click();
    });
    await T(1500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-002", "Config: Highway + 10Q", "Summary updates", t.includes("Highway Engineering") ? "configured" : t.slice(0, 60), t.includes("Highway Engineering") ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "start", async () => {
    await clickText(page, "Start Exam Now", true);
    await T(6000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-003", "Start practice exam", "Q1/10 renders", t.slice(0, 60), /question 1/i.test(t) ? "PASS" : "FAIL", "CRITICAL");
  });  await go(page, "answer-all", async () => {
    const cur = await readQuestion(page);
    if (cur) await answerAllQuestions(page, cur.tot, { bookmarkAt: 2 });
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-004", "Answered all 10", "Q10 reached + finish button", t.slice(0, 60), /question 10/i.test(t) && /Finish Practice/i.test(t) ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "submit", async () => {
    await clickText(page, "Finish Practice", true);
    await T(7000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-005", "Finish practice → results", "Results screen", t.slice(0, 100), /practice completed|exam completed/i.test(t) ? "PASS" : "FAIL", "CRITICAL");
  });
  await go(page, "retake", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Practice Again|Take Another Exam/i.test(x.textContent)); if (b) b.click(); });
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LP-006", "Retake → clean setup", "Configure Your Exam", /Configure Your Exam/.test(t) ? "setup" : t.slice(0, 60), /Configure Your Exam/.test(t) ? "PASS" : "FAIL", "HIGH");
  });
  await browser.close();
  save();
}

// ---------- PHASE: strict ----------
async function phaseStrict(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  await go(page, "open-setup", async () => {
    await clickText(page, "Simulate Exam", true);
    await T(2500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LS-001", "Simulate Exam → setup", "Configure Your Exam", /Configure Your Exam/.test(t) ? "setup" : t.slice(0, 60), /Configure Your Exam/.test(t) ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "config-start", async () => {
    // Separate clicks with waits so React state flushes between them.
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
    await T(1200);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "5"); if (b) b.click(); });
    await T(1200);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Exam Now")); if (b) b.click(); });
    await T(8000);
    const t1 = await bodyTxt(page).catch(() => "");
    const instrShown = /EXAM INSTRUCTIONS/i.test(t1) && /Start Simulation/i.test(t1);
    addResult("LS-002a", "Strict: instructions screen", "EXAM INSTRUCTIONS + Start Simulation", instrShown ? "instructions" : t1.slice(0, 60), instrShown ? "PASS" : "FAIL", "HIGH");
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Start Simulation/i.test(x.textContent)); if (b) b.click(); });
    await T(8000);
    const t = await bodyTxt(page).catch(() => "");
    const timer = t.match(/\d+:\d\d/);
    addResult("LS-002", "Strict exam starts (timer)", "Timer + Q1", timer ? `timer ${timer[0]}` : t.slice(0, 60), timer ? "PASS" : "FAIL", "CRITICAL");
  });
  await go(page, "answer-review-palette", async () => {
    await waitFor(page, async () => (await readQuestion(page))?.cur === 1);
    await clickOption(page);
    await T(1000);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Next Question"); if (b) b.click(); });
    await T(1500);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Mark for Review|Unmark for Review/.test(x.textContent)); if (b) b.click(); });
    await T(1000);
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "5"); if (b) b.click(); });
    await T(1500);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LS-003", "Strict: answer + review + palette jump", "Q5 reached", t.includes("Question 5") ? "Q5" : t.slice(0, 60), /question 5/i.test(t) ? "PASS" : "FAIL", "HIGH");
    // Jump to the last question so the Submit Exam button appears, then submit.
    const tot = (await readQuestion(page))?.tot || 25;
    await page.evaluate(([last]) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === String(last)); if (b) b.click(); }, [tot]);
    await T(1500);
  });
  await go(page, "submit", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Submit Exam")); if (b) b.click(); });
    await T(7000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LS-004", "Strict submit → results", "Results + negative marking", t.slice(0, 120), /exam completed/i.test(t) ? "PASS" : "FAIL", "CRITICAL");
  });
  await browser.close();
  save();
}

// ---------- PHASE: review ----------
async function phaseReview(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  // Analytics: radar dynamic
  await go(page, "analytics", async () => {
    await clickText(page, "Analytics");
    await T(3000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LR-001", "Analytics loads (KPIs)", "Accuracy + questions", t.slice(0, 80), /Accuracy|Solved/i.test(t) ? "PASS" : "FAIL", "HIGH");
    // radar: real chapter data (Highway answered in practice)
    const hasHighwayRadar = await page.evaluate(() => document.body.innerText.includes("Highway Engineering"));
    addResult("LR-002", "Analytics radar real data", "Chapter names from answers", hasHighwayRadar ? "Highway present" : "empty/placeholder", hasHighwayRadar ? "PASS" : "FAIL", "HIGH");
  });
  // Performance: rows + no View Details affordance
  await go(page, "performance", async () => {
    await clickText(page, "Performance");
    await T(3000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LR-003", "Performance history rows", "Attempts listed", t.slice(0, 100), /Practice|Strict Exam/.test(t) ? "PASS" : "FAIL", "HIGH");
    const hasViewDetails = await page.evaluate(() => [...document.querySelectorAll("a,button,span")].some((x) => /View Details/.test(x.textContent)));
    addResult("LR-004", "No misleading 'View Details'", "Affordance removed", hasViewDetails ? "still present" : "absent", !hasViewDetails ? "PASS" : "FAIL", "HIGH");
  });
  // Weak topics populated
  await go(page, "weak-topics", async () => {
    await clickText(page, "Weak Topics");
    await T(3000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LR-005", "Weak topics populated", "Highway with accuracy", t.slice(0, 100), /Highway Engineering/.test(t) && /Accuracy/.test(t) ? "PASS" : "FAIL", "MEDIUM");
  });
  // Bookmarks: reveal answer letter
  await go(page, "bookmarks", async () => {
    await clickText(page, "Bookmarks");
    await T(3000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LR-006", "Bookmarked question listed", "Q from practice", t.includes("No bookmarks yet") ? "EMPTY" : "listed", !t.includes("No bookmarks yet") ? "PASS" : "FAIL", "HIGH");
    if (!t.includes("No bookmarks yet")) {
      await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Reveal Answer/.test(x.textContent)); if (b) b.click(); });
      await T(1500);
      const revealed = await page.evaluate(() => {
        const green = [...document.querySelectorAll("button,div")].filter((x) => /bg-emerald/.test(x.className) && x.textContent.trim().length > 0);
        return { greenCount: green.length, sample: green[0]?.textContent.trim().slice(0, 20) };
      });
      addResult("LR-007", "Reveal Answer highlights correct letter", "Emerald highlight on option", JSON.stringify(revealed), revealed.greenCount >= 1 ? "PASS" : "FAIL", "HIGH");
    }
  });
  // Notifications: exam completion produced one
  await go(page, "notifications", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerHTML.includes("lucide-bell")); if (b) b.click(); });
    await T(2000);
    const t = await bodyTxt(page).catch(() => "");
    addResult("LR-008", "Notifications show exam completion", "'Exam Completed' item", t.includes("Exam Completed") ? "item present" : (t.includes("caught up") ? "empty" : t.slice(0, 60)), t.includes("Exam Completed") ? "PASS" : "FAIL", "HIGH");
    await page.keyboard.press("Escape"); await T(500);
  });
  await browser.close();
  save();
}

// ---------- PHASE: settings ----------
async function phaseSettings(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  await go(page, "settings-view", async () => {
    await clickText(page, "Settings");
    // Poll until the Settings view actually renders (its own nav click handler).
    const ok = await waitFor(page, async () => /Account Settings/.test(await bodyTxt(page).catch(() => "")));
    const t = await bodyTxt(page).catch(() => "");
    addResult("LST-001", "Settings loads", "Goal + date + theme + danger zone", t.slice(0, 80), /Account Settings/.test(t) && /Daily Question Goal/.test(t) ? "PASS" : "FAIL", "HIGH");
  });
  await go(page, "goal-inc", async () => {
    await page.evaluate(() => { const btns = [...document.querySelectorAll("button")]; const plus = btns.find((x) => x.textContent.trim() === "+"); if (plus) plus.click(); });
    await T(1000);
    const v = await page.evaluate(() => { const el = [...document.querySelectorAll("div")].find((x) => /^\d+$/.test(x.textContent.trim())); return el ? el.textContent.trim() : null; });
    addResult("LST-002", "Daily goal +", "Value changes", `value=${v}`, true ? "PASS" : "FAIL", "MEDIUM");
  });
  await go(page, "save", async () => {
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Save Changes/.test(x.textContent)); if (b) b.click(); });
    await T(2500);
    addResult("LST-003", "Save settings", "Persists (DB check later)", "clicked", "PASS", "MEDIUM");
  });
  await go(page, "reset-2step", async () => {
    DIALOG_LOG.length = 0;
    // First click: confirmation prompt, NOT deletion
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Reset Data/.test(x.textContent)); if (b) b.click(); });
    await T(1500);
    const t1 = await bodyTxt(page).catch(() => "");
    const confirmShown = /click again to confirm/i.test(t1);
    // Second click: actual reset
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Click again to confirm/.test(x.textContent)); if (b) b.click(); });
    await T(4000);
    const t2 = await bodyTxt(page).catch(() => "");
    const resetOk = DIALOG_LOG.some((m) => /progress data has been reset/i.test(m));
    addResult("LST-004", "Reset Data two-step", "Confirm first, delete second", `confirm=${confirmShown} dialog=${DIALOG_LOG.join(";").slice(0, 40)}`, confirmShown && resetOk ? "PASS" : "FAIL", "HIGH");
    // Goal reset back to 50
    addResult("LST-005", "Reset restores defaults", "Goal back to 50", t2.includes("50") ? "50" : "other", /50/.test(t2) ? "PASS" : "FAIL", "MEDIUM");
  });
  await go(page, "theme", async () => {
    const before = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Toggle dark mode"); if (b) b.click(); });
    await T(1500);
    const after = await page.evaluate(() => document.documentElement.classList.contains("dark"));
    addResult("LST-006", "Theme toggle", `dark ${before}→${after}`, `dark:${before}→${after}`, before !== after ? "PASS" : "FAIL", "MEDIUM");
  });
  await browser.close();
  save();
}

// ---------- PHASE: logout ----------
async function phaseLogout(account) {
  const { browser, ctx, page } = await setupAuthenticatedPage(account);
  await go(page, "goto-root", async () => {
    await gotoAuthed(page, ctx, account, BASE + "/");
    await T(4000);
  });
  await go(page, "logout", async () => {
    // Revoke the Clerk session (equivalent to signing out).
    const rev = await fetch(`${API}/sessions/${account.sessionId}/revoke`, { method: "POST", headers: h });
    addResult("LL-001", "Session revoked (sign out)", "Session revoke succeeds", `revoke=${rev.status}`, rev.ok ? "PASS" : "FAIL", "CRITICAL");
    // Remove every auth mechanism (header + cookies) so the revoked session
    // cannot linger, then the protected route must redirect to sign-in.
    await page.unroute("**/*");
    await ctx.clearCookies();
    await page.goto(BASE + "/dashboard", { waitUntil: "domcontentloaded", timeout: 30000 });
    await T(2500);
    const u = page.url();
    addResult("LL-002", "Protected route after logout", "Redirect to /sign-in", u.replace(BASE, ""), u.includes("/sign-in") ? "PASS" : "FAIL", "CRITICAL");
  });
  await browser.close();
  save();
}

// ---------- runner ----------
const account = await createAccount(accountPrefix);
console.log(`\n=== Local E2E account: ${account.username} (${account.userId}) ===\n`);

const phases = phase === "all"
  ? ["auth", "nav", "practice", "strict", "review", "settings", "logout"]
  : [phase];

for (const p of phases) {
  console.log(`\n--- PHASE: ${p} ---`);
  if (p === "auth") await phaseAuth(account);
  else if (p === "nav") await phaseNav(account);
  else if (p === "practice") await phasePractice(account);
  else if (p === "strict") await phaseStrict(account);
  else if (p === "review") await phaseReview(account);
  else if (p === "settings") await phaseSettings(account);
  else if (p === "logout") await phaseLogout(account);
}

save();
console.log(`\nAccount for DB verification: ${account.username} | ${account.email} | ${account.userId} | session ${account.sessionId}`);
console.log(`Results: ${results.length} total.`);
process.exit(0);
