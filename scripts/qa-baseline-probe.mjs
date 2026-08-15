import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
console.log("USERS:", users.length);
for (const u of users) {
  const attempts = await db.examAttempt.count({ where: { userId: u.id } });
  const bookmarks = await db.bookmark.count({ where: { userId: u.id } });
  const notifs = await db.notification.count({ where: { userId: u.id } });
  const goals = await db.dailyGoal.count({ where: { userId: u.id } });
  console.log(`  ${u.email} | id=${u.id.slice(0,8)} | clerk=${(u.clerkId||"").slice(0,14)} | attempts=${attempts} bm=${bookmarks} notifs=${notifs} goals=${goals} | targetDate=${u.examTargetDate ? u.examTargetDate.toISOString().slice(0,10) : "none"}`);
}
const q = await db.question.count();
console.log("QUESTION COUNT:", q);
const attempts = await db.examAttempt.findMany({ include: { answers: true } });
const completed = attempts.filter(a => a.completedAt);
const abandoned = attempts.filter(a => !a.completedAt);
console.log(`ATTEMPTS: ${attempts.length} (completed=${completed.length}, abandoned=${abandoned.length})`);
let badC = 0, badS = 0;
for (const a of completed) {
  const sum = a.correctCount + a.wrongCount + a.skippedCount;
  if (sum !== a.totalQuestions) { badC++; console.log("  count mismatch", a.id, sum, a.totalQuestions); }
  const exp = a.negativeMarkingEnabled && a.negativeMarkingPenalty
    ? Math.round(Math.max(0, a.correctCount - a.wrongCount * a.negativeMarkingPenalty) / a.totalQuestions * 100)
    : Math.round(a.correctCount / a.totalQuestions * 100);
  if (exp !== a.score) { badS++; console.log("  score mismatch", a.id, "score", a.score, "exp", exp); }
}
console.log("COUNT MISMATCHES:", badC, "SCORE MISMATCHES:", badS);
await db.$disconnect();
