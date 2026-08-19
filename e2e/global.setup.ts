import { clerkSetup } from "@clerk/testing/playwright";
import { config } from "dotenv";

// Load .env so CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY are available
config({ path: ".env" });

/**
 * Playwright global setup — creates a test user in Clerk (if needed),
 * then obtains a Testing Token so every authenticated test can bypass
 * bot detection and sign in via the ticket strategy.
 *
 * Required env vars (already present in .env):
 *   CLERK_PUBLISHABLE_KEY  — Clerk dev-instance publishable key
 *   CLERK_SECRET_KEY       — Clerk dev-instance secret key
 *   CLERK_TEST_USER_EMAIL  — (optional) override default test email
 */

const TEST_EMAIL =
  process.env.CLERK_TEST_USER_EMAIL || "test-e2e@apexcivil-test.com";
const TEST_FIRST_NAME = "E2E";
const TEST_LAST_NAME = "TestUser";
const TEST_USERNAME = "e2e-test-user";

/**
 * Ensure the test user exists in Clerk via the Backend API.
 * If the user already exists, the API returns the existing user.
 */
async function ensureTestUserExists(): Promise<void> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn("[global-setup] CLERK_SECRET_KEY not set — skipping user creation");
    return;
  }

  // Try to find the user first
  const searchUrl = `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(TEST_EMAIL)}`;
  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (searchRes.ok) {
    const data = (await searchRes.json()) as { data: Array<{ id: string }> };
    if (data.data && data.data.length > 0) {
      console.log(`[global-setup] Test user ${TEST_EMAIL} already exists (id: ${data.data[0].id})`);
      return;
    }
  }

  // User doesn't exist — create it
  console.log(`[global-setup] Creating test user ${TEST_EMAIL}...`);
  const createRes = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: [TEST_EMAIL],
      username: TEST_USERNAME,
      first_name: TEST_FIRST_NAME,
      last_name: TEST_LAST_NAME,
      password: "E2E-test-password-2024!",
      skip_password_checks: true,
      skip_password_requirement: true,
    }),
  });

  if (createRes.ok) {
    const user = (await createRes.json()) as { id: string };
    console.log(`[global-setup] Test user created (id: ${user.id})`);
  } else {
    const err = await createRes.text();
    // 422 = user already exists (race condition), which is fine
    if (createRes.status === 422) {
      console.log(`[global-setup] Test user ${TEST_EMAIL} already exists (422)`);
    } else {
      console.error(`[global-setup] Failed to create test user: ${createRes.status} ${err}`);
    }
  }
}

export default async function globalSetup() {
  // 1. Ensure the test user exists in Clerk
  await ensureTestUserExists();

  // 2. Fetch the Clerk Testing Token (bypasses bot detection)
  await clerkSetup();
}
