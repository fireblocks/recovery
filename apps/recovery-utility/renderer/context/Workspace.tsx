import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useBaseWorkspace, defaultBaseWorkspaceContext, BaseWorkspaceContext } from '@fireblocks/recovery-shared';
import { deriveWallet } from '@fireblocks/wallet-derivation';
import { getAssetConfig } from '@fireblocks/asset-config';
import { initIdleDetector } from '../lib/idleDetector';
import { useSettings } from './Settings';

const Context = createContext(defaultBaseWorkspaceContext);

type Props = {
  children: ReactNode;
};

export const WorkspaceProvider = ({ children }: Props) => {
  const { push, query } = useRouter();

  const settings = useSettings();

  const { relayBaseUrl, idleMinutes } = settings;

  const {
    extendedKeys,
    asset: currentAsset,
    account: currentAccount,
    accounts,
    transactions,
    getRelayUrl,
    restoreWorkspace,
    setWorkspaceFromRelayUrl,
    setExtendedKeys,
    setTransaction,
    setAsset,
    setAccount,
    addAccount,
    addWallet,
    reset: resetBaseWorkspace,
  } = useBaseWorkspace({
    relayBaseUrl,
    deriveWallet,
  });

  const asset = currentAsset ?? getAssetConfig(query.assetId as string);

  const account =
    currentAccount ??
    (typeof query.accountId !== 'undefined' ? accounts.get(parseInt(query.accountId as string, 10)) : undefined);

  const reset = () => {
    resetBaseWorkspace();
    push('/');
  };

  useEffect(() => {
    let abortController: AbortController | undefined;

    const initIdleDetectorHook = async () => {
      abortController = await initIdleDetector(reset, idleMinutes);
    };

    initIdleDetectorHook();

    return () => abortController?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idleMinutes]);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: BaseWorkspaceContext = {
    extendedKeys,
    asset,
    account,
    accounts,
    transactions,
    getRelayUrl,
    restoreWorkspace,
    setWorkspaceFromRelayUrl,
    setExtendedKeys,
    setTransaction,
    setAsset,
    setAccount,
    addAccount,
    addWallet,
    reset,
  };

  if (process.env.NODE_ENV === 'development') {
    console.info('Settings', settings);
  }

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
