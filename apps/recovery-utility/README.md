<h1 align="center">
  <img src="../recovery-relay/public/icons/192x192.png" width="64px" height="64px" />
  <br />
  Fireblocks Recovery Utility
</h1>

<p align="center">
  Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.
  <br />
  <br />
  <a href="https://github.com/fireblocks/recovery/releases">
    ⬇️ Download for macOS / Linux
  </a>
  <br />
  <br />
  <a href="https://gitpod.io/#https://github.com/fireblocks/recovery/tree/main/" target="_blank">
    <img src="https://gitpod.io/button/open-in-gitpod.svg" alt="Open in Gitpod" />
  </a>
  <br />
  <br />
  <a href="#" target="_blank">
    <img src="../../docs/img/splash.png" alt="Screenshot" />
  </a>
</p>

---

## 📚 User Guide

1. Set up a dedicated offline recovery machine. It must be:
   - Offline and air-gapped
   - Accessible only by necessary, authorized personnel
   - Protected with a very strong password
   - Encrypted on all partitions
   - Stored in a safe box when not in use
2. [Install the latest release of Recovery Utility](https://github.com/fireblocks/recovery/releases) on the offline recovery machine.
3. **(Optional)** [Install the latest release of Recovery Relay](https://github.com/fireblocks/recovery/releases) on a web server. [Recovery Relay](../recovery-relay/) is a companion web app that gets wallet balances and sends transactions without revealing your private keys. Fireblocks hosts an instance at [relay.fireblocks.solutions](https://relay.fireblocks.solutions), but you can host your own instance and set its URL in Recovery Utility's Settings tab.
4. Open Recovery Utility to use one of the following tools...

## 🧰 Tools

### 🆕 Set Up Recovery Kit

Generate an RSA keypair and checksum for a new Recovery Kit. If you already have your backup .zip, RSA keypair with passphrase, and owner's mobile app passphrase, then you can skip this and proceed to Verify Recovery Kit.

<p align="center">
  <img width="49.15%" src="../../docs/img/setup.png" alt="Set Up Recovery Kit" />
</p>

### ✅ Verify Recovery Kit

With your Recovery Kit .zip, RSA private key with passphrase, and owner's mobile app passphrase, you can verify your ability to perform a hard key recovery. Recovery Utility uses these materials to generate your workspace's `xpub` and `fpub` extended public keys. Check that the these extended public keys match the keys in your Fireblocks Console Settings.

<p align="center">
  <img width="49.15%" src="../../docs/img/verify.png" alt="Verify Recovery Kit" />
  <img width="49.15%" src="../../docs/img/public-keys.png" alt="Extended Public Keys" />
</p>

### 🔑 Recover Private Keys

With your Recovery Kit .zip, RSA private key with passphrase, and owner's mobile app passphrase, you can recover the extended private keys (`xprv` and `fprv`) of your Fireblocks workspace, derive wallets to recover your assets' private keys, and create transactions by scanning a QR code to the Recovery Relay web app.

#### 🚨 WARNING

Using private key recovery exposes your private keys to the host machine. Only do this in a disaster recovery scenario, and then move your assets to other secure wallets. Use the Fireblocks Console, APIs, and SDKs for standard operations.

<p align="center">
  <img width="49.15%" src="../../docs/img/recover.png" alt="Recover Private Keys" />
  <img width="49.15%" src="../../docs/img/assets.png" alt="Recover Bitcoin Wallets" />
</p>

## 🔨 Development

Recovery Utility is a cross-platform [Electron](https://www.electronjs.org/) app for macOS, Windows, and Linux. The window UI is built with [React](https://reactjs.org/) on the [Next.js](https://nextjs.org/) framework, using [Material UI](https://mui.com/material-ui/getting-started/overview/) components.

[Recovery Utility](../recovery-utility/) includes the compiled [@fireblocks/extended-key-recovery](../../packages/extended-key-recovery/) module in its [contents](https://www.electron.build/configuration/contents.html#extrafiles) and spawns it as a child process to restore a workspace's extended private/public keys. It uses [@fireblocks/wallet-derivation](../../packages/wallet-derivation/) to derive wallet keys and addresses.

### Build Process

Using Turborepo, the [@fireblocks/extended-key-recovery](../../packages/extended-key-recovery/) module is first compiled to an executable for the development machine's architecture. Then Recovery Utility's renderer process (the Next.js frontend) is transpiled to static HTML/JS/CSS. Finally, the renderer and module are bundled with the Electron main process into an application bundle for the development machine's architecture.

Cross-compilation is not supported. We use GitHub Actions with a matrix job to compile Recovery Utility for each supported architecture (masOS, Windows, and Linux).

### Security

The Electron main process disallows opening or redirecting to external URLs and disables Chrome permission requests (e.g. webcam access, clipboard reading). No external content is loaded.
