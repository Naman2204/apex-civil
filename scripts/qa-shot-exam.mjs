import { chromium } from "playwright";
import "dotenv/config";
const BASE = "http://localhost:3000";
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const username = "shot_" + Date.now().toString(36);
const user = await (await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [username + "@example.com"], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
const session = await (await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }) })).json();
const token = await (await fetch(`${API}/sessions/${session.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = token.jwt;
const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html,application/xhtml+xml", "Sec-Fetch-Dest": "document" }, redirect: "manual" });
let url = r1.headers.get("location");
let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("console", (m) => { if (m.type() === "error") console.log("  [err]", m.text().slice(0, 140)); });
page.on("pageerror", (e) => console.log("  [pageerror]", e.message.slice(0, 140)));
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
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await T(4000);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Quick Practice")); if (b) b.click(); });
await T(2500);
await page.evaluate(() => {
  const sel = document.querySelector("select");
  if (sel) { const opt = [...sel.options].find((o) => o.value === "Highway Engineering"); if (opt) { sel.value = opt.value; sel.dispatchEvent(new Event("change", { bubbles: true })); } }
  const b10 = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10");
  if (b10) b10.click();
});
await T(1500);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Exam Now")); if (b) b.click(); });
await T(7000);
await page.screenshot({ path: "/tmp/exam-q1.png" });
const btns = await page.evaluate(() => [...document.querySelectorAll("button")].map((b) => b.textContent.trim().slice(0, 25)).filter(Boolean));
console.log("BUTTONS:", JSON.stringify(btns));
const body = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
console.log("BODY:", body.slice(0, 500));
await browser.close();
process.exit(0);
