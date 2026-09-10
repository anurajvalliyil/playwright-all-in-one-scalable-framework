import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/logger';

export class CheckoutCompletePage {
  readonly page: Page;
  readonly completeHeader: Locator;

  constructor(page: Page) {
    this.page = page;
    this.completeHeader = page.locator('.complete-header');
  }

  async verifyOrderCompleted() {
    logger.info('Verifying order completion success message');
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
  }
}
