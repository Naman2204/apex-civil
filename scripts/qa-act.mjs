/**
 * ONE-SHOT live action runner against the QA Chrome session (CDP 9222).
 * Usage: node scripts/qa-act.mjs <action> [arg]
 * Actions:
 *   main            — print <main> text
 *   nav:<label>     — click element with exact text, wait 5s
 *   click:<label>   — click element containing text (first), wait 4s
 *   fillmain:<text> — set the value of the first <main> input (React setter)
 *   viewport:<w>:<h>— emulate viewport
 *   shot:<name>     — screenshot to scripts/qa-evidence/<name>
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const [action, arg] = (process.argv[2] || "main").split(":");
const T = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.connectOverCDP("http://127.0.0.1:9222");
const ctx = browser.contexts()[0];
let page = ctx.pages().find((p) => p.url().includes("apex-civil")) || ctx.pages()[0];
const cdp = await ctx.newCDPSession(page);
const ev = (fn, arg, ms = 15000) => Promise.race([page.evaluate(fn, arg), T(ms)]).catch((e) => "ERR " + e.message.split("\n")[0]);

let out;
switch (action) {
  case "main": {
    out = await ev(() => { const m = document.querySelector("main"); return m ? m.innerText.replace(/\s+/g, " ").trim().slice(0, 700) : "(no main)"; });
    break;
  }
  case "nav": {
    out = await ev((l) => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.trim() === l); if (el) { el.click(); return true; } return false; }, arg, 10000);
    await T(5000);
    break;
  }
  case "click": {
    out = await ev((l) => { const el = [...document.querySelectorAll("a,button")].find((x) => x.textContent.includes(l)); if (el) { el.click(); return true; } return false; }, arg, 10000);
    await T(4000);
    break;
  }
  case "fillmain": {
    out = await ev((v) => {
      const input = [...document.querySelectorAll("main input")][0];
      if (!input) return "no-main-input";
      const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      s.call(input, v);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return "filled:" + v;
    }, arg, 10000);
    await T(2000);
    break;
  }
  case "viewport": {
    const [w, h] = arg.split("x").map(Number);
    out = await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 500 }).then(() => `viewport ${w}x${h}`).catch((e) => "ERR " + e.message);
    await T(2000);
    break;
  }
  case "shot": {
    out = await Promise.race([
      cdp.send("Page.captureScreenshot", { format: "png" }).then(({ data }) => { fs.writeFileSync(path.join("scripts/qa-evidence", arg), Buffer.from(data, "base64")); return "saved " + arg; }),
      T(12000).then(() => "TIMEOUT"),
    ]).catch((e) => "ERR " + e.message);
    break;
  }
  default: out = "unknown action";
}
console.log(JSON.stringify({ action, out }));
process.exit(0);
