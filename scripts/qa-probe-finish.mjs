import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const H = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const ACTIONS = {
  startExamAttempt: "78332fe4fb9506f8a6a2e898fd624d2564617b1b5a",
  finishExamAttemptBatch: "70696f2bb79caa778a80553aeedfcbfb914c513f80",
  saveAttemptAnswer: "7cb719b68561d990a32991655bed35b66cec2554fe",
};

async function createAccount(prefix) {
  const username = `${prefix}_${Date.now().toString(36)}`;
  const email = `${username}@example.com`;
  const user = await (await fetch(`${API}/users`, {
    method: "POST", headers: H,
    body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }),
  })).json();
  const session = await (await fetch(`${API}/sessions`, {
    method: "POST", headers: H, body: JSON.stringify({ user_id: user.id }),
  })).json();
  const t = await (await fetch(`${API}/sessions/${session.id}/tokens`, {
    method: "POST", headers: H, body: JSON.stringify({ expires_in_seconds: 3600 }),
  })).json();
  return { username, email, userId: user.id, sessionId: session.id, jwt: t.jwt };
}

async function getDevBrowserJwt() {
  const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
  let url = r1.headers.get("location");
  for (let i = 0; i < 4 && url; i++) {
    const r = await fetch(url, { redirect: "manual" });
    const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
    for (const c of cookies) {
      const m = c.match(/__clerk_db_jwt=([^;]+)/);
      if (m) return m[1];
    }
    url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
  }
  throw new Error("no dev jwt");
}

async function invokeAction(actionName, args, principal, { cookie = true } = {}) {
  const headers = { "Next-Action": ACTIONS[actionName], "Content-Type": "text/plain;charset=UTF-8", Accept: "*/*" };
  if (principal?.jwt) headers.Authorization = `Bearer ${principal.jwt}`;
  if (cookie && principal?.jwt) {
    headers.Cookie = `__session=${principal.jwt}; __client_uat=${String(Math.floor(Date.now() / 1000))}; __clerk_db_jwt=${DEV_JWT}`;
  }
  const res = await fetch(BASE + "/", { method: "POST", headers, body: JSON.stringify(args) });
  return { status: res.status, text: await res.text() };
}

const DEV_JWT = await getDevBrowserJwt();
const victim = await createAccount("probvictim");
const attacker = await createAccount("probattacker");
console.log("victim:", victim.username, "| attacker:", attacker.username);

const startRes = await invokeAction("startExamAttempt", ["PRACTICE", "Highway Engineering", 3], victim);
const m = startRes.text.match(/"[a-z0-9]{20,25}"/g);
const attemptId = m ? m[0].replace(/"/g, "") : null;
console.log("victim attempt:", attemptId, "| start status:", startRes.status);

// Attacker tries to finish + save into the victim's attempt
const fin = await invokeAction("finishExamAttemptBatch", [attemptId, 10, {}], attacker);
console.log("attacker finish -> status:", fin.status, "| body:", JSON.stringify(fin.text.slice(0, 120)));
const sav = await invokeAction("saveAttemptAnswer", [attemptId, "mcq-vis-p596-1786430414603-3", "A", true, 5], attacker);
console.log("attacker save   -> status:", sav.status, "| body:", JSON.stringify(sav.text.slice(0, 120)));

// DB verification: attempt must be NOT completed; zero answers; no notification to victim
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const attempt = await db.examAttempt.findUnique({ where: { id: attemptId }, select: { completedAt: true, correctCount: true, wrongCount: true } });
const answers = await db.attemptAnswer.count({ where: { attemptId } });
const victimDb = await db.user.findUnique({ where: { email: victim.email }, select: { id: true } });
const notifs = await db.notification.count({ where: { userId: victimDb.id } });
console.log("\nDB CHECK:");
console.log("  completedAt:", attempt.completedAt === null ? "NULL ✓ (attacker did NOT complete it)" : attempt.completedAt);
console.log("  correct/wrong:", attempt.correctCount + "/" + attempt.wrongCount, "(must be 0/0)");
console.log("  answers rows:", answers, "(must be 0)");
console.log("  victim notifications:", notifs, "(must be 0 — attacker finish created none)");
const ok = attempt.completedAt === null && attempt.correctCount === 0 && attempt.wrongCount === 0 && answers === 0 && notifs === 0;
console.log("\nSEC-05 VERDICT:", ok ? "PASS — cross-user finish is a no-op, victim attempt untouched" : "FAIL");
await db.$disconnect();
process.exit(ok ? 0 : 1);
