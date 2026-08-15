/**
 * READ-ONLY DB validation for the QA account (diyeti1080@hutdot.com).
 * Usage: node --env-file=.env scripts/qa-db-user.mjs
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const user = await db.user.findUnique({ where: { email: "diyeti1080@hutdot.com" } });
if (!user) { console.log("QA user NOT in DB yet"); process.exit(0); }
console.log("QA DB user:", JSON.stringify({ id: user.id, clerkId: user.clerkId, email: user.email, createdAt: user.createdAt, targetDate: user.examTargetDate }));

const attempts = await db.examAttempt.findMany({ where: { userId: user.id }, orderBy: { startedAt: "asc" }, include: { _count: { select: { answers: true } } } });
console.log(`\nAttempts: ${attempts.length}`);
for (const a of attempts) {
  console.log(`  ${a.id.slice(0, 8)} | ${a.mode} | ${a.topic || "Mixed"} | ${a.totalQuestions}Q | C${a.correctCount}/W${a.wrongCount}/S${a.skippedCount} | score=${a.score}% | neg=${a.negativeMarkingEnabled}(p${a.negativeMarkingPenalty}) | ${a.timeTakenSeconds}s | ${a.completedAt ? "completed" : "ABANDONED"} | answers=${a._count.answers}`);
}

const bm = await db.bookmark.findMany({ where: { userId: user.id }, include: { question: { select: { id: true, chapter: true } } } });
console.log(`\nBookmarks: ${bm.length}`);
for (const b of bm) console.log(`  ${b.id.slice(0, 8)} | question ${b.questionId.slice(0, 8)} (${b.question.chapter}) | ${b.createdAt.toISOString()}`);

const notifs = await db.notification.count({ where: { userId: user.id } });
const goals = await db.dailyGoal.findMany({ where: { userId: user.id } });
console.log(`\nNotifications: ${notifs} | DailyGoals: ${goals.length}`);

await db.$disconnect();
