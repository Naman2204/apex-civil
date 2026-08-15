"use server";

import { db } from "../../lib/db";
import { getOrCreateDbUser } from "../../lib/auth";

export async function getDashboardStats() {
  const user = await getOrCreateDbUser();
  
  // 1. Streak
  let streak = await db.userStreak.findUnique({ where: { userId: user.id } });
  if (!streak) {
    streak = { id: '', userId: user.id, currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }

  // 2. Daily Goal
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Midnight
  let dailyGoal = await db.dailyGoal.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });
  if (!dailyGoal) {
    dailyGoal = { id: '', userId: user.id, date: today, targetQuestions: 50, completedQuestions: 0 };
  }

  // 3. Weak Topics — from COMPLETED attempts only (abandoned attempts must not skew accuracy)
  const attempts = await db.examAttempt.findMany({
    where: { userId: user.id, completedAt: { not: null } },
    select: { topic: true, correctCount: true, totalQuestions: true }
  });
  
  const topicStats: Record<string, { total: number; correct: number }> = {};
  for (const attempt of attempts) {
    const t = attempt.topic || 'Uncategorized';
    if (!topicStats[t]) topicStats[t] = { total: 0, correct: 0 };
    topicStats[t].total += attempt.totalQuestions;
    topicStats[t].correct += attempt.correctCount;
  }
  
  const topicsArray = Object.keys(topicStats).map(topic => {
    const s = topicStats[topic];
    return {
      topic,
      accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
      total: s.total
    };
  });
  
  // Sort by lowest accuracy first, and filter out those with very few questions
  const weakTopics = topicsArray
    .filter(t => t.total >= 5) // At least 5 questions attempted
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3);

  // 3b. Real progress: distinct questions answered per chapter (from all answers),
  // used by the Dashboard overall-progress and topic-card progress bars.
  const answeredRows = await db.attemptAnswer.findMany({
    where: { attempt: { userId: user.id } },
    select: { questionId: true, question: { select: { chapter: true } } },
    distinct: ['questionId']
  });
  const answeredByChapter: Record<string, number> = {};
  for (const row of answeredRows) {
    const ch = row.question.chapter || 'Uncategorized';
    answeredByChapter[ch] = (answeredByChapter[ch] || 0) + 1;
  }
  const totalAnswered = answeredRows.length;

  // 4. Exam Countdown
  let daysRemaining = null;
  if (user.examTargetDate) {
    const diffTime = user.examTargetDate.getTime() - new Date().getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  return {
    streak,
    dailyGoal,
    weakTopics,
    daysRemaining,
    examTargetDate: user.examTargetDate,
    answeredByChapter,
    totalAnswered
  };
}
