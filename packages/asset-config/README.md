# @fireblocks/asset-config

Blockchain constants

---

Output files generated at build time by [querying supported assets](https://developers.fireblocks.com/reference/get_supported-assets) from the Fireblocks API and [patching](config/assetPatches.ts) the result with custom data:

- Explorer URL (for native assets)
- Whether the asset is supported for key derivation by [@fireblocks/wallet-derivation](../wallet-derivation/)
- Whether the asset supports Segwit addresses
- Whether the asset uses UTXOs
