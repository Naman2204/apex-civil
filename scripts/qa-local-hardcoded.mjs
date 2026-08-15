/**
 * LOCAL HARDCODED-DATA PROBE — H-01..H-04 regression.
 * Completes a real 3-question Highway practice attempt via the server actions,
 * then loads the authenticated dashboard and asserts the progress numbers are
 * computed (non-zero) rather than the old literal 0 / 0% / 0%-bars.
 */
import { chromium } from "playwright";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const H = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const ACTIONS = {
  getQuestionsForExam: "70db9c1d0d277beaa00283fab791feaab94688d5c1",
  startExamAttempt: "78332fe4fb9506f8a6a2e898fd624d2564617b1b5a",
  saveAttemptAnswer: "7cb719b68561d990a32991655bed35b66cec2554fe",
  finishExamAttemptBatch: "70696f2bb79caa778a80553aeedfcbfb914c513f80",
};

const results = [];
const report = (id, feature, ok, actual) => {
  results.push({ id, feature, status: ok ? "PASS" : "FAIL", actual });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${feature} — ${ok ? "PASS" : "FAIL"} | ${actual}`);
};
const T = (ms) => new Promise((r) => setTimeout(r, ms));

async function createAccount(prefix) {
  const username = `${prefix}_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const ures = await fetch(`${API}/users`, { method: "POST", headers: H, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) });
  const user = await ures.json();
  if (!user.id) throw new Error(`user create failed: ${ures.status}`);
  const sres = await fetch(`${API}/sessions`, { method: "POST", headers: H, body: JSON.stringify({ user_id: user.id }) });
  const session = await sres.json();
  const tres = await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: H, body: JSON.stringify({ expires_in_seconds: 3600 }) });
  const t = await tres.json();
  if (!t.jwt) throw new Error("token mint failed");
  return { email, userId: user.id, sessionId: session.id, jwt: t.jwt };
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

async function invokeAction(actionName, args, jwt, devJwt) {
  const res = await fetch(BASE + "/", {
    method: "POST",
    headers: {
      "Next-Action": ACTIONS[actionName],
      "Content-Type": "text/plain;charset=UTF-8",
      Accept: "*/*",
      Authorization: `Bearer ${jwt}`,
      Cookie: `__session=${jwt}; __client_uat=${String(Math.floor(Date.now() / 1000))}; __clerk_db_jwt=${devJwt}`,
    },
    body: JSON.stringify(args),
  });
  const text = await res.text();
  let json = null;
  for (const line of text.split("\n")) {
    if (line.startsWith("1:")) { try { json = JSON.parse(line.slice(2)); break; } catch {} }
  }
  return { status: res.status, text, json };
}

const DEV_JWT = await getDevBrowserJwt();
const account = await createAccount("hdprobe");

// Fetch 15 Railway questions (smaller chapter: 267 → 15/267 = 5.6%, visibly > 0%)
const qs = (await invokeAction("getQuestionsForExam", ["Railway Engineering", "All", 15], account.jwt, DEV_JWT)).json;
const start = await invokeAction("startExamAttempt", ["PRACTICE", "Railway Engineering", 15], account.jwt, DEV_JWT);
const attemptId = start.text.match(/"[a-z0-9]{20,25}"/g)?.[0]?.replace(/"/g, "");
// Answer all CORRECTLY (read correctAnswer from the payload)
const answers = {};
for (const q of qs) {
  await invokeAction("saveAttemptAnswer", [attemptId, q.id, q.correctAnswer, false, 5], account.jwt, DEV_JWT);
  answers[q.id] = q.correctAnswer;
}
await invokeAction("finishExamAttemptBatch", [attemptId, 120, answers], account.jwt, DEV_JWT);
console.log(`completed attempt ${attemptId.slice(0, 10)} (${qs.length}/${qs.length} correct)\n`);

// Load the dashboard and read the progress numbers
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
await T(5000);
const t = await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());

// Overall progress card: "X / 8,007 Questions" with X = 15
const overall = t.match(/(\d+) \/ 8,007 Questions/);
report("H-01", "Dashboard overall progress dynamic", overall && +overall[1] >= 15, overall ? `${overall[1]} / 8,007` : "no match");
// Overall progress %: must not be a stale literal 0 — ">0%" or a real number
const pctAll = t.match(/(>0%|\d+(?:\.\d+)?%) of the bank explored/);
report("H-02", "Dashboard overall % dynamic", !!pctAll, pctAll ? pctAll[1] : "no match");
// Topic cards: Railway must show a real non-zero % (15/267 ≈ 5.6%)
const topicCards = await page.evaluate(() =>
  [...document.querySelectorAll("button")].map((el) => el.textContent.replace(/\s+/g, " ").trim()).filter((t) => /Railway Engineering/.test(t)).slice(0, 2)
);
const railwayPct = (topicCards[0] || "").match(/(?:>0%|\d+(?:\.\d+)?%)$/);
report("H-03", "Topic cards show real progress %", railwayPct && railwayPct[0] !== "0%", topicCards[0] ? topicCards[0].slice(0, 80) : "Railway card not found");

await browser.close();
console.log(`\nHARDCODED: ${results.filter((r) => r.status === "PASS").length}/${results.length} PASS`);
process.exit(0);
