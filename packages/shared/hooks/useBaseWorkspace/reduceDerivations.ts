import { Input, BaseWallet, HDPathInput } from '@fireblocks/wallet-derivation';
import { getDerivableAssetConfig, isTestnetAsset } from '@fireblocks/asset-config';
import { RecoveredKey } from '@fireblocks/extended-key-recovery/src/types';
import { VaultAccount, Wallet } from '../../types';
import { LOGGER_NAME_SHARED } from '../../constants';
import { getLogger } from '../../lib/getLogger';
import { sanatize } from '../../lib/sanatize';
import { getDerivationMapKey } from '../../lib/getDerivation';
import { RelayExtendedKeys, UtilityExtendedKeys } from '../../schemas';

const logger = getLogger(LOGGER_NAME_SHARED);

export type DerivationReducerInput<T extends BaseWallet, App extends 'utility' | 'relay'> = {
  extendedKeys?: App extends 'utility' ? UtilityExtendedKeys : RelayExtendedKeys;
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

export const reduceDerivations = <App extends 'utility' | 'relay', T extends BaseWallet = BaseWallet>(
  input: DerivationReducerInput<T, App>,
) => {
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
    isTestnet = input.assetId.includes('TEST') || input.assetId === 'WND' || isTestnetAsset(input.assetId),
    lastUpdated,
    balance,
    deriveWallet,
  } = input;

  const sanatizedReduction = sanatize(input);
  logger.debug('reduceDerivations', { sanatizedReduction });

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

  // No option to inspect App at runtime, need to rely on values in extendedKeys

  let keys;
  if ('xpub' in (extendedKeys || {})) {
    // Will only happen when extendedKeys is defined + is in relay app
    keys = { ...(extendedKeys as RelayExtendedKeys), xprv: undefined, fprv: undefined };
  } else {
    const keysets = Object.entries((extendedKeys as UtilityExtendedKeys) || {}).filter(
      ([keysetId]) => keysetId !== 'ncwMaster',
    ) as [string, RecoveredKey][];
    if (keysets.length === 0) {
      keys = undefined;
    }

    // We want to find the xpub and fpub for the extended keys that match the required accountId.
    let xpub: string | undefined;
    let xprv: string | undefined;
    let fpub: string | undefined;
    let fprv: string | undefined;
    const ecdsaKeyset = Object.values(keysets).findLast(([, key]) =>
      key.ecdsaExists ? key.ecdsaMinAccount !== -1 && key.ecdsaMinAccount <= accountId : false,
    );
    if (ecdsaKeyset !== undefined) {
      xpub = ecdsaKeyset[1].xpub;
      xprv = ecdsaKeyset[1].xprv;
    }
    const eddsaKeyset = Object.values(keysets).findLast(([, key]) =>
      key.eddsaExists ? key.eddsaMinAccount !== -1 && key.eddsaMinAccount <= accountId : false,
    );
    if (eddsaKeyset !== undefined) {
      fpub = eddsaKeyset[1].fpub;
      fprv = eddsaKeyset[1].xprv;
    }

    if (!xpub || !fpub) {
      keys = undefined;
    } else {
      keys = { xpub, fpub, xprv, fprv };
    }
  }

  const { xpub, fpub, xprv, fprv } = keys ?? {};

  const hasXpub = !!xpub || !!fpub;

  const hasXprv = !!xprv || !!fprv;

  const canDerive = (hasXpub || hasXprv) && !!getDerivableAssetConfig(assetId);

  const missingWalletKey = (hasXpub && !publicKey) || (hasXprv && !privateKey);

  const shouldDerive = canDerive && (missingWalletKey || !address || !wallet.derivations.has(address));

  // Derive wallet
  if (shouldDerive) {
    logger.info('Will derive wallet for input: ', sanatize(derivationInput));
    const derivation = deriveWallet(derivationInput);

    if (address && derivation.address !== address) {
      // TODO: Show notice in UI when this happens. For now just remove the erroneous imported address
      logger.warn(`Address mismatch, dropping import. Imported ${address}, derived ${derivation.address}`);
      wallet.derivations.delete(address);
    }

    wallet.derivations.set(getDerivationMapKey(derivation.assetId, derivation.address), derivation);
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
