// import { isDerivableAssetId, getAssetConfig } from '@fireblocks/asset-config';
// import { Input, BaseWallet } from '@fireblocks/wallet-derivation';
import { useState } from 'react';
import {
  // RelayImportRequestParams,
  // RelayCreateTxRequestParams,
  // RelayBroadcastTxRequestParams,
  // RelaySignTxResponseParams,
  RelayRequestParams,
  RelayResponseParams,
} from '../../../schemas';
import { getRelayParams, getRelayUrl } from '../../../lib/relayUrl';
// import { reduceDerivations } from '../reduceDerivations';
// import { reduceTransactions } from '../reduceTransactions';
// import { BaseWorkspace } from '../types';

// eslint-disable-next-line import/no-mutable-exports
export let initialHref: string | undefined;

if (typeof window !== 'undefined') {
  initialHref = window.location.href;
  window.location.hash = '';
}

// const reduceImport = <T extends BaseWallet = BaseWallet>(params: RelayImportRequestParams, prev: BaseWorkspace<T>) => ({
//   ...prev,
//   extendedKeys: {
//     xpub: params.xpub,
//     fpub: params.fpub,
//   },
// });

// const getRelayWorkspaceReducer =
//   <T extends BaseWallet = BaseWallet>(params: RelayParams, deriveWallet: (input: Input) => T) =>
//   (prev: BaseWorkspace<T>): BaseWorkspace<T> => {
//     switch (params.action) {
//       case 'import':
//         return reduceImport(params, prev);
//       case 'tx/create':
//         return reduceTxCreate(params, prev);
//       case 'tx/sign':
//         return reduceTxSign(params, prev);
//       case 'tx/broadcast':
//         return reduceTxBroadcast(params, prev);
//       default:
//         throw new Error(`Invalid action: ${params.action}`);
//     }

//     // Set extended public keys (don't override if already set)
//     const extendedKeys = {
//       xpub: params.xpub,
//       fpub: params.fpub,
//     };

//     // Update account balances
//     const accounts = new Map(prev.accounts);

//     params.balances?.forEach((balance) => {
//       const updatedAccount = reduceDerivations({
//         extendedKeys,
//         accounts,
//         assetId: balance.assetId,
//         accountId: balance.accountId,
//         path: { addressIndex: balance.addressIndex },
//         address: balance.address,
//         isLegacy: balance.isLegacy,
//         isTestnet: balance.isTestnet,
//         balance: { native: balance.native, usd: balance.usd },
//         deriveWallet,
//       });

//       accounts.set(balance.accountId, updatedAccount);
//     });

//     // Transactions
//     const transactions = reduceTransactions(prev.transactions, {
//       id: params.txId,
//       assetId: params.assetId,
//       accountId: params.accountId,
//       addressIndex: params.addressIndex,
//       from: params.from,
//       to: params.to,
//       amount: params.amount,
//       remainingBalance: params.remaining,
//       hex: params.txHex,
//       signature: params.signature,
//     });

//     // Active asset
//     const assetId = params.assetId ?? prev.asset?.id;

//     const asset = getAssetConfig(assetId) ?? prev.asset;

//     // Active account
//     const accountId = params.accountId ?? prev.account?.id;

//     const hasAccountId = typeof accountId === 'number';

//     if (assetId && hasAccountId) {
//       const existingWallet = prev.accounts.get(accountId)?.wallets.get(assetId);

//       const existingDerivation =
//         typeof params.addressIndex === 'number' && existingWallet
//           ? Array.from(existingWallet.derivations.values()).find((d) => d.path.addressIndex === params.addressIndex)
//           : undefined;

//       // Derive wallet if not already derived
//       if (!existingDerivation && extendedKeys.xpub && extendedKeys.fpub && isDerivableAssetId(assetId)) {
//         const newAccount = reduceDerivations({
//           extendedKeys,
//           accounts,
//           assetId,
//           accountId,
//           path: { addressIndex: params.addressIndex },
//           isTestnet: asset?.id.includes('TEST'),
//           deriveWallet,
//         });

//         accounts.set(accountId, newAccount);
//       }
//     }

//     const account = hasAccountId ? accounts.get(accountId) : prev.account;

//     return {
//       ...prev,
//       extendedKeys,
//       asset,
//       account,
//       accounts,
//       transactions,
//     };
//   };

export const useRelayUrl = <App extends 'utility' | 'relay'>(app: App, baseUrl: string) => {
  type InboundParams = App extends 'utility' ? RelayResponseParams : RelayRequestParams;
  type OutboundParams = App extends 'utility' ? RelayRequestParams : RelayResponseParams;

  const recipient = app === 'utility' ? 'relay' : 'utility';

  /**
   * Get parameters from an inbound Relay URL
   *
   * @param relayUrl Relay URL
   * @returns Relay URL params
   */
  const getInboundRelayParams = <Params extends InboundParams>(relayUrl: string) => getRelayParams<Params, App>(app, relayUrl);

  /**
   * Get parameters from the initial page URL
   *
   * @returns
   */
  const getInboundRelayParamsFromWindow = () => {
    if (!initialHref) {
      return undefined;
    }

    try {
      return getInboundRelayParams(initialHref);
    } catch {
      return undefined;
    }
  };

  /**
   * Get an outbound Relay URL
   *
   * @param params outbound Relay URL params
   * @returns Relay URL
   */
  const getOutboundRelayUrl = <Params extends OutboundParams>(params: Params) => getRelayUrl(recipient, baseUrl, params);

  const [inboundRelayParams, setInboundRelayParams] = useState(getInboundRelayParamsFromWindow);

  /**
   * Set `inboundRelayParams` based on a Relay URL
   *
   * @param relayUrl Relay URL
   * @returns void
   */
  const setInboundRelayUrl = (relayUrl: string | null) => {
    try {
      if (!relayUrl) {
        setInboundRelayParams(undefined);
      } else {
        const params = getInboundRelayParams(relayUrl);

        setInboundRelayParams(params);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return { inboundRelayParams, setInboundRelayUrl, getOutboundRelayUrl };
};

/**
 * Refactoring notes:
 *
 * Currently we rely on setWorkspaceFromRelayParams to update the workspace state whenever a new relay URL is received (manual call)
 * or when the initialHref is set (on mount). This is not ideal because it means that we have to listen for these updates to take
 * action on them (relayParams.action). Instead we should set a new state property (`inboundRelayParams`) and wire it up to React Query
 * to derive wallets and present transaction modals. This will allow us to remove the `setWorkspaceFromRelayParams` function and
 * the `getRelayWorkspaceReducer` function.
 *
 * Current flow: page load -> useEffect -> setWorkspaceFromRelayParams -> getRelayWorkspaceReducer -> setWorkspace -> get balances
 * New flow: page load -> useEffect -> setWorkspace (`inboundRelayParams` is undefined) -> React Query calls getBalance and openTransactionModal
 */
