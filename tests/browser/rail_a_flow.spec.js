// Rail A end-to-end: sleep query → Sleep Reset card → Add to Cart → drawer →
// Checkout → Stripe. Drives live bleu.live.
const { test, expect } = require('@playwright/test');

test('Rail A: sleep → card → cart → Stripe checkout', async ({ page }) => {
  await page.goto('/');
  await page.fill('#alvai-input', 'I cannot sleep');
  await page.click('#alvai-go');

  // Card renders below the streamed response.
  const card = page.locator('.bleu-card').first();
  await expect(card).toBeVisible({ timeout: 45000 });
  await expect(card).toContainText('Reviewed by Dr. Stoler');
  const addBtn = card.locator('.bleu-card__btn');
  await expect(addBtn).toHaveText(/Add to Cart/i);

  await addBtn.click();
  const count = page.locator('#bleu-your-plan-count');
  await expect(count).toHaveText('1', { timeout: 15000 });

  await page.click('#bleu-your-plan-badge');
  const drawer = page.locator('#bleu-your-plan-drawer');
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(drawer).toContainText('Sleep Reset');
  await expect(drawer).toContainText('49.00');

  const checkout = page.locator('#bleu-your-plan-continue');
  await expect(checkout).toBeEnabled();
  await Promise.all([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 30000 }),
    checkout.click(),
  ]);
});
