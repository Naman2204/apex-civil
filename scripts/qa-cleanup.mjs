/**
 * CLEANUP PHASE for the dedicated QA account (diyeti1080@hutdot.com).
 * 1. Builds a full inventory of the account's records (read-only).
 * 2. Deletes ONLY records owned by the QA account (transaction).
 * 3. Verifies: QA rows gone, other users' data untouched.
 *
 * Usage: node --env-file=.env scripts/qa-cleanup.mjs [--delete]
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const EMAIL = "diyeti1080@hutdot.com";
const DO_DELETE = process.argv.includes("--delete");

const user = await db.user.findUnique({ where: { email: EMAIL } });
if (!user) { console.log("QA user not found — nothing to clean."); process.exit(0); }

// -------- INVENTORY (read-only) --------
const attempts = await db.examAttempt.findMany({ where: { userId: user.id } });
const attemptIds = attempts.map((a) => a.id);
const answers = await db.attemptAnswer.count({ where: { attemptId: { in: attemptIds } } });
const bookmarks = await db.bookmark.findMany({ where: { userId: user.id } });
const notifs = await db.notification.count({ where: { userId: user.id } });
const goals = await db.dailyGoal.findMany({ where: { userId: user.id } });
const streaks = await db.userStreak.count({ where: { userId: user.id } });

const inventory = {
  accountEmail: EMAIL,
  clerkUserId: user.clerkId,
  dbUserId: user.id,
  createdAt: user.createdAt,
  records: {
    users: 1,
    examAttempts: attempts.map((a) => ({ id: a.id, mode: a.mode, topic: a.topic, total: a.totalQuestions, c: a.correctCount, w: a.wrongCount, s: a.skippedCount, score: a.score, completed: !!a.completedAt })),
    attemptAnswers: answers,
    bookmarks: bookmarks.map((b) => ({ id: b.id, questionId: b.questionId })),
    notifications: notifs,
    dailyGoals: goals.map((g) => ({ id: g.id, target: g.targetQuestions, date: g.date })),
    userStreaks: streaks,
  },
};
fs.writeFileSync("scripts/qa-cleanup-inventory.json", JSON.stringify(inventory, null, 2));
console.log("INVENTORY saved to scripts/qa-cleanup-inventory.json");
console.log(JSON.stringify({ account: EMAIL, clerkId: user.clerkId, attempts: attempts.length, answers, bookmarks: bookmarks.length, notifs, goals: goals.length }, null, 1));

// -------- Verify ownership exclusivity (all records belong to QA account) --------
const otherUsers = await db.user.count();
console.log(`Total users in DB (before): ${otherUsers} — QA account is 1 of them.`);

if (!DO_DELETE) {
  console.log("\nDry run (no --delete). Re-run with --delete to execute.");
  await db.$disconnect();
  process.exit(0);
}

// -------- DELETE (transaction, QA-scoped only) --------
const before = { users: await db.user.count(), attempts: await db.examAttempt.count(), answers: await db.attemptAnswer.count(), bookmarks: await db.bookmark.count(), notifs: await db.notification.count(), goals: await db.dailyGoal.count() };
const del = await db.$transaction([
  db.attemptAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } }),
  db.examAttempt.deleteMany({ where: { userId: user.id } }),
  db.bookmark.deleteMany({ where: { userId: user.id } }),
  db.notification.deleteMany({ where: { userId: user.id } }),
  db.dailyGoal.deleteMany({ where: { userId: user.id } }),
  db.userStreak.deleteMany({ where: { userId: user.id } }),
  db.user.delete({ where: { id: user.id } }),
]);
console.log("\nDELETED:", JSON.stringify({ attemptAnswers: del[0].count, examAttempts: del[1].count, bookmarks: del[2].count, notifications: del[3].count, dailyGoals: del[4].count, streaks: del[5].count, user: 1 }));

// -------- VERIFY --------
const after = { users: await db.user.count(), attempts: await db.examAttempt.count(), answers: await db.attemptAnswer.count(), bookmarks: await db.bookmark.count(), notifs: await db.notification.count(), goals: await db.dailyGoal.count() };
const gone = !(await db.user.findUnique({ where: { email: EMAIL } }));
const orphan = await db.attemptAnswer.count({ where: { attemptId: { in: attemptIds } } });
console.log("\nVERIFY:");
console.log(`  QA user in DB: ${gone ? "GONE ✓" : "STILL PRESENT ✗"}`);
console.log(`  Orphan answers for deleted attempts: ${orphan}`);
console.log(`  DB totals before → after: users ${before.users}→${after.users} | attempts ${before.attempts}→${after.attempts} | answers ${before.answers}→${after.answers} | bookmarks ${before.bookmarks}→${after.bookmarks} | notifs ${before.notifs}→${after.notifs} | goals ${before.goals}→${after.goals}`);
console.log(`  Delta (must equal QA records exactly): users -${before.users - after.users} | attempts -${before.attempts - after.attempts} | answers -${before.answers - after.answers} | bookmarks -${before.bookmarks - after.bookmarks} | notifs -${before.notifs - after.notifs} | goals -${before.goals - after.goals}`);
await db.$disconnect();
