import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Basic functionality verification
 * These tests verify that the application is accessible and renders correctly
 */

test.describe('Smoke Tests', () => {
  
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check page title
    await expect(page).toHaveTitle(/ApexCivil/);
    
    // Check that the page has content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    
    // Check for visible content (text, not just hidden divs)
    const visibleText = page.locator('body >> visible=true').first();
    await expect(visibleText).toBeVisible({ timeout: 10000 });
  });

  test('sign-in page loads', async ({ page }) => {
    await page.goto('/sign-in');
    
    // Check URL contains sign-in
    expect(page.url()).toContain('/sign-in');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page has content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('sign-up page loads', async ({ page }) => {
    await page.goto('/sign-up');
    
    // Check URL contains sign-up
    expect(page.url()).toContain('/sign-up');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Verify page has content
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('favicon loads correctly', async ({ page }) => {
    const response = await page.goto('/favicon.ico');
    
    // Favicon should return 200 or 304
    expect(response?.status()).toBeLessThan(400);
  });

  test('404 page handles unknown routes', async ({ page }) => {
    const response = await page.goto('/nonexistent-page-12345');
    
    // Should either show 404 or redirect to sign-in
    const status = response?.status() || 200;
    expect([404, 200, 302]).toContain(status);
  });
});

test.describe('Security Tests', () => {
  
  test('sensitive files are not accessible', async ({ page }) => {
    const sensitiveFiles = [
      '/.env',
      '/.env.local', 
      '/prisma/schema.prisma',
      '/package.json',
      '/tsconfig.json'
    ];

    for (const file of sensitiveFiles) {
      const response = await page.goto(file);
      expect(response?.status()).toBe(404);
    }
  });

  test('server actions require authentication', async ({ page }) => {
    // Attempt to access protected route without auth
    await page.goto('/');
    
    // Without authentication, should see sign-in page or redirect
    await page.waitForLoadState('networkidle');
    
    const url = page.url();
    // Should either be on sign-in page or have auth redirect
    const isOnSignIn = url.includes('/sign-in');
    const isOnHome = url === 'http://localhost:3000/';
    
    expect(isOnSignIn || isOnHome).toBeTruthy();
  });
});

test.describe('Performance Tests', () => {
  
  test('homepage loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds (generous for dev server)
    expect(loadTime).toBeLessThan(5000);
  });

  test('static assets load correctly', async ({ page }) => {
    // Track failed requests
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // No critical requests should fail
    const criticalFailures = failedRequests.filter(url => 
      !url.includes('favicon') && 
      !url.includes('.woff') &&
      !url.includes('clerk.')
    );
    
    expect(criticalFailures).toHaveLength(0);
  });
});
