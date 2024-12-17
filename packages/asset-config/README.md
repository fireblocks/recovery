# @fireblocks/asset-config

## Blockchain constants

Output files generated at build time by [querying supported assets](https://developers.fireblocks.com/reference/get_supported-assets) from the Fireblocks API and [patching](config/assetPatches.ts) the result with custom data:

- Explorer URL (for native assets)
- Whether the asset is supported for key derivation by [@fireblocks/wallet-derivation](../wallet-derivation/)
- Whether the asset supports Segwit addresses
- Whether the asset uses UTXOs

## :hammer: Developement

In order to add new assets to the asset configuration, perform the following, depending on your need.

### Native Asset Support

In case a native asset is missing (native asset refers to the base blockchain such as ATOM, ETH, BTC, etc), or has some incorrect data it can be added / fixed as follows:

1. In the folder `config` create a backup of the file `patches.ts`. This file contains all the information about native assets
2. In the original file, edit the fields needed or add a new field to the array `nativeAssetPatches`

The objects in the array have the following structure ([NativeAssetPatches](./types.ts#L21)):

```typescript
/**
 *  The key must appear in field of `nativeAsset` in one of the objects in the field globalAssets in `data/globalAssets.ts`.
 * There should be an object in the aformentioned array that is the native asset.
 */
key: {
  derive?: boolean;                // Should this asset be derived and presented as part of asset selection view
  transfer?: boolean;              // Can this asset be transfered / withdrawn?
  utxo?: boolean;                  // Is this asset a UTXO based asset?
  segwit?: boolean;                // Applicable for bitcoin only
  minBalance?: boolean | number;   // Minimal required balance for an account to exist - will limit withdrawal
  memo?: boolean;                  // Should this asset get a memo as part of transaction preparation?
  rpcUrl?: string;                 // The URL of an RPC endpoint used for communication
  getExplorerUrl?: GetExplorerUrl; // Elaborated below
}
```

The majority of the fields are self explanatory, the last field is unique compared to the rest. The `getExplorerUrl` is a function of the signature: `(type: 'tx' | 'address') => (value: string) => string`

This field is meant to build the link to display the transaction on an explorer after a transaction has been broadcasted.

So any object to be added or fixed must conform to the above object to avoid undefined behavior.

For your convinience we have provided base methods for common types of chains:

- `evm(baseExplorerUrl: string, rpcUrl?: string)` to create a basic EVM chain, simply provide the `baseExplorerUrl` (the URL of an explorer) and optionally `rpcUrl` as the URL of the RPC to communicate with
- `btc(baseExplorerUrl: string, segwit: boolean)` to create a basic BTC chain (ZCash, LTC, etc are all considered such) simply provide the `baseExplorerUrl` (the URL of an explorer) and optionally `segwit` should be false, as only BTC is relevant for this field

### Add a new Jetton token

To add support for withdrawals of a listed Jetton, make sure the token is listed in [globalAssets](/Users/tomerhorviz/Documents/recovery/packages/asset-config/data/globalAssets.ts) and in [patches](packages/asset-config/config/patches.ts).
The Jetton master contract address must be present in the 'globalAssets' list as the 'address' parameter.

### Token or new Base Asset Support

In case a token has bad data, alternatively a token is missing or you want to add a new base asset, it can be added by performing the following steps:

1. In the folder `data` create a backup of the file `globalAssets.ts`
2. In the original file, edit the fields that need to be edited, or alternatively add a new field to the array.

The objects in the array have the following structure:

```typescript
{
    id: string;           // The ID of the asset, this will match the Fireblocks definition of this token / asset
    symbol: string;       // In case of a token this is the symbol of the token, if an asset it will match the `id` field
    name: string;         // The name of the asset / token
    decimals: number;     // The number of decimals that the token / asset has
    address?: string;     // For tokens only, the address of the token on the relevant chain
    nativeAsset: string;  // In case of a token, this is `id` of the base asset otherwise will match the current object's `id` field
    protocol: string;     // In case of a token the `id` of the protocol that this token uses otherwise will match the current object's `id` field
    testnet: boolean;     // Is this a testnet or not
}
```

All objects must conform to the above object to avoid undefined behavior.
