import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/router";
import {
  getAssetInfo,
  assetsInfo,
  AssetInfo,
  AssetId,
} from "@fireblocks/recovery-shared";
import { deriveWallet } from "@fireblocks/wallet-derivation";
import { csvImport, ParsedRow } from "../lib/csv";
import { initIdleDetector } from "../lib/idleDetector";
import { ExtendedKeys } from "../lib/ipc/recoverExtendedKeys";
import { useSettings } from "./Settings";

export type Derivation = {
  pathParts: number[];
  address: string;
  type: "Permanent" | "Deposit";
  isTestnet: boolean;
  isLegacy?: boolean;
  description?: string;
  tag?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
};

export type Wallet = {
  assetId: AssetId;
  isTestnet: boolean;
  balance?: number;
  balanceUsd?: number;
  derivations: Map<string, Derivation>;
};

export type VaultAccount = {
  id: number;
  name: string;
  wallets: Map<AssetId, Wallet>;
};

interface IWorkspaceContext {
  extendedKeys?: ExtendedKeys;
  asset?: AssetInfo;
  vaultAccounts: Map<number, VaultAccount>;
  restoreVaultAccounts: (
    csvFile: File,
    extendedKeys: ExtendedKeys
  ) => Promise<void>;
  addVaultAccount: (name: string) => number;
  addWallet: (
    accountId: number,
    assetId: AssetId,
    addressIndex?: number
  ) => void;
  setExtendedKeys: Dispatch<SetStateAction<ExtendedKeys | undefined>>;
  reset: () => void;
}

const defaultValue: IWorkspaceContext = {
  extendedKeys: undefined,
  asset: undefined,
  vaultAccounts: new Map(),
  restoreVaultAccounts: async () => undefined,
  addVaultAccount: () => 0,
  addWallet: () => undefined,
  setExtendedKeys: () => undefined,
  reset: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

const testIsLegacy = (assetId: string, address: string) => {
  if (!assetId.startsWith("BTC")) {
    return false;
  }

  if (address.startsWith("bc1") || address.startsWith("tb1")) {
    return false;
  }

  return true;
};

export const WorkspaceProvider = ({ children }: Props) => {
  const { push, query } = useRouter();

  const { idleMinutes } = useSettings();

  const assetId =
    typeof query.assetId === "string" ? (query.assetId as AssetId) : undefined;

  const asset = assetId ? getAssetInfo(assetId) : undefined;

  const [extendedKeys, setExtendedKeys] = useState<ExtendedKeys | undefined>();

  const [vaultAccounts, setVaultAccounts] = useState(
    defaultValue.vaultAccounts
  );

  const addDerivation = useCallback(
    (
      derivation: Derivation,
      accountAssetId: AssetId,
      accountId: number,
      accountName?: string
    ) =>
      setVaultAccounts((prev) => {
        const accounts = new Map(prev);

        const newWallet: Wallet = {
          assetId: accountAssetId,
          isTestnet: derivation.isTestnet,
          derivations: new Map([[derivation.address, derivation]]),
        };

        const account = accounts.get(accountId);

        if (account) {
          const existingWallet = account.wallets.get(accountAssetId);

          if (existingWallet) {
            // Account and wallet found, add derivation
            existingWallet.derivations.set(derivation.address, derivation);

            account.wallets.set(accountAssetId, existingWallet);
          } else {
            // Account found, add wallet
            account.wallets.set(accountAssetId, newWallet);
          }

          accounts.set(accountId, account);
        } else {
          // Account not found, add account and wallet
          const newAccount: VaultAccount = {
            id: accountId,
            name: accountName || `Account ${accountId}`,
            wallets: new Map([[accountAssetId, newWallet]]),
          };

          accounts.set(accountId, newAccount);
        }

        return accounts;
      }),
    [setVaultAccounts]
  );

  const restoreVaultAccounts = useCallback(
    async (csvFile: File, exKeys: ExtendedKeys) => {
      const handleRow = (parsedRow: ParsedRow) => {
        const parsedAccountId = parsedRow.accountId;

        const parsedAssetId = parsedRow.assetId as AssetId;

        const isTestnet = parsedAssetId.includes("TEST");

        const isLegacy = testIsLegacy(parsedAssetId, parsedRow.address);

        const parsedIndex = parsedRow.pathParts[4];

        let derivation: Derivation;

        if (assetsInfo[parsedAssetId]) {
          derivation = deriveWallet({
            xprv: exKeys.xprv,
            fprv: exKeys.fprv,
            xpub: exKeys.xpub,
            fpub: exKeys.fpub,
            assetId: parsedAssetId,
            path: {
              account: parsedAccountId,
              addressIndex: parsedIndex,
            },
            isTestnet,
            isLegacy,
          });
        } else {
          derivation = {
            pathParts: parsedRow.pathParts,
            address: parsedRow.address,
            type: parsedRow.addressType,
            description: parsedRow.addressDescription,
            tag: parsedRow.tag,
            publicKey: parsedRow.publicKey,
            privateKey: parsedRow.privateKey,
            wif: parsedRow.privateKeyWif,
            isTestnet,
            isLegacy,
          };
        }

        addDerivation(
          derivation,
          parsedAssetId,
          parsedAccountId,
          parsedRow.accountName
        );
      };

      await csvImport(csvFile, handleRow);
    },
    [addDerivation]
  );

  const addVaultAccount = useCallback(
    (name: string) => {
      let accountId = vaultAccounts.size;

      setVaultAccounts((prev) => {
        const accounts = new Map(prev);

        accountId = accounts.size;

        if (accountId > 0) {
          const accountIds = Array.from(accounts.keys());

          accountId = Math.max(...accountIds) + 1;
        }

        const account: VaultAccount = {
          id: accountId,
          name,
          wallets: new Map<AssetId, Wallet>(),
        };

        accounts.set(accountId, account);

        return accounts;
      });

      return accountId;
    },
    [vaultAccounts.size]
  );

  const addWallet = useCallback(
    (accountId: number, accountAssetId: AssetId, addressIndex = 0) => {
      if (
        !extendedKeys?.xprv &&
        !extendedKeys?.xpub &&
        !extendedKeys?.fprv &&
        !extendedKeys?.fpub
      ) {
        throw new Error("Extended keys are not set");
      }

      const { xprv, fprv, xpub, fpub } = extendedKeys;

      const derivationInput = {
        xprv,
        fprv,
        xpub,
        fpub,
        assetId: accountAssetId,
        path: {
          account: accountId,
          addressIndex,
        },
        isTestnet: accountAssetId.includes("TEST"),
        isLegacy: false,
      };

      const derivation = deriveWallet(derivationInput);

      addDerivation(derivation, accountAssetId, accountId);

      if (accountAssetId.startsWith("BTC")) {
        const legacyDerivation = deriveWallet({
          ...derivationInput,
          isLegacy: true,
        });

        addDerivation(legacyDerivation, accountAssetId, accountId);
      }
    },
    [extendedKeys, addDerivation]
  );

  const reset = () => {
    setExtendedKeys(undefined);
    setVaultAccounts(defaultValue.vaultAccounts);
    push("/");
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

  if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.info("Vault Accounts", vaultAccounts);
  }

  // TODO: Fix
  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value = {
    extendedKeys,
    asset,
    vaultAccounts,
    restoreVaultAccounts,
    addVaultAccount,
    addWallet,
    setExtendedKeys,
    reset,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
