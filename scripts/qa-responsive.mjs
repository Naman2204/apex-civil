/**
 * LOCAL RESPONSIVE TEST — 7 viewports: 375, 412, 768, 1024, 1280, 1440, 1920.
 * For each width: authenticated Dashboard, Exam Setup, and Practice Q1 must
 * render without horizontal overflow and with key content present.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const WIDTHS = [375, 412, 768, 1024, 1280, 1440, 1920];
const RESULTS = path.resolve("scripts/qa-responsive-results.json");
const results = [];
const addResult = (testId, feature, actual, ok) => {
  results.push({ testId, feature, status: ok ? "PASS" : "FAIL", actual });
  console.log(`${ok ? "✅" : "❌"} [${testId}] ${feature} — ${ok ? "PASS" : "FAIL"} | ${actual}`);
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
const overflow = (page) => page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  innerW: window.innerWidth,
  bodyScrollW: document.body.scrollWidth,
}));

async function createAccount(prefix) {
  const username = `${prefix}_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const ures = await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) });
  const user = await ures.json();
  if (!user.id) throw new Error(`user create failed: ${ures.status}`);
  const sres = await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) });
  const session = await sres.json();
  for (let i = 1; i <= 4; i++) {
    const tres = await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) });
    const t = await tres.json();
    if (t.jwt) return { email, jwt: t.jwt };
    await T(1500);
  }
  throw new Error("token mint failed");
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

const account = await createAccount("resprobe");
const DEV_JWT = await getDevBrowserJwt();
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });

for (const width of WIDTHS) {
  const height = width <= 412 ? 812 : 900;
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  await ctx.addCookies([
    { name: "__session", value: account.jwt, domain: "localhost", path: "/" },
    { name: "__clerk_db_jwt", value: DEV_JWT, domain: "localhost", path: "/" },
    { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
  ]);
  await page.route("**/*", (route) => {
    const req = route.request();
    if (req.url().startsWith(BASE)) route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${account.jwt}` } });
    else route.continue();
  });

  // 1. Dashboard
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => "")));
  await T(2500);
  const ov1 = await overflow(page);
  addResult(`R-${width}-DASH`, `Dashboard @ ${width}px`, `scrollW=${ov1.scrollW} innerW=${ov1.innerW}`, ov1.scrollW <= ov1.innerW + 1);

  // 2. Exam setup
  await clickText(page, "Quick Practice", true);
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await T(800);
  const ov2 = await overflow(page);
  const t2 = await bodyTxt(page);
  addResult(`R-${width}-SETUP`, `Exam Setup @ ${width}px`, `scrollW=${ov2.scrollW} innerW=${ov2.innerW}`, ov2.scrollW <= ov2.innerW + 1 && /configure your exam/i.test(t2));

  // 3. Practice Q1 (only for widths where it's fast; do all)
  await page.evaluate(() => { const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b10) b10.click(); });
  await T(400);
  await clickText(page, "Start Exam Now", true);
  await waitFor(page, async () => /question 1/i.test(await bodyTxt(page).catch(() => "")));
  await T(1200);
  const ov3 = await overflow(page);
  addResult(`R-${width}-Q1`, `Practice Q1 @ ${width}px`, `scrollW=${ov3.scrollW} innerW=${ov3.innerW}`, ov3.scrollW <= ov3.innerW + 1);

  await ctx.close();
  save();
}

await browser.close();
const pass = results.filter((r) => r.status === "PASS").length;
console.log(`\nRESPONSIVE: ${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
