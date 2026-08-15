import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import "dotenv/config";

const H = process.env.CLERK_TEST_SECRET_KEY || process.env.CLERK_SECRET_KEY;
const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const email = `axed_${Date.now()}@example.com`;

const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_BIN || "/usr/bin/google-chrome" });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const page = await ctx.newPage();
page.setDefaultTimeout(10000);

await fetch(`https://api.clerk.com/v1/users`, {
  method: "POST",
  headers: { Authorization: `Bearer ${H}`, "Content-Type": "application/json" },
  body: JSON.stringify({ email_address: [email], password: "Kx9#vQ2$mZ4pL7nQ", skip_password_checks: true, public_metadata: { test: true } }),
});
await page.goto(BASE + "/sign-in");
await page.getByLabel("Email address").fill(email);
await page.getByLabel("Password", { exact: true }).fill("Kx9#vQ2$mZ4pL7nQ");
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForURL("**/dashboard**", { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1500);

async function scan(label) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"]).analyze();
  const ho = r.violations.filter((v) => v.id === "heading-order");
  console.log(`[${label}] heading-order x${ho.length}`);
  for (const v of ho) for (const n of v.nodes) console.log("   target:", n.target.join(" "), "\n   html:", (n.html || "").replace(/\s+/g, " ").slice(0, 180));
  const headings = await page.evaluate(() => Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(h => h.tagName + ":" + (h.textContent || "").trim().slice(0, 40)));
  console.log("   HEADINGS:", JSON.stringify(headings));
}

// Practice Q1 via sidebar click (same as audit)
await page.getByRole("button", { name: /quick practice/i }).click().catch(() => {});
await page.waitForTimeout(1200);
const btns = page.getByRole("button");
const bn = await btns.count();
for (let i = 0; i < bn; i++) {
  const t = ((await btns.nth(i).textContent()) || "").toLowerCase();
  if (t.includes("start practice")) { await btns.nth(i).click(); break; }
}
await page.waitForTimeout(2500);
const qVisible = await page.evaluate(() => !!document.querySelector("h2,h3") && document.body.innerText.includes("Question"));
console.log("question visible:", qVisible);
await scan("practice-q1");

await browser.close();
process.exit(0);
