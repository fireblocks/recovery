import { ExtendedKeys, Input, BaseWallet, HDPathInput } from '@fireblocks/wallet-derivation';
import { getDerivableAssetConfig } from '@fireblocks/asset-config';
import { VaultAccount, Wallet } from '../../types';

export type DerivationReducerInput<T extends BaseWallet> = {
  extendedKeys?: ExtendedKeys;
  accounts: Map<number, VaultAccount<T>>;
  assetId: string;
  accountId: number;
  accountName?: string;
  path?: HDPathInput;
  address?: string;
  type?: string;
  description?: string;
  tag?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
  isTestnet?: boolean;
  isLegacy?: boolean;
  lastUpdated?: Date;
  balance?: { native?: number; usd?: number };
  deriveWallet: (input: Input) => T;
};

export const testIsLegacy = (assetId: string, address: string) =>
  (assetId === 'BTC' && !address.startsWith('bc1')) || (assetId.startsWith('BTC_') && !address.startsWith('tb1'));

export const reduceDerivations = <T extends BaseWallet = BaseWallet>(input: DerivationReducerInput<T>) => {
  const {
    extendedKeys,
    accounts,
    assetId,
    accountId = 0,
    accountName = `Account ${input.accountId}`,
    address,
    type,
    description,
    tag,
    publicKey,
    privateKey,
    wif,
    isLegacy = !!input.address && testIsLegacy(input.assetId, input.address),
    isTestnet = input.assetId.includes('TEST') || input.assetId === 'WND',
    lastUpdated,
    balance,
    deriveWallet,
  } = input;

  const path = {
    ...input.path,
    account: input.path?.account ?? input.accountId ?? 0,
    changeIndex: input.path?.changeIndex ?? 0,
    addressIndex: input.path?.addressIndex ?? 0,
  };

  const account: VaultAccount<T> = {
    id: accountId,
    name: accountName,
    wallets: new Map<string, Wallet<T>>(),
    ...accounts.get(accountId),
  };

  const wallet: Wallet<T> = {
    assetId,
    isTestnet,
    derivations: new Map<string, T>(),
    lastUpdated,
    ...account.wallets.get(assetId),
  };

  // Mock derivation
  if (address) {
    wallet.derivations.set(address, {
      assetId,
      path,
      pathParts: [44, path.coinType, path.account, path.changeIndex, path.addressIndex],
      address,
      tag,
      type,
      description,
      publicKey,
      privateKey,
      wif,
      isTestnet,
      isLegacy,
    } as unknown as T);
  }

  const derivationInput: Input = {
    ...extendedKeys,
    assetId,
    path,
    isTestnet,
    isLegacy,
  };

  const { xpub, fpub, xprv, fprv } = extendedKeys ?? {};

  const hasXpub = !!xpub || !!fpub;

  const hasXprv = !!xprv || !!fprv;

  const canDerive = (hasXpub || hasXprv) && !!getDerivableAssetConfig(assetId);

  const missingWalletKey = (hasXpub && !publicKey) || (hasXprv && !privateKey);

  const shouldDerive = canDerive && (missingWalletKey || !address || !wallet.derivations.has(address));

  // Derive wallet
  if (shouldDerive) {
    const derivation = deriveWallet(derivationInput);

    if (address && derivation.address !== address) {
      // TODO: Show notice in UI when this happens. For now just remove the erroneous imported address
      console.warn(`Address mismatch, dropping import. Imported ${address}, derived ${derivation.address}`);
      wallet.derivations.delete(address);
    }

    wallet.derivations.set(derivation.address, derivation);
  }

  // Handle legacy + Segwit derivations
  if (assetId === 'BTC' || assetId.startsWith('BTC_')) {
    const hasOneAddressForPath =
      Array.from(wallet.derivations.values()).filter((d) => d.path.addressIndex === path.addressIndex).length < 2;

    if (hasOneAddressForPath) {
      const altDerivation = deriveWallet({
        ...derivationInput,
        isLegacy: !isLegacy,
      });

      wallet.derivations.set(altDerivation.address, altDerivation);
    }
  }

  wallet.balance = {
    native: 0,
    usd: 0,
    ...wallet.balance,
    ...balance,
  };

  account.wallets.set(assetId, wallet);

  return account;
};
