/**
 * PROBE — what password policy does the Clerk TEST instance actually enforce?
 * Uses the Backend API create-user WITHOUT skip_password_checks, so Clerk
 * validates the password against the instance's configured rules (the exact
 * same policy the <SignUp /> component enforces client-side and Clerk enforces
 * server-side). Passwords: 7, 8, 15, 16 chars. Created users are deleted.
 */
import "dotenv/config";

const SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const H = { Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
for (const { label, password } of [
  { label: "7 chars", password: "Qx9#mZ2" },
  { label: "8 chars", password: "Qx9#mZ2p" },
  { label: "15 chars", password: "Qx9#mZ2pL7nKv5" },
  { label: "16 chars", password: "Kx9#vQ2$mZ4pL7nQ" },
]) {
  const email = `pwprobe_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}@example.com`;
  const res = await fetch(`${API}/users`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({
      username: `pwprobe_${Date.now().toString(36)}`,
      email_address: [email],
      password,
      skip_password_checks: false,
      skip_email_verification: true,
    }),
  });
  const data = await res.json();
  let verdict;
  if (res.ok && data.id) {
    verdict = { verdict: "ACCEPTED", userId: data.id };
  } else {
    const e = data.errors?.[0];
    verdict = { verdict: "REJECTED", code: e?.code, message: e?.long_message || e?.message };
  }
  results.push({ label, passwordLen: password.length, httpStatus: res.status, ...verdict });
  console.log(`[${label}] (len ${password.length}) → HTTP ${res.status} | ${verdict.verdict}${verdict.message ? ` | ${verdict.message}` : ""}`);
  if (data.id) await fetch(`${API}/users/${data.id}`, { method: "DELETE", headers: H });
  await T(400);
}

console.log("\nSUMMARY:");
for (const r of results) console.log(`  ${r.label}: ${r.verdict}${r.message ? ` — "${r.message}"` : ""}`);

const eight = results.find((r) => r.passwordLen === 8);
const seven = results.find((r) => r.passwordLen === 7);
console.log(`\nRequirement check — 8 chars accepted: ${eight?.verdict === "ACCEPTED"} | <8 chars rejected: ${seven?.verdict === "REJECTED"}`);
process.exit(0);
