import { test } from '@playwright/test';
import { PerformanceAudit } from '../../utils/performanceAudit';

test.describe('Performance Tests', () => {
  // Lighthouse needs to connect to the browser's CDP port.
  // We'll launch a specific browser instance just for this test.
  test('Lighthouse audit for Login Page', async ({ playwright }) => {
    // Launch chromium with remote debugging port
    const browser = await playwright.chromium.launch({
      args: ['--remote-debugging-port=9222']
    });
    
    const page = await browser.newPage();
    await page.goto(process.env.BASE_URL || 'https://www.saucedemo.com');
    
    // Run the audit
    await PerformanceAudit.runAudit(page, 9222, 'login-page');
    
    await browser.close();
  });
});
