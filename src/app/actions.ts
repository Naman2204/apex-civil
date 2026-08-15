"use server";

import { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { getOrCreateDbUser } from "../lib/auth";

const VALID_DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const VALID_MODES = ["PRACTICE", "EXAM"];
const MAX_QUESTIONS_PER_EXAM = 200;

function validateChapter(chapter: string): string {
  if (typeof chapter !== "string" || chapter.trim() === "") {
    throw new Error("Invalid chapter");
  }
  if (chapter.length > 200) {
    throw new Error("Invalid chapter");
  }
  return chapter;
}

function validateDifficulty(difficulty: string): string {
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Invalid difficulty");
  }
  return difficulty;
}

function validateLimit(limit: number): number {
  const safeLimit = Math.floor(Number(limit));
  if (!Number.isFinite(safeLimit) || safeLimit < 1 || safeLimit > MAX_QUESTIONS_PER_EXAM) {
    throw new Error("Invalid question count");
  }
  return safeLimit;
}

export async function getChapterStats() {
  const groups = await db.question.groupBy({
    by: ['chapter'],
    _count: { id: true }
  });
  
  const totalQuestions = await db.question.count();
  
  return {
    totalQuestions,
    chapters: groups.map(g => ({
      name: g.chapter || 'Uncategorized',
      count: g._count.id
    }))
  };
}

export async function getQuestionsForExam(chapter: string, difficulty: string, limit: number) {
  await getOrCreateDbUser();

  // Server-side validation — never trust client input.
  const safeChapter = validateChapter(chapter);
  const safeDifficulty = validateDifficulty(difficulty);
  const safeLimit = validateLimit(limit);

  // Parameterized query: no user input is ever interpolated into SQL.
  // All values are passed as Prisma query parameters.
  const conditions: Prisma.Sql[] = [];
  if (safeChapter !== "All") {
    conditions.push(Prisma.sql`"chapter" = ${safeChapter}`);
  }
  if (safeDifficulty !== "All") {
    conditions.push(Prisma.sql`"difficulty" = ${safeDifficulty}`);
  }
  const where = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}` : Prisma.empty;

  const questions = await db.$queryRaw<QuestionRow[]>(
    Prisma.sql`SELECT * FROM "Question" ${where} ORDER BY RANDOM() LIMIT ${safeLimit}`
  );

  return questions.map(q => ({
    id: q.id,
    question: q.questionText,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation ?? undefined,
    difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard' | undefined,
    chapter: q.chapter ?? undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

interface QuestionRow {
  id: string;
  questionText: string;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
  difficulty: string;
  chapter: string | null;
}

export async function startExamAttempt(mode: 'PRACTICE' | 'EXAM', chapter: string, totalQuestions: number, negativeMarkingPenalty?: number) {
  // Server-side validation — never trust client input.
  if (!VALID_MODES.includes(mode)) {
    throw new Error("Invalid exam mode");
  }
  const safeChapter = validateChapter(chapter);
  const safeTotal = Math.floor(Number(totalQuestions));
  if (!Number.isFinite(safeTotal) || safeTotal < 1 || safeTotal > MAX_QUESTIONS_PER_EXAM) {
    throw new Error("Invalid question count");
  }
  const safePenalty = Number(negativeMarkingPenalty) || 0;
  if (safePenalty < 0 || safePenalty > 1) {
    throw new Error("Invalid negative marking penalty");
  }

  const user = await getOrCreateDbUser();
  const attempt = await db.examAttempt.create({
    data: {
      userId: user.id,
      mode,
      topic: safeChapter === 'All' ? null : safeChapter,
      totalQuestions: safeTotal,
      negativeMarkingEnabled: safePenalty > 0,
      negativeMarkingPenalty: safePenalty,
    }
  });
  return attempt.id;
}

export async function saveAttemptAnswer(
  attemptId: string, 
  questionId: string, 
  selectedAnswer: string, 
  _isCorrect: boolean, // Deprecated: correctness is computed server-side and the client value is ignored.
  timeSpentSeconds: number
) {
  const user = await getOrCreateDbUser();

  // Ownership check: the attempt must belong to the authenticated user.
  const attempt = await db.examAttempt.findFirst({
    where: { id: attemptId, userId: user.id },
    select: { id: true, completedAt: true }
  });
  if (!attempt) {
    throw new Error("Attempt not found");
  }
  // Do not mutate answers on an already-completed attempt.
  if (attempt.completedAt) return;

  const question = await db.question.findUnique({
    where: { id: questionId },
    select: { id: true, correctAnswer: true }
  });
  if (!question) {
    throw new Error("Question not found");
  }

  // Correctness is determined by the server against the stored correct answer.
  const computedCorrect = (selectedAnswer || "").trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();

  // Race-safe upsert under the unique (attemptId, questionId) constraint:
  // a concurrent create can never produce a duplicate row (BUG-10).
  const existing = await db.attemptAnswer.findUnique({
    where: { attemptId_questionId: { attemptId, questionId } }
  });

  if (existing) {
    await db.attemptAnswer.update({
      where: { id: existing.id },
      data: { selectedAnswer, isCorrect: computedCorrect, timeSpentSeconds }
    });
  } else {
    try {
      await db.attemptAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedAnswer,
          isCorrect: computedCorrect,
          timeSpentSeconds
        }
      });

      // Increment correct/wrong count on the attempt using the server-computed value
      if (computedCorrect) {
        await db.examAttempt.update({
          where: { id: attemptId },
          data: { correctCount: { increment: 1 } }
        });
      } else {
        await db.examAttempt.update({
          where: { id: attemptId },
          data: { wrongCount: { increment: 1 } }
        });
      }
    } catch (err) {
      // Lost a create race (P2002 unique violation): another request created
      // the row first — update it instead of erroring.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        await db.attemptAnswer.update({
          where: { attemptId_questionId: { attemptId, questionId } },
          data: { selectedAnswer, isCorrect: computedCorrect, timeSpentSeconds }
        });
      } else {
        throw err;
      }
    }
  }
}

export async function finishExamAttemptBatch(
  attemptId: string, 
  timeTakenSeconds: number,
  answers: Record<string, string>
) {
  const user = await getOrCreateDbUser();

  // Everything runs in one transaction so a failure cannot leave the attempt
  // claimed-but-incomplete. Ownership + idempotency: the claim update only
  // matches an attempt owned by this user that is not completed yet, so
  // exactly one concurrent caller wins and duplicates are impossible.
  const finalized = await db.$transaction(async (tx) => {
    const claimed = await tx.examAttempt.updateMany({
      where: { id: attemptId, userId: user.id, completedAt: null },
      data: { completedAt: new Date() }
    });
    if (claimed.count === 0) return null;

    const attempt = await tx.examAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, mode: true, topic: true, totalQuestions: true, negativeMarkingEnabled: true, negativeMarkingPenalty: true }
    });
    if (!attempt) return null;

    // Correctness is ALWAYS computed server-side: the stored correct answer
    // for every answered question is looked up from the database. The client
    // never supplies correctness data (BUG-04).
    const answeredIds = Object.keys(answers).filter((id) => answers[id]);
    const storedQuestions = answeredIds.length > 0
      ? await tx.question.findMany({
          where: { id: { in: answeredIds } },
          select: { id: true, correctAnswer: true }
        })
      : [];
    const correctByQuestion = new Map(storedQuestions.map((q) => [q.id, q.correctAnswer]));

    let correctCount = 0;
    let wrongCount = 0;
    
    const attemptAnswersData: {
      attemptId: string;
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      timeSpentSeconds: number;
    }[] = [];

    for (const [questionId, selected] of Object.entries(answers)) {
      if (!selected) continue;
      const storedCorrect = correctByQuestion.get(questionId);
      if (!storedCorrect) continue; // Unknown question id — never trust it
      const isCorrect = selected.trim().toUpperCase() === storedCorrect.trim().toUpperCase();
      if (isCorrect) correctCount++;
      else wrongCount++;
      
      attemptAnswersData.push({
        attemptId,
        questionId,
        selectedAnswer: selected,
        isCorrect,
        timeSpentSeconds: 0 // In batch, we don't have individual times unless tracked
      });
    }

    // skippedCount must reconcile: correct + wrong + skipped === totalQuestions
    const skippedCount = Math.max(0, attempt.totalQuestions - (correctCount + wrongCount));
    
    // Calculate score
    let score = 0;
    if (attempt.negativeMarkingEnabled && attempt.negativeMarkingPenalty) {
      score = correctCount - (wrongCount * attempt.negativeMarkingPenalty);
      score = Math.max(0, score);
      score = (score / attempt.totalQuestions) * 100;
    } else {
      score = attempt.totalQuestions > 0 ? (correctCount / attempt.totalQuestions) * 100 : 0;
    }

    // Finalize the attempt with server-computed counts and score
    await tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        timeTakenSeconds,
        correctCount,
        wrongCount,
        skippedCount,
        score: Math.round(score)
      }
    });

    // Persist answers idempotently — the unique (attemptId, questionId)
    // constraint means a repeated finish (or pre-saved incremental answers)
    // can never create duplicate rows. Upsert so the stored rows always
    // reflect the FINAL answer state (an answer changed mid-exam must not
    // leave a stale row that disagrees with the recomputed counts).
    for (const row of attemptAnswersData) {
      await tx.attemptAnswer.upsert({
        where: { attemptId_questionId: { attemptId: row.attemptId, questionId: row.questionId } },
        update: { selectedAnswer: row.selectedAnswer, isCorrect: row.isCorrect, timeSpentSeconds: row.timeSpentSeconds },
        create: {
          attemptId: row.attemptId,
          questionId: row.questionId,
          selectedAnswer: row.selectedAnswer,
          isCorrect: row.isCorrect,
          timeSpentSeconds: row.timeSpentSeconds
        }
      });
    }

    return { score: Math.round(score), topic: attempt.topic, mode: attempt.mode };
  });

  if (!finalized) return;

  // Notify the user about the completed exam (established event producer).
  await db.notification.create({
    data: {
      userId: user.id,
      title: "Exam Completed",
      message: `You scored ${finalized.score}% in ${finalized.topic || "Mixed Chapters"} (${finalized.mode === "EXAM" ? "Strict Exam" : "Practice"}).`,
    }
  });
}

export async function finishExamAttempt(attemptId: string, timeTakenSeconds: number) {
  const user = await getOrCreateDbUser();

  // Everything runs in one transaction so a failure cannot leave the attempt
  // claimed-but-incomplete. Ownership + idempotency: the claim update only
  // matches an attempt owned by this user that is not completed yet, so
  // exactly one concurrent caller wins and duplicates are impossible.
  const finalized = await db.$transaction(async (tx) => {
    const claimed = await tx.examAttempt.updateMany({
      where: { id: attemptId, userId: user.id, completedAt: null },
      data: { completedAt: new Date() }
    });
    if (claimed.count === 0) return null;

    const attempt = await tx.examAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, topic: true, totalQuestions: true, negativeMarkingEnabled: true, negativeMarkingPenalty: true }
    });
    if (!attempt) return null;

    // Recompute correctness server-side from the stored answers: the client
    // is never authoritative. Unanswered questions count as skipped.
    const savedAnswers = await tx.attemptAnswer.findMany({
      where: { attemptId },
      select: { selectedAnswer: true, question: { select: { correctAnswer: true } } }
    });
    let correctCount = 0;
    let wrongCount = 0;
    for (const a of savedAnswers) {
      const sel = (a.selectedAnswer || "").trim();
      if (!sel) continue; // unanswered counts as skipped
      if (sel.toUpperCase() === a.question.correctAnswer.trim().toUpperCase()) correctCount++;
      else wrongCount++;
    }

    // Reconcile counts server-side: correct + wrong + skipped MUST equal totalQuestions.
    const skippedCount = Math.max(0, attempt.totalQuestions - (correctCount + wrongCount));

    let score = 0;
    if (attempt.negativeMarkingEnabled && attempt.negativeMarkingPenalty) {
      score = Math.max(0, correctCount - (wrongCount * attempt.negativeMarkingPenalty));
      score = (score / attempt.totalQuestions) * 100;
    } else {
      score = attempt.totalQuestions > 0 ? (correctCount / attempt.totalQuestions) * 100 : 0;
    }

    await tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        timeTakenSeconds,
        correctCount,
        wrongCount,
        skippedCount,
        score: Math.round(score)
      }
    });

    return { score: Math.round(score), topic: attempt.topic };
  });

  if (!finalized) return;

  // Notify the user about the completed exam (established event producer).
  await db.notification.create({
    data: {
      userId: user.id,
      title: "Exam Completed",
      message: `You scored ${finalized.score}% in ${finalized.topic || "Mixed Chapters"} (Practice).`,
    }
  });
}

export async function toggleBookmark(questionId: string) {
  const user = await getOrCreateDbUser();
  
  const existing = await db.bookmark.findUnique({
    where: {
      userId_questionId: {
        userId: user.id,
        questionId
      }
    }
  });

  if (existing) {
    await db.bookmark.delete({
      where: { id: existing.id }
    });
    return false;
  } else {
    await db.bookmark.create({
      data: {
        userId: user.id,
        questionId
      }
    });
    return true;
  }
}

export async function getBookmarks() {
  const user = await getOrCreateDbUser();
  const bookmarks = await db.bookmark.findMany({
    where: { userId: user.id },
    include: {
      question: true
    },
    orderBy: { createdAt: 'desc' }
  });
  return bookmarks.map(b => ({
    ...b.question,
    question: b.question.questionText,
    createdAt: b.question.createdAt.toISOString(),
    updatedAt: b.question.updatedAt.toISOString(),
    options: typeof b.question.options === 'string' 
      ? JSON.parse(b.question.options) 
      : b.question.options
  }));
}
