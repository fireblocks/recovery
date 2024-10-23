<h1 align="center">
  <img src="apps/recovery-relay/public/icons/192x192.png" width="64px" height="64px" />
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
  <a href="#" target="_blank">
    <img  src="docs/img/splash.png" alt="Screenshot" />
  </a>
</p>

## [📚 User Guide](apps/recovery-utility/README.md)

## 🆕 Coming from [fireblocks-key-recovery-tool](https://github.com/fireblocks/fireblocks-key-recovery-tool)?

[Recovery Utility](apps/recovery-utility) offers a simple UI for your entire workspace backup and recovery lifecycle.

- Generate and verify keys for a new Recovery Kit.
- Verify your recovery procedure (sanity test).
- Recover your workspace private keys and derive wallet keys and addresses.
- Check balances and send transactions from recovered wallets using [Recovery Relay](apps/recovery-relay), which you can self-host.

## [💻 Apps](apps/)

- [**Recovery Utility**](apps/recovery-utility/): Recovery Utility: airgapped desktop app (Electron + Next.js)
- [**Recovery Relay**](apps/recovery-relay/): Recovery Relay: browser-based transaction client (Next.js)

## [📦 Packages](packages/)

- [**@fireblocks/extended-key-recovery**](packages/extended-key-recovery/): Recover extended private/public keys from a Recovery Kit (Python)
- [**@fireblocks/wallet-derivation**](packages/wallet-derivation/): Derive wallet keys and addresses from extended keys and HD paths (TypeScript)
- [**@fireblocks/recovery-shared**](packages/shared/): Shared frontend components and utilities (TypeScript)

## [🔨 Development](docs/CONTRIBUTING.md)

## ⚖️ Legal

[Copyright © 2023 Fireblocks](https://www.fireblocks.com)

[GNU General Public License v3.0 or later](LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/custom%2B9027%2Ffireblocks%2Frecovery.svg?type=large)](https://app.fossa.com/projects/custom%2B9027%2Ffireblocks%2Frecovery?ref=badge_large)
