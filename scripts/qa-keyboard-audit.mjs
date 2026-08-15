/**
 * KEYBOARD-ONLY ACCESSIBILITY AUDIT — Quick Practice + Simulate Exam.
 * All in-flow interactions are driven with Tab / Enter / Space / Escape only.
 * Records FAIL with viewport, element, expected, actual.
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const OUT = path.resolve("scripts/qa-keyboard-results.json");
const issues = [];
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const wt = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`[${label}] timeout`)), ms))]);
const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
const clickText = (page, label, partial = false) => page.evaluate(([l, p]) => {
  const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l);
  if (el) { el.click(); return true; } return false;
}, [label, partial]);
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
    await clickText(page, label, partial).catch(() => {});
    const ok = await waitFor(page, async () => expect.test(await bodyTxt(page).catch(() => "")));
    if (ok) return true;
    await T(700);
  }
  return false;
};
const active = (page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { tag: "BODY", text: "", label: "", cls: "" };
  return {
    tag: el.tagName,
    text: (el.textContent || "").trim().slice(0, 40),
    label: el.getAttribute("aria-label") || "",
    cls: (el.className || "").toString(),
    fv: el.matches(":focus-visible"),
  };
});
const pressTab = (page) => page.keyboard.press("Tab");
const tabTo = async (page, pred, maxTabs = 60) => {
  for (let i = 0; i < maxTabs; i++) {
    const a = await active(page);
    if (pred(a)) return a;
    await pressTab(page);
  }
  return null;
};
const tabToText = (page, text, maxTabs = 60) => tabTo(page, (a) => a.text.includes(text), maxTabs);
const tabToLabel = (page, label, maxTabs = 60) => tabTo(page, (a) => a.label === label, maxTabs);
const assert = (viewport, id, expected, ok, actual) => {
  issues.push({ viewport, id, expected, status: ok ? "PASS" : "FAIL", actual });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${expected}${ok ? "" : ` — ACTUAL: ${actual}`}`);
};

async function account() {
  const username = `kbaudit_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const u = await (await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
  const s = await (await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: u.id }) })).json();
  const t = await (await fetch(`${API}/sessions/${s.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
  const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
  let url = r1.headers.get("location");
  let devJwt = null;
  for (let i = 0; i < 4 && url; i++) {
    const r = await fetch(url, { redirect: "manual" });
    const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
    for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
    url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
  }
  return { jwt: t.jwt, devJwt };
}

const { jwt, devJwt } = await account();
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
  await wt(waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => ""))), 12000, "dash");
  await T(2200);
  return { ctx, page };
}

const enterPracticeQ1 = async (page) => {
  await wt(clickUntil(page, "Quick Practice", true, /configure your exam/i), 20000, "setup");
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); });
  await T(400);
  await wt(clickUntil(page, "Start Exam Now", true, /question 1\s*\//i), 20000, "start");
  await T(600);
};

// ================= DESKTOP 1440 =================
{
  const { ctx, page } = await openSession(1440, 900);
  await enterPracticeQ1(page);
  const vp = "1440";

  // 1. options reachable by keyboard with visible focus
  const optA = await tabTo(page, (a) => a.tag === "BUTTON" && /^Option A:/.test(a.label), 80);
  assert(vp, "KB-1 options focusable", "Answer option A focusable via Tab", !!optA, optA ? `${optA.tag} ${optA.label.slice(0, 30)}` : "not found");
  assert(vp, "KB-2 focus visible", "Active element matches :focus-visible", !!optA?.fv, `fv=${optA?.fv}`);
  // 2. select with Enter
  await page.keyboard.press("Enter");
  await T(1200);
  const fbTxt = await wt(bodyTxt(page), 8000, "fb");
  assert(vp, "KB-3 select with Enter", "Enter selects option + feedback shows", /correct|incorrect/i.test(fbTxt), fbTxt.slice(0, 60));
  // Options become disabled after answering; focus moves to the feedback region (by design).
  const afterSel = await active(page);
  assert(vp, "KB-3b focus after answer", "Focus lands on feedback region (not BODY)", afterSel.tag !== "BODY" && afterSel.cls.includes("focus:outline-none"), JSON.stringify(afterSel));
  // 3. Mark for Review via keyboard
  const mark = await tabTo(page, (a) => a.tag === "BUTTON" && /Mark for Review/.test(a.text), 40);
  assert(vp, "KB-4 mark focusable", "Mark for Review focusable", !!mark, mark ? mark.text : "not found");
  await page.keyboard.press("Enter");
  await T(600);
  const marked = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /Mark for Review|Unmark/.test(x.textContent));
    return b ? { text: b.textContent.trim(), pressed: b.getAttribute("aria-pressed") } : null;
  });
  const markedChip = await page.evaluate(() => /Marked/i.test(document.body.innerText));
  assert(vp, "KB-4b mark state", "Mark toggles aria-pressed + chip", !!marked && marked.pressed === "true" && markedChip, JSON.stringify(marked));
  // 4. Next via keyboard
  const next = await tabTo(page, (a) => a.text.includes("Next Question"), 40);
  await page.keyboard.press("Enter");
  await T(800);
  const q2 = await readQuestion(page);
  assert(vp, "KB-5 next works", "Enter on Next → Q2", q2?.cur === 2, JSON.stringify(q2));
  assert(vp, "KB-5b focus after next", "Focus stays on Next button after navigation", /Next Question/.test((await active(page)).text), JSON.stringify(await active(page)));
  // 5. Previous via keyboard
  const prev = await tabTo(page, (a) => a.text.includes("Previous") && a.tag === "BUTTON", 40);
  await page.keyboard.press("Enter");
  await T(800);
  const q1b = await readQuestion(page);
  assert(vp, "KB-6 previous works", "Enter on Previous → Q1", q1b?.cur === 1, JSON.stringify(q1b));
  // 6. bookmark via keyboard
  const bm = await tabTo(page, (a) => a.label === "Bookmark this question", 40);
  assert(vp, "KB-7 bookmark focusable", "Bookmark button focusable (aria-label)", !!bm, bm ? bm.label : "not found");
  await page.keyboard.press("Enter");
  await T(800);
  assert(vp, "KB-7b bookmark toggles", "Bookmark toggle via keyboard", /Remove bookmark/.test((await active(page)).label) || (await page.evaluate(() => !!document.querySelector('button[aria-label="Remove bookmark"]'))), JSON.stringify(await active(page)));
  // 7. Finish via keyboard
  for (let target = 2; target <= 10; target++) {
    const n = await tabTo(page, (a) => a.text.includes("Next Question"), 40);
    if (!n) break;
    await page.keyboard.press("Enter");
    await T(600);
  }
  const finish = await tabTo(page, (a) => a.text.includes("Finish Practice"), 40);
  assert(vp, "KB-8 finish focusable", "Finish Practice focusable", !!finish, finish ? finish.text : "not found");
  await page.keyboard.press("Enter");
  await T(5000);
  const res = await bodyTxt(page).catch(() => "");
  assert(vp, "KB-9 submit works", "Enter on Finish → results", /practice completed|exam completed/i.test(res), res.slice(0, 60));
  const afterRes = await active(page);
  assert(vp, "KB-10 focus after results", "Focus lands on meaningful result element", afterRes.tag !== "BODY" && afterRes.text.length > 0, `${afterRes.tag} "${afterRes.text.slice(0, 30)}"`);

  // 8. Exam flow
  const again = await tabTo(page, (a) => /Practice Again|Take Another Exam/.test(a.text), 40);
  await page.keyboard.press("Enter");
  await T(1500);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
  await T(700);
  await wt(clickUntil(page, "Start Exam Now", true, /exam instructions/i), 20000, "instr");
  const sim = await tabTo(page, (a) => /Start Simulation/.test(a.text), 60);
  assert(vp, "KB-11 start simulation focusable", "Start Simulation keyboard reachable", !!sim, sim ? sim.text : "not found");
  assert(vp, "KB-11b start sim focus visible", "Start Simulation :focus-visible", !!sim?.fv, `fv=${sim?.fv}`);
  await page.keyboard.press("Enter");
  await T(6000);
  const eq = await readQuestion(page);
  assert(vp, "KB-12 start sim works", "Enter starts exam → Q1", eq?.cur === 1, JSON.stringify(eq));
  // tab order through exam: options, clear response, mark for review, prev, next
  const eOpt = await tabTo(page, (a) => /^Option A:/.test(a.label), 60);
  assert(vp, "KB-13 exam options reachable", "Exam option focusable", !!eOpt, eOpt ? eOpt.label.slice(0, 30) : "not found");
  // Before answering, Clear Response is disabled (correctly not tab-focusable);
  // verify the disabled state is exposed instead.
  const clearDisabled = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => /Clear Response/.test(x.textContent));
    return b ? { disabled: b.disabled, aria: b.getAttribute("aria-disabled") } : null;
  });
  assert(vp, "KB-14 clear response disabled state", "Clear Response disabled before answering + exposed", !!clearDisabled && clearDisabled.disabled === true, JSON.stringify(clearDisabled));
  const markB = await tabTo(page, (a) => /Mark for Review/.test(a.text), 30);
  assert(vp, "KB-15 mark for review reachable", "Mark for Review focusable", !!markB, markB ? markB.text : "not found");
  // palette reachable by keyboard (desktop sidebar)
  const pal1 = await tabTo(page, (a) => a.tag === "BUTTON" && /^Question 1: /.test(a.label), 60);
  assert(vp, "KB-16 palette keyboard", "Palette cell keyboard reachable + named", !!pal1, pal1 ? pal1.label : "not found");
  // select via keyboard then clear response
  await tabTo(page, (a) => /^Option A:/.test(a.label), 60);
  await page.keyboard.press("Enter");
  await T(600);
  const clearB2 = await tabTo(page, (a) => /Clear Response/.test(a.text), 30);
  await page.keyboard.press("Enter");
  await T(600);
  const cleared = await page.evaluate(() => { const btns = [...document.querySelectorAll("button")]; const a = btns.find((x) => /^Option A:/.test(x.getAttribute("aria-label") || "")); return a ? a.getAttribute("aria-pressed") : "?"; });
  assert(vp, "KB-17 clear response works", "Enter clears selected answer", cleared === "false" || cleared === null, `aria-pressed=${cleared}`);
  await ctx.close();
}

// ================= MOBILE 375 =================
{
  const { ctx, page } = await openSession(375, 812);
  await enterPracticeQ1(page);
  const vp = "375";
  const optA = await tabTo(page, (a) => a.tag === "BUTTON" && /^Option A:/.test(a.label), 60);
  assert(vp, "KB-M1 options reachable", "Option focusable on mobile", !!optA, optA ? optA.label.slice(0, 30) : "not found");
  await page.keyboard.press("Enter");
  await T(1000);
  const nextM = await tabTo(page, (a) => a.text.includes("Next Question"), 40);
  await page.keyboard.press("Enter");
  await T(800);
  assert(vp, "KB-M2 next works", "Enter → Q2 on mobile", (await readQuestion(page))?.cur === 2, "q1");
  // exit practice (X) via keyboard → setup
  const exitBtn = await tabTo(page, (a) => a.label === "Exit practice", 60);
  assert(vp, "KB-M3 exit reachable", "Exit practice focusable (aria-label)", !!exitBtn, exitBtn ? exitBtn.label : "not found");
  await page.keyboard.press("Enter");
  await T(1500);
  assert(vp, "KB-M4 exit works", "Enter on X → setup", /configure your exam/i.test(await bodyTxt(page).catch(() => "")), (await bodyTxt(page).catch(() => "")).slice(0, 40));
  // strict exam on mobile: instructions → start → drawer keyboard
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Strict Exam")); if (b) b.click(); });
  await T(700);
  await wt(clickUntil(page, "Start Exam Now", true, /exam instructions/i), 20000, "instr");
  const simM = await tabTo(page, (a) => /Start Simulation/.test(a.text), 60);
  await page.keyboard.press("Enter");
  await T(6000);
  assert(vp, "KB-M5 start sim works", "Enter starts exam on mobile", (await readQuestion(page))?.cur === 1, "no");
  // Questions button → drawer via keyboard
  const qBtn = await tabTo(page, (a) => /Questions/.test(a.text), 60);
  assert(vp, "KB-M6 questions btn", "Questions button focusable", !!qBtn, qBtn ? qBtn.text : "not found");
  await page.keyboard.press("Enter");
  await T(900);
  const drawerState = await page.evaluate(() => {
    const d = [...document.querySelectorAll("div")].find((x) => (x.getAttribute("role") || "") === "dialog");
    return { dialog: !!d, modal: d?.getAttribute("aria-modal"), label: d?.getAttribute("aria-label") || d?.getAttribute("aria-labelledby") || "" };
  });
  assert(vp, "KB-M7 drawer dialog semantics", "Drawer is a dialog with accessible name", drawerState.dialog && !!drawerState.label, JSON.stringify(drawerState));
  const closeFocused = await active(page);
  assert(vp, "KB-M8 drawer focus in", "Focus moves into drawer when opened", closeFocused.tag !== "BODY" && closeFocused.label !== "", `${closeFocused.tag} "${closeFocused.label || closeFocused.text.slice(0, 20)}"`);
  const palCell = await tabTo(page, (a) => /^Question \d+:/.test(a.label), 40);
  assert(vp, "KB-M9 drawer palette keyboard", "Palette cell reachable inside drawer", !!palCell, palCell ? palCell.label : "not found");
  // Esc closes drawer
  await page.keyboard.press("Escape");
  await T(700);
  const drawerClosed = await page.evaluate(() => ![...document.querySelectorAll("div")].some((x) => (x.getAttribute("role") || "") === "dialog"));
  assert(vp, "KB-M10 escape closes", "Escape closes palette drawer", drawerClosed, `open=${!drawerClosed}`);
  // open again, jump to Q5, focus returns sensibly
  const qBtn2 = await tabTo(page, (a) => /Questions/.test(a.text), 40);
  await page.keyboard.press("Enter");
  await T(900);
  const q5 = await tabTo(page, (a) => a.label === "Question 5: " || (a.label || "").startsWith("Question 5:"), 40);
  await page.keyboard.press("Enter");
  await T(1000);
  assert(vp, "KB-M11 palette jump works", "Enter on Q5 jumps to Q5", (await readQuestion(page))?.cur === 5, JSON.stringify(await readQuestion(page)));
  const afterJump = await active(page);
  assert(vp, "KB-M12 focus after jump", "Focus returns to a sensible control after jump (not BODY)", afterJump.tag !== "BODY", `${afterJump.tag} "${afterJump.label || afterJump.text.slice(0, 20)}"`);
  // End Exam via keyboard
  const endBtn = await tabTo(page, (a) => a.label === "End exam" || a.text.includes("End Exam"), 40);
  assert(vp, "KB-M13 end exam reachable", "End Exam focusable", !!endBtn, endBtn ? (endBtn.label || endBtn.text) : "not found");
  await page.keyboard.press("Enter");
  await T(1500);
  assert(vp, "KB-M14 end exam works", "Enter on End Exam returns to setup", /configure your exam/i.test(await bodyTxt(page).catch(() => "")), (await bodyTxt(page).catch(() => "")).slice(0, 40));
  await ctx.close();
}

await browser.close();
const fails = issues.filter((i) => i.status === "FAIL");
fs.writeFileSync(OUT, JSON.stringify(issues, null, 2));
console.log(`\nKEYBOARD AUDIT: ${issues.length - fails.length}/${issues.length} PASS, ${fails.length} FAIL`);
process.exit(fails.length ? 2 : 0);
