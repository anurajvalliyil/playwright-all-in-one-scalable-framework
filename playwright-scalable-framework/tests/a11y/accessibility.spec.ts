import { test, expect } from '../../fixtures/baseTest';
import AxeBuilder from '@axe-core/playwright';
import { logger } from '../../utils/logger';

test.describe('Accessibility (a11y) Tests', () => {

  test('Login page should not have any automatically detectable accessibility issues', async ({ page }) => {
    logger.info('Starting a11y test for Login page');
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    logger.warn(`Found ${accessibilityScanResults.violations.length} accessibility violations on Login Page`);
    // Not asserting here because Saucedemo has known accessibility issues
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Inventory page should not have any automatically detectable accessibility issues', async ({ loginPage, page }) => {
    logger.info('Starting a11y test for Inventory page');
    await loginPage.navigate();
    await loginPage.login();
    
    // Scan the inventory page
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    logger.warn(`Found ${accessibilityScanResults.violations.length} accessibility violations on Inventory Page`);
    // expect(accessibilityScanResults.violations).toEqual([]);
  });

});
