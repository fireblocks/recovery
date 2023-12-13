# server

## 1.1.0

### Minor Changes

- dc720bb: fix: fixed agp recovery

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

## 0.2.0

### Minor Changes

- Remove separate Python server call to `/get-wif`
- Clean up Postman collection, remove OpenAPI schema

## 0.1.0

### Minor Changes

- 8a3516f: Initial prerelease. Recover Fireblocks assets and keys in a disaster, verify a Recovery Kit, or generate keys to set up a new Recovery Kit.
