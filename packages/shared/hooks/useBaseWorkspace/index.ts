import { useState, useCallback } from "react";
import { Input, BaseWallet } from "@fireblocks/wallet-derivation";
import { LocalFile } from "papaparse";
import { getAsset } from "../../constants/assetInfo";
import type { ExtendedKeys } from "../../schemas";
import { AssetId, Wallet, VaultAccount, Transaction } from "../../types";
import { BaseWorkspace, BaseWorkspaceContext } from "./types";
import { csvImport, ParsedRow } from "../../lib/csv";
import { RelayParams, getRelayParams, RelayPath } from "../../lib/relayUrl";
import { useRelayUrl } from "./useRelayUrl";
import {
  reduceDerivations,
  testIsLegacy,
  DerivationReducerInput,
} from "./reduceDerivations";
import { reduceTransactions } from "./reduceTransactions";

export type { BaseWorkspace, BaseWorkspaceContext };

export const defaultBaseWorkspace: BaseWorkspace<BaseWallet> = {
  extendedKeys: undefined,
  asset: undefined,
  account: undefined,
  accounts: new Map<number, VaultAccount<BaseWallet>>(),
  transactions: new Map<string, Transaction>(),
};

export const defaultBaseWorkspaceContext: BaseWorkspaceContext<BaseWallet> = {
  ...defaultBaseWorkspace,
  getRelayUrl: () => "",
  restoreWorkspace: async () => undefined,
  setWorkspaceFromRelayUrl: <P extends RelayPath>() => ({} as RelayParams<P>),
  setExtendedKeys: () => undefined,
  setAsset: () => undefined,
  setAccount: () => undefined,
  addAccount: () => 0,
  addWallet: () => undefined,
  setTransaction: () => undefined,
  reset: () => undefined,
};

type Props<T extends BaseWallet> = {
  relayBaseUrl: string;
  deriveWallet: (input: Input) => T;
};

export const useBaseWorkspace = <T extends BaseWallet>({
  relayBaseUrl,
  deriveWallet,
}: Props<T>) => {
  const [workspace, setWorkspace] = useState<BaseWorkspace<T>>(
    defaultBaseWorkspace as BaseWorkspace<T>
  );

  const setExtendedKeys = (extendedKeys: ExtendedKeys) =>
    setWorkspace((prev) => ({
      ...prev,
      extendedKeys: { ...prev.extendedKeys, ...extendedKeys },
    }));

  const setAsset = (assetId: string) =>
    setWorkspace((prev) => ({ ...prev, asset: getAsset(assetId) }));

  const setAccount = (accountId: number) =>
    setWorkspace((prev) => ({
      ...prev,
      account: prev.accounts.get(accountId),
    }));

  const { getRelayUrl, setWorkspaceFromRelayParams } = useRelayUrl(
    relayBaseUrl,
    setWorkspace,
    deriveWallet
  );

  const setWorkspaceFromRelayUrl = (url: string) => {
    try {
      const params = getRelayParams(url);

      setWorkspaceFromRelayParams(params);

      return params;
    } catch (error) {
      console.error(error);

      throw new Error("Invalid relay URL");
    }
  };

  const setDerivation = (
    derivationInput: Omit<
      DerivationReducerInput<T>,
      "accounts" | "deriveWallet"
    > & { extendedKeys?: ExtendedKeys }
  ) =>
    setWorkspace((prev) => {
      const accounts = new Map(prev.accounts);

      const account = reduceDerivations({
        ...derivationInput,
        deriveWallet,
        accounts,
        extendedKeys: {
          ...prev.extendedKeys,
          ...derivationInput.extendedKeys,
        },
      });

      accounts.set(account.id, account);

      return { ...prev, accounts };
    });

  const handleCsvRow = useCallback(
    (parsedRow: ParsedRow, extendedKeys = workspace.extendedKeys) => {
      const {
        assetId,
        accountName,
        pathParts,
        address,
        addressType,
        addressDescription,
        tag,
        publicKey,
        privateKey,
        privateKeyWif,
      } = parsedRow;

      const [, coinType, accountId, changeIndex, addressIndex] = pathParts;

      setDerivation({
        extendedKeys,
        assetId,
        accountId,
        accountName,
        path: {
          coinType,
          changeIndex,
          addressIndex,
        },
        address,
        type: addressType,
        description: addressDescription,
        tag,
        publicKey,
        privateKey,
        wif: privateKeyWif,
        isTestnet: assetId.includes("TEST"),
        isLegacy: testIsLegacy(assetId, address),
        balance: {
          native: 0,
          usd: 0,
        },
      });
    },
    [setDerivation, workspace.extendedKeys]
  );

  const restoreWorkspace = useCallback(
    async (extendedKeys?: ExtendedKeys, csvFile?: LocalFile) => {
      if (extendedKeys) {
        setExtendedKeys(extendedKeys);
      }

      if (csvFile) {
        await csvImport(csvFile, handleCsvRow);
      }
    },
    [setExtendedKeys, handleCsvRow]
  );

  const addAccount = useCallback(
    (name: string, newAccountId?: number) => {
      let resolvedAccountId = newAccountId;

      setWorkspace((prev) => {
        const accounts = new Map(prev.accounts);

        if (typeof resolvedAccountId === "undefined") {
          if (accounts.size > 0) {
            const accountIds = Array.from(accounts.keys());

            resolvedAccountId = Math.max(...accountIds) + 1;
          } else {
            resolvedAccountId = 0;
          }
        }

        const newAccount: VaultAccount<T> = {
          id: resolvedAccountId,
          name,
          wallets: new Map<AssetId, Wallet<T>>(),
        };

        accounts.set(resolvedAccountId, newAccount);

        return { ...prev, accounts };
      });

      return resolvedAccountId ?? 0;
    },
    [setWorkspace]
  );

  const addWallet = (assetId: string, accountId: number, addressIndex = 0) => {
    if (typeof accountId !== "number") {
      throw new Error("Wallet needs an account ID");
    }

    if (typeof assetId !== "string") {
      throw new Error("Wallet needs an asset ID");
    }

    setDerivation({
      assetId,
      accountId,
      path: { addressIndex },
    });
  };

  const setTransaction = (tx: Transaction) =>
    setWorkspace((prev) => ({
      ...prev,
      transactions: reduceTransactions(prev.transactions, tx),
    }));

  const reset = () => setWorkspace(defaultBaseWorkspace as BaseWorkspace<T>);

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("Workspace", workspace);
  }

  const value: BaseWorkspaceContext<T> = {
    extendedKeys: workspace.extendedKeys,
    asset: workspace.asset,
    account: workspace.account,
    accounts: workspace.accounts,
    transactions: workspace.transactions,
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

  return value;
};
