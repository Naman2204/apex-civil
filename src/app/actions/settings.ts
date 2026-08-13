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
    dailyGoal = await db.dailyGoal.create({
      data: {
        userId: user.id,
        date: today,
        targetQuestions: 50,
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
  const user = await getOrCreateDbUser();

  // Update user's examTargetDate
  await db.user.update({
    where: { id: user.id },
    data: {
      examTargetDate: examTargetDateStr ? new Date(examTargetDateStr) : null,
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
      data: { targetQuestions }
    });
  } else {
    await db.dailyGoal.create({
      data: {
        userId: user.id,
        date: today,
        targetQuestions,
        completedQuestions: 0
      }
    });
  }

  return { success: true };
}
