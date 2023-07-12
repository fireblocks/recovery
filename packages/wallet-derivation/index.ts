import { getAssetConfig } from '@fireblocks/asset-config';
import { Input } from './types';
import { BaseWallet } from './wallets/BaseWallet';
import { getWallet } from './wallets/chains';

export const deriveWallet = (input: Input): BaseWallet => {
  const nativeAssetId = getAssetConfig(input.assetId)?.nativeAsset ?? input.assetId;

  const WalletInstance = getWallet(nativeAssetId);

  // TODO: defaultCoinType should be unnecessary here, fix types / class inheritance
  const wallet = new WalletInstance(input, 0);

  return wallet;
};

export * from './types';

export * from './wallets/chains';

export { BaseWallet };
