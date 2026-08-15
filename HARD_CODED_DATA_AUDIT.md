# Hardcoded Data Audit — ApexCivil

**Scope:** every user-visible data value was traced to its source and, where possible, cross-checked against the live database (`apex-civil.vercel.app`, QA account `diyeti1080@hutdot.com`).

## A. Problematic hardcoded application data (defects)

| # | Value shown | Where | Source | Why it's a defect |
|---|---|---|---|---|
| H-01 | `0 / 8,007 Questions` + "Start practicing to see progress!" | Dashboard — overall progress card | `Dashboard.tsx` L165-167: literal `0` | **Never updates.** After completing real exams (2 attempts in DB), the card still shows `0 / N` and the empty-state message |
| H-02 | `0%` overall progress | Dashboard — progress card | `Dashboard.tsx` L176: literal `0%` | Same — hardcoded, ignores attempt history |
| H-03 | `0%` + empty progress bars on every topic card | Dashboard — 11 topic cards | `Dashboard.tsx` L240-242: `style={{ width: '0%' }}` + literal `0%` | **All 11 chapters show 0%** regardless of per-chapter attempts (e.g. Highway has answered questions but still 0%) |
| H-04 | Radar chart (Analytics) | Analytics — radar | `AnalyticsView.tsx` L28-29: `// For now we'll use placeholder radar data` with hardcoded array | The chart displays **fake data** that never changes and doesn't correspond to the user's actual per-topic performance |
| H-05 | "Welcome back, Student!" | Dashboard greeting | Hardcoded label | Static persona label (cosmetic; not a data defect per se, listed for completeness) |

## B. Correctly dynamic values (verified against DB)

| Value shown | Live value | DB source | Verified? |
|---|---|---|---|
| "8,007 questions" (hero, setup, footer) | 8,007 | `question.count()` = 8,007 | ✅ exact match |
| Chapter counts (267 / 298 / 1155 / 754 / 1410 / 1352 …) | per chapter | `groupBy(chapter).count()` | ✅ spot-checked Railway 267, Highway 1155 |
| Daily goal | 60 | `DailyGoals.targetQuestions` | ✅ (set via Settings, persisted) |
| Daily progress | 0/60 | `completedQuestions` today | ✅ (0 questions today — correct) |
| Exam countdown | "32 Days — Sep 15, 2026" | `user.examTargetDate` | ✅ (date saved in DB, countdown computed) |
| Weak topics | #1 Highway Engineering, 20% | `getWeakTopics()` from attempts | ✅ (10 attempted, 20% accuracy match) |
| Analytics accuracy | 20.0% | computed from completed attempts | ✅ (2 correct / 10) |
| Analytics questions solved | 10 | count of answered questions | ✅ |
| Performance row | 20%, 2/10, 2m 39s | `ExamAttempt` row | ✅ exact match (C2/W8/S0, score 20, 159s) |
| "11 Major Topics" | 11 | `chapterStats.length` | ✅ (11 chapters in DB) |

## C. Acceptable static UI text (not defects)

- Navigation labels (Dashboard, Topics, Settings…)
- Section headings ("Master Civil Engineering", "Detailed Analytics", "Configure Your Exam")
- Marketing copy ("4 Practice Modes ∞ Possibilities", "Access 8,007 meticulously categorized questions" — count itself is dynamic)
- Buttons ("Start Exam Now", "Reveal Answer & Explanation", "Practice")
- Empty-state copy ("No bookmarks yet", "No Weak Topics Yet!")

## D. Method note (H-01..H-03 verification)

Per the audit protocol: the underlying data WAS changed and the UI did NOT change. After two completed exam attempts were recorded in the DB (one with 2 correct answers in Highway Engineering), the Dashboard topic cards and overall progress still rendered hardcoded `0%` / `0 / N`. Source confirms literal values — no state or server action feeds these numbers.

**Conclusion:** 4 hardcoded data defects (H-01–H-04); all other displayed statistics are genuinely dynamic and DB-backed.
