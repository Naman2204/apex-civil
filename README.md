# Apex Civil Dev - Exam Portal

A full-stack, modern exam portal designed for Civil Engineering students, built with Next.js (App Router), Prisma, Neon Serverless Postgres, and Clerk Authentication. 

This platform allows students to practice topic-specific questions, take timed mock exams, track their performance analytics, and target their weak topics.

## 🚀 Features

- **Practice & Exam Modes:** Take timed strict exams or use practice mode with instant feedback.
- **Detailed Analytics:** Track lifetime accuracy, average time per question, and a 7-day activity radar.
- **Weak Topic Identification:** Automatically tracks which topics you struggle with most and provides quick-links to practice them.
- **Bookmarks:** Save difficult questions for later review.
- **Dynamic Dashboard:** View daily streaks, goals, and upcoming exam countdowns.
- **Real-Time Notifications:** Get alerted for achieved goals, upcoming exams, and system updates.
- **Global Search:** Quickly find specific chapters and topics to study.
- **Theme Support:** Fully optimized light/dark mode UI with dynamic styling.

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (React Server Components, Server Actions)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with Lucide React Icons
- **Database:** PostgreSQL via [Neon](https://neon.tech/) Serverless
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** [Clerk](https://clerk.com/)
- **Process Management:** [PM2](https://pm2.keymetrics.io/)

## 📂 Project Structure

- `src/app/` - Next.js App Router pages and Server Actions (`actions/`).
- `src/components/` - Reusable React components (Dashboard, Exam views, Settings).
- `src/lib/` - Shared utilities like the Prisma database client (`db.ts`) and Auth helpers.
- `prisma/` - Database schema (`schema.prisma`) and migrations.

## ⚙️ Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed.

### 1. Environment Variables
Create a `.env` file in the root directory and add the following keys:

```env
# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
CLERK_SECRET_KEY=your_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Neon Database Connection String
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Sync Database Schema
Push the Prisma schema to your connected Postgres database:
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🚀 Production Deployment (PM2)

To run the application in a production-like environment locally using PM2:

1. Build the Next.js application:
   ```bash
   npm run build
   ```
2. Start the app via PM2:
   ```bash
   pm2 start npm --name "apex-civil-dev" -- start
   ```

## 📝 License
This project is for educational and development purposes.
