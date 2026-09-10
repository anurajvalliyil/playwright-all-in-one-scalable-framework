import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly title: Locator;
  readonly inventoryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.inventoryList = page.locator('.inventory_list');
  }

  async verifyIsLoaded() {
    await expect(this.title).toHaveText('Products');
    await expect(this.inventoryList).toBeVisible();
  }
}
