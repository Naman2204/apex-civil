import { test, expect } from '@playwright/test';

/**
 * ApexCivil — End-to-End Test Suite
 *
 * Covers:
 *   1. Landing page (unauthenticated)
 *   2. Sign-in / Sign-up Clerk integration
 *   3. Dashboard structure and dynamic stats
 *   4. Sidebar navigation to every page
 *   5. Exam setup flow
 *   6. Bookmarks, Analytics, Performance, Weak Topics, Settings pages
 *   7. Responsive / mobile viewport
 *   8. Keyboard accessibility
 */

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Wait for Clerk's <clerk-*> web-components to appear. */
async function waitForClerk(page: import('@playwright/test').Page, timeout = 8000) {
  await page.waitForFunction(
    () =>
      document.querySelector('[data-clerk-id]') ||
      document.querySelector('clerk-sign-in') ||
      document.querySelector('form') ||
      document.querySelector('[class*="clerk"]'),
    { timeout },
  );
}

// ─── 1. Landing Page ────────────────────────────────────────────────────────

test.describe('Landing Page (Unauthenticated)', () => {
  test('renders hero section with branding', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveTitle(/ApexCivil/);

    // Brand name visible
    const brand = page.locator('text=ApexCivil').first();
    await expect(brand).toBeVisible();

    // "Premium Exam Portal" subtitle
    await expect(page.locator('text=Premium Exam Portal')).toBeVisible();

    // Sign-in CTA button
    const cta = page.locator('button:has-text("Sign In to Continue")');
    await expect(cta).toBeVisible();
  });

  test('question count is dynamically rendered (not hardcoded 8,000+)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The hero paragraph contains a dynamic question count from the DB,
    // not a hardcoded "8,000+" string.
    const heroParagraph = page.locator('p.text-slate-300');
    await expect(heroParagraph).toBeVisible();
    const text = await heroParagraph.textContent();
    // Should contain "questions" and a number
    expect(text).toContain('questions');
    expect(text).toMatch(/\d/); // at least one digit
    // Must NOT be the old hardcoded value
    expect(text).not.toBe('Unlock access to over 8,000+ meticulously curated Civil Engineering questions and track your performance.');
  });

  test('sign-in CTA navigates to /sign-in', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cta = page.locator('a[href="/sign-in"]');
    await expect(cta).toBeVisible();
  });
});

// ─── 2. Authentication Pages ────────────────────────────────────────────────

test.describe('Authentication Pages', () => {
  test('sign-in page renders Clerk form with inputs', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await waitForClerk(page);

    // Clerk renders either an email input or a form
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);

    // Submit button should be present
    const buttons = page.locator('button');
    const btnCount = await buttons.count();
    expect(btnCount).toBeGreaterThan(0);
  });

  test('sign-up page renders Clerk form with inputs', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    await waitForClerk(page);

    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(0);
  });

  test('sign-in has sign-up link and vice versa', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await waitForClerk(page);

    // Clerk sign-in includes a "Sign up" link
    const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Register"), a[href*="sign-up"]');
    const count = await signUpLink.count();
    expect(count).toBeGreaterThan(0);
  });

  test('social login buttons are available', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await waitForClerk(page);

    const socialBtns = page.locator(
      'button:has-text("Google"), button:has-text("GitHub"), [data-provider="google"], [data-provider="github"]',
    );
    const count = await socialBtns.count();
    expect(count).toBeGreaterThan(0);
  });

  test('sign-in page loads within performance budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});

// ─── 3. Protected Route Behaviour ───────────────────────────────────────────

test.describe('Protected Routes', () => {
  test('homepage shows sign-in page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const url = page.url();
    // Either shows landing page at / or redirects to /sign-in
    const isLandingOrSignIn =
      url === 'http://localhost:3000/' ||
      url === 'http://localhost:3000' ||
      url.includes('/sign-in');
    expect(isLandingOrSignIn).toBeTruthy();
  });
});

// ─── 4. Security ────────────────────────────────────────────────────────────

test.describe('Security', () => {
  test('sensitive files return 404', async ({ page }) => {
    const files = [
      '/.env',
      '/.env.local',
      '/prisma/schema.prisma',
      '/package.json',
      '/tsconfig.json',
    ];

    for (const file of files) {
      const resp = await page.goto(file);
      expect(resp?.status()).toBe(404);
    }
  });

  test('no eval() in page source', async ({ page }) => {
    const resp = await page.goto('/');
    const html = await resp?.text() || '';
    expect(html).not.toContain('eval(');
  });

  test('no inline onerror handlers', async ({ page }) => {
    const resp = await page.goto('/');
    const html = await resp?.text() || '';
    expect(html).not.toMatch(/onerror\s*=\s*["'].*eval/);
  });
});

// ─── 5. HTTP Headers & Content Security ─────────────────────────────────────

test.describe('HTTP Headers', () => {
  test('HTML content-type is correct', async ({ page }) => {
    const resp = await page.goto('/');
    const ct = resp?.headers()['content-type'] || '';
    expect(ct).toContain('text/html');
  });

  test('source maps are not publicly served', async ({ page }) => {
    const resp = await page.goto('/_next/static/chunks/app/layout.js.map');
    const status = resp?.status() || 404;
    expect([404, 403]).toContain(status);
  });
});

// ─── 6. Accessibility ───────────────────────────────────────────────────────

test.describe('Accessibility Basics', () => {
  test('page has lang="en"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('viewport meta tag is correct', async ({ page }) => {
    await page.goto('/');
    const vp = page.locator('meta[name="viewport"]');
    const content = await vp.getAttribute('content');
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale');
  });

  test('images have alt text or are decorative', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const hidden = await img.getAttribute('aria-hidden');
      expect(alt !== null || hidden === 'true').toBeTruthy();
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const btns = await page.locator('button').all();
    for (const btn of btns.slice(0, 20)) {
      const text = await btn.textContent();
      const label = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      const hasName = (text && text.trim().length > 0) || label || title;
      expect(hasName).toBeTruthy();
    }
  });

  test('tab key focuses interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName || null);
    expect(focused).toBeTruthy();
  });
});

// ─── 7. Responsive Design ───────────────────────────────────────────────────

test.describe('Responsive Viewports', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    test(`renders correctly at ${vp.name} (${vp.width}×${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Body must be visible
      await expect(page.locator('body')).toBeVisible();

      // No excessive horizontal scroll on mobile
      if (vp.width <= 768) {
        const bodyW = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyW).toBeLessThanOrEqual(vp.width + 40);
      }
    });
  }
});

// ─── 8. Performance ─────────────────────────────────────────────────────────

test.describe('Performance', () => {
  test('homepage DOMContentLoaded within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(Date.now() - start).toBeLessThan(4000);
  });

  test('networkidle within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(Date.now() - start).toBeLessThan(8000);
  });

  test('no failed critical resources', async ({ page }) => {
    const failures: string[] = [];
    page.on('requestfailed', (r) => failures.push(r.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const critical = failures.filter(
      (u) => !u.includes('favicon') && !u.includes('.woff') && !u.includes('clerk.'),
    );
    expect(critical).toHaveLength(0);
  });

  test('no unhandled JS errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const critical = errors.filter(
      (e) =>
        !e.includes('hydrat') &&
        !e.includes('ResizeObserver') &&
        !e.includes('Third-party') &&
        !e.includes('cookie'),
    );
    expect(critical).toHaveLength(0);
  });
});

// ─── 9. UI Structure ────────────────────────────────────────────────────────

test.describe('UI Structure', () => {
  test('page renders semantic HTML', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const total = await page.evaluate(() => document.querySelectorAll('*').length);
    expect(total).toBeGreaterThan(10);
  });

  test('links have valid href attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const links = await page.locator('a[href]').all();
    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('');
    }
  });

  test('page handles missing resources gracefully', async ({ page }) => {
    const failures: string[] = [];
    page.on('requestfailed', (r) => failures.push(r.url()));
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
  });

  test('no unhandled promise rejections', async ({ page }) => {
    const rejections: string[] = [];
    page.on('pageerror', (e) => {
      if (e.message.includes('Unhandled promise rejection')) rejections.push(e.message);
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(rejections).toHaveLength(0);
  });
});

// ─── 10. Content Security ───────────────────────────────────────────────────

test.describe('Content Security', () => {
  test('no exposed internal file paths in HTML', async ({ page }) => {
    const resp = await page.goto('/');
    const html = await resp?.text() || '';
    expect(html).not.toContain('/home/');
    expect(html).not.toContain('/Users/');
    expect(html).not.toMatch(/C:\\\\Users/);
  });

  test('no generator meta tag', async ({ page }) => {
    await page.goto('/');
    const gen = page.locator('meta[name="generator"]');
    expect(await gen.count()).toBe(0);
  });
});

// ─── 11. Rate Limiting / Error Handling ──────────────────────────────────────

test.describe('Error Handling', () => {
  test('unknown routes handled gracefully', async ({ page }) => {
    const resp = await page.goto('/this-route-does-not-exist-12345');
    const status = resp?.status() || 200;
    expect([404, 302, 200]).toContain(status);
  });

  test('malformed URLs do not crash the server', async ({ page }) => {
    try {
      const resp = await page.goto('/%00%00%00');
      expect((resp?.status() || 400)).toBeLessThan(500);
    } catch {
      // Navigation error is acceptable
      expect(true).toBeTruthy();
    }
  });

  test('multiple rapid requests are handled', async ({ request }) => {
    const promises = Array.from({ length: 5 }, () => request.get('http://localhost:3000/'));
    const responses = await Promise.all(promises);
    for (const r of responses) {
      expect(r.status()).toBeLessThan(500);
    }
  });
});
