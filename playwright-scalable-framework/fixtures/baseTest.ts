import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { InventoryPage } from '../page-objects/InventoryPage';
import { CartPage } from '../page-objects/CartPage';
import { CheckoutInfoPage } from '../page-objects/CheckoutInfoPage';
import { CheckoutOverviewPage } from '../page-objects/CheckoutOverviewPage';
import { CheckoutCompletePage } from '../page-objects/CheckoutCompletePage';
import { logger } from '../utils/logger';

type MyFixtures = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutInfoPage: CheckoutInfoPage;
  checkoutOverviewPage: CheckoutOverviewPage;
  checkoutCompletePage: CheckoutCompletePage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    logger.info('Initializing LoginPage fixture');
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    logger.info('Initializing InventoryPage fixture');
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    logger.info('Initializing CartPage fixture');
    await use(new CartPage(page));
  },
  checkoutInfoPage: async ({ page }, use) => {
    logger.info('Initializing CheckoutInfoPage fixture');
    await use(new CheckoutInfoPage(page));
  },
  checkoutOverviewPage: async ({ page }, use) => {
    logger.info('Initializing CheckoutOverviewPage fixture');
    await use(new CheckoutOverviewPage(page));
  },
  checkoutCompletePage: async ({ page }, use) => {
    logger.info('Initializing CheckoutCompletePage fixture');
    await use(new CheckoutCompletePage(page));
  }
});

export { expect } from '@playwright/test';
