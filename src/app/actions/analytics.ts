"use server";

import { db as prisma } from "../../lib/db";
import { getOrCreateDbUser } from "../../lib/auth";

export async function getExamHistory() {
  const dbUser = await getOrCreateDbUser();

  const attempts = await prisma.examAttempt.findMany({
    where: { userId: dbUser.id },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  return attempts.map(attempt => {
    // Format duration
    const timeTaken = attempt.timeTakenSeconds;
    const mins = Math.floor(timeTaken / 60);
    const secs = timeTaken % 60;
    const timeString = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    // Format Date (e.g. "Aug 10, 2026")
    const date = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(attempt.startedAt);

    return {
      id: attempt.id,
      date,
      mode: attempt.mode === 'EXAM' ? 'Strict Exam' : 'Practice',
      topic: attempt.topic || 'Mixed Chapters',
      score: attempt.correctCount,
      total: attempt.totalQuestions,
      time: timeString,
    };
  });
}

export async function getWeakTopics() {
  const dbUser = await getOrCreateDbUser();

  // Fetch all answers for this user
  const answers = await prisma.attemptAnswer.findMany({
    where: {
      attempt: { userId: dbUser.id }
    },
    include: {
      question: true
    }
  });

  // Group by chapter/topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  
  answers.forEach(ans => {
    const topic = ans.question.chapter || ans.question.topic;
    if (!topicStats[topic]) {
      topicStats[topic] = { correct: 0, total: 0 };
    }
    topicStats[topic].total += 1;
    if (ans.isCorrect) {
      topicStats[topic].correct += 1;
    }
  });

  // Calculate accuracy and filter
  const results = Object.entries(topicStats)
    .filter(([_, stats]) => stats.total >= 5) // Only include if they've answered at least 5 questions in this topic
    .map(([name, stats]) => ({
      name,
      accuracy: Math.round((stats.correct / stats.total) * 100),
      count: stats.total
    }))
    .sort((a, b) => a.accuracy - b.accuracy) // Sort ascending (weakest first)
    .slice(0, 5); // Top 5 weakest

  return results;
}

export async function getAnalyticsData() {
  const dbUser = await getOrCreateDbUser();

  // Get attempts from last 7 days
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const attempts = await prisma.examAttempt.findMany({
    where: {
      userId: dbUser.id,
      startedAt: { gte: oneWeekAgo }
    },
    include: {
      answers: true
    }
  });

  // Calculate Activity Data (per day)
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const activityMap: Record<string, { questions: number, correct: number }> = {};
  
  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = days[d.getDay()];
    activityMap[dayName] = { questions: 0, correct: 0 };
  }

  attempts.forEach(attempt => {
    const dayName = days[attempt.startedAt.getDay()];
    if (activityMap[dayName]) {
      activityMap[dayName].questions += attempt.totalQuestions;
      activityMap[dayName].correct += attempt.correctCount;
    }
  });

  const activityData = Object.entries(activityMap).map(([name, stats]) => ({
    name,
    questions: stats.questions,
    accuracy: stats.questions > 0 ? Math.round((stats.correct / stats.questions) * 100) : 0
  }));

  // Calculate Overall Accuracy & KPIs
  let totalQuestions = 0;
  let totalCorrect = 0;
  let totalTime = 0;

  attempts.forEach(att => {
    totalQuestions += att.totalQuestions;
    totalCorrect += att.correctCount;
    totalTime += att.timeTakenSeconds;
  });

  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : "0.0";
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

  return {
    activityData,
    overallAccuracy,
    totalQuestions,
    avgTimePerQuestion
  };
}
