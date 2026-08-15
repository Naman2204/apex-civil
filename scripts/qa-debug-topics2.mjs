import "dotenv/config";
import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const API = "https://api.clerk.com/v1";
const H = { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const users = await (await fetch(`${API}/users?limit=200`, { headers: H })).json();
const u = users.filter((x) => (x.username || "").startsWith("phase2b_")).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
const s = await (await fetch(`${API}/sessions`, { method: "POST", headers: H, body: JSON.stringify({ user_id: u.id }) })).json();
const t = await (await fetch(`${API}/sessions/${s.id}/tokens`, { method: "POST", headers: H, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = t.jwt;
const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
let url = r1.headers.get("location"); let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cs = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  for (const c of cs) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
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
const posts = [];
page.on("request", (req) => { if (req.method() === "POST" && req.headers()["next-action"]) posts.push(req.headers()["next-action"] + ":" + (req.postDataBuffer() ? req.postDataBuffer().toString("utf8").slice(0, 60) : "")); });
const errs = [];
page.on("pageerror", (e) => errs.push(String(e).split("\n")[0]));
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await T(5000);
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Topics"); if (b) b.click(); });
await T(8000);
const cards = await page.evaluate(() => [...document.querySelectorAll("button")].map((el) => el.textContent.replace(/\s+/g, " ").trim()).filter((t) => /Questions Available/.test(t)).slice(0, 4));
console.log("CARDS:", JSON.stringify(cards));
console.log("POSTS:", posts);
console.log("ERRORS:", errs.slice(0, 3));
await browser.close();
