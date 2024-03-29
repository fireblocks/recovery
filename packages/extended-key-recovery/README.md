# @fireblocks/extended-key-recovery

Recover extended private/public keys from a Recovery Kit

---

Recovers `xpub`, `fpub`, `xprv`, and `fprv` from a complete set of recovery materials. Use with [`@fireblocks/wallet-derivation`](../wallet-derivation/) to derive wallets from these recovered extended keys. This module is spawned by [Recovery Utility](../recovery-utility) when recovering or verifying a Recovery Kit.

## Usage

Recovery materials include:

- Backup Kit .zip
- Recovery RSA private key and passphrase
- Workspace owner's mobile recovery passphrase

The module accepts the Backup Kit .zip and RSA private key as base64-encoded strings.

Here are the four types of keys that are returned from valid recovery materials. Private keys are only returned if the `-p / --private` flag is `true`.

|             | ECDSA (BIP44) | Ed25519 |
| ----------- | ------------- | ------- |
| Private Key | `xprv`        | `fprv`  |
| Public Key  | `xpub`        | `fpub`  |

```sh
usage: recover [-h] -z ZIP -mp MOBILE_PASSPHRASE -rk RSA_KEY [-rp RSA_KEY_PASSPHRASE] [-p PRIVATE]

Fireblocks Extended Key Recovery: recover xprv/fprv/xpub/fpub from Fireblocks Recovery Kit

options:
  -h, --help            show this help message and exit
  -z ZIP, --zip ZIP     Base64-encoded string representation of the Recovery Kit zip file
  -mp MOBILE_PASSPHRASE, --mobile-passphrase MOBILE_PASSPHRASE
                        Owner's mobile app passphrase
  -rk RSA_KEY, --rsa-key RSA_KEY
                        Base64-encoded string representation of the RSA key PEM file
  -rp RSA_KEY_PASSPHRASE, --rsa-key-passphrase RSA_KEY_PASSPHRASE
                        RSA key passphrase
  -p PRIVATE, --private PRIVATE
                        Recover private keys flag (include xprv/fprv if true)
```

## Output

```json
{
  "xprv": "[ECDSA extended private key]",
  "fprv": "[EdDSA extended private key]",
  "xpub": "[ECDSA extended public key]",
  "fpub": "[EdDSA extended public key]"
}
```
