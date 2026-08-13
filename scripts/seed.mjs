import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Reading JSON file...');
  const filePath = path.resolve('../pdf-mcq-local-database/public/Arranged_Questions_By_Chapter.json');
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);

  console.log('Clearing existing questions...');
  await prisma.question.deleteMany({});

  const allQuestions = [];
  
  if (data.chapters && Array.isArray(data.chapters)) {
    data.chapters.forEach((chap) => {
      if (Array.isArray(chap.questions)) {
        chap.questions.forEach((q) => {
          allQuestions.push({
            id: q.id,
            questionText: q.question,
            options: q.options || [],
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || null,
            chapter: q.chapter || 'Uncategorized',
            difficulty: q.difficulty || 'Medium'
          });
        });
      }
    });
  }

  console.log(`Found ${allQuestions.length} questions. Starting bulk insert...`);
  
  // Insert in batches of 1000 to avoid connection limits/timeouts
  const BATCH_SIZE = 1000;
  for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
    const batch = allQuestions.slice(i, i + BATCH_SIZE);
    await prisma.question.createMany({
      data: batch,
      skipDuplicates: true,
    });
    console.log(`Inserted ${Math.min(i + BATCH_SIZE, allQuestions.length)} / ${allQuestions.length}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
