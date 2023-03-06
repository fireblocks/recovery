# Extended Key Recovery

Python module handling extended key recovery from a Recovery Kit, spawned by [Recovery Utility](../recovery-utility). Recovers `xpub` / `fpub` / `xprv` / `fprv` from a complete set of recovery materials.

## Build Process

The module is compiled to an executable by [PyInstaller](https://pyinstaller.org/en/stable/), and this executable can run portably without the Python runtime or dependent modules. Recovery Utility includes this executable in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and reads from `stdout` to retrieve the extended keys.

## Usage

Recovery materials include:

- Backup Kit .zip
- Recovery RSA private key and passphrase
- Workspace owner's mobile recovery passphrase

The module accepts the Backup Kit .zip and RSA private key as base64-encoded strings.

Here are the four types of keys that are returned from valid recovery materials. Private keys are only returned if the `-p` flag is included.

|             | ECDSA (BIP44) | Ed25519 |
| ----------- | ------------- | ------- |
| Private Key | `xprv`        | `fprv`  |
| Public Key  | `xpub`        | `fpub`  |

```sh
usage: recovery [-h] -z ZIP -mp MOBILE_PASSPHRASE -rk RSA_KEY [-rp RSA_KEY_PASSPHRASE] [-p PRIVATE]

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
