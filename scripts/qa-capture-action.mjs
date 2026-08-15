/**
 * Captures real Next.js server-action POST bodies from the practice flow so the
 * security probe can replay the exact encoding with attacker-chosen args.
 * Usage: node scripts/qa-capture-action.mjs <prefix>
 */
import { chromium } from "playwright";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const prefix = process.argv[2] || "capact";
const T = (ms) => new Promise((r) => setTimeout(r, ms));

const username = `${prefix}_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const user = await (await fetch(`${API}/users`, {
  method: "POST", headers: h,
  body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }),
})).json();
const session = await (await fetch(`${API}/sessions`, {
  method: "POST", headers: h, body: JSON.stringify({ user_id: user.id }),
})).json();
const t = await (await fetch(`${API}/sessions/${session.id}/tokens`, {
  method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }),
})).json();
const JWT = t.jwt;

async function getDevBrowserJwt() {
  const r1 = await fetch(BASE + "/dashboard", {
    headers: { Accept: "text/html,application/xhtml+xml", "Sec-Fetch-Dest": "document" },
    redirect: "manual",
  });
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

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("dialog", (d) => d.dismiss().catch(() => {}));
const devJwt = await getDevBrowserJwt();
await ctx.addCookies([
  { name: "__session", value: JWT, domain: "localhost", path: "/" },
  { name: "__clerk_db_jwt", value: devJwt, domain: "localhost", path: "/" },
  { name: "__client_uat", value: String(Math.floor(Date.now() / 1000)), domain: "localhost", path: "/" },
]);
await page.route("**/*", (route) => {
  const req = route.request();
  if (req.url().startsWith(BASE)) route.continue({ headers: { ...req.headers(), Authorization: `Bearer ${JWT}` } });
  else route.continue();
});

const captured = [];
page.on("request", (req) => {
  if (req.method() === "POST" && req.headers()["next-action"]) {
    const body = req.postDataBuffer();
    captured.push({ url: req.url().replace(BASE, ""), action: req.headers()["next-action"], contentType: req.headers()["content-type"], bodyHex: body ? body.toString("hex") : null, bodyUtf8: body ? body.toString("utf8") : null, bodyLen: body ? body.length : 0 });
  }
});

await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
await T(3500);
// Quick Practice → 10 questions → answer all → finish
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes("Quick Practice")); if (b) b.click(); });
await T(2500);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); });
await T(1200);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Start Exam Now")); if (b) b.click(); });
await T(5000);
// Answer all 10
for (let q = 1; q <= 10; q++) {
  await page.evaluate(() => { const opts = [...document.querySelectorAll("button")].filter((b) => { if (b.disabled) return false; return [...b.querySelectorAll("span")].some((s) => /^[A-D]$/.test(s.textContent.trim())); }); if (opts.length) opts[0].click(); });
  await T(900);
  if (q < 10) await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Next Question")); if (b) b.click(); });
  await T(900);
}
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.includes("Finish Practice")); if (b) b.click(); });
await T(6000);

console.log("CAPTURED:", captured.length);
for (const c of captured) {
  console.log("\n--- POST", c.url, "| action:", c.action.slice(0, 24), "| ct:", c.contentType, "| len:", c.bodyLen);
  console.log("utf8:", JSON.stringify(c.bodyUtf8?.slice(0, 400)));
  console.log("hex:", c.bodyHex?.slice(0, 500));
}
await browser.close();
process.exit(0);
