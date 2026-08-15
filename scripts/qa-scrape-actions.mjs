/** Scrape fresh Next-Action IDs from the running dev server's compiled chunks. */
const BASE = "http://localhost:3000";
const NAMES = ["getQuestionsForExam","startExamAttempt","saveAttemptAnswer","finishExamAttemptBatch","finishExamAttempt","createNotification","getDashboardStats","updateUserSettings","resetUserData","getNotifications","searchTopics","getChapterStats","getBookmarks","toggleBookmark"];

const html = await (await fetch(BASE + "/")).text();
const srcs = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
const urls = srcs.map((s) => new URL(s, BASE).href);
console.log("chunks:", urls.length);
const found = {};
for (const url of urls) {
  let text;
  try { text = await (await fetch(url)).text(); } catch { continue; }
  // Next 16 encodes actions like: "actionId":"..." or createServerReference("id")
  for (const name of NAMES) {
    if (found[name]) continue;
    // pattern: name adjacent to an id (either side within 200 chars)
    const idx = text.indexOf(name);
    if (idx === -1) continue;
    const win = text.slice(Math.max(0, idx - 400), idx + 400);
    const m = win.match(/["']([a-f0-9]{24,})["']/);
    if (m) found[name] = m[1];
  }
}
console.log(JSON.stringify(found, null, 2));
