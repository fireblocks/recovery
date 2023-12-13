# recovery-utility

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
