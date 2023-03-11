import { isDerivableAssetId, getAssetConfig } from '@fireblocks/asset-config';
import { Input, BaseWallet } from '@fireblocks/wallet-derivation';
import { useEffect, Dispatch, SetStateAction } from 'react';
import { RelayPath, RelayParams, AllRelayParams, getRelayUrl, getRelayParams } from '../../../lib/relayUrl';
import { reduceDerivations } from '../reduceDerivations';
import { reduceTransactions } from '../reduceTransactions';
import { BaseWorkspace } from '../types';

// eslint-disable-next-line import/no-mutable-exports
export let initialUrlParams: AllRelayParams | undefined;

if (typeof window !== 'undefined') {
  try {
    initialUrlParams = getRelayParams<RelayPath>(window.location.href) as AllRelayParams;
  } catch (error) {
    console.error(error);
  }

  window.location.hash = '';
}

const assertKeyParity = <T extends BaseWallet>(extension: 'x' | 'f', params: AllRelayParams, prev: BaseWorkspace<T>) => {
  const xprv = `${extension}prv` as const;
  const xpub = `${extension}pub` as const;

  if (prev.extendedKeys?.[xprv] && prev.extendedKeys[xpub] && params[xpub] && params[xpub] !== prev.extendedKeys[xpub]) {
    throw new Error(`Cannot mutate ${xpub} from Relay URL`);
  }
};

const getRelayWorkspaceReducer =
  <T extends BaseWallet = BaseWallet>(params: AllRelayParams, deriveWallet: (input: Input) => T) =>
  (prev: BaseWorkspace<T>): BaseWorkspace<T> => {
    // If private are set and the public keys are changing, throw an error
    assertKeyParity('x', params, prev);
    assertKeyParity('f', params, prev);

    // Set extended public keys (don't override if already set)
    const extendedKeys = {
      ...prev.extendedKeys,
      xpub: params.xpub,
      fpub: params.fpub,
    };

    // Update account balances
    const accounts = new Map(prev.accounts);

    params.balances?.forEach((balance) => {
      const updatedAccount = reduceDerivations({
        extendedKeys,
        accounts,
        assetId: balance.assetId,
        accountId: balance.accountId,
        path: { addressIndex: balance.addressIndex },
        address: balance.address,
        isLegacy: balance.isLegacy,
        isTestnet: balance.isTestnet,
        balance: { native: balance.native, usd: balance.usd },
        deriveWallet,
      });

      accounts.set(balance.accountId, updatedAccount);
    });

    // Transactions
    const transactions = reduceTransactions(prev.transactions, {
      id: params.txId,
      assetId: params.assetId,
      accountId: params.accountId,
      addressIndex: params.addressIndex,
      from: params.from,
      to: params.to,
      amount: params.amount,
      remainingBalance: params.remaining,
      hex: params.txHex,
      signature: params.signature,
    });

    // Active asset
    const assetId = params.assetId ?? prev.asset?.id;

    const asset = getAssetConfig(assetId) ?? prev.asset;

    // Active account
    const accountId = params.accountId ?? prev.account?.id;

    const hasAccountId = typeof accountId === 'number';

    if (assetId && hasAccountId) {
      const existingWallet = prev.accounts.get(accountId)?.wallets.get(assetId);

      const existingDerivation =
        typeof params.addressIndex === 'number' && existingWallet
          ? Array.from(existingWallet.derivations.values()).find((d) => d.path.addressIndex === params.addressIndex)
          : undefined;

      // Derive wallet if not already derived
      if (!existingDerivation && extendedKeys.xpub && extendedKeys.fpub && isDerivableAssetId(assetId)) {
        const newAccount = reduceDerivations({
          extendedKeys,
          accounts,
          assetId,
          accountId,
          path: { addressIndex: params.addressIndex },
          isTestnet: asset?.id.includes('TEST'),
          deriveWallet,
        });

        accounts.set(accountId, newAccount);
      }
    }

    const account = hasAccountId ? accounts.get(accountId) : prev.account;

    return {
      ...prev,
      extendedKeys,
      asset,
      account,
      accounts,
      transactions,
    };
  };

export const useRelayUrl = <T extends BaseWallet = BaseWallet>(
  relayBaseUrl: string,
  setWorkspace: Dispatch<SetStateAction<BaseWorkspace<T>>>,
  deriveWallet: (input: Input) => T,
) => {
  const getRelayUrlWithBase = <P extends RelayPath>(path: P, params: RelayParams<P>) => getRelayUrl(path, params, relayBaseUrl);

  const setWorkspaceFromRelayParams = (params: AllRelayParams) => setWorkspace(getRelayWorkspaceReducer(params, deriveWallet));

  useEffect(() => {
    if (initialUrlParams) {
      setWorkspaceFromRelayParams(initialUrlParams);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { getRelayUrl: getRelayUrlWithBase, setWorkspaceFromRelayParams };
};
