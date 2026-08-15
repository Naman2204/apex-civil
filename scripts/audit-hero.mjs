import { chromium } from "playwright";
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const ev = (fn) => Promise.race([page.evaluate(fn), T(8000)]).catch(() => null);
const body = () => Promise.race([page.evaluate(() => document.body.innerText.replace(/\s+/g, " ")), T(6000)]).catch(() => "");
const rec = (id, ctrl, ok, actual) => console.log(`${ok ? "✅" : "❌"} [${id}] ${ctrl} — ${ok ? "PASS" : "FAIL"} | ${actual}`);

// Start Simulation
await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes("Start Simulation")); if (el) el.click(); });
await T(3500);
let t = await body();
rec("D-08", "Start Simulation", /configure your exam/i.test(t), t.slice(0, 60));
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Quick Practice
await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes("Quick Practice")); if (el) el.click(); });
await T(3500);
t = await body();
rec("D-09", "Quick Practice (hero)", /configure your exam/i.test(t), t.slice(0, 60));
await ev(() => { const x = [...document.querySelectorAll("a,button")].find((el) => el.textContent.trim() === "Dashboard"); if (x) x.click(); });
await T(3000);

// Configure Exam
await ev(() => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes("Configure Exam")); if (el) el.click(); });
await T(3500);
t = await body();
rec("D-10", "Configure Exam (hero)", /configure your exam/i.test(t), t.slice(0, 60));
process.exit(0);
