# Recovery Relay - lib

This code contains all the logic for obtaining data from the supported blockchains as well as broadcasting the transactions to the relevant chains.

## :hammer: Developement

Extendability of this package is used to add blockchain external logic, such as fetching balances and broadcasting transactions.

To add new assets follow these steps;

1. Determine if there is a publicly available RPC that can be used
2. Create a new folder under `wallets`, where the name of the folder matches the `id` of the native asset from [`asset-config`](../../../../packages/asset-config/README.md), with (at least) a single file `index.ts`

3. The file `index.ts` must:

   1. There must be a single export of a class
   2. The class must `extend` the base wallet class from [`wallet-derivation`](../../../../packages/wallet-derivation/README.md)
   3. The class must `implement` either [`LateInitConnectedWallet`](./wallets/LateInitConnectedWallet.ts) or [`ConnectedWallet`](./wallets/ConnectedWallet.ts), depending on the aforementioned publicly available RPC (`LateInitConnectedWallet` if such an RPC is not available)

4. The class, as per the above requirements will have the following methods:
   1. `public getBalance(): Promise<number>` - Gets the balance for the generated address (populated in `this.address`)
   2. `public prepare(): Promise<AccountData>` - Prepares transaction data, more details are provided below
   3. `public broadcastTx(txHex: string, customUrl?: string): Promise<string>` - Broadcasts a given signed transaction. The `tx` is a string but the data within it is provided as part of the [`recovery-utility`](../../../apps/recovery-utility/README.md)'s configured asset

The `prepare` function is a unique one, the purpose of this function is to collect all information needed for the transaction creation on the [`recovery-utility`](../../../apps/recovery-utility/README.md). The output of the function is the following object:

```typescript
{
  balance: number;                    // The balance for the given account
  utxos?: UTXO[];                     // The UTXOs associated with the account if applicable
  utxoType?: UTXOType;                // The type fo the UTXO associated, only relevant for BTC
  feeRate?: number;                   // The fee rate that will be taken (can be the rate per byte or full rate, as long as the wallet on the utility side knows what to do with it)
  nonce?: number;                     // The nonce of the account if applicable
  gasPrice?: bigint | null;           // The gas price if applicable
  extraParams?: Map<string, any>;     // Any additional parameters, explained below
  endpoint?: string;                  // In case of a `LateInitConnectedWallet`, you can pass the actual endpoint
  insufficientBalance?: boolean;      // Does the account have sufficient balance to perform a transaction
}
```

The most unusual argument is `extraParams`, it contains any unique parameters that are needed as part of the transaction creation such as block header, unique data from the blockchain, latest block value, etc.
**Important Note:** Due to storage limitations with QR codes, try to make the data you put in extraParams as small as possible, we suggest that the keys be defined as a single character value, and values be as small as possible. An example can be seen in [HBAR](../../../packages/wallet-derivation/wallets/chains/HBAR.ts#L8).

With all the above created all that's left is to export the newly created wallet, to do this follow these steps:

1. Edit the `index.ts` file under the `wallets` folder
2. Add an import statement of the newly created wallet class to the top of the file
3. Under the const [`WalletClasses`](./wallets/index.ts#L39) add a new key-value pair, where the key is the same as the `id` of the asset (the folder name from step #1 above) and the value is the class itself (**not initalized, just the class**)

Once it's done, rebuild the project and the tool will be able to get information about the asset the new asset in the relay.

**Note** that we did not specify how to implement the logic of creation and signature as it is unique for each blockchain and requires additional research to be done to add the relevant blockchain code.
