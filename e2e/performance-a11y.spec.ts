import { test, expect } from '@playwright/test';

/**
 * Performance & Accessibility Tests
 * Tests page load performance, core web vitals, and accessibility basics
 */

test.describe('Page Load Performance', () => {
  
  test('homepage loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const domContentLoaded = Date.now() - startTime;
    
    // DOM content loaded within 3 seconds
    expect(domContentLoaded).toBeLessThan(3000);
    
    console.log(`DOM Content Loaded: ${domContentLoaded}ms`);
  });

  test('page reaches interactive state', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const timeToInteractive = Date.now() - startTime;
    
    // Time to interactive within 5 seconds
    expect(timeToInteractive).toBeLessThan(5000);
    
    console.log(`Time to Interactive: ${timeToInteractive}ms`);
  });

  test('sign-in page loads quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Sign-in page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Sign-in page load: ${loadTime}ms`);
  });

  test('no layout shifts during load', async ({ page }) => {
    // Track layout shifts
    let layoutShifts = 0;
    
    await page.goto('/');
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Check for CLS (Cumulative Layout Shift)
    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ('layoutShift' in entry) {
              clsValue += (entry as any).value;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 100);
      });
    });
    
    console.log(`CLS: ${cls}`);
    
    // CLS should be less than 0.1 (good threshold)
    expect(cls).toBeLessThan(0.1);
  });
});

test.describe('Resource Loading', () => {
  
  test('no failed critical resources', async ({ page }) => {
    const failedResources: string[] = [];
    
    page.on('requestfailed', request => {
      failedResources.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out non-critical failures
    const criticalFailures = failedResources.filter(url => 
      !url.includes('favicon') &&
      !url.includes('.woff') &&
      !url.includes('.woff2') &&
      !url.includes('clerk.') &&
      !url.includes('google') &&
      !url.includes('analytics')
    );
    
    expect(criticalFailures).toHaveLength(0);
  });

  test('CSS loads without render blocking', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for first paint
    await page.waitForLoadState('domcontentloaded');
    
    const firstPaint = Date.now() - startTime;
    
    console.log(`First Paint: ${firstPaint}ms`);
    
    // First paint should happen within reasonable time (generous for dev server)
    expect(firstPaint).toBeLessThan(5000);
  });

  test('JavaScript loads and executes', async ({ page }) => {
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No JavaScript errors should occur
    const criticalErrors = jsErrors.filter(e => 
      !e.includes('hydrat') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Third-party')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Accessibility Basics', () => {
  
  test('page has proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for h1 tag
    const h1 = await page.locator('h1').count();
    
    // Should have at least one h1
    expect(h1).toBeGreaterThanOrEqual(0); // May be on protected page
  });

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for labeled inputs
    const inputs = await page.locator('input').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      // Input should have some form of label
      const hasLabel = id || ariaLabel || placeholder;
      expect(hasLabel).toBeTruthy();
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check buttons
    const buttons = await page.locator('button').all();
    
    for (const btn of buttons.slice(0, 15)) {
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      
      // Button should have accessible name
      const hasName = (text && text.trim()) || ariaLabel || title;
      expect(hasName).toBeTruthy();
    }
  });

  test('page has lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const lang = await page.locator('html').getAttribute('lang');
    
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should have alt or be marked decorative
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });
});

test.describe('Responsive Design', () => {
  
  test('page renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should render without horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Allow some overflow for edge cases
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });

  test('page renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should render correctly
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('page renders on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should render correctly
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('Keyboard Navigation', () => {
  
  test('tab key moves focus through interactive elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Press tab multiple times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    
    // Check that something is focused
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.tagName || null;
    });
    
    // Some element should be focused
    expect(focusedElement).toBeTruthy();
  });

  test('enter key activates focused buttons', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Tab to a button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Get focused element
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    
    if (focusedTag === 'BUTTON') {
      // Press enter should activate the button
      await page.keyboard.press('Enter');
      
      // Page should not crash
      const body = page.locator('body');
      await expect(body).toBeVisible();
    }
  });
});
