/**
 * Create a controlled local Clerk test user via the Backend API (sk_test_ key)
 * and mint a session JWT for the __session cookie.
 * Usage: node scripts/qa-local-auth.mjs <username-prefix> [--create-only]
 * Prints JSON: { username, email, password, userId, sessionId, jwt }
 */
import "dotenv/config";

const prefix = process.argv[2] || "localqa";
const CREATE_ONLY = process.argv.includes("--create-only");
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";

if (!CLERK_SECRET) {
  console.error("CLERK_SECRET_KEY missing");
  process.exit(1);
}

const username = `${prefix}_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const password = "LocalRegressionPass123!";

const headers = {
  Authorization: `Bearer ${CLERK_SECRET}`,
  "Content-Type": "application/json",
};

const res = await fetch(`${API}/users`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    username,
    email_address: [email],
    password,
    skip_password_checks: true,
    skip_email_verification: true,
  }),
});
if (!res.ok) {
  const t = await res.text();
  console.error("create user failed:", res.status, t.slice(0, 300));
  process.exit(1);
}
const user = await res.json();
console.log("created user:", user.id, user.username, user.email_addresses?.[0]?.email_address);

if (CREATE_ONLY) {
  console.log(JSON.stringify({ username, email, password, userId: user.id }));
  process.exit(0);
}

// Create a session for the user (dev instance: active immediately).
const sres = await fetch(`${API}/sessions`, {
  method: "POST",
  headers,
  body: JSON.stringify({ user_id: user.id }),
});
if (!sres.ok) {
  const t = await sres.text();
  console.error("create session failed:", sres.status, t.slice(0, 300));
  process.exit(1);
}
const session = await sres.json();
console.log("created session:", session.id, session.status);

// Mint a JWT for the session.
const tres = await fetch(`${API}/sessions/${session.id}/tokens`, {
  method: "POST",
  headers,
  body: JSON.stringify({}),
});
if (!tres.ok) {
  const t = await tres.text();
  console.error("create token failed:", tres.status, t.slice(0, 300));
  process.exit(1);
}
const token = await tres.json();
console.log("minted token (len):", token.jwt?.length);

console.log(JSON.stringify({ username, email, password, userId: user.id, sessionId: session.id, jwt: token.jwt }));
process.exit(0);
