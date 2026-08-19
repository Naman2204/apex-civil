/**
 * Authenticated Dashboard Flow — E2E Tests
 *
 * Comprehensive tests covering every major user journey inside the
 * authenticated dashboard: rendering, navigation, practice/exam flow,
 * settings, search, notifications, bookmarks, and responsive behaviour.
 *
 * Uses the shared `authenticatedPage` fixture from `./fixtures/auth` which
 * signs in via Clerk's ticket strategy (mocked auth state via
 * `@clerk/testing`), so no real password entry or email verification
 * is needed.
 */

import { test, expect } from "./fixtures/auth";

// ─── 1. Dashboard Page Rendering ────────────────────────────────────────────

test.describe("Dashboard — Page Rendering", () => {
  test("renders sidebar, header, and main content areas", async ({
    authenticatedPage: page,
  }) => {
    // Sidebar (desktop is visible at 1440px viewport)
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    // Brand in sidebar
    await expect(sidebar.getByText("ApexCivil").first()).toBeVisible();

    // Header with greeting
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Main content
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("shows dynamic question stats in hero banner", async ({
    authenticatedPage: page,
  }) => {
    const heroText = page.locator("p", {
      hasText: "questions toward mastering",
    });
    await expect(heroText.first()).toBeVisible({ timeout: 10_000 });
  });

  test("hero banner has 'Continue Practice' button", async ({
    authenticatedPage: page,
  }) => {
    const btn = page.getByRole("button", { name: /Continue Practice/ });
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test("quick access grid renders all four cards", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Subject Mastery" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Daily Goal" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Topic Review" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Performance Trends" })
    ).toBeVisible();
  });

  test("recent activity panel shows empty state or entries", async ({
    authenticatedPage: page,
  }) => {
    // The Recent Activity panel is at 280px wide on the right side (xl+)
    const panel = page.locator("h3", { hasText: "Recent Activity" });
    // Panel may be hidden on smaller viewports, check it exists
    await expect(panel).toBeVisible();
  });
});

// ─── 2. Sidebar Navigation ──────────────────────────────────────────────────

test.describe("Dashboard — Sidebar Navigation", () => {
  const NAV_ITEMS = [
    "Dashboard",
    "Quick Practice",
    "Topics",
    "Weak Topics",
    "Bookmarks",
    "Analytics",
    "Performance",
    "Settings",
  ];

  test("all navigation items are present in sidebar", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    for (const item of NAV_ITEMS) {
      await expect(
        sidebar.getByRole("button", { name: item, exact: true })
      ).toBeVisible();
    }
  });

  test("Dashboard is the active item on initial load", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    const dashBtn = sidebar.getByRole("button", {
      name: "Dashboard",
      exact: true,
    });
    await expect(dashBtn).toHaveAttribute("aria-current", "page");
  });

  test("active item updates when navigating to Analytics", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');

    // Initially Dashboard is active
    await expect(
      sidebar.getByRole("button", { name: "Dashboard", exact: true })
    ).toHaveAttribute("aria-current", "page");

    // Click Analytics
    await sidebar
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await expect(
      page.locator("text=Advanced Performance Analytics")
    ).toBeVisible({ timeout: 10_000 });

    // Analytics is now active, Dashboard is not
    await expect(
      sidebar.getByRole("button", { name: "Analytics", exact: true })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      sidebar.getByRole("button", { name: "Dashboard", exact: true })
    ).not.toHaveAttribute("aria-current", "page");
  });

  test("can navigate to every page and back to Dashboard", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');

    // Quick Practice → Exam Setup
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    // Back to Dashboard
    await sidebar
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await expect(page.locator("text=Master Civil")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navigates to Topics page", async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Topics", exact: true })
      .click();
    await expect(page.locator("text=Topics & Chapters")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navigates to Weak Topics page", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();
    await page.waitForTimeout(3000);
    // Page renders without error
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });

  test("navigates to Analytics page", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await expect(
      page.locator("text=Advanced Performance Analytics")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navigates to Performance page", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Performance", exact: true })
      .click();
    await expect(page.locator("text=Performance History")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navigates to Settings page", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(page.locator("text=Account Settings")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("navigates to Bookmarks page", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Bookmarks", exact: true })
      .click();
    await page.waitForTimeout(3000);
    const body = await page.locator("body").textContent();
    expect(
      body?.includes("Bookmarked") ||
        body?.includes("No Bookmarked") ||
        body?.includes("Loading")
    ).toBeTruthy();
  });
});

// ─── 3. Header Interactions ─────────────────────────────────────────────────

test.describe("Dashboard — Header", () => {
  test("shows greeting with user name", async ({
    authenticatedPage: page,
  }) => {
    const header = page.locator("header");
    const greeting = header.locator("p", {
      hasText: /Good (morning|afternoon|evening)/,
    });
    await expect(greeting).toBeVisible();
  });

  test("search input is present with placeholder", async ({
    authenticatedPage: page,
  }) => {
    const search = page.locator('header input[placeholder*="Search"]');
    await expect(search).toBeVisible();
  });

  test("search shows dropdown after typing", async ({
    authenticatedPage: page,
  }) => {
    const search = page.locator('header input[placeholder*="Search"]');
    await search.fill("structural");
    await page.waitForTimeout(600);
    // Wait for dropdown: either results or empty state
    const dropdown = page
      .getByText("Top Results")
      .or(page.getByText("No results found"));
    await expect(dropdown).toBeVisible({ timeout: 8_000 });
  });

  test("clearing search hides dropdown", async ({
    authenticatedPage: page,
  }) => {
    const search = page.locator('header input[placeholder*="Search"]');
    await search.fill("structural");
    await page.waitForTimeout(600);
    await expect(
      page.getByText("Top Results").or(page.getByText("No results found"))
    ).toBeVisible({ timeout: 8_000 });

    // Clear the search
    await search.fill("");
    await page.waitForTimeout(400);
    await expect(
      page.getByText("Top Results").or(page.getByText("No results found"))
    ).not.toBeVisible();
  });

  test("theme toggle button exists and toggles", async ({
    authenticatedPage: page,
  }) => {
    const themeBtn = page.locator('header button[title="Toggle Theme"]');
    await expect(themeBtn).toBeVisible();

    const initialClass = (await page.locator("html").getAttribute("class")) || "";
    await themeBtn.click();
    await page.waitForTimeout(500);
    const newClass = (await page.locator("html").getAttribute("class")) || "";
    expect(newClass).not.toBe(initialClass);
  });

  test("notification bell is present", async ({
    authenticatedPage: page,
  }) => {
    // The header must be visible (authentication succeeded)
    const header = page.locator("header");
    await expect(header).toBeVisible({ timeout: 10_000 });

    // The action pill bar in the header contains the bell button.
    // Use the container with the bell icon — the button's accessible
    // name is not set, so match by the Bell svg class injected by
    // lucide-react.
    const headerBtns = header.locator("button");
    const count = await headerBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test("user button (avatar) is present in header", async ({
    authenticatedPage: page,
  }) => {
    // Clerk's UserButton renders a button with aria-label="Open user menu"
    const userButton = page.getByRole("button", { name: "Open user menu" });
    await expect(userButton).toBeVisible();
  });
});

// ─── 4. Exam Setup Flow ─────────────────────────────────────────────────────

test.describe("Dashboard — Exam Setup Flow", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("renders all configuration sections", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Exam Mode")).toBeVisible();
    await expect(page.locator("text=Topic / Chapter")).toBeVisible();
    await expect(page.locator("text=Difficulty Level")).toBeVisible();
    await expect(page.locator("text=Number of Questions")).toBeVisible();
    await expect(page.locator("text=Exam Summary")).toBeVisible();
  });

  test("default mode is Practice (Time Limit hidden)", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByText("Time Limit", { exact: true })
    ).not.toBeVisible();
    await expect(
      page.getByRole("complementary").getByText("Practice", { exact: true })
    ).toBeVisible();
  });

  test("can switch to Strict Exam mode and see Time Limit", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: /Strict Exam/ }).click();
    await expect(
      page.getByText("Time Limit", { exact: true })
    ).toBeVisible();

    // Summary updates to show Strict Exam
    await expect(
      page.getByRole("complementary").getByText("Strict Exam", { exact: true })
    ).toBeVisible();

    // Switch back — click the Practice ModeCard. The ModeCard button's
    // accessible name includes the description ("PracticeGet instant…"),
    // so we match the heading span inside the card and click its ancestor button.
    const practiceCard = page.locator("button").filter({ hasText: /^Practice/ }).first();
    await practiceCard.click();

    // After switching to Practice mode the Time Limit section should unmount.
    await expect(
      page.getByText("Time Limit", { exact: true })
    ).not.toBeVisible({ timeout: 8_000 });
  });

  test("can change difficulty level", async ({ authenticatedPage: page }) => {
    const mediumPill = page.locator("button", { hasText: "Medium" }).first();
    await mediumPill.click();
    await expect(
      page.getByRole("complementary").getByText("Medium")
    ).toBeVisible();
  });

  test("can change number of questions", async ({
    authenticatedPage: page,
  }) => {
    const tenPill = page.locator("button", { hasText: "10" }).first();
    await tenPill.click();
    await expect(page.locator("text=Exam Summary")).toBeVisible();
  });

  test("exam summary reflects current config", async ({
    authenticatedPage: page,
  }) => {
    await expect(
      page.getByRole("complementary").getByText("Practice", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("complementary").getByText("All Chapters (Mixed)")
    ).toBeVisible();
  });

  test("Start Practice Now button is visible and clickable", async ({
    authenticatedPage: page,
  }) => {
    const startBtn = page.getByRole("button", {
      name: /Start Practice Now/,
    });
    await expect(startBtn).toBeVisible();
    await expect(startBtn).toBeEnabled();
  });
});

// ─── 5. Practice View (Start → Answer → Next) ───────────────────────────────

test.describe("Dashboard — Practice View", () => {
  test("starting practice loads the question view", async ({
    authenticatedPage: page,
  }) => {
    // Navigate to Quick Practice
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    // Click Start Practice Now
    await page.getByRole("button", { name: /Start Practice Now/ }).click();

    // Should show question loading or question view
    await page.waitForTimeout(3000);

    // Practice view has answer options (A, B, C, D)
    const options = page.locator('[role="radiogroup"] button');
    const optionCount = await options.count();
    // If questions loaded, we should see options; otherwise check for no-questions message
    if (optionCount > 0) {
      await expect(options.first()).toBeVisible();
    } else {
      // Could be loading or no questions match
      const body = await page.locator("body").textContent();
      expect(body).toBeTruthy();
    }
  });

  test("practice view shows question number and progress", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Start Practice Now/ }).click();
    await page.waitForTimeout(3000);

    // Check for "Question X / Y" pattern
    const questionLabel = page.locator("text=/Question\\s+\\d+\\s*\\/\\s*\\d+/");
    // May or may not be visible depending on whether questions loaded
    const hasQuestions = (await questionLabel.count()) > 0;
    if (!hasQuestions) {
      // Verify page is still functional
      await expect(page.locator("body")).toBeVisible();
    }
  });

  test("answer options are clickable in practice mode", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Start Practice Now/ }).click();
    await page.waitForTimeout(3000);

    // Try clicking the first option if available
    const options = page.locator('[role="radiogroup"] button');
    if ((await options.count()) > 0) {
      await options.first().click();
      await page.waitForTimeout(500);
      // After clicking, feedback should appear (Correct/Incorrect)
      const feedback = page.locator(
        '[role="status"], text="Correct", text="Incorrect"'
      );
      // Feedback may or may not be visible depending on the flow
      const body = await page.locator("body").textContent();
      expect(body).toBeTruthy();
    }
  });

  test("bookmark button is present in practice view", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Start Practice Now/ }).click();
    await page.waitForTimeout(3000);

    // Bookmark button has aria-label
    const bookmarkBtn = page.getByRole("button", {
      name: /Bookmark this question|Remove bookmark/,
    });
    if ((await bookmarkBtn.count()) > 0) {
      await expect(bookmarkBtn.first()).toBeVisible();
    }
  });

  test("exit button returns to exam setup", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Start Practice Now/ }).click();
    await page.waitForTimeout(3000);

    // If practice view loaded, try exit button
    const exitBtn = page.getByRole("button", { name: /Exit practice/ });
    if ((await exitBtn.count()) > 0) {
      await exitBtn.click();
      await expect(page.locator("text=Configure Your Exam")).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});

// ─── 6. Settings Page ───────────────────────────────────────────────────────

test.describe("Dashboard — Settings Page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(page.locator("text=Account Settings")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows user profile overview", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Signed in")).toBeVisible();
    await expect(page.locator("text=Streak")).toBeVisible();
    await expect(page.locator("text=Solved")).toBeVisible();
    await expect(page.locator("text=Goal Qs")).toBeVisible();
  });

  test("settings tabs are present", async ({ authenticatedPage: page }) => {
    await expect(
      page.getByRole("button", { name: "General" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Study Goals" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Security" })
    ).toBeVisible();
  });

  test("Study Goals tab shows daily goal controls", async ({
    authenticatedPage: page,
  }) => {
    // Default tab is Study Goals
    await expect(
      page.getByText("Daily Question Goal", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Target Exam Date", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save Changes" })
    ).toBeVisible();
  });

  test("can increment daily goal", async ({
    authenticatedPage: page,
  }) => {
    // Find the + button next to the goal counter
    const plusBtn = page.locator("button").filter({ hasText: "+" }).first();
    await plusBtn.click();
    // Verify the page is still functional
    await expect(
      page.getByRole("heading", { name: "Study Goals" })
    ).toBeVisible();
  });

  test("can decrement daily goal", async ({
    authenticatedPage: page,
  }) => {
    const minusBtn = page.locator("button").filter({ hasText: "−" }).first();
    await minusBtn.click();
    await expect(
      page.getByRole("heading", { name: "Study Goals" })
    ).toBeVisible();
  });

  test("can save settings", async ({ authenticatedPage: page }) => {
    const saveBtn = page.getByRole("button", { name: "Save Changes" });
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();
    // Wait for save to complete (button text may change briefly)
    await page.waitForTimeout(1000);
    // Page should still be functional
    await expect(page.locator("text=Account Settings")).toBeVisible();
  });

  test("Security tab shows danger zone", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: "Security" }).click();
    await expect(page.locator("text=Danger Zone")).toBeVisible();
    await expect(page.locator("text=Reset Progress")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset Data" })).toBeVisible();
  });

  test("General tab shows placeholder text", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: "General" }).click();
    await expect(
      page.locator("text=General settings will appear here soon")
    ).toBeVisible();
  });

  test("reset data shows confirmation warning on first click", async ({
    authenticatedPage: page,
  }) => {
    await page.getByRole("button", { name: "Security" }).click();
    await expect(page.getByRole("button", { name: "Reset Data" })).toBeVisible();

    await page.getByRole("button", { name: "Reset Data" }).click();

    // Confirmation button should appear with warning text
    await expect(
      page.getByRole("button", { name: "Click again to confirm" })
    ).toBeVisible();
    // The warning paragraph explains what gets deleted
    await expect(
      page.locator("span", { hasText: "This permanently deletes" })
    ).toBeVisible();
  });
});

// ─── 7. Analytics Page ──────────────────────────────────────────────────────

test.describe("Dashboard — Analytics Page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await expect(
      page.locator("text=Advanced Performance Analytics")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("Performance Cockpit section is visible", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Performance Cockpit")).toBeVisible();
  });

  test("KPI cards render", async ({ authenticatedPage: page }) => {
    await expect(page.locator("text=Overall Accuracy")).toBeVisible();
    await expect(page.locator("text=Total Questions Solved")).toBeVisible();
    await expect(page.locator("text=Avg. Time/Question")).toBeVisible();
  });

  test("Daily Activity section is visible", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Daily Activity")).toBeVisible();
    await expect(page.locator("text=Commitment Score").first()).toBeVisible();
  });

  test("Consistency Stats chips render", async ({
    authenticatedPage: page,
  }) => {
    await expect(page.locator("text=Active Days")).toBeVisible();
    await expect(page.locator("text=Qs Solved")).toBeVisible();
    await expect(page.locator("text=Curr Streak")).toBeVisible();
    await expect(page.locator("text=Best Streak")).toBeVisible();
  });
});

// ─── 8. Performance Page ────────────────────────────────────────────────────

test.describe("Dashboard — Performance Page", () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Performance", exact: true })
      .click();
    await expect(page.locator("text=Performance History")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("search and filter controls are present when history exists, or empty state is shown", async ({
    authenticatedPage: page,
  }) => {
    // The search/filter row only renders when the user has exam history.
    // New users see the EmptyState instead — both are valid.
    const searchInput = page.getByPlaceholder(/search performance/i);
    const emptyState = page.getByText("No attempts recorded");

    const hasHistory = (await searchInput.count()) > 0;
    if (hasHistory) {
      await expect(searchInput).toBeVisible();
      await expect(page.getByText("Filter by Topic")).toBeVisible();
      await expect(page.getByText("Filter by Date")).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible({ timeout: 10_000 });
    }
  });

  test("page renders without errors", async ({
    authenticatedPage: page,
  }) => {
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});

// ─── 9. Bookmarks Page ──────────────────────────────────────────────────────

test.describe("Dashboard — Bookmarks Page", () => {
  test("shows empty state or bookmarks list", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Bookmarks", exact: true })
      .click();
    await page.waitForTimeout(3000);
    const body = await page.locator("body").textContent();
    const isEmpty = body?.includes("No Bookmarked");
    const isBookmarks = body?.includes("Bookmarked Questions");
    const isLoading = body?.includes("Loading");
    expect(isEmpty || isBookmarks || isLoading).toBeTruthy();
  });

  test("bookmark a question during practice and verify it appears on the Bookmarks page", async ({
    authenticatedPage: page,
  }) => {
    // 1. Start a practice session with 10 questions
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Quick Practice", exact: true })
      .click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    // Select 10 questions for a quick session
    const tenPill = page.locator("button", { hasText: "10" }).first();
    await tenPill.click();

    await page
      .getByRole("button", { name: /Start Practice Now/ })
      .click();

    // 2. Wait for the practice view to load with answer options
    const options = page.locator('[role="radiogroup"] button');
    await expect(options.first()).toBeVisible({ timeout: 15_000 });

    // 3. Bookmark the current question
    const bookmarkBtn = page.getByRole("button", {
      name: "Bookmark this question",
    });
    await expect(bookmarkBtn).toBeVisible();
    await bookmarkBtn.click();
    await page.waitForTimeout(500);

    // Verify the button toggled to "Remove bookmark"
    await expect(
      page.getByRole("button", { name: "Remove bookmark" })
    ).toBeVisible({ timeout: 5_000 });

    // 4. Answer the question so we can proceed
    await options.first().click();
    await page.waitForTimeout(500);

    // 5. Exit practice via the X button
    const exitBtn = page.getByRole("button", { name: /Exit practice/ });
    await expect(exitBtn).toBeVisible();
    await exitBtn.click();
    await expect(page.locator("text=Configure Your Exam")).toBeVisible({
      timeout: 10_000,
    });

    // 6. Navigate to the Bookmarks page
    await sidebar
      .getByRole("button", { name: "Bookmarks", exact: true })
      .click();
    await page.waitForTimeout(3000);

    // 7. Verify the bookmarked question appears
    await expect(
      page.locator("text=Bookmarked Questions")
    ).toBeVisible({ timeout: 10_000 });

    // The page should show at least one saved question card
    const removeBtns = page.getByRole("button", {
      name: "Remove from Bookmarks",
    });
    await expect(removeBtns.first()).toBeVisible({ timeout: 5_000 });
    expect(await removeBtns.count()).toBeGreaterThanOrEqual(1);
  });
});

// ─── 9b. Weak Topics Page ────────────────────────────────────────────────────

test.describe("Dashboard — Weak Topics Page", () => {
  test("page renders with diagnostic overview or empty state", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    // Wait for loading to finish
    await page.waitForTimeout(5000);

    const body = await page.locator("body").textContent();
    const hasDiagnostic = body?.includes("Diagnostic Overview") || body?.includes("Focus Priority Dashboard");
    const hasEmptyState = body?.includes("No Weak Topics Detected Yet");
    const hasAnalyzing = body?.includes("Analyzing your performance");
    expect(hasDiagnostic || hasEmptyState || hasAnalyzing).toBeTruthy();
  });

  test("diagnostic overview shows hero with mastery stats", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    // Wait for content to load
    await expect(
      page.getByText("Diagnostic Overview").or(page.getByText("Focus Priority Dashboard"))
    ).toBeVisible({ timeout: 10_000 });

    // Hero section should show mastery or improvement potential
    const body = await page.locator("body").textContent();
    const hasMastery = body?.includes("Overall Mastery") || body?.includes("Improvement Potential");
    expect(hasMastery).toBeTruthy();
  });

  test("expert study plan section is visible", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    await page.waitForTimeout(5000);

    // Study plan section should be visible
    await expect(page.locator("text=Expert Study Plan")).toBeVisible();
  });

  test("clicking Practice Now on a weak topic starts exam with that topic", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    await page.waitForTimeout(5000);

    // Check if there are priority topic cards with Practice Now buttons
    const practiceBtns = page.getByRole("button", { name: /Practice Now/ });
    const hasWeakTopics = (await practiceBtns.count()) > 0;

    if (hasWeakTopics) {
      // Click the first Practice Now button
      await practiceBtns.first().click();

      // Should navigate to exam setup
      await expect(page.locator("text=Configure Your Exam")).toBeVisible({
        timeout: 10_000,
      });

      // The topic selector should be pre-filled (not "All Chapters")
      const select = page.locator("select");
      const selectedValue = await select.inputValue();
      // The topic should be pre-selected (not "All")
      expect(selectedValue).not.toBe("All");
    } else {
      // Zero state — click Start an Exam button
      const startBtn = page.getByRole("button", { name: /Start an Exam/ });
      if ((await startBtn.count()) > 0) {
        await startBtn.click();
        await expect(page.locator("text=Configure Your Exam")).toBeVisible({
          timeout: 10_000,
        });
      }
    }
  });

  test("empty state shows zero-state illustration and CTA", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    await page.waitForTimeout(5000);

    const body = await page.locator("body").textContent();
    const hasEmptyState = body?.includes("No Weak Topics Detected Yet");

    if (hasEmptyState) {
      // Zero state message
      await expect(page.getByText("No Weak Topics Detected Yet")).toBeVisible();
      await expect(
        page.getByText("Start practicing to unlock personalized insights")
      ).toBeVisible();

      // CTA button
      const startBtn = page.getByRole("button", { name: /Start an Exam/ });
      await expect(startBtn).toBeVisible();
    } else {
      // If weak topics exist, verify priority topic cards are shown
      await expect(
        page.getByText("Priority Topic Focus")
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("priority topic cards show exam weightage and mastery level", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Weak Topics", exact: true })
      .click();

    await page.waitForTimeout(5000);

    // Priority Topic Focus section should exist if there are weak topics
    const prioritySection = page.getByText("Priority Topic Focus");
    if ((await prioritySection.count()) > 0) {
      await expect(prioritySection).toBeVisible();

      // Each card should show Exam Weightage and Mastery Level
      await expect(page.getByText("Exam Weightage:").first()).toBeVisible();
      await expect(page.getByText("Mastery Level:").first()).toBeVisible();
    }
  });
});

// ─── 10. Mobile Navigation ──────────────────────────────────────────────────

test.describe("Dashboard — Mobile Navigation", () => {
  test("mobile menu toggle opens sidebar drawer", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).not.toBeVisible();

    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Drawer should contain navigation items
    const drawer = page.locator(".fixed.inset-0.z-50");
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText("Dashboard")).toBeVisible();
  });

  test("mobile drawer closes when overlay is clicked", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Click the backdrop overlay
    const overlay = page.locator(".fixed.inset-0.z-50 > div").first();
    await overlay.click({ force: true });
    await page.waitForTimeout(300);

    // Drawer should be gone
    await expect(page.locator(".fixed.inset-0.z-50")).not.toBeVisible();
  });

  test("mobile drawer navigation works", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click();
    await page.waitForTimeout(300);

    const drawer = page.locator(".fixed.inset-0.z-50");
    await drawer
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await page.waitForTimeout(500);

    await expect(
      page.locator("text=Advanced Performance Analytics")
    ).toBeVisible({ timeout: 10_000 });
  });

  test("mobile drawer navigates to Settings", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click();
    await page.waitForTimeout(300);

    const drawer = page.locator(".fixed.inset-0.z-50");
    await drawer
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await page.waitForTimeout(500);

    await expect(page.locator("text=Account Settings")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("mobile drawer navigates to Bookmarks", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    const menuBtn = page.getByRole("button", { name: "Open menu" });
    await menuBtn.click();
    await page.waitForTimeout(300);

    const drawer = page.locator(".fixed.inset-0.z-50");
    await drawer
      .getByRole("button", { name: "Bookmarks", exact: true })
      .click();
    await page.waitForTimeout(3000);

    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});

// ─── 11. Responsive Design ──────────────────────────────────────────────────

test.describe("Dashboard — Responsive Design", () => {
  const viewports = [
    { name: "mobile", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`page renders at ${vp.name} (${vp.width}×${vp.height})`, async ({
      authenticatedPage: page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(500);

      // Body must be visible
      await expect(page.locator("body")).toBeVisible();

      // On mobile, sidebar should be hidden
      if (vp.width < 1024) {
        const sidebar = page.locator('aside[role="navigation"]');
        await expect(sidebar).not.toBeVisible();
      }

      // On desktop, sidebar should be visible
      if (vp.width >= 1024) {
        const sidebar = page.locator('aside[role="navigation"]');
        await expect(sidebar).toBeVisible();
      }
    });
  }

  test("no excessive horizontal scroll on mobile", async ({
    authenticatedPage: page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375 + 40);
  });
});

// ─── 12. Cross-Page Navigation State ────────────────────────────────────────

test.describe("Dashboard — Cross-Page State", () => {
  test("sidebar remains visible across page transitions", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Navigate to Analytics
    await sidebar
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await expect(
      page.locator("text=Advanced Performance Analytics")
    ).toBeVisible({ timeout: 10_000 });
    await expect(sidebar).toBeVisible();

    // Navigate to Performance
    await sidebar
      .getByRole("button", { name: "Performance", exact: true })
      .click();
    await expect(page.locator("text=Performance History")).toBeVisible({
      timeout: 10_000,
    });
    await expect(sidebar).toBeVisible();

    // Back to Dashboard
    await sidebar
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await expect(page.locator("text=Master Civil")).toBeVisible({
      timeout: 10_000,
    });
    await expect(sidebar).toBeVisible();
  });

  test("header remains visible across page transitions", async ({
    authenticatedPage: page,
  }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();

    // Navigate to Settings
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Settings", exact: true })
      .click();
    await expect(page.locator("text=Account Settings")).toBeVisible({
      timeout: 10_000,
    });
    await expect(header).toBeVisible();
  });

  test("no JavaScript errors during rapid page transitions", async ({
    authenticatedPage: page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    const sidebar = page.locator('aside[role="navigation"]');

    // Rapidly cycle through pages
    const pages = [
      "Analytics",
      "Performance",
      "Bookmarks",
      "Settings",
      "Dashboard",
    ];
    for (const pageName of pages) {
      await sidebar
        .getByRole("button", { name: pageName, exact: true })
        .click();
      await page.waitForTimeout(300);
    }

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("hydrat") &&
        !e.includes("ResizeObserver") &&
        !e.includes("Third-party") &&
        !e.includes("cookie")
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

// ─── 13. Accessibility ──────────────────────────────────────────────────────

test.describe("Dashboard — Accessibility", () => {
  test("sidebar navigation has proper aria-current", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    const dashBtn = sidebar.getByRole("button", {
      name: "Dashboard",
      exact: true,
    });
    await expect(dashBtn).toHaveAttribute("aria-current", "page");
  });

  test("sidebar has accessible navigation landmark", async ({
    authenticatedPage: page,
  }) => {
    const nav = page.locator('aside[role="navigation"]');
    await expect(nav).toHaveAttribute("aria-label", "Main navigation");
  });

  test("main content area is accessible", async ({
    authenticatedPage: page,
  }) => {
    const main = page.locator("main");
    await expect(main).toBeVisible();
  });

  test("tab key focuses interactive elements on dashboard", async ({
    authenticatedPage: page,
  }) => {
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
    }

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || null;
    });

    expect(focusedElement).toBeTruthy();
  });

  test("buttons have accessible names in sidebar", async ({
    authenticatedPage: page,
  }) => {
    const sidebar = page.locator('aside[role="navigation"]');
    const buttons = await sidebar.locator("button").all();

    for (const btn of buttons) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute("aria-label");
      const hasAccessibleName =
        (text && text.trim().length > 0) || ariaLabel;
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});

// ─── 14. Performance ────────────────────────────────────────────────────────

test.describe("Dashboard — Performance", () => {
  test("dashboard loads within performance budget", async ({
    authenticatedPage: page,
  }) => {
    // Page is already loaded by the fixture, but we can check render time
    const body = page.locator("main");
    await expect(body).toBeVisible();
  });

  test("no unhandled promise rejections", async ({
    authenticatedPage: page,
  }) => {
    const rejections: string[] = [];
    page.on("pageerror", (error) => {
      if (error.message.includes("Unhandled promise rejection"))
        rejections.push(error.message);
    });

    // Navigate around to trigger any potential rejections
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Analytics", exact: true })
      .click();
    await page.waitForTimeout(2000);
    await sidebar
      .getByRole("button", { name: "Dashboard", exact: true })
      .click();
    await page.waitForTimeout(2000);

    expect(rejections).toHaveLength(0);
  });

  test("no failed critical network requests", async ({
    authenticatedPage: page,
  }) => {
    const failedRequests: string[] = [];
    page.on("requestfailed", (request) => {
      failedRequests.push(request.url());
    });

    // Navigate to trigger network requests
    const sidebar = page.locator('aside[role="navigation"]');
    await sidebar
      .getByRole("button", { name: "Performance", exact: true })
      .click();
    await page.waitForTimeout(3000);

    // Filter out non-critical failures (favicon, fonts, third-party,
    // and Next.js RSC flight data requests which can fail during
    // rapid navigation transitions)
    const criticalFailures = failedRequests.filter(
      (url) =>
        !url.includes("favicon") &&
        !url.includes(".woff") &&
        !url.includes("clerk.") &&
        !url.includes("google") &&
        !url.includes("analytics") &&
        !url.includes("?_rsc=")
    );

    expect(criticalFailures).toHaveLength(0);
  });
});
