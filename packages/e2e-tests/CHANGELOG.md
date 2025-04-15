# @fireblocks/e2e-tests

## 0.5.0

### Minor Changes

- c33832f: update vault navigation to be able to go to vault from main page or from specific vault

## 0.4.0

### Minor Changes

- 3e6e341: Bump versions

## 0.3.0

### Minor Changes

- f3906da: Created more descriptive error types
- 2418fcb: raise error if couldn't get balance

### Patch Changes

- 213ebf9: raise error if invalid address format
- 72000ba: Added support for testing configurable rpc
- 7e455f8: added .env example for e2e test
- 9846d3e: Added support for configurable rpc test and error types
- 9effeb7: updated asset list for test
- 28c8ebd: Updated possible test assets
- c320e08: Updated launch timeout

## 0.2.0

### Minor Changes

- c2bb413: tests now take into account broadcast errors
- c2bb413: allowed for alternative to address in tests

## 0.1.0

### Minor Changes

- d8208bc: fix: added ids for e2e testing mode only
- 2c19295: fix: fixed tests for btc
- e7ac8d9: fix: removed unnecessary pause on tests
- a5802f7: fix: console generated error generates log zip instead of crashing first
- 92c558f: chore: split test assets to mainnet and testnet native assets
- ab60232: fix: fixed tests to avoid false positives
- 3ee3773: fix: prevent build for e2e-tests as part of yarn build

### Patch Changes

- 129b1fe: feat: added e2e tests
