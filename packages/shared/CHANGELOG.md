# shared

## 0.7.0

### Minor Changes

- 19bea91: Version Bump

### Patch Changes

- Updated dependencies [19bea91]
  - @fireblocks/asset-config@0.6.0
  - @fireblocks/wallet-derivation@0.7.1

## 0.6.0

### Minor Changes

- 3e6e341: Bump versions

### Patch Changes

- Updated dependencies [3e6e341]
  - @fireblocks/asset-config@0.5.0
  - @fireblocks/wallet-derivation@0.7.0

## 0.5.0

### Minor Changes

- b836b7c: Updated settings schema for configurable RPC
- e081c5a: fixed address validation for cosmos based chains

### Patch Changes

- Updated dependencies [ab2ea37]
- Updated dependencies [210c378]
- Updated dependencies [ecb2e9b]
- Updated dependencies [665e844]
- Updated dependencies [cccaa37]
- Updated dependencies [cf7bb23]
- Updated dependencies [ef57e43]
- Updated dependencies [e0395df]
  - @fireblocks/asset-config@0.4.0
  - @fireblocks/wallet-derivation@0.6.0

## 0.4.0

### Minor Changes

- c2bb413: allow manual input of xprv and fprv
- c2bb413: prevent loading csv if asset is missing derivation path
- c2bb413: fixed address validation for testnet assets
- c2bb413: changed variable names
- c2bb413: fix: consecutive withdrawals don't work
- c2bb413: added ncw recovery functionality
- c2bb413: fixed EVM provider caching and funds broadcast error
- c2bb413: added functionality to only recover NCW keys
- c2bb413: update type naming
- c2bb413: export NCW master wallet from recovery to workspace

### Patch Changes

- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
  - @fireblocks/extended-key-recovery@1.3.0
  - @fireblocks/asset-config@0.3.0
  - @fireblocks/wallet-derivation@0.6.0

## 0.2.0

### Minor Changes

- d8208bc: fix: added ids for e2e testing mode only
- e26a3c7: chore: ui fixes (asset id on balance query result and prevent relay modal from closing on empty data scanned
- dc4e3ea: allow public key to be used instead of generating public key from scratch
- d4833f0: fix: prevent loading CSV row if it contained invalid data
- b84ccc7: fix: fixed build

### Patch Changes

- Updated dependencies [d8208bc]
- Updated dependencies [50f113b]
- Updated dependencies [84a4973]
- Updated dependencies [e0891d5]
- Updated dependencies [fd87693]
  - @fireblocks/asset-config@0.1.0
  - @fireblocks/wallet-derivation@0.4.0

## 0.1.2

### Patch Changes

- - Add algorithm labels to extended key fields
  - Replace references to BIP32 paths with BIP44 paths
  - Add more notices about key material storage in set up
  - Add notice that Ed25519/EdDSA keys are Fireblocks proprietary
  - Make RSA passphrase field mandatory in set up, optional in recovery
  - Update documentation
  - Refactoring
  - CI fixes

## 0.1.1

### Patch Changes

- Fix Button props

## 0.1.0

### Minor Changes

- 8a3516f: Initial prerelease. Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.
