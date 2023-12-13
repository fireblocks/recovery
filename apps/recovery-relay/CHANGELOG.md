# recovery-relay

## 0.4.0

### Minor Changes

- e26a3c7: chore: ui fixes (asset id on balance query result and prevent relay modal from closing on empty data scanned
- 50f113b: fix: fixed solana transfers
- f547ea4: lint fix
- e0891d5: fix: Solana connection 403 fix
- 9f8f0d0: fix: fixed btc transfer
- 1a720ce: fix: prevent negative balance on EVMs

### Patch Changes

- Updated dependencies [d8208bc]
- Updated dependencies [e26a3c7]
- Updated dependencies [50f113b]
- Updated dependencies [dc4e3ea]
- Updated dependencies [d4833f0]
- Updated dependencies [84a4973]
- Updated dependencies [e0891d5]
- Updated dependencies [b84ccc7]
- Updated dependencies [fd87693]
  - @fireblocks/asset-config@0.1.0
  - @fireblocks/recovery-shared@0.2.0
  - @fireblocks/wallet-derivation@0.4.0

## 0.1.1

### Patch Changes

- - Add algorithm labels to extended key fields
  - Replace references to BIP32 paths with BIP44 paths
  - Add more notices about key material storage in set up
  - Add notice that Ed25519/EdDSA keys are Fireblocks proprietary
  - Make RSA passphrase field mandatory in set up, optional in recovery
  - Update documentation
  - Refactoring
  - CI fixes
- Updated dependencies
  - shared@0.1.2

## 0.1.0

### Minor Changes

- 8a3516f: Initial prerelease. Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.

### Patch Changes

- Updated dependencies [8a3516f]
  - shared@0.1.0
