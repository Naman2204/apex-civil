"use server";

import { db } from "../lib/db";
import { getOrCreateDbUser } from "../lib/auth";

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

  const questions = await db.$queryRawUnsafe<any[]>(
    `SELECT * FROM "Question" WHERE ${
      chapter !== 'All' ? `"chapter" = '${chapter}'` : '1=1'
    } AND ${
      difficulty !== 'All' ? `"difficulty" = '${difficulty}'` : '1=1'
    } ORDER BY RANDOM() LIMIT ${limit}`
  );

  return questions.map(q => ({
    id: q.id,
    question: q.questionText,
    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    difficulty: q.difficulty,
    chapter: q.chapter,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export async function startExamAttempt(mode: 'PRACTICE' | 'EXAM', chapter: string, totalQuestions: number, negativeMarkingPenalty?: number) {
  const user = await getOrCreateDbUser();
  const attempt = await db.examAttempt.create({
    data: {
      userId: user.id,
      mode,
      topic: chapter,
      totalQuestions,
      negativeMarkingEnabled: negativeMarkingPenalty ? negativeMarkingPenalty > 0 : false,
      negativeMarkingPenalty: negativeMarkingPenalty || 0,
    }
  });
  return attempt.id;
}

export async function saveAttemptAnswer(
  attemptId: string, 
  questionId: string, 
  selectedAnswer: string, 
  isCorrect: boolean, 
  timeSpentSeconds: number
) {
  // Find if an answer already exists
  const existing = await db.attemptAnswer.findFirst({
    where: { attemptId, questionId }
  });

  if (existing) {
    await db.attemptAnswer.update({
      where: { id: existing.id },
      data: { selectedAnswer, isCorrect, timeSpentSeconds }
    });
  } else {
    await db.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        selectedAnswer,
        isCorrect,
        timeSpentSeconds
      }
    });

    // Increment correct/wrong count on the attempt
    if (isCorrect) {
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
  }
}

export async function finishExamAttemptBatch(
  attemptId: string, 
  timeTakenSeconds: number,
  answers: Record<string, string>,
  questions: any[]
) {
  const attempt = await db.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return;

  let correctCount = 0;
  let wrongCount = 0;
  
  const attemptAnswersData = [];

  for (const q of questions) {
    const selected = answers[q.id];
    if (selected) {
      const isCorrect = selected.toUpperCase() === q.correctAnswer.toUpperCase();
      if (isCorrect) correctCount++;
      else wrongCount++;
      
      attemptAnswersData.push({
        attemptId,
        questionId: q.id,
        selectedAnswer: selected,
        isCorrect,
        timeSpentSeconds: 0 // In batch, we don't have individual times unless tracked
      });
    }
  }

  const skippedCount = attempt.totalQuestions - (correctCount + wrongCount);
  
  // Calculate score
  let score = 0;
  if (attempt.negativeMarkingEnabled && attempt.negativeMarkingPenalty) {
    score = correctCount - (wrongCount * attempt.negativeMarkingPenalty);
    score = Math.max(0, score); // Avoid negative score if desired, or allow negative. Let's allow negative but maybe percentage is weird. 
    // Actually typically competitive exams allow negative score. Let's just keep the raw score, but usually score is a percentage or raw marks.
    // If score is percentage: 
    score = (score / attempt.totalQuestions) * 100;
  } else {
    score = attempt.totalQuestions > 0 ? (correctCount / attempt.totalQuestions) * 100 : 0;
  }

  // Update ExamAttempt
  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      timeTakenSeconds,
      correctCount,
      wrongCount,
      skippedCount,
      score: Math.round(score)
    }
  });

  // Batch insert answers
  if (attemptAnswersData.length > 0) {
    await db.attemptAnswer.createMany({
      data: attemptAnswersData
    });
  }
}

export async function finishExamAttempt(attemptId: string, timeTakenSeconds: number) {
  const attempt = await db.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt) return;

  const scorePercentage = attempt.totalQuestions > 0 
    ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100) 
    : 0;

  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      timeTakenSeconds,
      score: scorePercentage
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
