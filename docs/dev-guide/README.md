# Fireblocks Recovery Utility Developer Guide

This guide's purpose is to provide a detailed explanation of the technical aspects of Fireblocks Recovery Utility and Recovery Relay. This includes but is not limited to:

- High level architecture
- Flow explanation
- Potential error locations
- Code structure
- Extendability

The guide can be used to add capabilities or new blockchains in case of disaster recovery.

> **Note:** `xprv/fprv` and `xpub/fpub` are the extended private and extended public keys. These are the root keys of the workspace from which all wallet keys are derived. `xprv/xpub` are ECDSA keys, compatible with BIP32 wallet derivation. `fprv/fpub` are EdDSA keys and use Fireblocks-specific implementations for wallet derivation.

## Table of Contents

- [Operations Flow](#operations-flow)
- [Package Structure](#package-structure)
  - [Recovery Utility](#recovery-utility)
  - [Recovery Relay](#recovery-relay)
  - [Shared - Extended Key Recovery](#shared---extended-key-recovery)
  - [Shared - Asset Config](#shared---asset-config)
  - [Shared - Wallet Derivation](#shared---wallet-derivation)
  - [Shared](#shared)
- [Adding Assets](#adding-assets)

## Operations Flow

### Main Components

The main components of Recovery Utility are the `Recovery Utility` and `Recovery Relay` applications. Both of them utilize shared packages from the recovery monorepo as well as 3rd party dependencies.

#### Recovery Utility

A desktop application that **must** be used **only** on an offline, air-gapped machine. Recovery Utility is used to set up Backup Kit encryption keys, verify a Backup Kit, and recover a Backup Kit in a disaster recovery scenario. In a disaster recovery scenario, `Recovery Utility` houses private key material and is responsible for transaction creation and signing. It uses inputs provided from the online `Recovery Relay` to construct transactions, then passes signed transactions back to `Recovery Relay` for broadcasting.

#### Recovery Relay

A web application running on an Internet-connected server that houses blockchain interaction logic. It is responsible for deriving wallet public keys to obtain transaction inputs from the relevant blockchain and to broadcast transactions. `Recovery Relay` never handles private keys.

### Operations Flow

The operations that are covered are the following:

- Verification of the recovery package
- Recovery of the private key material
- Withdrawing funds

#### Verification of the Recovery Package

![verify package](./verify-flow.png)

The package verification process recovers the `xprv` and `fprv` extended private keys, computes the `xpub` and `fpub` extended public keys, discards the private keys, and compares the public keys to the ones provided in the Backup Kit metadata. After a successful verification, wallet public keys may be derived and verified.

> **Note:** AGP means Auto-Generate Passphrase

#### Recovery of the `xprv/fprv` Key Material

![recover package](./recovery-flow.png)

The disaster recovery process recovers the `xprv/fprv` extended private key material along with computing the `xpub/fpub` extended public keys. The `xpub/fpub` keys are verified in the same process as in the verification flow (against the Backup Kit metadata).

If there is an error, the recovery process is haulted and an error is displayed. Otherwise the `xprv/fprv` key values are stored in memory, followed by rendering the "Accounts" view.

#### Withdrawing Funds

![withdrawing funds](./withdrawing-funds.png)

Recovery Utility works in tandem with Recovery Relay to securely withdraw an entire wallet's balance to a separate wallet address. Recovery Relay must be separately configured on a web server with access to the Internet, and its URL must be set in Recovery Utility's settings. Recovery Relay requires internet access to make outbound requests, but it does **not** need to listen on an Internet-accessible port for inbound requests.

After a user performs a workspace recovery in Recovery Utility and derives a wallet's private keys, the user may initiate a withdraw. After the user provides a destination address, Recovery Utility generates a URL and a QR code which may be opened from a **separate** online machine with access to the Recovery Relay web server. This URL encodes the destination address, workspace extended **public** keys, and targeted wallet derivation path. Recovery Relay will derive wallet public keys from this information and then fetch wallet balances and any required parameters for creating a transaction. It will then encode another URL/QR code to be opened on the air-gapped offline machine with Recovery Utility. This URL contains all parameters necessary for creating a transaction, except for keys. The user opens Recovery Relay's URL with Recovery Utility, confirms the transaction details to securely sign the transaction offline, and is then presented with a final URL/QR code containing the signed transaction. The user opens this URL/QR code on the online machine to broadcast the transaction to the blockchain with Recovery Relay.

The main item missing from the above diagram is the actual wallet key derivation process. Key derivation is extensively covered throughout resources online, therefore we do not discuss it.

## Package Structure

### Recovery Utility

The [`@fireblocks/recovery-utility`](../../apps/recovery-utility/) application is the corner-stone of the disaster recovery process. It is a hardened Electron application containing utilities for extended private key recovery, wallet key derivation, and the main Next.js UI and logic. It must be run from an air-gapped offline machine.

#### `main` directory

Houses the Electron `main` process which is the application entrypoint, responsible for launching the `renderer` web UI process.

- [`helpers`](../../apps/recovery-utility/main/helper/README.md): Browser window helpers
- [`ipc`](../../apps/recovery-utility/main/ipc/README.md): Electron inter-process communication handlers
- [`store`](../../apps/recovery-utility/main/store/README.md): classes for data persistence using `electron-store`. Extended workspace keys and wallet keys are never persisted.

#### `renderer`

Houses the Electron `renderer` process which is a Next.js/React.js web application.

- [`components`](../../apps//recovery-utility/renderer/components): shared React components
- [`context`](../../apps/recovery-utility/renderer/context): React context, most importantly for workspace management
- [`lib`](../../apps/recovery-utility/renderer/lib/README.md): `renderer` libraries including IPC handlers and cold wallets
- [`pages`](../../apps/recovery-utility/renderer/pages): Next.js pages
- [`public`](../../apps/recovery-utility/renderer/public): Static web assets

---

### Recovery Relay

The [`@fireblocks/recovery-relay`](../../apps/recovery-relay/) web application is responsible for all blockchain communications to enable transaction creation and broadcasting. It retrieves blockchain data such as balances, UTXOs, and other metadata needed for transaction creation.

The following are the main folders for the relay code.

- [`components`](../../apps//recovery-relay/components): shared React components
- [`context`](../../apps/recovery-relay/context): React context, most importantly for workspace management
- [`lib`](../../apps/recovery-relay/lib/README.md): public key -based wallet handlers
- [`pages`](../../apps/recovery-relay/pages): Next.js pages
- [`public`](../../apps/recovery-relay/public): Static web assets

---

### Shared - Extended Key Recovery

The [`@fireblocks/extended-key-recovery`](../../packages/extended-key-recovery/) package provides the cryptography code to take the encrypted extended private key shards of the Backup Kit and combine them into the real extended private/public key materials. All logic is in [`recovery.ts`](../../packages/extended-key-recovery/recovery.ts).

This package is not intended to be extended or modified, since Fireblocks will roll out any new curves or key capabilities to this repository as they are implemented on the Fireblocks platform.

---

### Shared - Asset Config

The [`@fireblocks/asset-config`](../../packages/asset-config/) package provides Recovery Utility and Recovery Relay with asset metadata for assets supported by Fireblocks. By default we provide only the global tokens that are added and available for all Fireblocks customers.

To extend asset config with additional assets or to fix existing assets please follow the `Development` section of [this README](../../packages/asset-config/README.md).

---

### Shared - Wallet Derivation

The [`@fireblocks/wallet-derivation`](../../packages/wallet-derivation/) package provides Recovery Utility and Recovery Relay with the ability to take an `xpub/fpub` key or `xprv/fprv` key and derive a wallet's public or private key corresponding to a BIP44 derivation path. As a derivation path is a thoroughly explored concept we will not define or elaborate on it.

To extend wallet derivation with additional assets or to fix existing assets please follow the `Development` section of [this README](../../packages/wallet-derivation/README.md).

---

### Shared

The [`@fireblocks/recovery-shared`](../../packages/shared/) package contains React components, hooks, and utilities shared across Recovery Utility and Recovery Relay. There is no extendability relevant for this package.

## Adding Assets

Adding assets requires multiple changes:

1. If this is a new native asset (i.e. is not an EVM or BTC style chain, using the same code) - add a new native asset as per the [`asset-config` readme](../../packages/asset-config/README.md#native-asset-support). If this is not a new native asset, only [add a `globalAsset`](../../packages/asset-config/README.md#token-or-new-base-asset-support)
2. Add a new wallet as per [`wallet-derivation` readme](../../packages/wallet-derivation/README.md#🔨-development)
3. Add balance fetching and broadcasting logic as per [`recovery-relay/lib` readme](../../apps/recovery-relay/lib/README.md)
4. Add transaction creating and signing logic as per [`recovery-utility/renderer/lib readme`](../../apps/recovery-utility/renderer/lib/README.md)

Once done, rebuild the project and you'll be able to use your newly added asset.
