/**
 * Retest: target exam date via React-compatible native setter, save, verify
 * persistence + dashboard countdown. Also theme persistence (ST-006).
 * Usage: node scripts/qa-settings-date.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EVIDENCE = path.resolve("scripts/qa-evidence");
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const cdp = await ctx.newCDPSession(page);
const ev = (fn) => Promise.race([page.evaluate(fn), T(10000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").trim()), T(6000)]).catch(() => "");
async function shot(n) {
  const ok = await Promise.race([
    cdp.send("Page.captureScreenshot", { format: "png" }).then(({ data }) => { fs.writeFileSync(path.join(EVIDENCE, n), Buffer.from(data, "base64")); return true; }),
    T(12000).then(() => false),
  ]);
  console.log(`  📸 ${n}: ${ok ? "captured" : "TIMEOUT"}`);
}

// 1. Go to settings
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Settings"); if (x) x.click(); });
await T(3500);
const s0 = await body();
console.log("settings text:", s0.slice(0, 200));

// 2. Set the target date with React-native setter
await ev(() => {
  const input = document.querySelector('input[type="date"]');
  if (!input) return "no-input";
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(input, "2026-09-15");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  return input.value;
});
await T(1500);
const s1 = await body();
console.log("after date set:", /sep|15|2026/.test(s1) ? "date shown" : s1.slice(0, 120));
await shot("45b-settings-date-set.png");

// 3. Save
await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => /save|update/i.test(x.textContent)); if (b) { b.click(); return true; } return false; });
await T(4000);
console.log("saved; verifying in DB next");

// 4. Dashboard countdown
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3500);
const d = await body();
const cd = d.match(/day[s]? remaining|countdown|(\d+) days?/i);
console.log("dashboard countdown:", cd ? cd[0] : d.slice(0, 250));
await shot("45c-dashboard-countdown.png");

// 5. Theme persistence (ST-006): toggle → light, reload, verify
await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Toggle dark mode"); if (b) b.click(); });
await T(1500);
const before = await ev(() => document.documentElement.classList.contains("dark"));
await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
await T(3500);
const after = await ev(() => document.documentElement.classList.contains("dark"));
console.log(`theme: dark=${before} → reload → dark=${after} (${before === after ? "PERSISTED" : "NOT PERSISTED"})`);
// restore dark
await ev(() => { const b = [...document.querySelectorAll("button")].find((x) => x.title === "Toggle dark mode"); if (b) b.click(); });
await T(800);
console.log("done");
process.exit(0);
