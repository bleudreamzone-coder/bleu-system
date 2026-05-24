// Rail C end-to-end: amazon supplement query → card → Add to Cart → drawer
// (Amazon disclosure) → Checkout → disclosure confirm() → Amazon opens.
const { test, expect } = require('@playwright/test');

test('Rail C: magnesium → card → drawer disclosure → Amazon', async ({ page, context }) => {
  await page.goto('/');
  await page.fill('#alvai-input', 'magnesium on amazon');
  await page.click('#alvai-go');

  const card = page.locator('.bleu-card').first();
  await expect(card).toBeVisible({ timeout: 45000 });
  await card.locator('.bleu-card__btn').click();
  await expect(page.locator('#bleu-your-plan-count')).toHaveText('1', { timeout: 15000 });

  await page.click('#bleu-your-plan-badge');
  const drawer = page.locator('#bleu-your-plan-drawer');
  await expect(drawer).toHaveAttribute('aria-hidden', 'false');
  await expect(drawer).toContainText(/bleulive20-20/i); // Amazon disclosure line

  // Checkout → continueRailC fires a confirm() naming the commission, then
  // window.open(amazon_url). Accept the dialog and capture the popup.
  let dialogText = '';
  page.once('dialog', async (d) => { dialogText = d.message(); await d.accept(); });
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 30000 }),
    page.click('#bleu-your-plan-continue'),
  ]);
  expect(dialogText).toMatch(/bleulive20-20/i);
  await popup.waitForLoadState('domcontentloaded').catch(() => {});
  expect(popup.url()).toMatch(/amazon\.com/);
  expect(popup.url()).toMatch(/tag=bleulive/);
});
