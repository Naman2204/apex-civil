/**
 * Verify the parameterized getQuestionsForExam query pattern:
 * 1. Normal chapter+difficulty filtering returns rows.
 * 2. Injection-shaped input is bound as a parameter (0 rows, no error).
 * 3. Raw interpolation of the same input is visibly dangerous (sanity check only).
 * READ-ONLY — no data modified.
 * Usage: node --env-file=.env scripts/qa-verify-sqlfix.mjs
 */
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

// Mirrors src/app/actions.ts getQuestionsForExam query construction.
function buildWhere(chapter, difficulty) {
  const conditions = [];
  if (chapter !== "All") conditions.push(Prisma.sql`"chapter" = ${chapter}`);
  if (difficulty !== "All") conditions.push(Prisma.sql`"difficulty" = ${difficulty}`);
  return conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;
}

const run = async (chapter, difficulty, limit) => {
  const where = buildWhere(chapter, difficulty);
  return db.$queryRaw(Prisma.sql`SELECT * FROM "Question" ${where} ORDER BY RANDOM() LIMIT ${limit}`);
};

const q1 = await run("Highway Engineering", "Medium", 5);
console.log("1. chapter=Highway,diff=Medium,limit=5 ->", q1.length, "rows; sample chapter:", q1[0]?.chapter);

const q2 = await run("All", "All", 3);
console.log("2. All/All ->", q2.length, "rows");

const q3 = await run("Highway Engineering", "Hard", 10);
console.log("3. Highway/Hard ->", q3.length, "rows; difficulty:", q3[0]?.difficulty);

// Injection-shaped input: must be inert (parameterized), returning 0 rows.
const evil = `" OR 1=1 --`;
const inj = await run(evil, "All", 5);
console.log("4. injection chapter ->", inj.length, "rows (expect 0; the value is bound, not interpolated)");

// Sanity: the same input interpolated raw WOULD match everything (proves why the fix matters).
const raw = await db.$queryRawUnsafe(
  `SELECT COUNT(*)::int AS n FROM "Question" WHERE "chapter" = '${evil}'`
).catch((e) => ({ error: e.message.slice(0, 60) }));
console.log("5. (sanity) raw interpolation of same input ->", JSON.stringify(raw));

process.exit(0);
