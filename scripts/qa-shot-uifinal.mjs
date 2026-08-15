import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const OUT = path.resolve("scripts/qa-evidence-ui");
fs.mkdirSync(OUT, { recursive: true });
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => console.log(m);
const wt = (p, ms, label) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`[${label}] timeout ${Math.round(ms / 1000)}s`)), ms))]);
const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
const clickText = (page, label, partial = false) => page.evaluate(([l, p]) => {
  const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l);
  if (el) { el.click(); return true; } return false;
}, [label, partial]);
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
const waitFor = async (page, cond, ms = 10000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await cond()) return true; await T(350); }
  return false;
};
const clickUntil = async (page, label, partial, expect, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    await clickText(page, label, partial).catch(() => {});
    const ok = await waitFor(page, async () => expect.test(await bodyTxt(page).catch(() => "")));
    if (ok) return true;
    await T(700);
  }
  return false;
};

log("creating account…");
const username = `uishot_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const ures = await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) });
const user = await ures.json();
if (!user.id) { console.error("user create failed", ures.status, JSON.stringify(user).slice(0, 200)); process.exit(1); }
const sres = await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) });
const session = await sres.json();
const tres = await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) });
const jwt = (await tres.json()).jwt;
log("account ready");

const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
let url = r1.headers.get("location");
let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}
log("dev jwt ready");

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });

async function openSession(width, height) {
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
  await wt(page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 15000 }), 20000, "goto");
  await wt(waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => ""))), 12000, "dashboard");
  await T(2200);
  return { ctx, page };
}

// Desktop 1440: practice feedback → results; exam instructions → exam → results
log("session 1440…");
{
  const { ctx, page } = await openSession(1440, 900);
  await wt(clickUntil(page, "Quick Practice", true, /configure your exam/i), 20000, "setup");
  await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); }), 8000, "10q");
  await T(400);
  await wt(clickUntil(page, "Start Exam Now", true, /question 1\s*\//i), 20000, "start");
  await T(800);
  log("  practice Q1");
  await wt(clickOption(page), 8000, "answer");
  await T(1200);
  await wt(page.screenshot({ path: path.join(OUT, "practice-feedback-1440.png") }), 15000, "shot feedback");
  // answer the remaining 9 questions: wait → answer → click Next (inside loop)
  for (let target = 2; target <= 10; target++) {
    await wt(clickText(page, "Next Question", true), 8000, `next${target}`);
    await wt(waitFor(page, async () => (await readQuestion(page).catch(() => null))?.cur === target), 10000, `q${target}`);
    await wt(clickOption(page), 8000, `answer${target}`);
    await T(600);
  }
  await wt(clickText(page, "Finish Practice", true), 8000, "finish");
  await wt(waitFor(page, async () => /practice completed|exam completed/i.test(await bodyTxt(page).catch(() => ""))), 12000, "results");
  await T(1500);
  await wt(page.screenshot({ path: path.join(OUT, "practice-results-1440.png") }), 15000, "shot results");
  log("  practice results shot");

  await wt(clickText(page, "Practice Again", true), 8000, "retake");
  await wt(waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => ""))), 12000, "setup2");
  await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); }), 8000, "strict");
  await T(700);
  await wt(clickUntil(page, "Start Exam Now", true, /exam instructions/i), 20000, "instr");
  await T(800);
  await wt(page.screenshot({ path: path.join(OUT, "exam-instructions-1440.png") }), 15000, "shot instr");
  log("  instructions shot");
  await wt(clickUntil(page, "Start Simulation", true, /question 1\s*\//i), 20000, "sim");
  await T(1000);
  await wt(clickOption(page), 8000, "ans");
  await T(500);
  await wt(clickText(page, "Mark for Review", true), 8000, "mark");
  await T(500);
  await wt(page.screenshot({ path: path.join(OUT, "exam-q1-palette-1440.png") }), 15000, "shot exam");
  log("  exam Q1 shot");
  const tot = (await wt(readQuestion(page), 8000, "tot"))?.tot || 25;
  await wt(page.evaluate(([last]) => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === String(last)); if (b) b.click(); }, [tot]), 8000, "jump");
  await T(1500);
  await wt(waitFor(page, async () => (await readQuestion(page).catch(() => null))?.cur === tot, 10000), 12000, "lastq");
  await wt(clickText(page, "Submit Exam", true), 8000, "submit");
  await wt(waitFor(page, async () => /exam completed/i.test(await bodyTxt(page).catch(() => ""))), 12000, "eresults");
  await T(1500);
  await wt(page.screenshot({ path: path.join(OUT, "exam-results-1440.png") }), 15000, "shot eresults");
  log("  exam results shot");
  await ctx.close();
}

// Mobile 375: practice Q1 + feedback
log("session 375 practice…");
{
  const { ctx, page } = await openSession(375, 812);
  await wt(clickUntil(page, "Quick Practice", true, /configure your exam/i), 20000, "setup");
  await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); }), 8000, "10q");
  await T(400);
  await wt(clickUntil(page, "Start Exam Now", true, /question 1\s*\//i), 20000, "start");
  await T(800);
  await wt(page.screenshot({ path: path.join(OUT, "practice-q1-375.png") }), 15000, "shot q1");
  await wt(clickOption(page), 8000, "answer");
  await T(1200);
  await wt(page.screenshot({ path: path.join(OUT, "practice-feedback-375.png") }), 15000, "shot fb");
  log("  done");
  await ctx.close();
}

// Mobile 375: exam instructions + Q1 + drawer
log("session 375 exam…");
{
  const { ctx, page } = await openSession(375, 812);
  await wt(clickUntil(page, "Quick Practice", true, /configure your exam/i), 20000, "setup");
  await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); }), 8000, "strict");
  await T(700);
  await wt(clickUntil(page, "Start Exam Now", true, /exam instructions/i), 20000, "instr");
  await wt(page.screenshot({ path: path.join(OUT, "exam-instructions-375.png") }), 15000, "shot instr");
  await wt(clickUntil(page, "Start Simulation", true, /question 1\s*\//i), 20000, "sim");
  await T(1000);
  await wt(page.screenshot({ path: path.join(OUT, "exam-q1-375.png") }), 15000, "shot q1");
  await wt(clickText(page, "Questions", true), 8000, "drawer");
  await T(900);
  await wt(page.screenshot({ path: path.join(OUT, "exam-palette-drawer-375.png") }), 15000, "shot drawer");
  log("  done");
  await ctx.close();
}

await browser.close();
log("screenshots captured");
process.exit(0);
