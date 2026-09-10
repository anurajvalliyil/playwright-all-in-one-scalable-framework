import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/logger';

export class CheckoutOverviewPage {
  readonly page: Page;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.finishButton = page.locator('[data-test="finish"]');
  }

  async verifyProductIncluded(productName: string) {
    logger.info(`Verifying product "${productName}" is in checkout overview`);
    const productLocator = this.page.locator('.inventory_item_name', { hasText: productName });
    await expect(productLocator).toBeVisible();
  }

  async finishCheckout() {
    logger.info('Clicking finish on Checkout Overview page');
    await this.finishButton.click();
  }
}
