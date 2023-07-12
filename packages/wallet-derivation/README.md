# @fireblocks/wallet-derivation

Derive wallet keys and addresses from extended keys and HD paths

---

TypeScript methods and classes for deriving a wallet's private/public keys and address from extended private/public keys. Used by [Recovery Utility](../recovery-utility/) to generate wallet keys and addresses and by [Recovery Relay](../recovery-relay/) to generate public keys for checking balances and blockchain state.

Included in the [Next.js](https://nextjs.org/) frontends using [next-transpile-modules](https://www.npmjs.com/package/next-transpile-modules).

## :hammer: Development

In some scenarios you will want to either fix some incorrect derivation, or to add completely new wallets to the Recovery tool.

To do this perform the following:

1. (Only relevant for new assets) Identify which curve is the asset using - currently only `ECDSA` and `EdDSA` are supported, so only assets using those chains can be supported
2. Create a backup of the relevant wallet file in the folder `wallets/chains` (or create a new file named `<CHAIN>.ts` with `<CHAIN>` being a placeholder for the id of the wallet), note we consider it best practice for the name of the file (without `.ts`) to match the corresponding key in the [`asset-config`](../asset-config/README.md) package

The wallet must extends either `ECDSAWallet` or `EdDSAWallet` classes according to step 1 above.

You will need to implement two methods:

1. A constructor with the following signature: `constructor(input: Input)`. The constructor receives an [`Input`](./types.ts#L21) object which contains relevant information. Usually the implementation of the constructor will simply be `super(input, <COIN-ID>)` with `<COIN-ID>` being a placeholder for a number value corresponding to the coin Id used in the derivation path.<br> The system is set up in such a way that all "hard work" needed for derivation is handled by the corresponding curve wallets with the provided `input` field and `<COIN-ID>` value
2. An implementation of the `getAddress(evmAddress?: string) => string` method. This method will take the provided public key and compute the address of wallet corresponding to the public key.<br>Note: for an example of a wallet that is unable to deteremine the address from the public key see Hedera

In case you added a new wallet, the last step is to export the wallet. To do this:

1. Edit the file [`wallets/chains/index.ts`](./wallets/chains/index.ts).<br>
2. Add the relevant import statement
3. Add the newly imported wallet at the bottom of `export` statement
4. In the large `switch` statement, add a new case with the key is the same as the name of the file (which should match the `id` of the asset in the [`asset-config`](../asset-config/README.md)'s native assets), and the content of the case should be returning the class itself (**not initiated, the class as type**).

## :books: Usage

In case you want to use the `wallet-derivation` package in some other code, below you will be able to find the relevant functions that can be used from this package

### `deriveWallet(input: Input)`

Accepts an input including an `xpub | fpub | xprv | fprv`, `path` object, and `assetId`.

If an `xprv` or `fprv` are provided, `deriveWallet` includes in its return object the private key in hexadecimal format and in WIF for ECDSA-signed assets.

```typescript
import { deriveWallet, Input } from '@fireblocks/wallet-derivation';

// Derive a BTC private+public key and address from vault account 0
const btcInput: Input = {
  assetId: 'BTC',
  xprv: 'xprv...',
  path: { account: 0, addressIndex: 0 },
};
const btcWallet = deriveWallet(btcInput);
console.info(btcWallet);

/**
 * {
 *   wif: 'L5...',
 *   privateKey: '0x...'
 *   publicKey: '0x...',
 *   address: 'bc1...',
 *   pathParts: [44, 0, 0, 0, 0],
 *   balance: 0,
 *   ...
 * }
 */

// Derive a ETH private+public key and address from vault account 1
const ethInput: Input = {
  assetId: 'ERH',
  xprv: 'xprv...',
  path: { account: 1 },
};
const ethWallet = deriveWallet(ethInput);
console.info(ethWallet);

/**
 * {
 *   privateKey: '0x...'
 *   publicKey: '0x...',
 *   address: '0x...',
 *   pathParts: [44, 60, 1, 0, 0],
 *   balance: 0,
 *   ...
 * }
 */

// Derive a SOL public key and address from vault account 2
const solInput: Input = {
  assetId: 'SOL',
  fpub: 'fpub...',
  path: { account: 2 },
};
const solWallet = deriveWallet(solInput);
console.info(solWallet);

/**
 * {
 *   publicKey: '0x...',
 *   address: 'U3...',
 *   pathParts: [44, 501, 2, 0, 0],
 *   balance: 0,
 *   ...
 * }
 */
```
