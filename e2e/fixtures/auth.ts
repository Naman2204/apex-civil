/**
 * Clerk Auth Fixture for Playwright E2E Tests
 *
 * Provides two strategies for mocking Clerk authentication:
 *
 * 1. **Ticket strategy** (default) — uses `@clerk/testing` to obtain a Clerk
 *    Testing Token, then signs in via Clerk's ticket flow. This hits Clerk's
 *    API but bypasses email verification and password entry.
 *
 * 2. **Route-interception strategy** — intercepts Clerk's backend API calls at
 *    the network layer and returns fabricated session/JWT data. This avoids
 *    any external API calls, making tests fully deterministic and offline-capable.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth';
 *
 *   test('my test', async ({ authenticatedPage }) => {
 *     // page is already signed in
 *   });
 */

import { test as base, expect, type Page } from "@playwright/test";
import { setupClerkTestingToken, clerk } from "@clerk/testing/playwright";
import { config } from "dotenv";

// Load env
config({ path: ".env" });

const TEST_EMAIL =
  process.env.CLERK_TEST_USER_EMAIL || "test-e2e@apexcivil-test.com";

// ---------------------------------------------------------------------------
// Clerk session cookie helpers
// ---------------------------------------------------------------------------

/**
 * Fabricate a minimal Clerk session JWT for offline mocking.
 * The JWT is unsigned — Clerk's frontend will accept it when the backend
 * verification is also mocked via route interception.
 */
function fabricateSessionJwt(userId: string): string {
  const header = Buffer.from(
    JSON.stringify({ alg: "none", typ: "JWT" })
  ).toString("base64url");

  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iss: "https://clerk.apexcivil-test.com",
      aud: "apexcivil-test",
      iat: now,
      exp: now + 3600,
      sid: "mock-session-001",
    })
  ).toString("base64url");

  return `${header}.${payload}.`;
}

/**
 * Mock Clerk's backend verification endpoints so the Next.js server
 * believes the session cookie is valid.
 */
async function mockClerkBackendForSession(
  page: Page,
  userId: string,
  opts?: { email?: string; firstName?: string; lastName?: string }
): Promise<void> {
  const email = opts?.email || TEST_EMAIL;
  const firstName = opts?.firstName || "E2E";
  const lastName = opts?.lastName || "TestUser";

  // Mock /v1/user/me → returns the authenticated user
  await page.route("**/api.clerk.com/v1/users/me*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: userId,
        object: "user",
        email_addresses: [{ email_address: email, id: "ea_mock" }],
        primary_email_address_id: "ea_mock",
        username: "e2e-test-user",
        first_name: firstName,
        last_name: lastName,
        created_at: Date.now(),
        updated_at: Date.now(),
      }),
    });
  });

  // Mock /v1/sessions → returns the active session
  await page.route("**/api.clerk.com/v1/sessions*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "mock-session-001",
            object: "session",
            status: "active",
            user_id: userId,
            last_active_at: Date.now(),
            expire_at: Date.now() + 3600000,
          },
        ],
      }),
    });
  });

  // Mock /v1/clients → returns the active client
  await page.route("**/api.clerk.com/v1/clients*", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "mock-client-001",
            object: "client",
            sessions: [
              {
                id: "mock-session-001",
                status: "active",
                user_id: userId,
              },
            ],
          },
        ],
      }),
    });
  });
}

// ---------------------------------------------------------------------------
// Custom test fixture
// ---------------------------------------------------------------------------

type AuthFixtures = {
  /**
   * A page already signed in via the ticket strategy.
   * Navigates to "/" and waits for network idle.
   */
  authenticatedPage: Page;

  /**
   * A page with Clerk auth state fully mocked at the network layer.
   * No calls to Clerk's API are made — tests are fully deterministic.
   * Navigates to "/" and waits for network idle.
   */
  mockedAuthPage: Page;

  /** The mock Clerk user ID used by mockedAuthPage */
  mockUserId: string;

  /**
   * Same as authenticatedPage but with Playwright's clock installed BEFORE
   * any page navigation — all setInterval / setTimeout calls (including
   * React useEffect timers) are created with the mocked clock. Use this
   * fixture when you need to fast-forward time (e.g. auto-submit tests).
   */
  clockAuthenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  mockUserId: async ({}, use) => {
    await use("user_mock_abc123");
  },

  clockAuthenticatedPage: async ({ page }, use) => {
    // Install the clock BEFORE any navigation so that every timer
    // (including React's useEffect setInterval) uses the mocked clock.
    await page.clock.install();

    // Then do the same sign-in flow as authenticatedPage.
    await setupClerkTestingToken({ page });
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await clerk.signIn({ page, emailAddress: TEST_EMAIL });
        await page.waitForLoadState("networkidle");
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        await page.context().clearCookies();
      }
    }
    if (lastError) throw lastError;

    await use(page);
  },

  authenticatedPage: async ({ page }, use) => {
    // 1. Set up the testing token (bypasses bot detection)
    await setupClerkTestingToken({ page });

    // 2. Navigate to the app and sign in via Clerk's ticket flow.
    //    Retry up to 3 times — Clerk's ticket endpoint is occasionally flaky
    //    under parallel load (especially with 4 workers).
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("/", { waitUntil: "domcontentloaded" });
        await clerk.signIn({ page, emailAddress: TEST_EMAIL });
        await page.waitForLoadState("networkidle");
        lastError = null;
        break;
      } catch (err) {
        lastError = err;
        // Clear any stale state before retrying
        await page.context().clearCookies();
      }
    }
    if (lastError) throw lastError;

    await use(page);
  },

  mockedAuthPage: async ({ page, mockUserId }, use) => {
    // 1. Mock all Clerk backend endpoints before any navigation
    await mockClerkBackendForSession(page, mockUserId);

    // 2. Also mock the Clerk frontend session check that Next.js server
    //    performs via the /api/auth/mejor similar introspection endpoint.
    //    The Next.js middleware calls Clerk's __session cookie check on the
    //    server side — we simulate a valid response by setting the cookie
    //    and mocking the verification call.
    const sessionJwt = fabricateSessionJwt(mockUserId);
    await page.context().addCookies([
      {
        name: "__session",
        value: sessionJwt,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      },
    ]);

    // 3. Navigate to the app
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await use(page);
  },
});

export { expect };
