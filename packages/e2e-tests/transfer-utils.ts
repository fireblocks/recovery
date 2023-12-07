import { Page } from 'playwright-core';
import { waitForLoadingToEnd } from './utils';

export const deriveAsset = async (page: Page, assetId: string) => {
  await page.getByRole('button', { name: 'Asset Wallet' }).click();
  await page.getByPlaceholder('Search assets').fill(assetId);
  await page.getByText(assetId, { exact: true }).locator('../..').click();
  await page.getByRole('button', { name: 'Recover' }).click();

  // if (await page.getByRole('heading', { name: '❗️Add Wallet Failed', exact: true }).isVisible()) {
  //   const errorText = await page.getByLabel('❗️Add Wallet Failed').locator('div').nth(1).innerText();
  //   throw new Error(`Failed to derive wallet - ${errorText}`);
  // }
};

export const createVaults = async (page: Page, numToCreate: number, leaveLast: boolean) => {
  for (let i = 0; i < numToCreate; i++) {
    await page.getByRole('button', { name: 'Vault Account' }).click();
    const nameInput = page.getByPlaceholder('e.g. Funding');
    await nameInput.fill(`Vault ${i + 1}`);
    await page.getByRole('button', { name: 'Recover' }).click();
    console.log(`Created vault ${i + 1}`);
    if (i === numToCreate - 1 && !leaveLast) return;
    await page.getByRole('link', { name: 'My Vault' }).click();
  }
};

export const getAddressForAsset = async (page: Page, assetId: string): Promise<string> => {
  await page.getByRole('row', { name: assetId }).getByLabel('Show addresses').click();
  let toAddress: string;
  try {
    toAddress = await page.getByRole('heading', { name: 'Permanent Address' }).locator('..').locator('p').innerText();
  } catch (e: any) {
    const error: Error = e as Error;
    if (error.message.includes('resolved to') && error.message.includes('strict mode violation')) {
      toAddress = (await page.getByText('Segwit:').innerText()).replace('Segwit:', '');
    } else {
      throw e;
    }
  }
  await page.getByRole('button', { name: 'Close', exact: true }).click();

  return toAddress;
};

export const startWithdrawal = async (page: Page, assetId: string, toAddress: string): Promise<string> => {
  // If the asset is disabled the getByLabel will fail on timeout, this is an alternative approach to obtain the relevant item
  if (await page.getByRole('row', { name: assetId }).getByRole('menuitem').nth(-1).isDisabled()) {
    throw new Error(`Asset ID ${assetId} is disabled for withdraw`);
  }
  await page.getByLabel(`Withdraw ${assetId}`).click();
  await page.getByLabel('Recipient Address').fill(toAddress);
  await page.getByRole('button', { name: 'Create Transaction' }).click();
  return (await page.getByLabel('Relay URL').inputValue()) ?? '';
};

export const fetchTxParamData = async (page: Page, txInitData: string, endpointData?: string): Promise<string> => {
  await _fillQrCode(page, txInitData);
  await page.getByLabel('Open').click();
  await page.getByRole('option').nth(0).click();

  // If some endpoint or additional data is required but missing, the prepare transaction button will be disabled, and the below getByRole will fail.
  if (await page.locator('#endpoint').isVisible()) {
    if (!endpointData) {
      throw new Error('Endpoint needed but not provided');
    }
    await page.locator('#endpoint').fill(endpointData);
  }

  await waitForLoadingToEnd(page);
  const errorText = await page.locator('form>div').nth(-2).innerText();
  const isVisible = await page.locator('form>div').nth(-2).isVisible();
  if (isVisible && errorText) {
    throw new Error(errorText);
  }

  try {
    if (await page.getByText('Could not get balance', { exact: true }).isVisible()) {
      throw new Error('Unable to fetch balance');
    }
  } catch (e) {}

  await page.getByRole('button', { name: 'Prepare Transaction' }).click();
  return (await page.getByLabel('Relay URL').inputValue()) ?? '';
};

export const approveTransaction = async (page: Page, txParamsData: string): Promise<string> => {
  await _fillQrCode(page, txParamsData);
  await page.getByRole('button', { name: 'Approve & Sign Transaction', exact: true }).click();
  return (await page.getByLabel('Relay URL').inputValue()) ?? '';
};

export const broadcastTransaction = async (page: Page, signedTxData: string): Promise<string> => {
  await _fillQrCode(page, signedTxData);
  await page.getByRole('button', { name: 'Confirm and broadcast', exact: true }).click();
  return (await page.getByRole('link').innerText()) ?? '';
};

const _fillQrCode = async (page: Page, qrCodeData: string) => await page.getByLabel('QR Code URL').fill(qrCodeData);

// export const deriveAsset = wrapFunc(_deriveAsset);
// export const createVaults = wrapFunc(_createVaults);
// export const getAddressForAsset = wrapFunc(_getAddressForAsset);
// export const startWithdrawal = wrapFunc(_startWithdrawal);
// export const fetchTxParamData = wrapFunc(_fetchTxParamData);
// export const approveTransaction = wrapFunc(_approveTransaction);
// export const broadcastTransaction = wrapFunc(_broadcastTransaction);
