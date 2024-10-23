import { Page } from 'playwright-core';
import { FixableError } from './types';

export const updateRPCURL = async (page: Page, assetId: string, newUrl: string): Promise<void> => {
  await page.getByRole('link', { name: 'Settings' }).click();
  const searchBar = page.getByPlaceholder('Search…');
  await searchBar.fill(assetId);
  await page.locator(`#update-${assetId}`).click();
  await page.locator(`#edit-${assetId}`).fill(newUrl);
  await page.getByRole('button', { name: 'Save' }).click();
  if (!(await page.getByText(newUrl).isVisible())) {
    throw new FixableError(`Could not change URL for asset ${assetId} - url not found post update`);
  }
  await page.getByRole('link', { name: 'Relay', exact: true }).click();
};
