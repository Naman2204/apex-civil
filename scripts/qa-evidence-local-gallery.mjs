import fs from "fs";
import path from "path";

const dir = path.resolve("scripts/qa-evidence-local");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort();
const labels = {
  "g-practice-setup-1440.png": "G — Quick Practice setup (1440)",
  "g-practice-setup-configured-1440.png": "G — Setup configured: Highway + 10Q (1440)",
  "g-practice-q1-1440.png": "G — Practice Q1 (1440)",
  "g-practice-setup-375.png": "G — Quick Practice setup (375 mobile)",
  "h-strict-setup-1440.png": "H — Simulate Exam setup (1440)",
  "h-strict-exam-1440.png": "H — Strict exam: timer + Q1 (1440)",
  "h-strict-setup-375.png": "H — Simulate Exam setup (375 mobile)",
};
const cards = files.map((f) => {
  const b64 = fs.readFileSync(path.join(dir, f)).toString("base64");
  const label = labels[f] || f;
  return `<figure class="card"><img loading="lazy" src="data:image/png;base64,${b64}" alt="${label}"/><figcaption>${label}</figcaption></figure>`;
}).join("\n");
const html = `<!doctype html><html><head><meta charset="utf-8"/>
<title>Local UI Review — Quick Practice / Simulate Exam</title>
<style>
  body{background:#0b0c16;color:#e2e8f0;font-family:system-ui,sans-serif;margin:0;padding:24px;max-width:1500px}
  h1{font-size:20px;color:#fff;margin:0 0 4px}
  p.note{color:#94a3b8;font-size:13px;margin:0 0 20px;line-height:1.5}
  .card{background:#111327;border:1px solid #2a2d45;border-radius:12px;padding:10px;margin:0 0 24px}
  .card img{width:100%;border-radius:8px;display:block;border:1px solid #2a2d45}
  .card figcaption{font-size:13px;color:#a5b4fc;margin-top:8px;line-height:1.4}
</style></head><body>
<h1>🖥️ Local UI Review — Quick Practice (G) & Simulate Exam (H)</h1>
<p class="note">Captured from the local dev server (localhost:3000, current working tree) with a fresh test account.</p>
${cards}
</body></html>`;
fs.writeFileSync(path.resolve("scripts/qa-evidence-local-gallery.html"), html);
console.log("gallery rewritten:", files.length, "screenshots");
