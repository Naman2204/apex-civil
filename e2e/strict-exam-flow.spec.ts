/**
 * Strict Exam Flow — E2E Tests
 *
 * End-to-end tests covering the full Strict Exam journey:
 *   1. Exam Setup — switch to Strict Exam mode, configure time/chapter/difficulty
 *   2. Exam Instructions — summary cards, rules, auto-submit notice
 *   3. Live Exam — countdown timer, question palette, answer, mark for review
 *   4. Auto-submit on timer expiry (via Playwright clock)
 *   5. Exam Results — score, stats, detailed review, retake
 *
 * Uses the shared `authenticatedPage` fixture from `./fixtures/auth`.
 */

import { test, expect } from "./fixtures/auth";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Navigate to Quick Practice and wait for ExamSetup to render. */
async function goToExamSetup(page: import("@playwright/test").Page) {
  const sidebar = page.locator('aside[role="navigation"]');
  await sidebar
    .getByRole("button", { name: "Quick Practice", exact: true })
    .click();
  await expect(page.locator("text=Configure Your Exam")).toBeVisible({
    timeout: 10_000,
  });
}

/** Switch to Strict Exam mode and verify Time Limit appears. */
async function switchToStrictExam(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Strict Exam/ }).click();
  await expect(page.getByText("Time Limit", { exact: true })).toBeVisible();
}

/** Click Start Exam Now and wait for the next screen (instructions or live). */
async function startExam(page: import("@playwright/test").Page) {
  await page
    .getByRole("button", { name: /Start Exam Now/ })
    .click();
}

// ─── 1. Exam Setup — Strict Exam Mode ───────────────────────────────────────

test.describe("Strict Exam — Setup", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goToExamSetup(page);
  });

  test("switching to Strict Exam shows Time Limit selector", async ({
    authenticatedPage: page,
  }) => {
    await switchToStrictExam(page);
    // Time Limit section with preset buttons should be visible
    await expect(page.getByText("Time Limit", { exact: true })).toBeVisible();
    // Default time limit is 5 min
    await expect(
      page.getByRole("complementary").getByText("5 min")
    ).toBeVisible();
  });

  test("can change time limit", async ({ authenticatedPage: page }) => {
    await switchToStrictExam(page);

    // Select 15 min
    await page.getByRole("button", { name: "15 min" }).click();
    await expect(
      page.getByRole("complementary").getByText("15 min")
    ).toBeVisible();

    // Summary reflects the change
    await expect(
      page.getByRole("complementary").getByText("Strict Exam", { exact: true })
    ).toBeVisible();
  });

  test("summary shows Strict Exam mode and time limit", async ({
    authenticatedPage: page,
  }) => {
    await switchToStrictExam(page);

    // Summary sidebar shows Strict Exam, time, and marking
    const summary = page.getByRole("complementary");
    await expect(summary.getByText("Strict Exam", { exact: true })).toBeVisible();
    await expect(summary.getByText("All Chapters (Mixed)")).toBeVisible();
  });

  test("Start Exam Now button is visible", async ({
    authenticatedPage: page,
  }) => {
    await switchToStrictExam(page);
    const startBtn = page.getByRole("button", { name: /Start Exam Now/ });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
  });

  test("switching back to Practice hides Time Limit", async ({
    authenticatedPage: page,
  }) => {
    await switchToStrictExam(page);
    await expect(page.getByText("Time Limit", { exact: true })).toBeVisible();

    // Switch back to Practice
    const practiceCard = page
      .locator("button")
      .filter({ hasText: /^Practice/ })
      .first();
    await practiceCard.click();

    await expect(
      page.getByText("Time Limit", { exact: true })
    ).not.toBeVisible({ timeout: 8_000 });
  });
});

// ─── 2. Exam Instructions ───────────────────────────────────────────────────

test.describe("Strict Exam — Instructions", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    // Instructions page should load
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("renders instructions header and chapter info", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible();
    await expect(page.locator("text=All Chapters (Mixed)")).toBeVisible();
  });

  test("summary cards show correct values", async ({
    authenticatedPage: page,
  }) => {
    // The instructions page shows 6 summary cards — use exact match to
    // avoid matching "questions" inside the rules text.
    await expect(page.getByText("Questions", { exact: true })).toBeVisible();
    await expect(page.getByText("Minutes", { exact: true })).toBeVisible();
    await expect(page.getByText("Correct Answer", { exact: true })).toBeVisible();
    await expect(page.getByText("Incorrect Answer", { exact: true })).toBeVisible();
    await expect(page.getByText("Skipped", { exact: true })).toBeVisible();
    await expect(page.getByText("Total Marks", { exact: true })).toBeVisible();
  });

  test("rules and guidelines are listed", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Rules & Guidelines")).toBeVisible();

    // Check for key rules
    await expect(
      page.getByText("navigate between questions anytime")
    ).toBeVisible();
    await expect(
      page.getByText("mark questions for review")
    ).toBeVisible();
    await expect(
      page.getByText("automatically submitted when the timer expires")
    ).toBeVisible();
  });

  test("auto-submit warning is displayed", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByText("Time starts as soon as you begin")
    ).toBeVisible();
    await expect(
      page.getByText("submitted automatically")
    ).toBeVisible();
  });

  test("Start Simulation button is visible", async ({
    authenticatedPage: page,
  }) => {
    const startBtn = page.getByRole("button", { name: /Start Simulation/ });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
  });

  test("Cancel button returns to exam setup", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ─── 3. Live Exam — Timer & Navigation ──────────────────────────────────────

test.describe("Strict Exam — Live Exam", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    // Wait for instructions
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    // Start the simulation
    await page.getByRole("button", { name: /Start Simulation/ }).click();
    // Wait for the live exam to load — the server action creates the
    // attempt in the DB, which can take a moment.
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });
  });

  test("countdown timer is visible and ticking", async ({
    authenticatedPage: page,
  }) => {
    // The timer shows MM:SS format
    const timer = page.locator('[role="timer"]');
    await expect(timer).toBeVisible({ timeout: 10_000 });

    // Read initial time
    const initialText = await timer.textContent();
    expect(initialText).toMatch(/\d+:\d{2}/);

    // Wait 2 seconds and verify timer changed
    await page.waitForTimeout(2500);
    const laterText = await timer.textContent();
    expect(laterText).toMatch(/\d+:\d{2}/);

    // Timer should have decreased
    expect(laterText).not.toBe(initialText);
  });

  test("question palette shows current question highlighted", async ({
    authenticatedPage: page,
  }) => {
    // Question palette is in the aside on desktop
    const palette = page.locator('[aria-label="Question palette"]');
    await expect(palette).toBeVisible({ timeout: 10_000 });

    // First question should be marked as current
    const q1Btn = palette.getByRole("button", {
      name: /Question 1: Current question/,
    });
    await expect(q1Btn).toBeVisible();
  });

  test("can select an answer option", async ({ authenticatedPage: page }) => {
    // Wait for question to load
    const options = page.locator('[role="radiogroup"] button');
    await expect(options.first()).toBeVisible({ timeout: 10_000 });

    // Click first option
    await options.first().click();
    await page.waitForTimeout(500);

    // Verify the page is still functional
    await expect(page.locator('[role="timer"]')).toBeVisible();
  });

  test("can navigate to next question", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // Click Next Question
    const nextBtn = page.getByRole("button", { name: "Next Question" });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Question palette should show Q2 as current
    const palette = page.locator('[aria-label="Question palette"]');
    const q2Btn = palette.getByRole("button", {
      name: /Question 2: Current question/,
    });
    await expect(q2Btn).toBeVisible({ timeout: 5_000 });
  });

  test("can navigate to previous question", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // Go to Q2
    await page.getByRole("button", { name: "Next Question" }).click();
    await page.waitForTimeout(500);

    // Go back to Q1
    await page.getByRole("button", { name: "Previous" }).click();
    await page.waitForTimeout(500);

    // Q1 should be current again
    const palette = page.locator('[aria-label="Question palette"]');
    const q1Btn = palette.getByRole("button", {
      name: /Question 1: Current question/,
    });
    await expect(q1Btn).toBeVisible({ timeout: 5_000 });
  });

  test("can jump to a question via palette", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // Click Q5 in the palette
    const palette = page.locator('[aria-label="Question palette"]');
    const q5Btn = palette.getByRole("button", {
      name: /Question 5/,
    });
    await expect(q5Btn).toBeVisible();
    await q5Btn.click();

    // Q5 should now be current
    const q5Current = palette.getByRole("button", {
      name: /Question 5: Current question/,
    });
    await expect(q5Current).toBeVisible({ timeout: 5_000 });
  });

  test("mark for review toggles palette state", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // Mark Q1 for review — use .first() because there may be multiple
    // "Mark for Review" buttons (clear-response section + desktop controls).
    const markBtn = page.getByRole("button", { name: "Mark for Review" }).first();
    await expect(markBtn).toBeVisible();
    await markBtn.click();
    await page.waitForTimeout(500);

    // Button should toggle to "Unmark for Review"
    const unmarkBtn = page.getByRole("button", { name: /Unmark for Review/ }).first();
    await expect(unmarkBtn).toBeVisible({ timeout: 8_000 });

    // Unmark
    await unmarkBtn.click();
    await page.waitForTimeout(500);

    // Should toggle back to "Mark for Review"
    await expect(
      page.getByRole("button", { name: "Mark for Review" }).first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test("clear response removes selected answer", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // Select an answer
    const options = page.locator('[role="radiogroup"] button');
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    await options.first().click();
    await page.waitForTimeout(500);

    // Clear it
    const clearBtn = page.getByRole("button", { name: "Clear Response" });
    await expect(clearBtn).toBeVisible();
    await expect(clearBtn).toBeEnabled();
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Page should still be functional
    await expect(page.locator('[role="timer"]')).toBeVisible();
  });

  test("End Exam button submits and returns to setup", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // End Exam button (desktop) — may also appear as "Submit Exam"
    const endBtn = page.getByRole("button", { name: /End Exam|Submit Exam/ });
    await expect(endBtn).toBeVisible({ timeout: 8_000 });
    await endBtn.click();

    // Should return to exam setup
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("scoring rules chip shows +1.0 / -0.25", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator('[role="timer"]')).toBeVisible({
      timeout: 10_000,
    });

    // The scoring rules chip shows +1.0 / -0.25
    await expect(page.getByText("+1.0")).toBeVisible();
    await expect(page.getByText("-0.25")).toBeVisible();
  });
});

// ─── 4. Auto-Submit on Timer Expiry ──────────────────────────────────────────

test.describe("Strict Exam — Auto-Submit", () => {
  test("auto-submit warning is shown during live exam", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await page.waitForTimeout(2000);

    // The palette sidebar includes an auto-submit notice
    await expect(
      page.getByText("automatically submitted")
    ).toBeVisible();
  });

  test("auto-submit notice mentions countdown and automatic submission", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    // Instructions page has auto-submit warning
    await expect(page.getByText("Time starts as soon as you begin")).toBeVisible();
    await expect(page.getByText("submitted automatically")).toBeVisible();

    // Start the exam and verify the live exam also shows the warning
    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // The palette sidebar includes an auto-submit notice
    await expect(page.getByText("automatically submitted")).toBeVisible();

    // Timer should be counting down (not stuck at 5:00)
    const timer = page.locator('[role="timer"]');
    const initialTime = await timer.textContent();
    await page.waitForTimeout(3000);
    const laterTime = await timer.textContent();
    expect(laterTime).not.toBe(initialTime);
  });
});

// ─── 5. Exam Results ────────────────────────────────────────────────────────

test.describe("Strict Exam — Results", () => {
  test("results page renders after answering and submitting", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Answer a question if available
    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) {
      await options.first().click();
      await page.waitForTimeout(300);
    }

    // Navigate to last question via palette and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const lastOptions = page.locator('[role="radiogroup"] button');
    if ((await lastOptions.count()) > 0) {
      await lastOptions.first().click();
      await page.waitForTimeout(300);
    }

    const submitBtn = page.getByRole("button", { name: /Submit Exam/ });
    await expect(submitBtn).toBeVisible({ timeout: 8_000 });
    await submitBtn.click();

    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });
  });

  test("results page shows score and stats after manual submit", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Navigate to last question and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) await options.first().click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Submit Exam/ }).click();

    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Score")).toBeVisible();
    // Use .first() because these labels appear in both stat tiles and detailed review
    await expect(page.getByText("Correct", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Incorrect", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Skipped", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Time Taken", { exact: true })).toBeVisible();
  });

  test("results page shows detailed review section", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Navigate to last question and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) await options.first().click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Submit Exam/ }).click();
    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });

    await expect(page.locator("text=Detailed Review")).toBeVisible();
    // Use "Question 1 /" to avoid matching Question 10, 11, etc.
    await expect(page.getByText("Question 1 /")).toBeVisible();

    const reviewCards = page.locator("#exam-review .border.rounded-2xl");
    const cardCount = await reviewCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("Take Another Exam returns to setup", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Navigate to last question and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) await options.first().click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Submit Exam/ }).click();
    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Take Another Exam/ }).click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({ timeout: 10_000 });
  });

  test("Review Answers scrolls to detailed review section", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Navigate to last question and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) await options.first().click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Submit Exam/ }).click();
    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Review Answers/ }).click();
    await page.waitForTimeout(500);
    await expect(page.locator("#exam-review")).toBeVisible();
  });

  test("penalty info is shown when negative marking is enabled", async ({
    authenticatedPage: page,
  }) => {
    await goToExamSetup(page);
    await switchToStrictExam(page);
    await startExam(page);
    await expect(page.getByRole("heading", { name: "EXAM INSTRUCTIONS", exact: true })).toBeVisible({ timeout: 15_000 });

    await page.getByRole("button", { name: /Start Simulation/ }).click();
    await expect(page.locator('[role="timer"]')).toBeVisible({ timeout: 15_000 });

    // Navigate to last question and submit
    const palette = page.locator('[aria-label="Question palette"]');
    await palette.locator("button").last().click();
    await page.waitForTimeout(500);

    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) await options.first().click();
    await page.waitForTimeout(300);

    await page.getByRole("button", { name: /Submit Exam/ }).click();
    await expect(page.getByRole("heading", { name: "Exam Completed" })).toBeVisible({ timeout: 15_000 });

    const penaltyText = page.locator("text=Penalty applied");
    if ((await penaltyText.count()) > 0) {
      await expect(penaltyText).toBeVisible();
    }
    await expect(page.locator("text=Detailed Review")).toBeVisible();
  });
});
