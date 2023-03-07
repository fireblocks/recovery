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
import { csvImport, ParsedRow } from "../lib/csv";
import { deriveWallet } from "../lib/deriveWallet";
import { initIdleDetector } from "../lib/idleDetector";
import { ExtendedKeys } from "../lib/ipc/recoverExtendedKeys";
import { useSettings } from "./Settings";

export type Derivation = {
  pathParts: number[];
  address: string;
  type: "Permanent" | "Deposit";
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
  derivations: Derivation[];
};

export type VaultAccount = {
  id: number;
  name: string;
  wallets: Map<AssetId, Wallet>;
};

// const splitPath = (path: string) => path.split(",").map((p) => parseInt(p, 10));

interface IWorkspaceContext {
  extendedKeys?: ExtendedKeys;
  asset?: AssetInfo;
  vaultAccounts: Map<number, VaultAccount>;
  restoreVaultAccounts: (
    csvFile: File,
    extendedKeys: ExtendedKeys
  ) => Promise<void>;
  restoreVaultAccount: (name: string) => number;
  restoreWallet: (accountId: number, assetId: string) => void;
  setExtendedKeys: Dispatch<SetStateAction<ExtendedKeys | undefined>>;
  reset: () => void;
}

const defaultValue: IWorkspaceContext = {
  extendedKeys: undefined,
  asset: undefined,
  vaultAccounts: new Map(),
  restoreVaultAccounts: async () => undefined,
  restoreVaultAccount: () => 0,
  restoreWallet: () => undefined,
  setExtendedKeys: () => undefined,
  reset: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

// const orderAddresses = (a: Address, b: Address) => {
//   const aPath = deserializePath(a.pathParts);
//   const bPath = deserializePath(b.pathParts);

//   // Keep wallets with the same path together
//   if (aPath.accountId === bPath.accountId && aPath.index === bPath.index) {
//     const aIsLegacy = a.address[0] === "1";
//     const bIsLegacy = b.address[0] === "1";

//     if (aIsLegacy && !bIsLegacy) {
//       return -1;
//     }

//     if (!aIsLegacy && bIsLegacy) {
//       return 1;
//     }

//     return 0;
//   }

//   if (aPath.accountId > bPath.accountId) {
//     return 1;
//   }

//   if (aPath.accountId < bPath.accountId) {
//     return -1;
//   }

//   if (aPath.index > bPath.index) {
//     return 1;
//   }

//   if (aPath.index < bPath.index) {
//     return -1;
//   }

//   return 0;
// };

// const formatWallets = (wallets: Wallet[]): Wallet[] => {
//   const uniqueWallets = [
//     ...new Map(wallets.map((wallet) => [wallet.address, wallet])).values(),
//   ];

//   const sortedWallets = uniqueWallets.sort(orderWallets);

//   return sortedWallets;
// };

const testIsLegacy = (assetId: string, address: string) => {
  if (!assetId.startsWith("BTC")) {
    return false;
  }

  if (address.startsWith("bc1") || address.startsWith("tb1")) {
    return false;
  }

  return true;
};

const deriveVaultAccount = (
  { xprv, fprv }: Pick<ExtendedKeys, "xprv" | "fprv">,
  account: VaultAccount
) => {
  // Convert account.wallets to an array
  const wallets = [...account.wallets.values()];

  const derivedWalletsMap = wallets.map<[AssetId, Wallet]>((wallet) => {
    const { assetId, derivations: oldDerivations } = wallet;

    if (!assetsInfo[assetId]) {
      return [assetId, wallet];
    }

    const indexStart = oldDerivations[0].pathParts[4];
    const indexEnd = oldDerivations[oldDerivations.length - 1].pathParts[4];

    const derivations = deriveWallet({
      xprv,
      fprv,
      assetId,
      accountId: account.id,
      indexStart,
      indexEnd,
    });

    return [assetId, { ...wallet, derivations }];
  });

  return new Map(derivedWalletsMap);
};

const deriveAllVaultAccounts = (
  extendedKeys: Pick<ExtendedKeys, "xprv" | "fprv">,
  vaultAccounts: Map<number, VaultAccount>
) => {
  const accounts = [...vaultAccounts.values()];

  const derivedAccountsMap = accounts.map<[number, VaultAccount]>((account) => {
    const wallets = deriveVaultAccount(extendedKeys, account);

    return [account.id, { ...account, wallets }];
  });

  return new Map(derivedAccountsMap);
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

  const restoreVaultAccounts = useCallback(
    async (csvFile: File, { xprv, fprv }: ExtendedKeys) => {
      const tmpAccounts = new Map<number, VaultAccount>();

      const handleRow = (parsedRow: ParsedRow) => {
        const parsedAssetId = parsedRow.assetId as AssetId;

        const isTestnet = parsedAssetId.includes("TEST");

        const derivation: Derivation = {
          pathParts: parsedRow.pathParts,
          address: parsedRow.address,
          type: parsedRow.addressType,
          description: parsedRow.addressDescription,
          tag: parsedRow.tag,
          publicKey: parsedRow.publicKey,
          privateKey: parsedRow.privateKey,
          wif: parsedRow.privateKeyWif,
          isLegacy: testIsLegacy(parsedAssetId, parsedRow.address),
        };

        const wallet: Wallet = {
          assetId: parsedAssetId,
          isTestnet,
          derivations: [derivation],
        };

        const account = tmpAccounts.get(parsedRow.accountId);

        if (account) {
          const existingWallet = account.wallets.get(parsedAssetId);

          if (existingWallet) {
            existingWallet.derivations.push(derivation);

            existingWallet.derivations.sort((a, b) => {
              if (a.pathParts[4] > b.pathParts[4]) {
                return 1;
              }

              if (a.pathParts[4] < b.pathParts[4]) {
                return -1;
              }

              return 0;
            });

            account.wallets.set(parsedAssetId, existingWallet);
          } else {
            account.wallets.set(parsedAssetId, wallet);
          }
        } else {
          tmpAccounts.set(parsedRow.accountId, {
            id: parsedRow.accountId,
            name: parsedRow.accountName ?? `Account ${parsedRow.accountId}`,
            wallets: new Map<AssetId, Wallet>([[parsedAssetId, wallet]]),
          });
        }
      };

      setVaultAccounts(defaultValue.vaultAccounts);

      await csvImport(csvFile, handleRow);

      setVaultAccounts(deriveAllVaultAccounts({ xprv, fprv }, tmpAccounts));
    },
    [setVaultAccounts]
  );

  const restoreVaultAccount = useCallback(
    (name: string) => {
      let accountId = vaultAccounts.size;

      setVaultAccounts((prev) => {
        const accounts = new Map(prev);

        if (accountId > 0) {
          const accountIds = Array.from(accounts.keys());

          accountId = Math.max(...accountIds) + 1;
        }

        accounts.set(accountId, {
          id: accountId,
          name,
          wallets: new Map<AssetId, Wallet>(),
        });

        return accounts;
      });

      return accountId;
    },
    [vaultAccounts.size]
  );

  const restoreWallet = useCallback(
    (accountId: number, walletAssetId: string) => {
      if (!extendedKeys?.xprv || !extendedKeys?.fprv) {
        throw new Error("Extended private keys are not set");
      }

      const derivations = deriveWallet({
        xprv: extendedKeys?.xprv,
        fprv: extendedKeys?.fprv,
        assetId: walletAssetId as AssetId,
        accountId,
        indexStart: 0,
        indexEnd: 0,
      });

      setVaultAccounts((prev) => {
        const accounts = new Map(prev);

        const account = accounts.get(accountId);

        if (account) {
          const wallet = account.wallets.get(assetId as AssetId);

          account.wallets.set(assetId as AssetId, {
            assetId: walletAssetId as AssetId,
            isTestnet: walletAssetId.includes("TEST"),
            ...wallet,
            derivations,
          });

          accounts.set(accountId, account);
        }

        return accounts;
      });
    },
    [assetId, extendedKeys?.fprv, extendedKeys?.xprv]
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
    restoreVaultAccount,
    restoreWallet,
    setExtendedKeys,
    reset,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
