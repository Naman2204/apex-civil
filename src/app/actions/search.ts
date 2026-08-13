"use server";

import { db } from "../../lib/db";

export async function searchTopics(query: string) {
  if (!query || query.trim().length === 0) return [];

  const lowerQuery = query.toLowerCase();

  // We group questions by chapter, so a search queries the distinct chapters.
  // We'll search the chapters to find those matching the query.
  const questions = await db.question.findMany({
    where: {
      chapter: {
        contains: lowerQuery,
        mode: 'insensitive',
      }
    },
    select: {
      chapter: true,
    },
    distinct: ['chapter']
  });

  return questions.map(q => q.chapter).filter(Boolean);
}
