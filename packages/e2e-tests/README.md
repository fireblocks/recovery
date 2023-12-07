# E2E Testing

End to end testing (E2E testing) is used to verify that the entire process of recovery, derivation, withdrawal and broadcasting works properly.

E2E Testing should be used once you have finished adding a new asset or functionality.

## How to setup the test

E2E Testing utilizes [playwright](https://playwright.dev) to run the application in relay and utility mode **on the SAME DEVICE** which needs to be **ONLINE** device.

This is currently a mandatory requirement and as such make sure **NOT** to use your production recovery kit when performing E2E testing, only use the DRS specific workspace's recovery kit and add to it the relevant assets you're looking to test.

In the tests directory you must create a `.env` file with the following fields:
| Variable name | Required | Description |
|-------------------------------|----------|--------------------------------------------------------------------------------|
| RECOVERY_KIT_PATH | ✅ | The **absolute ** path to the recovery kit |
| RECOVERY_RSA_PATH | ✅ | The **absolute ** path to the recovery kit's RSA file |
| RECOVERY_MOBILE_KEYSHARE_PASS | ✅ | The passphrase for the mobile keyshare (the owner passphrase) |
| RECOVERY_RSA_PASS | ✅ | The passphrase for the RSA file |
| VAULTS_TO_CREATE | ✅ | How many vaults to create as part of the E2E testing |
| VAULT_TO_USE | ✅ | Which vault to use for testing (0-based index) |
| DEBUG_ON_CONSOLE_ERROR | ❌ | Should playwright pause the window when a console generated error is detected? (allows for debugging live) |

You can also specify the assets you want to do the E2E test for:

1. Go to the [`tests.ts`](./tests.ts) file and edit it
2. Replace the contents of the variable `testAssets` to be your assets.
3. The assets you specify must be of type [`AssetTestConfig`](./types.ts#L1)

## How to run the tests

From the root of the project, run the command:

```
yarn e2etest
```

This will init the tests.
You are able to also run:

```
yarn ui-e2etest
```

For the playwright UI, which will allow you to more easily see what is happening and see the logs.

## How to troubleshoot failed tests

If a test fails, a new `<ASSET-ID>-<TIMESTAMP>.zip` file will be created under the `failed-tests` folder in this folder.<br/>
It will contain all the logs of the utility and relay which will allow you to debug the issue.<br/>
