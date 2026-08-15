import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import "dotenv/config";

const BASE = "http://localhost:3000";
const CLERK_SECRET = process.env.CLERK_SECRET_KEY;
const API = "https://api.clerk.com/v1";
const h = { Authorization: `Bearer ${CLERK_SECRET}`, "Content-Type": "application/json" };
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const bodyTxt = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim());
const waitFor = async (page, cond, ms = 12000) => {
  const start = Date.now();
  while (Date.now() - start < ms) { if (await cond()) return true; await T(350); }
  return false;
};
const clickUntil = async (page, label, partial, expect, tries = 4) => {
  for (let i = 0; i < tries; i++) {
    await page.evaluate(([l, p]) => { const el = [...document.querySelectorAll("a,button")].find((x) => p ? x.textContent.includes(l) : x.textContent.trim() === l); if (el) el.click(); }, [label, partial]);
    const ok = await waitFor(page, async () => expect.test(await bodyTxt(page).catch(() => "")));
    if (ok) return true;
    await T(700);
  }
  return false;
};

const username = `axefocus_${Date.now().toString(36)}`;
const email = `${username}@example.com`;
const u = await (await fetch(`${API}/users`, { method: "POST", headers: h, body: JSON.stringify({ username, email_address: [email], password: "LocalRegressionPass123!", skip_password_checks: true, skip_email_verification: true }) })).json();
const s = await (await fetch(`${API}/sessions`, { method: "POST", headers: h, body: JSON.stringify({ user_id: u.id }) })).json();
const t = await (await fetch(`${API}/sessions/${s.id}/tokens`, { method: "POST", headers: h, body: JSON.stringify({ expires_in_seconds: 3600 }) })).json();
const jwt = t.jwt;
const r1 = await fetch(BASE + "/dashboard", { headers: { Accept: "text/html" }, redirect: "manual" });
let url = r1.headers.get("location");
let devJwt = null;
for (let i = 0; i < 4 && url; i++) {
  const r = await fetch(url, { redirect: "manual" });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  for (const c of cookies) { const m = c.match(/__clerk_db_jwt=([^;]+)/); if (m) devJwt = m[1]; }
  url = r.headers.get("location") ? new URL(r.headers.get("location"), BASE).href : null;
}

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
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
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 20000 });
await waitFor(page, async () => /master civil engineering/i.test(await bodyTxt(page).catch(() => "")));
await T(2200);
await clickUntil(page, "Quick Practice", true, /configure your exam/i);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim() === "10"); if (b) b.click(); });
await T(400);
await clickUntil(page, "Start Exam Now", true, /question 1\s*\//i);
await T(800);

const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"]).analyze();
for (const v of res.violations) {
  console.log(`-- ${v.id} [${v.impact}] (${v.nodes.length})`);
  for (const n of v.nodes) {
    console.log(`   ${n.target.join(" ")}`);
    console.log(`     HTML: ${(n.html || "").replace(/\s+/g, " ").slice(0, 130)}`);
  }
}
await browser.close();
process.exit(0);
