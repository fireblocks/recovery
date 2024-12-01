# recovery-relay

## 1.1.0

### Minor Changes

- 3e6e341: Bump versions

### Patch Changes

- Updated dependencies [3e6e341]
  - @fireblocks/asset-config@0.5.0
  - @fireblocks/recovery-shared@0.6.0
  - @fireblocks/wallet-derivation@0.7.0

## 1.0.0

### Major Changes

- 2042e27: Removed early access warning

### Minor Changes

- 3ec08d8: Added default RPC URLs

### Patch Changes

- ab2ea37: Re-enabled transfer of and fixed ATOM
- 0d3674f: yarn file and version bump
- b836b7c: Updated settings schema for configurable RPC
- cf7bb23: Added celestia and coredao logic
- fc90716: Updated relay UI for configurable RPC
- af041e2: Updated wallets to use configurable RPCs
- Updated dependencies [ab2ea37]
- Updated dependencies [210c378]
- Updated dependencies [ecb2e9b]
- Updated dependencies [b836b7c]
- Updated dependencies [665e844]
- Updated dependencies [e081c5a]
- Updated dependencies [cccaa37]
- Updated dependencies [cf7bb23]
- Updated dependencies [ef57e43]
- Updated dependencies [e0395df]
  - @fireblocks/asset-config@0.4.0
  - @fireblocks/recovery-shared@0.5.0
  - @fireblocks/wallet-derivation@0.6.0

## 0.6.0

### Minor Changes

- c2bb413: fixed btc relay wallet broadcast failure
- c2bb413: added alert for new version availability
- c2bb413: reflect broadcast error in case occurred
- c2bb413: refactored btc-like information query code on relay
- c2bb413: fix: consecutive withdrawals don't work
- c2bb413: allowed btc relay utils to pipe web req through main proc
- c2bb413: fixed fetching UTXO to only confirmed ones
- c2bb413: refactored doge relay wallet
- c2bb413: added bsv broadcast function and cleanup
- c2bb413: ripple tx broadcast and result without waiting for confirmation
- c2bb413: fixed EVM provider caching and funds broadcast error
- c2bb413: updated withdrawal modal to reflect errors
- c2bb413: execute web requests through main process instead of renderer for SOL and BSV
- c2bb413: fix error due to bigint in info call
- c2bb413: fixed btc relay wallet to use overwritten broadcast function in case available

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
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
- Updated dependencies [c2bb413]
  - @fireblocks/recovery-shared@0.4.0
  - @fireblocks/asset-config@0.3.0
  - @fireblocks/wallet-derivation@0.6.0

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
