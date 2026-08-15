/**
 * AUTO-SUBMIT TIMEOUT TEST — controlled Playwright clock (no real 5-min wait).
 * Verifies: timer starts/decrements, auto-submit at 0 fires exactly once,
 * attempt marked completed, answers persisted, no duplicates, score formula,
 * reload after timeout does not create a second submission.
 */
import { chromium } from "playwright";
import fs from "fs";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

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
const readTimer = (page) => page.evaluate(() => {
  const el = document.querySelector('[role="timer"]');
  return el ? el.textContent.trim() : null;
});
const waitFor = async (page, cond, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await cond()) return true; await T(350); }
  return false;
};
const clickUntil = async (page, label, partial, expect, tries = 5) => {
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

const results = [];
const add = (id, expected, ok, actual) => {
  results.push({ id, expected, status: ok ? "PASS" : "FAIL", actual });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${expected}${ok ? "" : ` — ACTUAL: ${actual}`}`);
};

const username = `autosub_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const u = await (await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
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
console.log(`Auto-submit test account: ${email} | ${u.id}`);

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: "dark" });
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

// Configure 5-minute strict exam
await clickUntil(page, "Quick Practice", true, /configure your exam/i);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
await T(800);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "5 min"); if (b) b.click(); });
await T(800);
await clickUntil(page, "Start Exam Now", true, /exam instructions/i);

// Controlled clock: install BEFORE the exam starts so the countdown uses it.
await page.clock.install({ time: new Date("2026-08-15T12:00:00Z") });
await clickUntil(page, "Start Simulation", true, /question 1\s*\//i);
await waitFor(page, async () => (await readQuestion(page).catch(() => null))?.cur === 1);
await T(800);

// 1. Timer starts at 5:00
const t0 = await readTimer(page);
add("AS-1 timer starts", "Timer shows 5:00 at start", t0 === "5:00", t0);

// answer two questions (data for the consistency checks)
await clickOption(page);
await T(800);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
await waitFor(page, async () => (await readQuestion(page).catch(() => null))?.cur === 2);
await clickOption(page);
await T(800);

// 2. Timer visibly decreases (mocked 60s) — runFor fires repeated interval ticks
await page.clock.runFor(60_000);
await T(400);
const t1 = await readTimer(page);
// ~60s elapsed (runFor boundary may fire one extra tick: 5:00 -> 3:59 or 4:00)
const t1ok = /^([3]:[5-9]\d|4:0\d|4:00)$/.test(t1 || "");
add("AS-2 timer decrements", "Timer decreases ~60s (not frozen)", t1ok, t1);

// 3-4. Run past zero: auto-submit at 0, exactly once, never negative
await page.clock.runFor(240_000 + 3_000);
const resOk = await waitFor(page, async () => /exam completed/i.test(await bodyTxt(page).catch(() => "")));
add("AS-3 auto-submit at zero", "Results appear after timer expires", resOk, resOk ? "results shown" : "no results");
const neg = await page.evaluate(() => /:-\d/.test(document.body.innerText));
add("AS-4 no negative timer", "Timer never renders negative", !neg, `negative=${neg}`);
const tEnd = await readTimer(page).catch(() => null);
add("AS-5 timer at/after zero", "Timer no longer ticking on results (unmounted)", tEnd === null, tEnd);

// 5-9. DB verification
const userDb = await db.user.findUnique({ where: { email } });
const attempts = await db.examAttempt.findMany({ where: { userId: userDb.id }, orderBy: { startedAt: "asc" } });
add("AS-6 exactly one attempt", "Exactly 1 attempt row", attempts.length === 1, `count=${attempts.length}`);
const a = attempts[0];
add("AS-7 attempt completed", "completedAt set (not abandoned)", !!a.completedAt, a.completedAt ? String(a.completedAt) : "null");
add("AS-8 full duration", `timeTakenSeconds = ${a.timeTakenSeconds}`, a.timeTakenSeconds === 300, String(a.timeTakenSeconds));
const sum = a.correctCount + a.wrongCount + a.skippedCount;
add("AS-9 counts consistent", "correct+wrong+skipped = totalQuestions", sum === a.totalQuestions, `${a.correctCount}+${a.wrongCount}+${a.skippedCount}=${sum} vs ${a.totalQuestions}`);
let expectedScore;
if (a.negativeMarkingEnabled && a.negativeMarkingPenalty) expectedScore = Math.round(Math.max(0, a.correctCount - a.wrongCount * a.negativeMarkingPenalty) / a.totalQuestions * 100);
else expectedScore = Math.round(a.correctCount / a.totalQuestions * 100);
add("AS-10 negative marking formula", `score matches configured formula (${expectedScore})`, a.score === expectedScore, `score=${a.score}`);
const answers = await db.attemptAnswer.findMany({ where: { attemptId: a.id } });
add("AS-11 answers persisted", "Answer rows = answered count (2)", answers.length === 2, `count=${answers.length}`);
const dupAns = await db.$queryRawUnsafe(`SELECT "questionId", COUNT(*) c FROM "AttemptAnswer" WHERE "attemptId" = $1 GROUP BY "questionId" HAVING COUNT(*) > 1`, a.id);
add("AS-12 no duplicate answers", "No duplicate (attemptId, questionId) rows", !dupAns || dupAns.length === 0, JSON.stringify(dupAns));
// Each stored answer's isCorrect flag must match the question's real answer key.
const qIds = answers.map((an) => an.questionId);
const qRows = qIds.length ? await db.question.findMany({ where: { id: { in: qIds } } }) : [];
const qMap = new Map(qRows.map((q) => [q.id, q]));
const mismatches = answers.filter((an) => {
  const q = qMap.get(an.questionId);
  return q && an.selectedAnswer && (an.selectedAnswer.toUpperCase() === q.correctAnswer.toUpperCase()) !== an.isCorrect;
});
add("AS-13 answer correctness flags", "isCorrect matches the question answer key", mismatches.length === 0, `mismatches=${mismatches.length}`);

// 10. Reload around timeout must not create a second submission
await page.reload({ waitUntil: "domcontentloaded", timeout: 20000 });
await T(2500);
const attemptsAfter = await db.examAttempt.count({ where: { userId: userDb.id } });
add("AS-14 reload no second submit", "Still exactly 1 attempt after reload", attemptsAfter === 1, `count=${attemptsAfter}`);
const answersAfter = await db.attemptAnswer.count({ where: { attemptId: a.id } });
add("AS-15 answers unchanged after reload", "Still 2 answer rows after reload", answersAfter === 2, `count=${answersAfter}`);
const orphans = await db.examAttempt.count({ where: { userId: userDb.id, completedAt: null } });
add("AS-16 no orphan attempt", "No abandoned attempt for user", orphans === 0, `orphans=${orphans}`);

await browser.close();
await db.$disconnect();
const fails = results.filter((r) => r.status === "FAIL").length;
fs.writeFileSync("scripts/qa-autosubmit-results.json", JSON.stringify(results, null, 2));
console.log(`\nAUTO-SUBMIT: ${results.length - fails}/${results.length} PASS`);
process.exit(fails ? 1 : 0);
