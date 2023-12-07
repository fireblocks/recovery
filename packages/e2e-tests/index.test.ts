import test, { ConsoleMessage, ElectronApplication, Page, TestInfo } from 'playwright/test';
import dotenv from 'dotenv';
import { loadApplications, reconstructWorkspace, setupOBS } from './pre-setup';
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
import { AssetTestConfig, AsyncFn } from './types';
import { assert, testFailed } from './utils';
import { navigateToVault, reset } from './test-utils';

let recoveryApp: ElectronApplication, relayApp: ElectronApplication;
let relayWindow: Page, utilWindow: Page;

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
  const ignoredErrors = ['Failed to start scanner. Cannot read properties of null'];

  if (msg.type() !== 'error') {
    return;
  }
  if (ignoredErrors.some((err) => msg.text().includes(err))) {
    return;
  }
  console.error(`${windowType.toUpperCase()} Faced an error: ${msg.text()}`);
  if (process.env.PAUSE_ON_CONSOLE_ERROR) {
    if (windowType === 'relay') await relayWindow.pause();
    else await utilWindow.pause();
  }
  throw new Error(msg.text());
};

const wrapStep = <T extends AsyncFn>(
  windowType: 'relay' | 'utility',
  assetId: string,
  call: T,
): ((...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>) => {
  return async (...args: Parameters<T>) => {
    try {
      return await call(...args);
    } catch (e) {
      console.log(args);
      if (!(e as Error).message.includes('Target page, context or browser has been closed')) await (args[0] as Page).pause();
      console.error(`${windowType.toUpperCase()} failed to do step due to `, e);
      await testFailed(windowType, assetId);
    }
  };
};

const tryTransferAsset =
  (assetConfig: AssetTestConfig) =>
  async <TestArgs>({}: TestArgs, testInfo: TestInfo): Promise<void> => {
    const relayWindow = await relayApp.firstWindow();
    const utilWindow = await recoveryApp.firstWindow();
    const { assetId, endpoint } = assetConfig;

    await navigateToVault(utilWindow, parseInt(process.env.VAULT_TO_USE!));
    if (!(await utilWindow.getByRole('cell', { name: assetId }).isVisible())) {
      console.log(`Wallet ${assetId} is not derived.`);
      try {
        await deriveAsset(utilWindow, assetId);
      } catch (e) {
        console.error(e);
        throw new Error(`Failed to derive ${assetId}`);
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

testAssets.forEach((assetConfig: AssetTestConfig) => {
  test(`Withdraw ${assetConfig.assetId}`, tryTransferAsset(assetConfig));
});
