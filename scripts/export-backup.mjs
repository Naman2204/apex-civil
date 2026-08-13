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
  console.log('Querying all questions from Neon database...');
  
  // Fetch all questions
  const questions = await prisma.question.findMany();
  
  console.log(`Successfully fetched ${questions.length} questions from the database.`);
  
  // Format the date for the filename
  const date = new Date().toISOString().split('T')[0];
  const backupsDir = path.resolve(process.cwd(), 'backups');
  
  // Ensure the backups directory exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  const backupFileName = `questions-backup-${date}.json`;
  const backupFilePath = path.join(backupsDir, backupFileName);
  
  console.log(`Writing to ${backupFilePath}...`);
  fs.writeFileSync(backupFilePath, JSON.stringify(questions, null, 2));
  
  console.log('Export complete!');
  
  // Output a small sample to verify
  console.log('\n--- SAMPLE OF EXPORTED DATA (First 2 questions) ---');
  console.log(JSON.stringify(questions.slice(0, 2), null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
