# Recovery Utility `renderer` /lib

Recovery Utility `renderer` libraries for:

- Creating cold wallets based on [`@fireblocks/wallet-derivation`](../../../../packages/wallet-derivation/README.md), used to generate and sign transactions
- [Electron inter-process communication](https://www.electronjs.org/docs/latest/tutorial/ipc) handlers for:
  - Handling the `fireblocks-recovery:/` URL scheme (transaction signing requests from Recovery Relay)
  - Persisting and restoring application settings

## 🛠️ Developement

To add new assets follow these steps;

1. Create a new folder under `wallets`, where the name of the folder matches the `id` of the native asset from [`asset-config`](../../../../packages/asset-config/README.md), with (at least) a single file `index.ts`

2. The `index.ts` file must be constructed as follows;

   1. There must be a single export of a class, the name of which will match the name of the blockchain (or it's `id`)
   2. The class must `extend` the base wallet class from [`@fireblocks/wallet-derivation`](../../../../packages/wallet-derivation/README.md)
   3. The class must `implement` the class [`SigningWallet`](./wallets/SigningWallet.ts)

3. The class, as per the above requirements, will have to implement the function `public async generateTx(generateTxInput: GenerateTxInput): Promise<TxPayload>`. <br>The code that for this function will take the [`GenerateTxInput`](./wallets/types.ts#L35) create and sign a transaction with the following details:

   1. The transaction `amount`, `to`(transaction destination), `memo` (if applicable), `nonce`(if applicable), will be the corresponding field in `generateTxInput`
   2. The UTXOs to use (if applicable) will be derived from `generateTxInput.utxos`
   3. Any additional information required in the transaction creation should be located in `generateTxInput.extraParams` and be obtained by the [`recovery-relay`](../../../recovery-relay/lib/README.md) ahead of time

4. Once the transaction is created it should be signed with the private key stored in `this.privateKey`.<br>**Important Note:** Fireblocks `EdDSA` signature is not the same as most implementations, and as a result, for `EdDSA` based signatures instead of the blockchain's specific implementation, use [`this.sign(message)`](../../../../packages/wallet-derivation/wallets/EdDSAWallet.ts#L138) and provide it with the message that needs to be signed

5. Once the transaction is signed, serialize it and return it (preferably hex, or some object that can be reconstructed on the relay, for an example see `HBAR` on the [utility side](./wallets/HBAR/index.ts#L40) and on the [relay side](../../../recovery-relay/lib/wallets/HBAR/index.ts#L54)): `return {tx: <SERIALIZED-SIGNED-TX>};`

Once the wallet's creation and signing logic is added, you will need to add it to the exported wallets:

1. Edit the `index.ts` file under the `wallets` folder
2. Add an import statement of the newly created wallet class to the top of the file
3. Under the const [`WalletClasses`](./wallets/index.ts#L21) add a new key-value pair, where the key is the same as the `id` of the asset (the folder name from step #1 above) and the value is the class itself (**not initalized, just the class**)

Once it's done, rebuild the project and the tool will be able to sign the new asset's transactions.

**Note** that we do not specify how to implement the logic of creation and signature as it is unique for each blockchain and requires additional research to be done to add the relevant blockchain code.
