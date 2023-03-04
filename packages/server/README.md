# Key Recovery Server

Python server handling extended key recovery from a Recovery Kit, called to by [Recovery Utility](../app).

## Build Process

The server module is compiled to an executable by [PyInstaller](https://pyinstaller.org/en/stable/), which doesn't require the Python runtime or dependent modules. Recovery Utility includes the server in its [contents](https://www.electron.build/configuration/contents.html#extrafiles), spawns it as a child process, and interfaces with it using HTTP requests.

## HTTP Endpoints

⬇️ [Postman Collection](res/DRS%20Endpoints%20Collection.postman_collection.json)

#### `/recover-keys`

Recovers Fireblocks extended private/public keys from a complete set of recovery materials. Recovery materials include:

- Backup Kit .zip
- Recovery RSA private key and passphrase
- Workspace owner's mobile recovery passphrase

Here are the four types of keys that are returned from valid recovery materials:

|             | ECDSA (BIP44) | Ed25519 |
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
  "xprv": "BIP44 extended private key",
  "fprv": "BIP44 extended public key",
  "xpub": "Ed25519 extended private key",
  "fpub": "Ed25519 extended public key"
}
```
