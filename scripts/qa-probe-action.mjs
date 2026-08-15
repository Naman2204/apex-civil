import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const H = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };

const username = "probe_" + Date.now().toString(36);
const user = await (await fetch(API + "/users", { method: "POST", headers: H, body: JSON.stringify({ username, email_address: [username + "@example.com"], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
const session = await (await fetch(API + "/sessions", { method: "POST", headers: H, body: JSON.stringify({ user_id: user.id }) })).json();
const t = await (await fetch(API + "/sessions/" + session.id + "/tokens", { method: "POST", headers: H, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = t.jwt;

const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html,application/xhtml+xml", "Sec-Fetch-Dest": "document" }, redirect: "manual" });
let url = r1.headers.get("location");
let dev = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cs = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  for (const c of cs) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) dev = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}
console.log("dev jwt:", dev ? "ok" : "MISSING");

const res = await fetch(BASE + "/", {
  method: "POST",
  headers: {
    "Next-Action": "70db9c1d0d277beaa00283fab791feaab94688d5c1",
    "Content-Type": "text/plain;charset=UTF-8",
    Accept: "*/*",
    Authorization: `Bearer ${jwt}`,
    Cookie: `__session=${jwt}; __client_uat=${Math.floor(Date.now() / 1000)}; __clerk_db_jwt=${dev}`,
  },
  body: JSON.stringify(["Highway Engineering", "All", 3]),
});
const text = await res.text();
console.log("status:", res.status);
console.log("body (first 800):", text.slice(0, 800));
process.exit(0);
