/**
 * LOCAL UI CAPTURE — Quick Practice (G) and Simulate Exam (H) views for visual
 * review against the approved reference. Desktop (1440) + mobile (375).
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const OUT = path.resolve("scripts/qa-evidence-local");
fs.mkdirSync(OUT, { recursive: true });
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
    if (t.jwt) return { email, userId: user.id, jwt: t.jwt };
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

const account = await createAccount("guhaudit");
const DEV_JWT = await getDevBrowserJwt();
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });

async function authedPage(width, height) {
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
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await T(4000);
  return { ctx, page };
}

const shot = async (page, name) => {
  await page.screenshot({ path: path.join(OUT, name), timeout: 20000, animations: "disabled" });
  console.log("captured", name);
};

// ---------- G: Quick Practice ----------
{
  const { ctx, page } = await authedPage(1440, 900);
  await clickText(page, "Quick Practice", true);
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await T(1000);
  await shot(page, "g-practice-setup-1440.png");
  // Select Highway + 10 questions, then start → Q1
  await page.evaluate(() => {
    const sel = document.querySelector("select");
    if (sel) { const opt = [...sel.options].find((o) => o.value === "Highway Engineering"); if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
    const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10");
    if (b10) b10.click();
  });
  await T(1200);
  await shot(page, "g-practice-setup-configured-1440.png");
  await clickText(page, "Start Exam Now", true);
  await waitFor(page, async () => /question 1/i.test(await bodyTxt(page).catch(() => "")));
  await T(1500);
  await shot(page, "g-practice-q1-1440.png");
  await ctx.close();
}
{
  const { ctx, page } = await authedPage(375, 812);
  await clickText(page, "Quick Practice", true);
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await T(1000);
  await shot(page, "g-practice-setup-375.png");
  await ctx.close();
}

// ---------- H: Simulate Exam ----------
{
  const { ctx, page } = await authedPage(1440, 900);
  await clickText(page, "Simulate Exam", true);
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await T(1000);
  await shot(page, "h-strict-setup-1440.png");
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
  await T(1200);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "5"); if (b) b.click(); });
  await T(1200);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Exam Now")); if (b) b.click(); });
  await waitFor(page, async () => /question 1/i.test(await bodyTxt(page).catch(() => "")));
  await T(1500);
  await shot(page, "h-strict-exam-1440.png");
  await ctx.close();
}
{
  const { ctx, page } = await authedPage(375, 812);
  await clickText(page, "Simulate Exam", true);
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await T(1000);
  await shot(page, "h-strict-setup-375.png");
  await ctx.close();
}

await browser.close();
console.log("done:", fs.readdirSync(OUT).join(", "));
process.exit(0);
