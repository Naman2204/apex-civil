"use server";

import { db } from "../../lib/db";
import { getOrCreateDbUser } from "../../lib/auth";

export async function getUserSettings() {
  const user = await getOrCreateDbUser();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get or create today's daily goal to return the target
  let dailyGoal = await db.dailyGoal.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (!dailyGoal) {
    const defaultTarget = Number(process.env.DEFAULT_DAILY_GOAL) || 30;
    dailyGoal = await db.dailyGoal.create({
      data: {
        userId: user.id,
        date: today,
        targetQuestions: defaultTarget,
        completedQuestions: 0
      }
    });
  }

  return {
    dailyGoal: dailyGoal.targetQuestions,
    examTargetDate: user.examTargetDate ? user.examTargetDate.toISOString() : null,
  };
}

export async function updateUserSettings(targetQuestions: number, examTargetDateStr: string | null) {
  // Server-side validation — never trust client input.
  const goal = Math.floor(Number(targetQuestions));
  if (!Number.isFinite(goal) || goal < 10 || goal > 500) {
    throw new Error("Daily goal must be between 10 and 500 questions");
  }
  let parsedDate: Date | null = null;
  if (examTargetDateStr) {
    parsedDate = new Date(examTargetDateStr);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new Error("Invalid target exam date");
    }
  }

  const user = await getOrCreateDbUser();

  // Update user's examTargetDate
  await db.user.update({
    where: { id: user.id },
    data: {
      examTargetDate: parsedDate,
    }
  });

  // Update today's daily goal target
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyGoal = await db.dailyGoal.findUnique({
    where: { userId_date: { userId: user.id, date: today } }
  });

  if (dailyGoal) {
    await db.dailyGoal.update({
      where: { id: dailyGoal.id },
      data: { targetQuestions: goal }
    });
  } else {
    await db.dailyGoal.create({
      data: {
        userId: user.id,
        date: today,
        targetQuestions: goal,
        completedQuestions: 0
      }
    });
  }

  return { success: true };
}

/**
 * Danger Zone: permanently delete the authenticated user's progress data
 * (exam attempts, answers, bookmarks, daily goals, streaks, notifications).
 * Runs in a single transaction; the user account itself is preserved so
 * settings (theme, target date) survive. Nothing belonging to other users
 * can be touched — every query is scoped to the authenticated user id.
 */
export async function resetUserData() {
  const user = await getOrCreateDbUser();

  await db.$transaction(async (tx) => {
    await tx.attemptAnswer.deleteMany({
      where: { attempt: { userId: user.id } }
    });
    await tx.examAttempt.deleteMany({ where: { userId: user.id } });
    await tx.bookmark.deleteMany({ where: { userId: user.id } });
    await tx.dailyGoal.deleteMany({ where: { userId: user.id } });
    await tx.userStreak.deleteMany({ where: { userId: user.id } });
    await tx.notification.deleteMany({ where: { userId: user.id } });
  });

  return { success: true };
}
