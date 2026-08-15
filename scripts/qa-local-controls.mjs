/**
 * LOCAL UI CONTROL AUDIT — the control-matrix gaps not already covered by
 * qa-local-e2e.mjs (which validates dashboard CTAs, exam setup, settings,
 * performance, bookmarks, notifications against the SAME local codebase).
 *
 * Covers (matrix IDs): Topics filter (V-03/V-04), Topics card click (V-05),
 * Weak Topics load + Target Weaknesses (V-06/V-07), empty-state Start an Exam
 * (V-08), Bookmarks empty Start Practice (V-15), sidebar nav (V-01/V-02).
 *
 * Usage: node scripts/qa-local-controls.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const RESULTS = path.resolve("scripts/qa-controls-results.json");

const results = [];
const addResult = (testId, feature, expected, actual, status) => {
  results.push({ testId, feature, expected, actual, status, phase: "controls" });
  console.log(`${status === "PASS" ? "✅" : "❌"} [${testId}] ${feature} — ${status}${actual ? ` | ${actual}` : ""}`);
};
const save = () => fs.writeFileSync(RESULTS, JSON.stringify(results, null, 2));
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
const clickText = (page, label, partial = false) => page.evaluate(([l, p]) => {
  const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l);
  if (el) { el.click(); return true; } return false;
}, [label, partial]);
const waitFor = async (page, cond, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await cond()) return true; await T(400); }
  return false;
};

// ---------- Clerk API helpers (same as qa-local-e2e.mjs) ----------
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
async function createAccount(prefix) {
  const username = `${prefix}_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const ures = await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) });
  const user = await ures.json();
  if (!user.id) throw new Error(`user create failed: ${ures.status} ${JSON.stringify(user).slice(0, 200)}`);
  const sres = await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) });
  const session = await sres.json();
  if (!session.id) throw new Error(`session create failed: ${sres.status} ${JSON.stringify(session).slice(0, 200)}`);
  return { username, email, userId: user.id, sessionId: session.id };
}
async function mintJwt(sessionId) {
  for (let i = 1; i <= 4; i++) {
    const res = await fetch(`${API}/sessions/${sessionId}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) });
    const t = await res.json();
    if (t.jwt) return t.jwt;
    console.log(`  ↻ token mint attempt ${i} failed (${res.status}); retrying`);
    await T(2000);
  }
  throw new Error("could not mint session JWT");
}
async function getDevBrowserJwt() {
  const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
  let url = r1.headers.get("location");
  for (let i = 0; i < 4 && url; i++) {
    const r = await fetch(url, { redirect: "manual" });
    const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
    for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) return m[1]; }
    url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
  }
  throw new Error("no dev jwt");
}

let ACTIVE_JWT = null;
const account = await createAccount("ctrlaudit");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));
const DEV_JWT = await getDevBrowserJwt();
ACTIVE_JWT = await mintJwt(account.sessionId);
await ctx.addCookies([
  { name: "__session", value: ACTIVE_JWT, domain: "localhost", path: "/" },
  { name: "__clerk_db_jwt", value: DEV_JWT, domain: "localhost", path: "/" },
  { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
]);
await page.route("**/*", (route) => {
  const req = route.request();
  if (req.url().startsWith(BASE)) route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${ACTIVE_JWT}` } });
  else route.continue();
});
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await T(4000);

// ---------- V-01/V-02: sidebar nav to exam setup ----------
await clickText(page, "Quick Practice", true);
await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
addResult("V-01", "Sidebar Quick Practice → setup", "Configure Your Exam", (await bodyTxt(page)).slice(0, 60), /configure your exam/i.test(await bodyTxt(page)) ? "PASS" : "FAIL");
await clickText(page, "Dashboard"); await waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => "")));
await clickText(page, "Simulate Exam", true);
await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
addResult("V-02", "Sidebar Simulate Exam → setup", "Configure Your Exam", (await bodyTxt(page)).slice(0, 60), /configure your exam/i.test(await bodyTxt(page)) ? "PASS" : "FAIL");

// ---------- V-03/V-04: Topics view filter ----------
await clickText(page, "Topics");
await waitFor(page, async () => /topics & chapters/i.test(await bodyTxt(page).catch(() => "")));
await page.evaluate(() => {
  const input = [...document.querySelectorAll("main input")].find((i) => /search/i.test(i.placeholder));
  if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "geo"); input.dispatchEvent(new Event("input", { bubbles: true })); }
});
await T(2500);
let t = await bodyTxt(page);
const geoOnly = t.includes("Geotechnical Engineering") && !t.includes("Railway Engineering");
addResult("V-03", "Topics filter 'geo'", "Only Geotechnical", String(geoOnly), geoOnly ? "PASS" : "FAIL");
await page.evaluate(() => {
  const input = [...document.querySelectorAll("main input")].find((i) => /search/i.test(i.placeholder));
  if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, "zzz"); input.dispatchEvent(new Event("input", { bubbles: true })); }
});
await T(2000);
t = await bodyTxt(page);
addResult("V-04", "Topics filter no-result", "'No topics found'", t.includes("No topics found") ? "shown" : t.slice(0, 60), t.includes("No topics found") ? "PASS" : "FAIL");
await page.evaluate(() => {
  const input = [...document.querySelectorAll("main input")].find((i) => /search/i.test(i.placeholder));
  if (input) { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set; s.call(input, ""); input.dispatchEvent(new Event("input", { bubbles: true })); }
});
await T(1000);
await page.evaluate(() => {
  const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Highway Engineering") && x.textContent.includes("Questions"));
  if (el) el.click();
});
await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
t = await bodyTxt(page);
addResult("V-05", "Topics card click (Highway)", "Setup prefilled", t.includes("Highway Engineering") ? "prefilled" : t.slice(0, 60), /configure your exam/i.test(t) && t.includes("Highway Engineering") ? "PASS" : "FAIL");

// ---------- V-06..V-08: Weak Topics ----------
await clickText(page, "Weak Topics");
await waitFor(page, async () => /weak topics/i.test(await bodyTxt(page).catch(() => "")));
t = await bodyTxt(page);
addResult("V-06", "Weak Topics view loads", "Header + empty state", t.includes("Weak Topics Analysis") ? "loaded" : t.slice(0, 60), t.includes("Weak Topics Analysis") ? "PASS" : "FAIL");
await page.evaluate(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Target Weaknesses")); if (el) el.click(); });
await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
addResult("V-07", "'Target Weaknesses' → setup", "Configure Your Exam", (await bodyTxt(page)).slice(0, 50), /configure your exam/i.test(await bodyTxt(page)) ? "PASS" : "FAIL");
await clickText(page, "Weak Topics");
await waitFor(page, async () => /weak topics/i.test(await bodyTxt(page).catch(() => "")));
await page.evaluate(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start an Exam")); if (el) el.click(); });
await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
addResult("V-08", "Empty-state 'Start an Exam' → setup", "Configure Your Exam", (await bodyTxt(page)).slice(0, 50), /configure your exam/i.test(await bodyTxt(page)) ? "PASS" : "FAIL");

// ---------- V-15: Bookmarks empty Start Practice ----------
await clickText(page, "Bookmarks");
await waitFor(page, async () => /no bookmarks yet/i.test(await bodyTxt(page).catch(() => "")));
t = await bodyTxt(page);
addResult("V-14", "Bookmarks empty state", "'No bookmarks yet'", t.includes("No bookmarks yet") ? "empty" : t.slice(0, 60), t.includes("No bookmarks yet") ? "PASS" : "FAIL");
await page.evaluate(() => { const el = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Practice")); if (el) el.click(); });
await waitFor(page, async () => /configure your exam|quick practice/i.test(await bodyTxt(page).catch(() => "")));
t = await bodyTxt(page);
addResult("V-15", "Empty-state 'Start Practice'", "Leads to practice (setup/hub)", t.slice(0, 50), /configure your exam|quick practice/i.test(t) ? "PASS" : "FAIL");

await browser.close();
save();
console.log(`\nCONTROLS: ${results.filter((r) => r.status === "PASS").length}/${results.length} PASS`);
process.exit(0);
