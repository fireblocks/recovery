import { Page } from 'playwright-core';

export const navigateToVault = async (page: Page, vaultToNavigateTo: number) => {
  try {
    await page
      .getByRole('heading', { name: `Vault ${vaultToNavigateTo} (ID ${vaultToNavigateTo})` })
      .innerText({ timeout: 5000 });
    return;
  } catch (e) {
    console.log(`Utility is not in Vault ${vaultToNavigateTo}`, e);
  }
  await page.getByLabel('Close modal').click();
  await page.getByRole('link', { name: 'My Vault' }).click();
  await page.getByRole('cell', { name: `Vault ${vaultToNavigateTo}` }).click();
};

export const reset = async (page: Page) => {
  try {
    // await page.pause();
    await page.getByLabel('Close modal').click({ timeout: 2500 });
  } catch (e) {} // It might be that we didn't reach the modal for withdrawal so if we get timeout we're okay to continue
};
