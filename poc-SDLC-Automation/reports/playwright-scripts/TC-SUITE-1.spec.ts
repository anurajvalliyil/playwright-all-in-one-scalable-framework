import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';

test.describe('SauceDemo E2E Test Suite', () => {

  test('End-to-End Test Case', async ({ page }) => {

    // ── Arrange: Initialize Page Objects ──
    const loginPage = new LoginPage(page);
    const productsPage = new ProductsPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    // ── Act & Assert: Login ──
    await loginPage.navigate();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(productsPage.title).toHaveText('Products', { timeout: 5000 });

    // ── Act & Assert: Add Products to Cart ──
    await productsPage.addToCart('Sauce Labs Backpack');
    await productsPage.addToCart('Sauce Labs Bike Light');
    await expect(productsPage.cartBadge).toHaveText('2', { timeout: 5000 });

    // ── Act & Assert: Verify Cart ──
    await productsPage.goToCart();
    await expect(cartPage.cartItems).toHaveCount(2, { timeout: 5000 });

    // ── Act & Assert: Checkout ──
    await cartPage.checkout();
    await checkoutPage.fillInfo('John', 'Doe', '12345');
    await checkoutPage.continue();
    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!', { timeout: 5000 });

    // ── Act & Assert: Return Home and Logout ──
    await checkoutPage.backHome();
    await expect(productsPage.title).toHaveText('Products', { timeout: 5000 });
    await productsPage.logout();
    await expect(loginPage.loginButton).toBeVisible({ timeout: 5000 });
  });
});
