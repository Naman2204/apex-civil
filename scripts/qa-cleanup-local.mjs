/**
 * LOCAL QA CLEANUP — inventory + scoped transactional delete of every test
 * account created by the local QA/remediation cycle.
 *
 * Test users = every *@example.com automation account (localqa_, secvictim_,
 * secattacker_, probvictim_, probattacker_, hdprobe_, resprobe_, ctrlaudit_,
 * guhaudit_, dbg*, capact_, consist*, probe_, shot_, loop*, fail*, apex.qa.tester2)
 * PLUS diyeti1080@hutdot.com — the documented throwaway QA account from the
 * live audit (QA_REPORT.md §Cleanup Record).
 *
 * Real users (sparta220403@gmail.com, rushikesh.borkar@jupitice.com,
 * sknb420@gmail.com) are NEVER touched and their record counts are verified
 * unchanged after the delete.
 *
 * Usage:
 *   node --env-file=.env scripts/qa-cleanup-local.mjs          (dry run / inventory)
 *   node --env-file=.env scripts/qa-cleanup-local.mjs --delete (execute)
 *   node --env-file=.env scripts/qa-cleanup-local.mjs --verify (verify against saved inventory)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import fs from "fs";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });
const DO_DELETE = process.argv.includes("--delete");
const VERIFY_ONLY = process.argv.includes("--verify");
const REAL_EMAILS = ["sparta220403@gmail.com", "rushikesh.borkar@jupitice.com", "sknb420@gmail.com"];
const DOCUMENTED_QA_EMAILS = ["diyeti1080@hutdot.com"]; // QA_REPORT §Cleanup Record — throwaway audit account
const INVENTORY_FILE = "scripts/qa-cleanup-inventory-local.json";

async function recordCounts(userIds, clerkIds = []) {
  const attempts = await db.examAttempt.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
  const attemptIds = attempts.map((a) => a.id);
  const [users, answers, bookmarks, goals, notifs, streaks, history] = await Promise.all([
    db.user.count({ where: { id: { in: userIds } } }),
    db.attemptAnswer.count({ where: { attemptId: { in: attemptIds } } }),
    db.bookmark.count({ where: { userId: { in: userIds } } }),
    db.dailyGoal.count({ where: { userId: { in: userIds } } }),
    db.notification.count({ where: { userId: { in: userIds } } }),
    db.userStreak.count({ where: { userId: { in: userIds } } }),
    db.examHistory.count({ where: { userId: { in: clerkIds } } }),
  ]);
  return { users, attempts: attempts.length, answers, bookmarks, goals, notifs, streaks, history };
}

async function dbTotals() {
  return {
    users: await db.user.count(), attempts: await db.examAttempt.count(), answers: await db.attemptAnswer.count(),
    bookmarks: await db.bookmark.count(), goals: await db.dailyGoal.count(), notifs: await db.notification.count(),
  };
}

// -------- VERIFY (uses the pre-delete inventory file as ground truth) --------
async function verify() {
  const saved = JSON.parse(fs.readFileSync(INVENTORY_FILE, "utf8"));
  const exp = saved.testRecordTotals;
  const expReal = saved.realUserRecordsBefore;
  const expQ = saved.questionCountBefore;
  const expDb = saved.dbTotalsBefore;
  const testIds = saved.testUsers.map((u) => u.id);

  const after = await recordCounts(testIds);
  const realUsers = await db.user.findMany({ where: { email: { in: REAL_EMAILS } }, select: { id: true, clerkId: true } });
  const realAfter = await recordCounts(realUsers.map((u) => u.id), realUsers.map((u) => u.clerkId));
  const questionCountAfter = await db.question.count();
  const totalAfter = await dbTotals();

  // Orphan checks — rows pointing at records that no longer exist (notIn
  // pattern; Prisma 7 does not allow { is: null } on required relations).
  const remainingAttemptIds = (await db.examAttempt.findMany({ select: { id: true } })).map((a) => a.id);
  const remainingUserIds = (await db.user.findMany({ select: { id: true } })).map((u) => u.id);
  const remainingClerkIds = (await db.user.findMany({ select: { clerkId: true } })).map((u) => u.clerkId);
  const orphans = {
    answers: await db.attemptAnswer.count({ where: { attemptId: { notIn: remainingAttemptIds } } }),
    attempts: await db.examAttempt.count({ where: { userId: { notIn: remainingUserIds } } }),
    bookmarks: await db.bookmark.count({ where: { userId: { notIn: remainingUserIds } } }),
    goals: await db.dailyGoal.count({ where: { userId: { notIn: remainingUserIds } } }),
    notifs: await db.notification.count({ where: { userId: { notIn: remainingUserIds } } }),
    history: await db.examHistory.count({ where: { userId: { notIn: remainingClerkIds } } }),
  };

  console.log("VERIFY (vs saved inventory):");
  console.log(`  Test records remaining: ${JSON.stringify(after)} (must be all 0)`);
  console.log(`  Orphans: ${JSON.stringify(orphans)} (all must be 0)`);
  console.log(`  Real users: ${realAfter.users} (must be ${expReal.users}) | records: ${JSON.stringify(realAfter)} (must equal ${JSON.stringify(expReal)})`);
  console.log(`  Questions: ${expQ} → ${questionCountAfter}`);
  console.log(`  DB totals now: ${JSON.stringify(totalAfter)} | expected after delete: ${JSON.stringify({ users: expDb.users - exp.users, attempts: expDb.attempts - exp.attempts, answers: expDb.answers - exp.answers, bookmarks: expDb.bookmarks - exp.bookmarks, goals: expDb.goals - exp.goals, notifs: expDb.notifs - exp.notifs })}`);

  const deltasMatch = expDb.users - totalAfter.users === exp.users
    && expDb.attempts - totalAfter.attempts === exp.attempts
    && expDb.answers - totalAfter.answers === exp.answers
    && expDb.bookmarks - totalAfter.bookmarks === exp.bookmarks
    && expDb.goals - totalAfter.goals === exp.goals
    && expDb.notifs - totalAfter.notifs === exp.notifs;
  const ok = Object.values(after).every((v) => v === 0)
    && Object.values(orphans).every((v) => v === 0)
    && realAfter.users === expReal.users && JSON.stringify(realAfter) === JSON.stringify(expReal)
    && questionCountAfter === expQ
    && deltasMatch;
  console.log(`\nCLEANUP ${ok ? "OK ✓" : "CHECK FAILED ✗"}`);
  return ok;
}

if (VERIFY_ONLY) {
  const ok = await verify();
  await db.$disconnect();
  process.exit(ok ? 0 : 1);
}

// -------- INVENTORY --------
const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
const testUsers = users.filter((u) => u.email.endsWith("@example.com") || DOCUMENTED_QA_EMAILS.includes(u.email));
const realUsers = users.filter((u) => REAL_EMAILS.includes(u.email));
const otherUsers = users.filter((u) => !testUsers.includes(u) && !realUsers.includes(u));
if (otherUsers.length > 0) {
  console.log("⚠️  UNCLASSIFIED users — aborting:", otherUsers.map((u) => u.email).join(", "));
  await db.$disconnect();
  process.exit(2);
}
const testIds = testUsers.map((u) => u.id);
const realIds = realUsers.map((u) => u.id);
const testClerkIds = testUsers.map((u) => u.clerkId);

const before = await recordCounts(testIds);
const realBefore = await recordCounts(realIds);
const questionCountBefore = await db.question.count();
const totalBefore = await dbTotals();
const historyBefore = await db.examHistory.count({ where: { userId: { in: testClerkIds } } });
before.history = historyBefore;

const inventory = {
  generatedAt: new Date().toISOString(),
  protectedRealEmails: REAL_EMAILS,
  documentedQaRemoved: DOCUMENTED_QA_EMAILS,
  testUsers: testUsers.map((u) => ({ email: u.email, id: u.id, clerkId: u.clerkId, createdAt: u.createdAt.toISOString() })),
  testRecordTotals: before,
  realUserRecordsBefore: realBefore,
  questionCountBefore,
  dbTotalsBefore: totalBefore,
};
fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2));

console.log(`TOTAL USERS: ${users.length} | TEST (to delete): ${testIds.length} | REAL (protected): ${realIds.length}`);
console.log(`TEST RECORDS: ${JSON.stringify(before)}`);
console.log(`REAL RECORDS (before): ${JSON.stringify(realBefore)}`);
console.log(`Questions: ${questionCountBefore}`);
console.log(`DB totals (before): ${JSON.stringify(totalBefore)}`);
console.log(`Inventory saved to ${INVENTORY_FILE}`);

if (!DO_DELETE) {
  console.log("\nDry run — no deletion. Re-run with --delete to execute.");
  await db.$disconnect();
  process.exit(0);
}

// -------- DELETE (single transaction, scoped to test ids) --------
const testAttemptIds = (await db.examAttempt.findMany({ where: { userId: { in: testIds } }, select: { id: true } })).map((a) => a.id);
const del = await db.$transaction([
  db.attemptAnswer.deleteMany({ where: { attemptId: { in: testAttemptIds } } }),
  db.examAttempt.deleteMany({ where: { userId: { in: testIds } } }),
  db.bookmark.deleteMany({ where: { userId: { in: testIds } } }),
  db.notification.deleteMany({ where: { userId: { in: testIds } } }),
  db.dailyGoal.deleteMany({ where: { userId: { in: testIds } } }),
  db.userStreak.deleteMany({ where: { userId: { in: testIds } } }),
  db.examHistory.deleteMany({ where: { userId: { in: testClerkIds } } }),
  db.user.deleteMany({ where: { id: { in: testIds } } }),
]);
console.log("\nDELETED:", JSON.stringify({ answers: del[0].count, attempts: del[1].count, bookmarks: del[2].count, notifs: del[3].count, goals: del[4].count, streaks: del[5].count, history: del[6].count, users: del[7].count }));

const ok = await verify();
await db.$disconnect();
process.exit(ok ? 0 : 1);
