import { createContext, useContext, ReactNode, useEffect } from "react";
import {
  useBaseWorkspace,
  defaultBaseWorkspaceContext,
  BaseWorkspaceContext,
} from "@fireblocks/recovery-shared";
import { WalletClasses, Derivation } from "../lib/wallets";

type WorkspaceContext = BaseWorkspaceContext<Derivation>;

const defaultValue: WorkspaceContext =
  defaultBaseWorkspaceContext as WorkspaceContext;

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
    relayBaseUrl: "fireblocks-recovery://",
    deriveWallet: (input) => {
      const assetId = input.assetId as keyof typeof WalletClasses;

      if (assetId in WalletClasses) {
        return new WalletClasses[assetId](input);
      }

      throw new Error(`Unsupported asset: ${assetId}`);
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
