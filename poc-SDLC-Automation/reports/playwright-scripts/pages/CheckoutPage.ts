import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.completeHeader = page.locator('.complete-header');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  async fillInfo(firstName: string, lastName: string, postalCode: string) {
    await this.firstNameInput.fill(firstName, { timeout: 5000 });
    await this.lastNameInput.fill(lastName, { timeout: 5000 });
    await this.postalCodeInput.fill(postalCode, { timeout: 5000 });
  }

  async continue() {
    await this.continueButton.click({ timeout: 5000 });
  }

  async finish() {
    await this.finishButton.click({ timeout: 5000 });
  }

  async backHome() {
    await this.backHomeButton.click({ timeout: 5000 });
  }
}
