"use server";

import { db as prisma } from "../../lib/db";
import { getOrCreateDbUser } from "../../lib/auth";

export async function getExamHistory() {
  const dbUser = await getOrCreateDbUser();

  // History reflects completed exams only — abandoned attempts are not results.
  const attempts = await prisma.examAttempt.findMany({
    where: { userId: dbUser.id, completedAt: { not: null } },
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

    // Format time of day (e.g. "11:40 PM")
    const timeOfDay = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(attempt.startedAt);

    return {
      id: attempt.id,
      date,
      timeOfDay,
      mode: attempt.mode === 'EXAM' ? 'Mock Test' : 'Practice Mode',
      topic: attempt.topic ? (attempt.topic === 'None' ? 'Uncategorized' : attempt.topic) : 'Mixed Chapters',
      score: attempt.correctCount,
      total: attempt.totalQuestions,
      time: timeString,
    };
  });
}

export async function getWeakTopics() {
  const dbUser = await getOrCreateDbUser();

  // Fetch answers from completed attempts only, so abandoned exams do not
  // skew weak-topic accuracy.
  const answers = await prisma.attemptAnswer.findMany({
    where: {
      attempt: { userId: dbUser.id, completedAt: { not: null } }
    },
    select: {
      isCorrect: true,
      question: { select: { chapter: true, topic: true } }
    }
  });

  // Group by chapter/topic
  const topicStats: Record<string, { correct: number; total: number }> = {};
  
  answers.forEach(ans => {
    const rawTopic = ans.question.chapter || ans.question.topic || 'None';
    const topic = rawTopic === 'None' ? 'Uncategorized' : rawTopic;
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

  // Get completed attempts from the last 7 days only — abandoned attempts
  // must not pollute analytics.
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const attempts = await prisma.examAttempt.findMany({
    where: {
      userId: dbUser.id,
      completedAt: { not: null },
      startedAt: { gte: oneWeekAgo }
    },
    include: {
      answers: true
    }
  });

  // Lifetime KPI source. The seven-day query above powers the trend chart only;
  // these totals must not be presented as lifetime values unless they include
  // every completed attempt.
  const lifetimeAttempts = await prisma.examAttempt.findMany({
    where: { userId: dbUser.id, completedAt: { not: null } },
    select: {
      totalQuestions: true,
      correctCount: true,
      timeTakenSeconds: true,
    },
  });

  // Daily activity heatmap source (last 16 weeks + alignment slack).
  const dailyStart = new Date();
  dailyStart.setDate(dailyStart.getDate() - 140);
  const dailyAttempts = await prisma.examAttempt.findMany({
    where: {
      userId: dbUser.id,
      completedAt: { not: null },
      startedAt: { gte: dailyStart }
    },
    select: {
      startedAt: true,
      totalQuestions: true,
      correctCount: true,
    }
  });

  const dailyMap: Record<string, { questions: number; correct: number }> = {};
  for (const attempt of dailyAttempts) {
    const key = attempt.startedAt.toISOString().slice(0, 10);
    if (!dailyMap[key]) dailyMap[key] = { questions: 0, correct: 0 };
    dailyMap[key].questions += attempt.totalQuestions;
    dailyMap[key].correct += attempt.correctCount;
  }
  const dailyActivity = Object.entries(dailyMap)
    .map(([date, stats]) => ({
      date,
      questions: stats.questions,
      correct: stats.correct,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

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

  lifetimeAttempts.forEach(att => {
    totalQuestions += att.totalQuestions;
    totalCorrect += att.correctCount;
    totalTime += att.timeTakenSeconds;
  });

  const overallAccuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : "0.0";
  const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0;

  // Subject Mastery Radar — real per-chapter accuracy from completed answers.
  const radarAnswers = await prisma.attemptAnswer.findMany({
    where: {
      attempt: { userId: dbUser.id, completedAt: { not: null } }
    },
    select: {
      isCorrect: true,
      question: { select: { chapter: true } }
    }
  });
  const radarMap: Record<string, { correct: number; total: number }> = {};
  radarAnswers.forEach((a) => {
    const chapter = a.question.chapter || "Uncategorized";
    if (!radarMap[chapter]) radarMap[chapter] = { correct: 0, total: 0 };
    radarMap[chapter].total += 1;
    if (a.isCorrect) radarMap[chapter].correct += 1;
  });
  const radarData = Object.entries(radarMap)
    .map(([subject, s]) => ({
      subject,
      A: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.A - a.A);

  return {
    activityData,
    overallAccuracy,
    totalQuestions,
    avgTimePerQuestion,
    radarData,
    dailyActivity,
  };
}
