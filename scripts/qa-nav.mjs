/**
 * AUTHENTICATED LIVE — search, notifications, topics, weak topics, bookmarks.
 * Attaches to QA Chrome (CDP 9222), real UI interactions.
 * Usage: node scripts/qa-nav.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const EVIDENCE = path.resolve("scripts/qa-evidence");
const results = [];
function addResult(testId, feature, expected, actual, status, severity = "MEDIUM") {
  results.push({ testId, feature, expected, actual, status, severity });
  console.log(`${status === "PASS" ? "✅" : "❌"} [${testId}] ${feature} — ${status}${actual ? ` | ${actual}` : ""}`);
}

const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];

// CDP screenshot (bypasses Playwright's font/animation wait)
async function cdpShot(page, name) {
  try {
    const cdp = await ctx.newCDPSession(page);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(EVIDENCE, name), Buffer.from(data, "base64"));
    return true;
  } catch (e) { console.log(`  ⚠️ shot ${name}: ${e.message.split("\n")[0]}`); return false; }
}

// Ensure on root (dashboard) with fresh load
await page.goto("https://apex-civil.vercel.app/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForTimeout(3000);
await cdpShot(page, "12-dashboard-authenticated.png");

// ============ GLOBAL SEARCH ============
console.log("\n===== GLOBAL SEARCH (live) =====");
const searchInput = page.getByPlaceholder(/search topics/i);
await searchInput.first().fill("highway");
await page.waitForTimeout(4000); // 300ms debounce + server action + render
const dropdownBtns = await page.locator('div[class*="top-full"] button').allInnerTexts().catch(() => []);
addResult("A-010", "Search 'highway' (lowercase)", "Highway Engineering in dropdown", dropdownBtns.length ? dropdownBtns.join("|") : "dropdown empty", dropdownBtns.some((t) => t.includes("Highway Engineering")) ? "PASS" : "FAIL", "HIGH");
await cdpShot(page, "13-search-results.png");

// Uppercase variant
await searchInput.first().fill("HIGHWAY");
await page.waitForTimeout(3000);
const upperBtns = await page.locator('div[class*="top-full"] button').allInnerTexts().catch(() => []);
addResult("A-010b", "Search 'HIGHWAY' (uppercase, case-insensitive)", "Highway Engineering found", upperBtns.join("|"), upperBtns.some((t) => t.includes("Highway Engineering")) ? "PASS" : "FAIL", "MEDIUM");

// Partial
await searchInput.first().fill("estimat");
await page.waitForTimeout(3000);
const partialBtns = await page.locator('div[class*="top-full"] button').allInnerTexts().catch(() => []);
addResult("A-010c", "Search 'estimat' (partial)", "Estimation & Costing found", partialBtns.join("|"), partialBtns.some((t) => t.toLowerCase().includes("estimation")) ? "PASS" : "FAIL", "MEDIUM");

// Nonexistent
await searchInput.first().fill("zzzzznothing");
await page.waitForTimeout(3000);
const noneText = await page.locator('div[class*="top-full"]').innerText().catch(() => "");
addResult("A-011", "Search nonexistent", "'No matching topics found.'", noneText.replace(/\s+/g, " ").trim().slice(0, 60), /no matching topics/i.test(noneText) ? "PASS" : "FAIL", "MEDIUM");
await cdpShot(page, "13b-search-noresult.png");

// Click a result → exam prefill
await searchInput.first().fill("highway");
await page.waitForTimeout(3000);
await page.locator('div[class*="top-full"] button', { hasText: "Highway Engineering" }).first().click();
await page.waitForTimeout(3000);
const afterSearch = (await page.locator("body").innerText()).replace(/\s+/g, " ");
addResult("A-011b", "Click search result", "Exam setup prefilled with Highway Engineering", /Configure Your Exam/.test(afterSearch) ? "setup shown" : "not shown", /Highway Engineering/.test(afterSearch) && /Configure Your Exam/.test(afterSearch) ? "PASS" : "FAIL", "HIGH");
await cdpShot(page, "13c-search-exam-prefill.png");
// Exit back to dashboard
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Dashboard"); if (b) b.click(); });
await page.waitForTimeout(2500);

// ============ NOTIFICATIONS ============
console.log("\n===== NOTIFICATIONS (live) =====");
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.innerHTML.includes("lucide-bell")); if (b) b.click(); });
await page.waitForTimeout(1800);
const notifText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
addResult("A-012", "Notifications dropdown", "Opens with empty state", /You're all caught up/.test(notifText) ? "'all caught up' (empty state)" : "rendered", /Notifications/.test(notifText) ? "PASS" : "FAIL", "MEDIUM");
addResult("A-012b", "Notifications empty state (dead feature check)", "'You're all caught up!'", String(/You're all caught up/.test(notifText)), /You're all caught up/.test(notifText) ? "PASS" : "FAIL", "MEDIUM");
await cdpShot(page, "14-notifications.png");
await page.keyboard.press("Escape");
await page.waitForTimeout(600);

// ============ TOPICS ============
console.log("\n===== TOPICS (live) =====");
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Topics"); if (b) b.click(); });
await page.waitForTimeout(2500);
const topicsText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
addResult("A-013", "Topics view", "All chapters render", topicsText.includes("Railway Engineering") && topicsText.includes("Highway Engineering") && topicsText.includes("Geotechnical Engineering") ? "chapters render" : topicsText.slice(0, 120), topicsText.includes("Railway Engineering") ? "PASS" : "FAIL", "HIGH");
await cdpShot(page, "15-topics.png");

// ============ WEAK TOPICS ============
console.log("\n===== WEAK TOPICS (live) =====");
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Weak Topics"); if (b) b.click(); });
await page.waitForTimeout(2500);
const weakText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
addResult("A-014", "Weak topics empty state (fresh account)", "No-data message", /no data yet|no weak topics/i.test(weakText) ? "empty state" : weakText.slice(0, 100), /no data yet|no weak topics/i.test(weakText) ? "PASS" : "FAIL", "MEDIUM");
await cdpShot(page, "16-weak-topics-empty.png");

// ============ BOOKMARKS ============
console.log("\n===== BOOKMARKS (live) =====");
await page.evaluate(() => { const b = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === "Bookmarks"); if (b) b.click(); });
await page.waitForTimeout(3500);
const bmText = (await page.locator("body").innerText()).replace(/\s+/g, " ").trim();
addResult("A-015", "Bookmarks empty state", "'No bookmarks yet'", bmText.includes("No bookmarks yet") ? "empty state" : bmText.slice(0, 120), bmText.includes("No bookmarks yet") ? "PASS" : "FAIL", "MEDIUM");
await cdpShot(page, "17-bookmarks-empty.png");

fs.writeFileSync(path.resolve("scripts/qa-nav-results.json"), JSON.stringify(results, null, 2));
const pass = results.filter((r) => r.status === "PASS").length;
console.log(`\nNAV PHASE: ${pass}/${results.length} PASS`);
await browser.close();
