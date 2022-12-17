# Key Recovery and Derivation Server

Python server handling cryptographic operations, called to by [Recovery Utility](../app).

## Build Process

The server module is compiled to an executable by [PyInstaller](https://pyinstaller.org/en/stable/), which doesn't require the Python runtime or dependent modules. Recovery Utility includes the server in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and interfaces with it using HTTP requests.

## HTTP Endpoints

[⬇️ Postman Collection](res/DRS Endpoints Collection.postman_collection.json)

#### `/recover-keys`

Recovers Fireblocks extended private/public keys from a complete set of recovery materials. Recovery materials include:

- Backup Kit .zip
- Recovery RSA private key and passphrase
- Workspace owner's mobile recovery passphrase

Here are the four types of keys that are returned from valid recovery materials:

|             | ECDSA (BIP32) | Ed25519 |
| ----------- | ------------- | ------- |
| Private Key | `xprv`        | `fprv`  |
| Public Key  | `xpub`        | `fpub`  |

##### Request

###### Query Parameters

- `recover-prv: boolean`

  If true, responds with the extended private keys (`xprv` and `fprv`) and caches them in application memory until exit.

  If false, only extended public keys (`xpub` and `fpub`) are returned and cached.

###### JSON Body

```json
{
  "zip": "base64-encoded Backup Kit .zip file",
  "passphrase": "workspace owner's mobile recovery passphrase",
  "rsa-key": "base-64 encoded recovery RSA private key",
  "rsa-key-passphrase": "recovery RSA private key passphrase"
}
```

##### Response

```json
{
  "xprv": "BIP32 extended private key",
  "fprv": "BIP32 extended public key",
  "xpub": "Ed25519 extended private key",
  "fpub": "Ed25519 extended public key"
}
```

#### `/derive-keys`

After the extended private keys have been cached from a prior request to `/recover-keys?recover-prv=true`, calling `/derive-keys` returns a Fireblocks asset's private/public keys and addresses, derived from an extended private key.

##### Request

###### Query Parameters

- `asset: string`

  Fireblocks Asset ID (e.g. `BTC`, `ETH`, `SOL`)

- `account: number`

  Fireblocks Vault Account ID

- `change: number`

  BIP32 change address index. For Fireblocks wallets, this is always 0.

- `index_start: number`

  Address index range start. 0 derives the wallet's permanent address. All greater numbers derive the wallet's deposit addresses.

- `index_end: number`

  Address index range end.

- `xpub: boolean`

  If true, only derives and returns a wallet's public keys by using the `xpub` or `fpub` extended public keys.

  If false, the `xprv` or `fprv` extended private keys are used to derive wallet private keys, which are returned in the response.

- `testnet: boolean`

  If true, derives a wallet for a testnet account.

  If false, derives a wallet for a mainnet account.

- `legacy: boolean`

  If true and the asset is BTC, returns a legacy address.

  If false and the asset is BTC, returns a Native SegWit address.

##### Response

```json
{
  "wif": "(for ECDSA assets) private key in base58-encoded Wallet Import Format",
  "prv": "hexadecimal private key",
  "pub": "hexadecimal public key",
  "address": "wallet address",
  "path": "comma-delimited BIP32 derivation path"
}
```

#### `/show-extended-keys`

Returns the previously-derived and cached extended private/public keys. Throws an exception if a complete set of extended private/public keys has not yet been derived via a request to `/recover-keys?recover-prv=true`.

##### Request

No query parameters or JSON body.

##### Response

```json
{
  "xprv": "BIP32 extended private key",
  "fprv": "BIP32 extended public key",
  "xpub": "Ed25519 extended private key",
  "fpub": "Ed25519 extended public key"
}
```
