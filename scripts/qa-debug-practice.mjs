import { chromium } from "playwright";
import "dotenv/config";

const BASE = "http://localhost:3000";
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));

// create account
const username = "dbg_" + Date.now().toString(36);
const user = await (await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [username + "@example.com"], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
const session = await (await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) })).json();
const token = await (await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = token.jwt;
console.log("account:", username);

// dev browser jwt
const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html,application/xhtml+xml", "Sec-Fetch-Dest": "document" }, redirect: "manual" });
let url = r1.headers.get("location");
let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}
console.log("devJwt:", devJwt ? devJwt.slice(0, 20) : "MISSING");

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.log("  [browser]", m.type(), m.text().slice(0, 150)); });
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 150)));
page.on("dialog", (d) => { console.log("  [dialog]", d.type(), d.message().slice(0, 100)); d.dismiss(); });
page.on("requestfailed", (r) => console.log("  [reqfailed]", r.url().slice(0, 80), r.failure()?.errorText));

await ctx.addCookies([
  { name: "__session", value: jwt, domain: "localhost", path: "/" },
  { name: "__clerk_db_jwt", value: devJwt, domain: "localhost", path: "/" },
  { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
]);
// Also authenticate same-origin requests via the Authorization header — the
// middleware reads the header before the cookie, so server actions stay
// authenticated even if client-side Clerk JS rewrites the injected cookie.
// Cross-origin (Clerk FAPI scripts) must NOT receive the header (CORS).
await page.route("**/*", (route) => {
  const req = route.request();
  if (req.url().startsWith(BASE)) {
    route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${jwt}` } });
  } else {
    route.continue();
  }
});

await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await T(4000);
let body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("\n=== after load ===\n", body.slice(0, 180));

// open setup
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Quick Practice")); if (b) b.click(); });
await T(2500);
body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("\n=== after Quick Practice ===\n", body.slice(0, 180));

// configure
await page.evaluate(() => {
  const sel = document.querySelector("select");
  if (sel) { const opt = [...sel.options].find((o) => o.value === "Highway Engineering"); if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
  const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10");
  if (b10) b10.click();
});
await T(1500);
// click start
const clicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Exam Now"));
  if (b) { b.click(); return true; }
  return false;
});
console.log("start clicked:", clicked);
await T(8000);
body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("\n=== after Start Exam Now ===\n", body.slice(0, 300));
console.log("has Question 1:", /Question 1/.test(body));
console.log("url:", page.url());
await page.screenshot({ path: "/tmp/dbg-practice.png" });
await browser.close();
process.exit(0);
