import { test, expect } from '@playwright/test';
import { LoginPage } from '../../page-objects/LoginPage';
import { InventoryPage } from '../../page-objects/InventoryPage';

test.describe('Saucedemo UI Tests', () => {
  test('User should be able to login successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const inventoryPage = new InventoryPage(page);

    await test.step('Navigate to login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Login with valid credentials', async () => {
      await loginPage.login();
    });

    await test.step('Verify successful login', async () => {
      await inventoryPage.verifyIsLoaded();
    });
  });
});
