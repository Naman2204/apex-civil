import { test, expect } from '@playwright/test';

/**
 * Navigation Tests
 * Tests sidebar navigation, page routing, and URL updates
 * Note: These tests run without authentication to test routing structure
 */

test.describe('Navigation Structure', () => {
  
  test('homepage has expected HTML structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for main HTML elements
    const html = await page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');
    
    // Check for viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });

  test('sign-in page has Clerk integration', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('networkidle');
    
    // Clerk should load its components
    // Check for Clerk-related elements or scripts
    const clerkElements = await page.locator('[data-clerk-id], [id*="clerk"], script[src*="clerk"]').count();
    
    // At least some Clerk elements should be present
    expect(clerkElements).toBeGreaterThan(0);
  });

  test('sign-up page has Clerk integration', async ({ page }) => {
    await page.goto('/sign-up');
    await page.waitForLoadState('networkidle');
    
    // Check for Clerk elements
    const clerkElements = await page.locator('[data-clerk-id], [id*="clerk"], script[src*="clerk"]').count();
    
    expect(clerkElements).toBeGreaterThan(0);
  });
});

test.describe('Theme and Styling', () => {
  
  test('page has CSS loaded', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that stylesheets are loaded
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    const inlineStyles = await page.locator('style').count();
    
    // Should have some styles
    expect(stylesheets + inlineStyles).toBeGreaterThan(0);
  });

  test('page has JavaScript loaded', async ({ page }) => {
    // Track JS errors
    const jsErrors: string[] = [];
    
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check for script tags
    const scripts = await page.locator('script[src]').count();
    expect(scripts).toBeGreaterThan(0);
    
    // No critical JS errors should occur
    const criticalErrors = jsErrors.filter(e => 
      !e.includes('hydrat') && 
      !e.includes('ResizeObserver') &&
      !e.includes('favicon')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('responsive viewport meta is correct', async ({ page }) => {
    await page.goto('/');
    
    const viewport = page.locator('meta[name="viewport"]');
    const content = await viewport.getAttribute('content');
    
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');
  });
});

test.describe('Accessibility Basics', () => {
  
  test('page has lang attribute', async ({ page }) => {
    await page.goto('/');
    
    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', /en/);
  });

  test('images have alt attributes or are decorative', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all images
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaHidden = await img.getAttribute('aria-hidden');
      
      // Image should have alt or aria-hidden
      expect(alt !== null || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get all buttons
    const buttons = await page.locator('button').all();
    
    for (const btn of buttons.slice(0, 20)) { // Check first 20 buttons
      const text = await btn.textContent();
      const ariaLabel = await btn.getAttribute('aria-label');
      const title = await btn.getAttribute('title');
      
      // Button should have text, aria-label, or title
      const hasAccessibleName = 
        (text && text.trim().length > 0) || 
        ariaLabel || 
        title;
      
      expect(hasAccessibleName).toBeTruthy();
    }
  });
});

test.describe('Content Security', () => {
  
  test('no inline scripts with dangerous patterns', async ({ page }) => {
    const pageContent = await page.goto('/').then(r => r?.text());
    
    // Check for potentially dangerous inline scripts
    const dangerousPatterns = [
      /eval\s*\(/,
      /document\.write\s*\(/,
      /innerHTML\s*=/,
    ];
    
    for (const pattern of dangerousPatterns) {
      expect(pageContent).not.toMatch(pattern);
    }
  });

  test('meta tags do not expose sensitive info', async ({ page }) => {
    await page.goto('/');
    
    // Check for sensitive meta tags
    const generator = page.locator('meta[name="generator"]');
    const count = await generator.count();
    
    // Should not have generator meta tag
    expect(count).toBe(0);
  });
});
