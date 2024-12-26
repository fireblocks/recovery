# recovery-utility

## 1.2.0

### Minor Changes

- 19bea91: Version Bump

## 1.1.0

### Minor Changes

- 3e6e341: Bump versions

## 1.0.0

### Major Changes

- 2042e27: Removed early access warning

### Minor Changes

- ef57e43: Fixed ETC withdrawal

### Patch Changes

- fb852ae: Fix typo
- ab2ea37: Re-enabled transfer of and fixed ATOM
- b836b7c: Updated settings schema for configurable RPC
- cf7bb23: Added celestia and coredao logic
- e0395df: Added flag to force legacy transaction format

## 0.6.0

### Minor Changes

- c2bb413: Implemented BSV transaction creation, serialization and signing
- c2bb413: implemented doge tx signing
- c2bb413: fix: consecutive withdrawals don't work
- c2bb413: implemented DASH signing
- c2bb413: fix linux appimage relaunch failure
- c2bb413: added ncw recovery functionality
- c2bb413: added functionality to only recover NCW keys
- c2bb413: refactor derivation and signing code
- c2bb413: update type naming
- c2bb413: execute web requests through main process instead of renderer for SOL and BSV
- c2bb413: export NCW master wallet from recovery to workspace
- c2bb413: remove log flooding print

## 0.4.0

### Minor Changes

- d8208bc: fix: added ids for e2e testing mode only
- 50f113b: fix: fixed solana transfers
- dc4e3ea: allow public key to be used instead of generating public key from scratch
- e0891d5: fix: Solana connection 403 fix
- e1e456c: chore: ui fix
- 9f8f0d0: fix: fixed btc transfer
- b84ccc7: fix: fixed build

### Patch Changes

- 6ea3f00: fix: recovery command-line argument not opens utility properly

## 0.2.1

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
  - server@0.2.1

## 0.2.0

### Minor Changes

- Fix footer licensing
- Fix fallback Python server URL
- Fix development server URL
- Fix Python server URL fallback
- Remove copy button from withdrawal PIN field
- More reliable key derivation UI: replace window with popover, remove Electron IPC listeners
- Remove separate Python server call to `/get-wif`
- Setup copy updates
- Add ability to select and delete wallets

### Patch Changes

- Updated dependencies
  - server@0.2.0

## 0.1.0

### Minor Changes

- 8a3516f: Initial prerelease. Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.

### Patch Changes

- Updated dependencies [8a3516f]
  - server@0.1.0
