/**
 * Attaches to the persistent QA Chrome via CDP (port 9222) and reports state.
 * Usage: node scripts/qa-attach.mjs [screenshot.png]
 */
import { chromium } from "playwright";

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctxs = browser.contexts();
let out = { pages: [], url: "", title: "", authed: false, cookies: 0 };
for (const ctx of ctxs) {
  for (const page of ctx.pages()) {
    const url = page.url();
    let title = "";
    try { title = await page.title(); } catch {}
    out.pages.push({ url: url.slice(0, 160), title });
    out.url = url;
    out.title = title;
    const cookies = await ctx.cookies();
    out.cookies = cookies.length;
    const clerkSession = cookies.filter((c) => c.name === "__session");
    out.authed = clerkSession.length > 0 && clerkSession[0].value.length > 20;
  }
}
const shot = process.argv[2];
if (shot) {
  const page = ctxs[0]?.pages().find((p) => p.url().includes("apex-civil")) || ctxs[0]?.pages()[0];
  if (page) await page.screenshot({ path: shot });
}
console.log(JSON.stringify(out, null, 2));
await browser.close();
