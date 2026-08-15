/**
 * LIGHTWEIGHT RESPONSIVE VALIDATOR — Quick Practice + Simulate Exam UI.
 * One fresh browser per viewport (crash isolation), every step time-bounded,
 * per-width 30s hard cap, ERROR recorded (never retried) on timeout/crash.
 *
 * Widths: 375, 390, 412, 768, 1024, 1280, 1440.
 * Checks: page loads, no horizontal overflow, options visible, nav usable,
 * timer visible, mobile palette drawer works, no uncaught page errors.
 * Screenshots only at 1440 and 768 for visual evidence.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const WIDTHS = [375, 390, 412, 768, 1024, 1280, 1440];
const SHOT = { 1440: "1440", 768: "768" };
const OUT = path.resolve("scripts/qa-evidence-ui");
fs.mkdirSync(OUT, { recursive: true });  const results = [];
  const save = () => fs.writeFileSync(path.resolve("scripts/qa-responsive-light-results.json"), JSON.stringify(results, null, 2));
  // console.error entries that are dev-only React warnings (not failures)
  const DEV_WARN = /unique \"key\" prop|Warning: |Cannot update a component/i;
const T = (ms) => new Promise((r) => setTimeout(r, ms));

// Hard timeout on ANY step — the failure mode the old script had.
const wt = (p, ms, label) =>
  Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error(`[${label}] timed out after ${Math.round(ms / 1000)}s`)), ms)),
  ]);

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
const overflow = (page) => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
const optionButtons = (page) => page.evaluate(() =>
  [...document.querySelectorAll("button")].filter((b) => !b.disabled && [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim()))).length
);

async function createAccount() {
  const username = `uilight_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const ures = await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) });
  const user = await ures.json();
  const sres = await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) });
  const session = await sres.json();
  for (let i = 1; i <= 4; i++) {
    const tres = await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) });
    const t = await tres.json();
    if (t.jwt) return { jwt: t.jwt };
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

const account = await createAccount();
const DEV_JWT = await getDevBrowserJwt();

async function runWidth(width) {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
  const checks = [];
  const pageErrors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width, height: width <= 412 ? 812 : 900 } });
    const page = await ctx.newPage();
    page.on("dialog", (d) => d.dismiss().catch(() => {}));
    page.on("pageerror", (e) => pageErrors.push("UNCAUGHT: " + String(e).split("\n")[0]));
    page.on("console", (m) => { if (m.type() === "error" && !DEV_WARN.test(m.text())) pageErrors.push("CONSOLE: " + m.text().split("\n")[0]); });
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

    // 1. Dashboard loads
    await wt(page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 15000 }), 18000, "goto dashboard");
    const dashOk = await wt(waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => ""))), 12000, "dashboard ready");
    checks.push(["dashboard loads", dashOk]);
    await T(2000); // let React hydrate before interacting (SSR text renders earlier)

    // retry helper: click until the expected text appears (hydration-safe)
    const clickUntil = async (label, partial, expect, tries = 5) => {
      for (let i = 0; i < tries; i++) {
        await clickText(page, label, partial).catch(() => {});
        const ok = await waitFor(page, async () => expect.test(await bodyTxt(page).catch(() => "")));
        if (ok) return true;
        await T(800);
      }
      return false;
    };

    // 2. Quick Practice Q1
    const setupOk = await wt(clickUntil("Quick Practice", true, /configure your exam/i), 14000, "open practice setup");
    checks.push(["practice setup opens", setupOk]);
    await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); }), 8000, "select 10Q");
    await T(400);
    const startOk = await wt(clickUntil("Start Exam Now", true, /question 1\s*\//i), 16000, "start practice");
    const q1Ok = startOk && (await wt(readQuestion(page), 8000, "read q1"))?.cur === 1;
    checks.push(["practice Q1 renders", q1Ok]);
    const o1 = await wt(overflow(page), 8000, "overflow p-q1");
    checks.push(["practice Q1 no overflow", o1.sw <= o1.iw + 1]);
    checks.push(["practice options visible", (await wt(optionButtons(page), 8000, "p options")) >= 4]);

    // answer + feedback
    await wt(clickOption(page), 8000, "answer Q1");
    await T(1000);
    const fb = await wt(bodyTxt(page), 8000, "feedback text");
    checks.push(["feedback shown", /correct|incorrect/i.test(fb)]);

    // nav usability: Next → Q2, Previous → Q1
    await wt(clickText(page, "Next Question", true), 8000, "next");
    const q2 = await wt(waitFor(page, async () => (await readQuestion(page))?.cur === 2), 10000, "reach Q2");
    checks.push(["next works (Q2)", q2]);
    await wt(clickText(page, "Previous", true), 8000, "previous");
    const q1b = await wt(waitFor(page, async () => (await readQuestion(page))?.cur === 1), 10000, "back to Q1");
    checks.push(["previous works (Q1)", q1b]);

    // screenshot (desktop/tablet evidence)
    if (SHOT[width]) await page.screenshot({ path: path.join(OUT, `practice-q1-${SHOT[width]}.png`) }).catch(() => {});

    // exit practice → setup → Strict Exam → instructions
    await wt(page.evaluate(() => { const b = document.querySelector('button[aria-label="Exit practice"]'); if (b) b.click(); }), 8000, "exit practice");
    await wt(waitFor(page, async () => /configure your exam/i.test(await bodyTxt(page).catch(() => ""))), 10000, "setup after exit");
    await wt(page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); }), 8000, "strict mode");
    await T(600);
    const instrOk = await wt(clickUntil("Start Exam Now", true, /exam instructions/i), 16000, "start exam setup");
    checks.push(["exam instructions screen", instrOk]);
    const o2 = await wt(overflow(page), 8000, "overflow instr");
    checks.push(["instructions no overflow", o2.sw <= o2.iw + 1]);

    // start simulation → exam Q1 with timer
    const simOk = await wt(clickUntil("Start Simulation", true, /question 1\s*\//i), 16000, "start simulation");
    const eq1 = simOk && (await wt(readQuestion(page), 8000, "read exam q1"))?.cur === 1;
    checks.push(["exam Q1 renders", eq1]);
    const et = await wt(bodyTxt(page), 8000, "exam text");
    checks.push(["timer visible", /\d+:\d\d/.test(et)]);
    const o3 = await wt(overflow(page), 8000, "overflow e-q1");
    checks.push(["exam Q1 no overflow", o3.sw <= o3.iw + 1]);
    checks.push(["exam options visible", (await wt(optionButtons(page), 8000, "e options")) >= 4]);
    checks.push(["clear response btn", await wt(page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Clear Response/.test(b.textContent))), 8000, "clear btn")]);
    checks.push(["mark for review btn", await wt(page.evaluate(() => [...document.querySelectorAll("button")].some((b) => /Mark for Review/.test(b.textContent))), 8000, "mark btn")]);

    // palette: drawer (<1024) / sidebar (>=1024)
    if (width < 1024) {
      await wt(clickText(page, "Questions", true), 8000, "open drawer");
      await T(700);
      const drawerOk = await wt(page.evaluate(() => /Question Palette/i.test(document.body.innerText)), 8000, "drawer palette");
      checks.push(["mobile palette drawer", drawerOk]);
      const legendOk = await wt(page.evaluate(() => /Answered|Marked for Review|Not Visited|Unanswered/.test(document.body.innerText)), 8000, "drawer legend");
      checks.push(["palette legend visible", legendOk]);
      if (SHOT[width]) await page.screenshot({ path: path.join(OUT, `exam-drawer-${SHOT[width]}.png`) }).catch(() => {});
    } else {
      const palOk = await wt(page.evaluate(() => /Question Palette/i.test(document.body.innerText)), 8000, "palette sidebar");
      checks.push(["palette sidebar", palOk]);
      const legendOk = await wt(page.evaluate(() => /Answered|Marked for Review|Not Visited|Unanswered/.test(document.body.innerText)), 8000, "legend");
      checks.push(["palette legend visible", legendOk]);
      if (SHOT[width]) await page.screenshot({ path: path.join(OUT, `exam-q1-${SHOT[width]}.png`) }).catch(() => {});
    }

    checks.push(["no uncaught page errors", pageErrors.length === 0]);
    if (pageErrors.length) console.log(`  ⚠️ ${width}px pageErrors: ${pageErrors.slice(0, 2).join(" / ")}`);

    await ctx.close();
    return { checks, pageErrors, shot: !!SHOT[width] };
  } finally {
    await browser.close().catch(() => {});
  }
}

for (const width of WIDTHS) {
  try {
    const r = await wt(runWidth(width), 30000, `width ${width} total`);
    const failed = r.checks.filter(([, ok]) => !ok);
    const status = failed.length === 0 ? "PASS" : "FAIL";
    const reason = failed.length === 0 ? "all checks passed" : failed.map(([n]) => n).join("; ");
    const errs = r.pageErrors.length ? ` | pageErrors: ${r.pageErrors.slice(0, 2).join(" / ")}` : "";
    results.push({ width, status, reason, pageErrors: r.pageErrors });
    console.log(`${status === "PASS" ? "✅" : "❌"} ${width}px: ${status} — ${reason}${errs}`);
  } catch (e) {
    results.push({ width, status: "ERROR", reason: e.message.split("\n")[0] });
    console.log(`⚠️  ${width}px: ERROR — ${e.message.split("\n")[0]}`);
  }
  save();
}

const ok = results.filter((r) => r.status === "PASS").length;
console.log(`\nRESPONSIVE-LIGHT: ${ok}/${results.length} PASS`);
process.exit(ok === results.length ? 0 : 1);
