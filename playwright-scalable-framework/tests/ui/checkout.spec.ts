import { test, expect } from '../../fixtures/baseTest';
import checkoutData from '../../data/checkoutData.json';
import { logger } from '../../utils/logger';

test.describe('Checkout Flow Tests', () => {

  test('User should be able to complete checkout successfully', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage
  }) => {
    logger.info('--- Starting Checkout Flow Test ---');

    await test.step('Arrange - Login to the application', async () => {
      await loginPage.navigate();
      await loginPage.login();
      await inventoryPage.verifyIsLoaded();
    });

    await test.step('Act - Add products and complete checkout process', async () => {
      // Add products to cart
      for (const product of checkoutData.products) {
        logger.info(`Adding product: ${product}`);
        await inventoryPage.addProductToCart(product);
      }

      // Navigate to cart
      await inventoryPage.navigateToCart();

      // Verify cart and proceed
      for (const product of checkoutData.products) {
        await cartPage.verifyProductInCart(product);
      }
      await cartPage.proceedToCheckout();

      // Fill checkout info
      const { firstName, lastName, postalCode } = checkoutData.checkoutUser;
      await checkoutInfoPage.fillInformation(firstName, lastName, postalCode);
      await checkoutInfoPage.continue();

      // Verify overview and finish
      for (const product of checkoutData.products) {
        await checkoutOverviewPage.verifyProductIncluded(product);
      }
      await checkoutOverviewPage.finishCheckout();
    });

    await test.step('Assert - Verify order completion', async () => {
      await checkoutCompletePage.verifyOrderCompleted();
      logger.info('--- Checkout Flow Test Completed Successfully ---');
    });
  });

});
