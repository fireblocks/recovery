import { Page } from 'playwright-core';
// import { wrapFunc } from './utils';

export const navigateToVault = async (page: Page, vaultToNavigateTo: number) => {
  try {
    await page
      .getByRole('heading', { name: `Vault ${vaultToNavigateTo} (ID ${vaultToNavigateTo})` })
      .innerText({ timeout: 5000 });
    return;
  } catch (e) {
    console.error(e);
    console.log(`Utility is not in Vault ${vaultToNavigateTo}`);
  }
  await page.getByLabel('Close modal').click();
  await page.getByRole('link', { name: 'My Vault' }).click();
  await page.getByRole('cell', { name: `Vault ${vaultToNavigateTo}` }).click();
  await page.pause();
};

// export const navigateToVault = wrapFunc(_navigateToVault);
export const reset = async (page: Page) => await page.getByLabel('Close modal').click();
