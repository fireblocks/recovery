import { getAssetConfig } from '@fireblocks/asset-config';
import { Input } from './types';
import { BaseWallet } from './wallets/BaseWallet';
import { getWallet } from './wallets/chains';

export const deriveWallet = (input: Input): BaseWallet => {
  const nativeAssetId = getAssetConfig(input.assetId)?.nativeAsset?.id ?? input.assetId;

  const WalletInstance = getWallet(nativeAssetId);

  const wallet = new WalletInstance(input);

  return wallet;
};

export * from './types';

export * from './wallets/chains';

export { BaseWallet };
