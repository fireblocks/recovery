import { findLatestBuild, parseElectronApp } from 'electron-playwright-helpers';
import { ElectronApplication, Page, _electron as electron } from 'playwright-core';
import OBSWebSocket from 'obs-websocket-js';
import fs from 'fs';
import { assert } from './utils';

const loadApplications = async () => {
  let relayApp: ElectronApplication, recoveryApp: ElectronApplication;
  const latestBuild = findLatestBuild('../../apps/recovery-utility/dist/');
  const appInfo = parseElectronApp(latestBuild);

  relayApp = await electron.launch({
    args: [appInfo.main],
    env: { MODE_RELAY: '1', CI: 'e2e' },
    executablePath: appInfo.executable,
    timeout: 10000,
  });

  recoveryApp = await electron.launch({
    args: [appInfo.main],
    env: { MODE_UTIL: '1', CI: 'e2e' },
    executablePath: appInfo.executable,
    timeout: 10000,
  });

  return [recoveryApp, relayApp];
};

const reconstructWorkspace = async (page: Page) => {
  assert(
    process.env.RECOVERY_KIT_PATH && fs.existsSync(process.env.RECOVERY_KIT_PATH),
    'Missing recovery kit path (RECOVERY_KIT_PATH)',
  );
  assert(
    process.env.RECOVERY_RSA_PATH && fs.existsSync(process.env.RECOVERY_RSA_PATH),
    'Missing recovery kit rsa path (RECOVERY_RSA_PATH)',
  );
  assert(process.env.RECOVERY_MOBILE_KEYSHARE_PASS, 'Missing recovery kit mobile keyshare pass (RECOVERY_MOBILE_KEYSHARE_PASS)');
  assert(process.env.RECOVERY_RSA_PASS, 'Missing recovery rsa pass (RECOVERY_RSA_PASS)');

  await page.getByRole('link', { name: 'Recover Private Keys Use' }).click();

  const kitLocation = page.locator('#recovery-kit-upload-well');
  const rsaLocation = page.locator('#recovery-kit-key-upload-well');
  const mobilePassLocation = page.getByLabel('Mobile App Recovery Passphrase');
  const rsaPassLocation = page.getByLabel('Recovery Private Key Passphrase');

  await kitLocation.setInputFiles(process.env.RECOVERY_KIT_PATH!);
  await rsaLocation.setInputFiles(process.env.RECOVERY_RSA_PATH!);

  await mobilePassLocation.fill(process.env.RECOVERY_MOBILE_KEYSHARE_PASS!);
  await rsaPassLocation.fill(process.env.RECOVERY_RSA_PASS!);

  await page.getByRole('button', { name: 'Recover' }).click();
  await page.getByLabel('I want to recover my private').click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  const errored = await page.getByText(/^(Error|error|Failed|Unknown|unknown|failed|ERROR).+$/).isVisible();
  if (errored) {
    throw Error('Failed to reconstruct keys');
  }
};

const setupOBS = async () => {
  // assert(process.env.OBS_WS_PASSWORD, 'No OBS password field, please check Readme');
  // const obsWs = new OBSWebSocket();
  // await obsWs.connect('ws://127.0.0.1:4455', process.env.OBS_WS_PASSWORD);
};

// const reconstructWorkspace = wrapFunc(_reconstructWorkspace);

export { reconstructWorkspace, loadApplications, setupOBS };
