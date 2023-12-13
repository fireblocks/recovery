# shared

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
