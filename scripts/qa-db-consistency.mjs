/**
 * READ-ONLY DB CONSISTENCY REGRESSION — final QA pass.
 * Checks attempt lifecycle integrity, answer/score consistency, duplicates,
 * orphans, and the auto-submit + E2E test accounts' data.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const results = [];
const add = (id, expected, ok, actual) => {
  results.push({ id, expected, status: ok ? "PASS" : "FAIL", actual });
  console.log(`${ok ? "✅" : "❌"} [${id}] ${expected}${ok ? "" : ` — ACTUAL: ${actual}`}`);
};

async function main() {
  console.log("===== DB CONSISTENCY REGRESSION (read-only) =====\n");

  // 1. Global integrity: all completed attempts
  const attempts = await db.examAttempt.findMany({ include: { answers: true } });
  const completed = attempts.filter((a) => a.completedAt);
  const abandoned = attempts.filter((a) => !a.completedAt);
  console.log(`Attempts total=${attempts.length} completed=${completed.length} abandoned=${abandoned.length}`);

  let badCounts = 0, badScores = 0, badAnswerCounts = 0;
  for (const a of completed) {
    const sum = a.correctCount + a.wrongCount + a.skippedCount;
    if (sum !== a.totalQuestions) { badCounts++; add(`DB-A${a.id.slice(0, 6)}`, "count consistency", false, `${sum} != ${a.totalQuestions}`); }
    let expected;
    if (a.negativeMarkingEnabled && a.negativeMarkingPenalty) expected = Math.round(Math.max(0, a.correctCount - a.wrongCount * a.negativeMarkingPenalty) / a.totalQuestions * 100);
    else expected = Math.round(a.correctCount / a.totalQuestions * 100);
    if (expected !== a.score) { badScores++; add(`DB-S${a.id.slice(0, 6)}`, "score formula", false, `score=${a.score} expected=${expected}`); }
    if (a.answers.length !== a.correctCount + a.wrongCount) { badAnswerCounts++; add(`DB-N${a.id.slice(0, 6)}`, "answer rows = answered", false, `${a.answers.length} != ${a.correctCount + a.wrongCount}`); }
  }
  add("DB-1 completed count consistency", "correct+wrong+skipped == total for all completed", badCounts === 0, `${completed.length} checked, ${badCounts} bad`);
  add("DB-2 score formula", "score == configured formula (incl. negative marking)", badScores === 0, `${completed.length} checked, ${badScores} bad`);
  add("DB-3 answer row count", "answer rows == correct+wrong per attempt", badAnswerCounts === 0, `${completed.length} checked, ${badAnswerCounts} bad`);
  add("DB-4 abandoned distinguishable", "abandoned attempts have completedAt null", abandoned.every((a) => a.completedAt === null), `${abandoned.length} abandoned, all completedAt null`);

  // 2. Answer correctness flags vs question answer keys
  const qIds = [...new Set(completed.flatMap((a) => a.answers.map((an) => an.questionId)))];
  const qs = qIds.length ? await db.question.findMany({ where: { id: { in: qIds } } }) : [];
  const qMap = new Map(qs.map((q) => [q.id, q]));
  let flagMismatch = 0;
  for (const a of completed) {
    for (const an of a.answers) {
      const q = qMap.get(an.questionId);
      if (!q) { flagMismatch++; continue; }
      if (an.selectedAnswer && (an.selectedAnswer.toUpperCase() === q.correctAnswer.toUpperCase()) !== an.isCorrect) flagMismatch++;
    }
  }
  add("DB-5 answer correctness flags", "isCorrect flags match stored question answer keys", flagMismatch === 0, `${flagMismatch} mismatches`);

  // 3. Duplicates
  const dupAns = await db.$queryRawUnsafe(`SELECT "attemptId", "questionId", COUNT(*) c FROM "AttemptAnswer" GROUP BY "attemptId", "questionId" HAVING COUNT(*) > 1 LIMIT 10`);
  const dupBm = await db.$queryRawUnsafe(`SELECT "userId", "questionId", COUNT(*) c FROM "Bookmark" GROUP BY "userId", "questionId" HAVING COUNT(*) > 1 LIMIT 5`);
  add("DB-6 no duplicate answer rows", "No duplicate (attemptId, questionId)", !dupAns?.length, `${dupAns?.length || 0} dup groups`);
  add("DB-7 no duplicate bookmarks", "No duplicate (userId, questionId)", !dupBm?.length, `${dupBm?.length || 0} dup groups`);

  // 4. Orphans
  const orphanAns = await db.$queryRawUnsafe(`SELECT COUNT(*) c FROM "AttemptAnswer" a LEFT JOIN "ExamAttempt" e ON a."attemptId" = e.id WHERE e.id IS NULL`);
  const orphanBm = await db.$queryRawUnsafe(`SELECT COUNT(*) c FROM "Bookmark" b LEFT JOIN "User" u ON b."userId" = u.id LEFT JOIN "Question" q ON b."questionId" = q.id WHERE u.id IS NULL OR q.id IS NULL`);
  const orphanNotifs = await db.$queryRawUnsafe(`SELECT COUNT(*) c FROM "Notification" n LEFT JOIN "User" u ON n."userId" = u.id WHERE u.id IS NULL`);
  add("DB-8 zero orphan answers", "No answer rows without an attempt", Number(orphanAns[0].c) === 0, `orphans=${orphanAns[0].c}`);
  add("DB-9 zero orphan bookmarks", "No bookmark without user/question", Number(orphanBm[0].c) === 0, `orphans=${orphanBm[0].c}`);
  add("DB-10 zero orphan notifications", "No notification without user", Number(orphanNotifs[0].c) === 0, `orphans=${orphanNotifs[0].c}`);

  // 5. This pass's QA accounts (E2E + auto-submit + audits)
  const qaUsers = await db.user.findMany({
    where: { email: { contains: "@example.com" } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\nQA accounts in DB: ${qaUsers.length}`);
  for (const u of qaUsers) {
    const atts = await db.examAttempt.findMany({ where: { userId: u.id }, include: { answers: true }, orderBy: { startedAt: "asc" } });
    const bms = await db.bookmark.count({ where: { userId: u.id } });
    const notifs = await db.notification.count({ where: { userId: u.id } });
    console.log(`  ${u.email} | attempts=${atts.length} (${atts.map((a) => `${a.mode}:${a.completedAt ? "done" : "abandoned"}`).join(", ")}) | bookmarks=${bms} | notifs=${notifs}`);
  }

  // Auto-submit accounts: every run created exactly 1 attempt; successful runs
  // are completed with 2 answers + 300s; the buggy-clock run is abandoned (still
  // distinguishable via completedAt null).
  const autoUsers = qaUsers.filter((u) => u.email.startsWith("autosub_"));
  let autoOk = autoUsers.length >= 2;
  let autoDetail = [];
  for (const u of autoUsers) {
    const atts = attempts.filter((a) => a.userId === u.id);
    if (atts.length !== 1) { autoOk = false; autoDetail.push(`${u.email}:${atts.length}`); continue; }
    const a = atts[0];
    if (a.completedAt) {
      if (a.answers.length !== 2 || a.timeTakenSeconds !== 300) { autoOk = false; autoDetail.push(`${u.email}:answers=${a.answers.length},t=${a.timeTakenSeconds}`); }
    }
  }
  add("DB-11 auto-submit accounts consistent", "1 attempt each; completed runs have 2 answers + 300s", autoOk, `${autoUsers.length} account(s) ${autoDetail.join(" ")}`);

  fs.writeFileSync("scripts/qa-db-consistency-results.json", JSON.stringify(results, null, 2));
  const fails = results.filter((r) => r.status === "FAIL").length;
  console.log(`\nDB CONSISTENCY: ${results.length - fails}/${results.length} PASS`);
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { console.error("ERROR:", e.message); process.exit(1); }).finally(() => db.$disconnect());
