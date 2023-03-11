import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useBaseWorkspace, defaultBaseWorkspaceContext, BaseWorkspaceContext } from '@fireblocks/recovery-shared';
import { getAssetConfig } from '@fireblocks/asset-config';
import { WalletClasses, Derivation } from '../lib/wallets';

type WorkspaceContext = BaseWorkspaceContext<Derivation>;

const defaultValue: WorkspaceContext = defaultBaseWorkspaceContext as WorkspaceContext;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WorkspaceProvider = ({ children }: Props) => {
  const {
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
  } = useBaseWorkspace({
    relayBaseUrl: 'fireblocks-recovery://',
    deriveWallet: (input) => {
      const nativeAssetId = (getAssetConfig(input.assetId)?.nativeAsset?.id ?? input.assetId) as keyof typeof WalletClasses;

      if (nativeAssetId in WalletClasses) {
        return new WalletClasses[nativeAssetId](input);
      }

      throw new Error(`Unsupported asset: ${input.assetId}`);
    },
  });

  useEffect(() => {}, [accounts]);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: WorkspaceContext = {
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

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
