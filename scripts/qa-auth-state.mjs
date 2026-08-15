/**
 * Probes the authenticated QA Chrome session state.
 * Usage: node scripts/qa-auth-state.mjs
 */
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
const page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
if (!page) { console.log(JSON.stringify({ error: "no apex-civil page" })); process.exit(0); }
const url = page.url();
const text = (await page.locator("body").innerText().catch(() => "")).replace(/\s+/g, " ").slice(0, 400);
const cookies = (await ctx.cookies()).map((c) => c.name);
const clerkSession = cookies.find((c) => c === "__session");
console.log(JSON.stringify({ url, text, hasSessionCookie: !!clerkSession, cookieNames: cookies }, null, 2));
await browser.close();
