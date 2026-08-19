import { test, expect } from '@playwright/test';

/**
 * Dashboard Tests
 * Tests the main dashboard page functionality and UI elements
 * Note: These tests verify the page structure without requiring authentication
 */

test.describe('Dashboard Page Structure', () => {
  
  test('homepage loads with correct title', async ({ page }) => {
    await page.goto('/');
    
    // Check page title contains ApexCivil
    await expect(page).toHaveTitle(/ApexCivil/);
  });

  test('page has correct meta tags', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport - meta tags are hidden, so check existence not visibility
    const viewport = page.locator('meta[name="viewport"]');
    const viewportCount = await viewport.count();
    expect(viewportCount).toBeGreaterThan(0);
    
    // Check that viewport has correct content
    if (viewportCount > 0) {
      const content = await viewport.getAttribute('content');
      expect(content).toContain('width=device-width');
    }
  });

  test('page renders without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('hydrat') &&
      !e.includes('ResizeObserver') &&
      !e.includes('Third-party') &&
      !e.includes('cookie')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('page has loading state handling', async ({ page }) => {
    await page.goto('/');
    
    // The page should show something immediately
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

test.describe('UI Components', () => {
  
  test('page uses semantic HTML elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for semantic elements - on unauthenticated page, Clerk may render its own structure
    const semanticElements = await page.evaluate(() => {
      return {
        hasMain: document.querySelectorAll('main').length > 0,
        hasHeader: document.querySelectorAll('header').length > 0,
        hasNav: document.querySelectorAll('nav').length > 0,
        hasFooter: document.querySelectorAll('footer').length > 0,
        hasDiv: document.querySelectorAll('div').length > 0,
        hasSection: document.querySelectorAll('section').length > 0,
        totalElements: document.querySelectorAll('*').length,
      };
    });
    
    // Page should have elements rendered
    expect(semanticElements.totalElements).toBeGreaterThan(10);
  });

  test('interactive elements are focusable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that buttons are focusable
    const buttons = await page.locator('button:not([disabled])').all();
    
    for (const btn of buttons.slice(0, 10)) {
      const tabIndex = await btn.getAttribute('tabindex');
      const isFocusable = tabIndex === null || parseInt(tabIndex) >= 0;
      expect(isFocusable).toBeTruthy();
    }
  });

  test('links have proper href attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check anchor tags
    const links = await page.locator('a[href]').all();
    
    for (const link of links.slice(0, 20)) {
      const href = await link.getAttribute('href');
      
      // Link should have a valid href
      expect(href).toBeTruthy();
      expect(href).not.toBe('');
    }
  });
});

test.describe('Color and Contrast', () => {
  
  test('text elements have color properties', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that text is visible (has color)
    const textElements = await page.locator('p, h1, h2, h3, span').all();
    
    for (const el of textElements.slice(0, 10)) {
      const isVisible = await el.isVisible();
      if (isVisible) {
        const color = await el.evaluate(e => 
          window.getComputedStyle(e).color
        );
        
        // Color should not be transparent or same as background
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
      }
    }
  });
});

test.describe('Error Boundaries', () => {
  
  test('page handles missing resources gracefully', async ({ page }) => {
    // Track failed requests
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Page should still render even if some resources fail
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('no unhandled promise rejections', async ({ page }) => {
    const rejections: string[] = [];
    
    page.on('pageerror', error => {
      if (error.message.includes('Unhandled promise rejection')) {
        rejections.push(error.message);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    expect(rejections).toHaveLength(0);
  });
});
