import { Page, Locator, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly title: Locator;
  readonly inventoryList: Locator;
  readonly shoppingCartLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.inventoryList = page.locator('.inventory_list');
    this.shoppingCartLink = page.locator('.shopping_cart_link');
  }

  async verifyIsLoaded() {
    await expect(this.title).toHaveText('Products');
    await expect(this.inventoryList).toBeVisible();
  }

  async addProductToCart(productName: string) {
    // Format product name to match the add-to-cart button's data-test attribute
    // E.g., "Sauce Labs Backpack" -> "add-to-cart-sauce-labs-backpack"
    const formattedName = productName.toLowerCase().replace(/ /g, '-');
    await this.page.locator(`[data-test="add-to-cart-${formattedName}"]`).click();
  }

  async navigateToCart() {
    await this.shoppingCartLink.click();
  }
}
