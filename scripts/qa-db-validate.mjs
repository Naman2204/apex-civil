/**
 * READ-ONLY database validation for the ApexCivil QA audit.
 * Executes SELECT-only queries against the shared Neon database
 * (same DB used by the live deployment). Does NOT modify any data.
 *
 * Usage: node scripts/qa-db-validate.mjs
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("===== READ-ONLY DATABASE VALIDATION (shared Neon DB) =====");

  // 1. Table sizes
  const [users, questions, attempts, answers, bookmarks, notifications, streaks, goals] = await Promise.all([
    db.user.count(), db.question.count(), db.examAttempt.count(), db.attemptAnswer.count(),
    db.bookmark.count(), db.notification.count(), db.userStreak.count(), db.dailyGoal.count(),
  ]);
  console.log(`Users: ${users} | Questions: ${questions} | Attempts: ${attempts} | Answers: ${answers} | Bookmarks: ${bookmarks} | Notifications: ${notifications} | Streaks: ${streaks} | DailyGoals: ${goals}`);

  // 2. Attempt lifecycle integrity: counts & score formulas
  const attemptsAll = await db.examAttempt.findMany({ orderBy: { startedAt: "desc" }, take: 30 });
  let countChecks = 0, countFailures = 0, scoreFailures = 0, completed = 0;
  const abandoned = attemptsAll.filter((a) => !a.completedAt).length;
  for (const a of attemptsAll) {
    if (!a.completedAt) continue;
    completed++;
    const sum = a.correctCount + a.wrongCount + a.skippedCount;
    if (sum !== a.totalQuestions) {
      countFailures++;
      console.log(`  ⚠️ ${a.id.slice(0, 8)}: correct+wrong+skipped=${sum} != total=${a.totalQuestions}`);
    } else countChecks++;
    let expectedScore;
    if (a.negativeMarkingEnabled && a.negativeMarkingPenalty) {
      const raw = Math.max(0, a.correctCount - a.wrongCount * a.negativeMarkingPenalty);
      expectedScore = Math.round((raw / a.totalQuestions) * 100);
    } else {
      expectedScore = a.totalQuestions > 0 ? Math.round((a.correctCount / a.totalQuestions) * 100) : 0;
    }
    if (expectedScore !== a.score) {
      scoreFailures++;
      console.log(`  ⚠️ ${a.id.slice(0, 8)}: score=${a.score} expected=${expectedScore} (mode=${a.mode}, neg=${a.negativeMarkingEnabled} p=${a.negativeMarkingPenalty}, c=${a.correctCount}/${a.totalQuestions})`);
    }
  }
  console.log(`Attempt checks — count-consistency: ${countChecks} ok / ${countFailures} fail; score: ${completed - scoreFailures} ok / ${scoreFailures} fail; completed=${completed}, abandoned=${abandoned} (of last 30)`);

  // 3. Duplicate AttemptAnswer rows (race-condition indicator)
  const dupRows = await db.$queryRawUnsafe(
    `SELECT "attemptId", "questionId", COUNT(*) c FROM "AttemptAnswer" GROUP BY "attemptId", "questionId" HAVING COUNT(*) > 1 LIMIT 10`
  );
  console.log(`Duplicate attempt-answer rows (attemptId+questionId): ${Array.isArray(dupRows) ? dupRows.length : 0} ${dupRows?.length ? JSON.stringify(dupRows.slice(0, 5)) : ""}`);

  // 4. Duplicate active bookmarks (should be impossible via unique constraint)
  const dupBm = await db.$queryRawUnsafe(
    `SELECT "userId", "questionId", COUNT(*) c FROM "Bookmark" GROUP BY "userId", "questionId" HAVING COUNT(*) > 1 LIMIT 5`
  );
  console.log(`Duplicate bookmarks: ${Array.isArray(dupBm) ? dupBm.length : 0}`);

  // 5. QA test user data (created during prior local session, same shared DB as live)
  const qaUser = await db.user.findUnique({ where: { email: "apex.qa.tester2@example.com" } });
  if (qaUser) {
    const qaAttempts = await db.examAttempt.findMany({ where: { userId: qaUser.id }, orderBy: { startedAt: "asc" } });
    console.log(`\nQA test user (${qaUser.email}): ${qaAttempts.length} attempts`);
    for (const a of qaAttempts) {
      console.log(`  ${a.mode} ${a.topic || "Mixed"} | ${a.correctCount}/${a.wrongCount}/${a.skippedCount} of ${a.totalQuestions} | score=${a.score}% | ${a.completedAt ? "completed" : "ABANDONED"} | ${a.timeTakenSeconds}s`);
    }
    const qaBm = await db.bookmark.count({ where: { userId: qaUser.id } });
    console.log(`QA user bookmarks: ${qaBm}`);
  } else {
    console.log("\nQA test user not found (apex.qa.tester2@example.com)");
  }

  // 6. Real user activity (aggregates only, no PII beyond what's already public in the app)
  const realUsers = await db.user.findMany({
    where: { email: { not: "apex.qa.tester2@example.com" } },
    select: { id: true, email: true },
  });
  const activity = [];
  for (const u of realUsers) {
    const c = await db.examAttempt.count({ where: { userId: u.id } });
    if (c > 0) activity.push({ email: u.email, attempts: c });
  }
  console.log(`\nReal users with attempts: ${activity.length}`);
  for (const a of activity) console.log(`  ${a.email}: ${a.attempts} attempt(s)`);

  // 7. Question distribution sanity
  const chapters = await db.question.groupBy({ by: ["chapter"], _count: { id: true }, orderBy: { _count: { id: "desc" } } });
  console.log("\nChapter distribution (top):");
  chapters.slice(0, 8).forEach((c) => console.log(`  ${c.chapter || "NULL"}: ${c._count.id}`));
}

main()
  .catch((e) => { console.error("ERROR:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
