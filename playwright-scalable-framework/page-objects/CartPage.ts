import { Page, Locator, expect } from '@playwright/test';
import { logger } from '../utils/logger';

export class CartPage {
  readonly page: Page;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async verifyProductInCart(productName: string) {
    logger.info(`Verifying product "${productName}" is in cart`);
    const productLocator = this.page.locator('.inventory_item_name', { hasText: productName });
    await expect(productLocator).toBeVisible();
  }

  async proceedToCheckout() {
    logger.info('Proceeding to checkout from Cart page');
    await this.checkoutButton.click();
  }
}
