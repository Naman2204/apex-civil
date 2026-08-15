import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
const readQuestion = (page) => page.evaluate(() => {
  const m = document.body.innerText.match(/Question\s+(\d+)\s*\/\s*(\d+)/i);
  return m ? { cur: +m[1], tot: +m[2] } : null;
});
const waitFor = async (page, cond, ms = 12000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await cond()) return true; await T(350); }
  return false;
};
const clickUntil = async (page, label, partial, expect, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    await page.evaluate(([l, p]) => { const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l); if (el) el.click(); }, [label, partial]);
    const ok = await waitFor(page, async () => expect.test(await bodyTxt(page).catch(() => "")));
    if (ok) return true;
    await T(700);
  }
  return false;
};
const clickOption = (page) => page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => !x.disabled && /^Option A:/.test(x.getAttribute("aria-label") || ""));
  if (b) { b.click(); return true; }
  return false;
});

// Reuse an existing QA test account (do not create new accounts).
const users = await (await fetch(`${API}/users?limit=100`, { headers: h })).json();
if (!Array.isArray(users) || users.length === 0) throw new Error("no Clerk users found to reuse");
const u = users
  .filter((x) => /^(axeaudit|localqa)_/.test(x.username || ""))
  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
if (!u) throw new Error("no existing axeaudit/localqa account to reuse");
const s = await (await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: u.id }) })).json();
const t = await (await fetch(`${API}/sessions/${s.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = t.jwt;
const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
let url = r1.headers.get("location");
let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const results = [];
const add = (screen, violations) => {
  results.push({ screen, violations: violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, sample: v.nodes.slice(0, 2).map((n) => n.target.join(" ")) })) });
  if (violations.length === 0) console.log(`✅ ${screen}: 0 violations`);
  else for (const v of violations) console.log(`❌ ${screen}: [${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} nodes)`);
};

async function session(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, colorScheme: "dark" });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.dismiss().catch(() => {}));
  await ctx.addCookies([
    { name: "__session", value: jwt, domain: "localhost", path: "/" },
    { name: "__clerk_db_jwt", value: devJwt, domain: "localhost", path: "/" },
    { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
  ]);
  await page.route("**/*", (route) => {
    const req = route.request();
    if (req.url().startsWith(BASE)) route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${jwt}` } });
    else route.continue();
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => "")));
  await T(2200);
  return { ctx, page };
}
const scan = async (page, screen) => {
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
  add(screen, res.violations);
  return res.violations;
};

// Desktop 1440
{
  const { ctx, page } = await session(1440, 900);
  await clickUntil(page, "Quick Practice", true, /configure your exam/i);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); });
  await T(400);
  await clickUntil(page, "Start Exam Now", true, /question 1\s*\//i);
  await T(800);
  await scan(page, "practice-q1-1440");
  await clickOption(page);
  await T(1200);
  await scan(page, "practice-feedback-1440");
  // finish 10
  for (let target = 2; target <= 10; target++) {
    await waitFor(page, async () => (await readQuestion(page).catch(() => null))?.cur === target);
    await clickOption(page);
    await T(600);
    if (target < 10) await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
  }
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Finish Practice")); if (b) b.click(); });
  await waitFor(page, async () => /practice completed|exam completed/i.test(await bodyTxt(page).catch(() => "")));
  await T(1500);
  await scan(page, "practice-results-1440");
  // exam instructions + exam
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => /Practice Again|Take Another Exam/.test(x.textContent)); if (b) b.click(); });
  await waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => "")));
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
  await T(700);
  await clickUntil(page, "Start Exam Now", true, /exam instructions/i);
  await T(800);
  await scan(page, "exam-instructions-1440");
  await clickUntil(page, "Start Simulation", true, /question 1\s*\//i);
  await T(1500);
  await scan(page, "exam-q1-1440");
  await ctx.close();
}

// Mobile 375 drawer
{
  const { ctx, page } = await session(375, 812);
  await clickUntil(page, "Quick Practice", true, /configure your exam/i);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
  await T(700);
  await clickUntil(page, "Start Exam Now", true, /exam instructions/i);
  await clickUntil(page, "Start Simulation", true, /question 1\s*\//i);
  await T(1200);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "Questions"); if (b) b.click(); });
  await T(900);
  await scan(page, "exam-palette-drawer-375");
  await ctx.close();
}

await browser.close();
const total = results.reduce((n, r) => n + r.violations.length, 0);
fs.writeFileSync(path.resolve("scripts/qa-axe-results.json"), JSON.stringify(results, null, 2));
console.log(`\nAXE: ${results.length} screens scanned, ${total} violations total`);
process.exit(total ? 1 : 0);
