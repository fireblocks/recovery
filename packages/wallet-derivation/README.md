# @fireblocks/wallet-derivation

Derive wallet keys and addresses from extended keys and HD paths

---

TypeScript methods and classes for deriving a wallet's private/public keys and address from extended private/public keys. Used by [Recovery Utility](../recovery-utility/) to generate wallet keys and addresses and by [Recovery Relay](../recovery-relay/) to generate public keys for checking balances and blockchain state.

Included in the [Next.js](https://nextjs.org/) frontends using [next-transpile-modules](https://www.npmjs.com/package/next-transpile-modules).

## 📚 Usage

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
