/**
 * Generates scripts/qa-evidence-gallery.html — self-contained gallery (base64
 * inlined) of LIVE-site QA screenshots for the Freebuff preview.
 * Usage: node scripts/build-gallery.mjs
 */
import fs from "fs";
import path from "path";

const dir = path.resolve("scripts/qa-evidence");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();

const labels = {
  "01-landing.png": "LIVE — Landing page (1440x900)",
  "02-signin-modal-unknown-email.png": "LIVE — Sign-in modal: unknown email → \"Couldn't find your account\"",
  "03-signin-page.png": "LIVE — /sign-in page (Clerk UI)",
  "04-signup-turnstile.png": "LIVE — /sign-up page: Cloudflare Turnstile gate",
  "05-landing-375x812.png": "LIVE — Landing @ 375x812",
  "05-landing-768x1024.png": "LIVE — Landing @ 768x1024",
  "05-landing-1024x768.png": "LIVE — Landing @ 1024x768",
  "05-landing-1920x1080.png": "LIVE — Landing @ 1920x1080",
  "10-signup-prefilled.png": "LIVE — Sign-up form prefilled (username+password)",
  "11-signup-email-filled.png": "LIVE — Sign-up form with QA email diyeti1080@hutdot.com",
  "12-dashboard-authenticated.png": "AUTH — Dashboard: Welcome back, Student! 8,007 Q",
  "13-search-results.png": "AUTH — Search 'highway' → Highway Engineering",
  "13b-search-noresult.png": "AUTH — Search nonexistent → 'No matching topics found.'",
  "13c-search-exam-prefill.png": "AUTH — Search result click → exam prefilled",
  "14-notifications.png": "AUTH — Notifications dropdown (empty — dead feature)",
  "15-topics.png": "AUTH — Topics view",
  "16-weak-topics-empty.png": "AUTH — Weak Topics (empty, fresh account)",
  "17-bookmarks-empty.png": "AUTH — Bookmarks (empty state)",
  "20-exam-setup.png": "AUTH — Exam setup",
  "21-exam-setup-configured.png": "AUTH — Setup: Highway Engineering + 10 Q",
  "22-practice-q1.png": "AUTH — Practice exam Q1 (Highway Engineering)",
  "23-practice-q10.png": "AUTH — Practice exam Q10",
  "24-practice-results.png": "AUTH — Practice results: 10% (1C/9W/0S) 4m58s",
  "30-strict-setup.png": "AUTH — Strict exam setup",
  "30-strict-q1.png": "AUTH — Strict exam: timer + Q1",
  "30b-strict-q5-palette.png": "AUTH — Strict: palette jump to Q5",
  "30c-strict-q25-answered.png": "AUTH — Strict: Q25 answered",
  "31-strict-results.png": "AUTH — Strict results: 8% (2C/0W/-0 penalty/23S) 47s",
  "40-analytics.png": "AUTH — Analytics (35 Q, accuracy, charts)",
  "41-performance.png": "AUTH — Performance history (2 attempts)",
  "42-weak-topics.png": "AUTH — Weak Topics populated (Highway etc.)",
  "43-bookmarks.png": "AUTH — Bookmarks: flagged Q2 listed",
  "44-settings.png": "AUTH — Settings view",
  "45b-settings-date-set.png": "AUTH — Settings: target date set",
  "45c-dashboard-countdown.png": "AUTH — Dashboard: Exam Countdown 32 Days (Sep 15, 2026)",
  "46-light-mode.png": "AUTH — Light mode",
  "50-after-logout.png": "AUTH — After logout: landing (signed out)",
  "51-protected-after-logout.png": "AUTH — /dashboard → /sign-in redirect (logged out)",
};

const cards = files
  .map((f) => {
    const b64 = fs.readFileSync(path.join(dir, f)).toString("base64");
    const label = labels[f] || f;
    return `<figure class="card"><img loading="lazy" src="data:image/png;base64,${b64}" alt="${label}"/><figcaption>${label}</figcaption></figure>`;
  })
  .join("\n");

const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Live QA Evidence — apex-civil.vercel.app</title>
<style>
  body{background:#0b0c16;color:#e2e8f0;font-family:system-ui,sans-serif;margin:0;padding:24px}
  h1{font-size:20px;color:#fff;margin:0 0 4px}
  p.note{color:#94a3b8;font-size:13px;margin:0 0 20px;line-height:1.5}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px}
  .card{background:#111327;border:1px solid #2a2d45;border-radius:12px;padding:10px;margin:0}
  .card img{width:100%;border-radius:8px;display:block}
  .card figcaption{font-size:12px;color:#a5b4fc;margin-top:8px;line-height:1.4}
  .badge{display:inline-block;background:#5842f2;color:#fff;padding:2px 10px;border-radius:999px;font-size:12px;margin-bottom:12px}
  .count{color:#7dd3fc;font-weight:700}
</style></head><body>
<h1>🖥️ Live QA Evidence — apex-civil.vercel.app</h1>
<p class="note">Real Chrome (Playwright + CDP) against the <strong>production Vercel deployment</strong>. Freebuff's preview webview is loopback-only, so the live site cannot be embedded directly — these are real screenshots captured from the live browser session.<br/>
<b>Pre-login baseline:</b> 27 PASS / 0 FAIL / 4 BLOCKED. &nbsp; <b>Authenticated matrix:</b> 35/35 PASS (throwaway QA account, since cleaned up).</p>
<span class="badge">LIVE DEPLOYMENT — apex-civil.vercel.app · <span class="count">${files.length}</span> screenshots</span>
<div class="grid">
${cards}
</div>
</body></html>`;

fs.writeFileSync(path.resolve("scripts/qa-evidence-gallery.html"), html);
console.log(`Gallery written: scripts/qa-evidence-gallery.html (${files.length} screenshots)`);
