import test, { ConsoleMessage, ElectronApplication, Page, TestInfo } from 'playwright/test';
import dotenv from 'dotenv';
import { loadApplications, reconstructWorkspace } from './pre-setup';
import {
  approveTransaction,
  broadcastTransaction,
  createVaults,
  deriveAsset,
  fetchTxParamData,
  getAddressForAsset,
  startWithdrawal,
} from './transfer-utils';
import { testAssets } from './tests';
import { AssetTestConfig, FixError, SkipError } from './types';
import { assert, skipTest, testFailed, wrapStep } from './utils';
import { navigateToVault, reset } from './test-utils';

let recoveryApp: ElectronApplication, relayApp: ElectronApplication;
let relayWindow: Page, utilWindow: Page;
let assetId: string;

dotenv.config({ path: `${__dirname}/.env` });

test.beforeAll(async () => {
  [recoveryApp, relayApp] = await loadApplications();
  relayWindow = await relayApp.firstWindow();
  utilWindow = await recoveryApp.firstWindow();

  relayWindow.on('console', consoleMessageCallback('relay'));
  utilWindow.on('console', consoleMessageCallback('utility'));

  await reconstructWorkspace(utilWindow);
  await relayWindow.getByRole('link', { name: 'Scan QR Code' }).click();

  assert(process.env.VAULTS_TO_CREATE, 'Must know how many vaults to create for the vault to use');
  assert(process.env.VAULT_TO_USE, 'Must know which vault to use for tests');

  if (process.env.CSV_TO_LOAD) {
    // TODO: Load CSV
    return;
  }

  await createVaults(utilWindow, parseInt(process.env.VAULTS_TO_CREATE!), false);
});

const consoleMessageCallback = (windowType: 'utility' | 'relay') => async (msg: ConsoleMessage) => {
  const ignoredErrors = ['Failed to start scanner. Cannot read properties of null', 'Refused to set unsafe header'];
  const skipErrors = ['Insufficient balance'];
  const fixErrors = ['Endpoint not initialized yet'];

  if (msg.type() !== 'error') {
    return;
  }
  if (ignoredErrors.some((err) => msg.text().includes(err))) {
    return;
  }

  if (process.env.PAUSE_ON_ERROR) {
    if (windowType === 'relay') await relayWindow.pause();
    else await utilWindow.pause();
  }

  if (skipErrors.some((err) => msg.text().includes(err))) {
    throw new SkipError(msg.text());
  }

  if (fixErrors.some((err) => msg.text().includes(err))) {
    throw new FixError(msg.text());
  }

  console.error(`${windowType.toUpperCase()} Faced an error: ${msg.text()}`);
  await testFailed(windowType, assetId);
  // throw new Error(msg.text());
};

const tryTransferAsset = (assetConfig: AssetTestConfig) => {
  assetId = assetConfig.assetId;
  const transferAsset = async (testInfo: TestInfo): Promise<void> => {
    const relayWindow = await relayApp.firstWindow();
    const utilWindow = await recoveryApp.firstWindow();
    const { assetId, endpoint } = assetConfig;

    await navigateToVault(utilWindow, parseInt(process.env.VAULT_TO_USE!));
    if (!(await utilWindow.getByRole('cell', { name: assetId }).isVisible())) {
      console.log(`Wallet ${assetId} is not derived.`);
      try {
        await deriveAsset(utilWindow, assetId);
      } catch (e) {
        throw new FixError(`Failed to derive ${assetId} - ${(e as Error).message}`);
      }
    }

    const address = await wrapStep('utility', assetId, getAddressForAsset)(utilWindow, assetId);
    const txInitData = await wrapStep('utility', assetId, startWithdrawal)(utilWindow, assetId, address);
    const txParamData = await wrapStep('relay', assetId, fetchTxParamData)(relayWindow, txInitData, endpoint);
    const signedTxData = await wrapStep('utility', assetId, approveTransaction)(utilWindow, txParamData);
    const txHash = await wrapStep('relay', assetId, broadcastTransaction)(relayWindow, signedTxData);
    console.log('TxHash: ', txHash);

    await reset(utilWindow);
    await reset(relayWindow);
  };

  return async <TestArgs>({}: TestArgs, testInfo: TestInfo): Promise<void> => {
    try {
      await transferAsset(testInfo);
    } catch (e) {
      if (e instanceof SkipError || e instanceof FixError) {
        await skipTest(e, assetConfig.assetId, relayWindow, utilWindow);
        return;
      }
      throw e;
    }
  };
};

testAssets.forEach(async (assetConfig: AssetTestConfig) => {
  test(`Withdraw ${assetConfig.assetId}`, tryTransferAsset(assetConfig));
});
