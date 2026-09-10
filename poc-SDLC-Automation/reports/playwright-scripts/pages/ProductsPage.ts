import { type Page, type Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly burgerMenuBtn: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('.title');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartLink = page.locator('.shopping_cart_link');
    this.burgerMenuBtn = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async addToCart(productName: string) {
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await this.page.locator(`[data-test="add-to-cart-${slug}"]`).click({ timeout: 5000 });
  }

  async goToCart() {
    await this.cartLink.click({ timeout: 5000 });
  }

  async logout() {
    await this.burgerMenuBtn.click({ timeout: 5000 });
    await this.logoutLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.logoutLink.click({ timeout: 5000 });
  }
}
