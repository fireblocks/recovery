import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { useRouter } from "next/router";
import produce from "immer";
import { getAssetInfo, assetsInfo, AssetInfo, AssetId } from "shared";
import { deserializePath } from "../lib/bip44";
import { csvImport, ParsedRow } from "../lib/csv";
import { deriveWallet } from "../lib/deriveWallet";

export type Derivation = {
  pathParts: number[];
  address: string;
  type: "Permanent" | "Deposit";
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
  wallets: Wallet[];
};

const splitPath = (path: string) => path.split(",").map((p) => parseInt(p));

interface IWorkspaceContext {
  isRecovered: boolean;
  asset?: AssetInfo;
  pathParts: number[];
  address?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
  isTestnet?: boolean;

  vaultAccounts: VaultAccount[];
  restoreVaultAccounts: (csvFile: File) => Promise<void>;
  restoreVaultAccount: (name: string) => number;
  restoreWallet: (accountId: number, assetId: string) => void;

  /** @deprecated */
  currentAssetWallets: Wallet[];
  setIsRecovered: Dispatch<SetStateAction<boolean>>;
  /** @deprecated */
  handleAddWallets: (wallets: Wallet[]) => void;
  /** @deprecated */
  handleDeleteWallets: (addresses: string[]) => void;
  resetWorkspace: (isRecovered: boolean) => void;
}

const defaultValue: IWorkspaceContext = {
  isRecovered: false,
  asset: undefined,
  pathParts: [],
  address: undefined,
  publicKey: undefined,
  privateKey: undefined,
  wif: undefined,
  isTestnet: undefined,
  vaultAccounts: [],
  restoreVaultAccounts: async () => undefined,
  restoreVaultAccount: () => 0,
  restoreWallet: () => undefined,
  currentAssetWallets: [],
  setIsRecovered: () => undefined,
  handleAddWallets: () => undefined,
  handleDeleteWallets: () => undefined,
  resetWorkspace: () => undefined,
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

export const WorkspaceProvider = ({ children }: Props) => {
  const {
    query: {
      assetId: _assetId,
      path: _path,
      address: _address,
      publicKey: _publicKey,
      privateKey: _privateKey,
      wif: _wif,
      isTestnet: _isTestnet,
    },
  } = useRouter();

  const assetId =
    typeof _assetId === "string" ? (_assetId as AssetId) : undefined;

  const asset = assetId ? getAssetInfo(assetId) : undefined;

  const [isRecovered, setIsRecovered] = useState(false);

  const [vaultAccounts, setVaultAccounts] = useState(
    defaultValue.vaultAccounts
  );

  const handleImportedVaultAccount = async (row: ParsedRow) => {
    const assetId = row.assetId as AssetId;

    const derivation: Derivation = {
      pathParts: row.pathParts,
      address: row.address,
      type: row.addressType,
      description: row.addressDescription,
      tag: row.tag,
      publicKey: row.publicKey,
      privateKey: row.privateKey,
      wif: row.privateKeyWif,
    };

    let wallet: Wallet = {
      assetId,
      isTestnet: row.assetId.includes("_TEST"),
      derivations: [derivation],
    };

    // TODO: Derive wallets after importing so we can batch indices
    // TODO: Handle testnet assets
    if (
      (!derivation.publicKey || !derivation.privateKey) &&
      assetsInfo[assetId]
    ) {
      console.info("Deriving wallet", {
        assetId,
        accountId: row.accountId,
        indexStart: row.pathParts[4],
        indexEnd: row.pathParts[4],
      });

      wallet = await deriveWallet({
        assetId,
        accountId: row.accountId,
        indexStart: row.pathParts[4],
        indexEnd: row.pathParts[4],
      });
    }

    setVaultAccounts(
      produce((draft) => {
        const accountIndex = draft.findIndex(
          (account) => account.id === row.accountId
        );

        if (accountIndex > 0) {
          const walletIndex = draft[accountIndex].wallets.findIndex(
            (wallet) => wallet.assetId === row.assetId
          );

          if (walletIndex > 0) {
            draft[accountIndex].wallets[walletIndex].derivations.push(
              derivation
            );
          } else {
            draft[accountIndex].wallets.push(wallet);
          }
        } else {
          draft.push({
            id: row.accountId,
            name: row.accountName ?? `Account ${row.accountId}`,
            wallets: [wallet],
          });
        }
      })
    );
  };

  const restoreVaultAccounts = async (csvFile: File) => {
    setVaultAccounts(defaultValue.vaultAccounts);

    void csvImport(csvFile, handleImportedVaultAccount);
  };

  const restoreVaultAccount = (name: string) => {
    let accountId = vaultAccounts.length;

    setVaultAccounts(
      produce((draft) => {
        if (accountId > 0) {
          accountId = Math.max(...draft.map((account) => account.id)) + 1;
        }

        draft.push({ id: accountId, name, wallets: [] });
      })
    );

    return accountId;
  };

  const restoreWallet = (accountId: number, assetId: string) => {
    setVaultAccounts(
      produce((draft) => {
        const account = draft.find((account) => account.id === accountId);

        if (account) {
          const wallet = account.wallets.find(
            (wallet) => wallet.assetId === assetId
          );

          if (!wallet) {
            account.wallets.push({
              assetId: assetId as AssetId,
              isTestnet: assetId.includes("_TEST"),
              derivations: [],
            });
          }
        }
      })
    );
  };

  const currentAssetWallets = useMemo(
    () =>
      vaultAccounts
        .map(({ wallets }) =>
          wallets.filter((wallet) => wallet.assetId === assetId)
        )
        .flat(),
    [assetId, vaultAccounts]
  );

  const resetWorkspace = (isRecovered: boolean) => {
    setIsRecovered(isRecovered);
    setVaultAccounts(defaultValue.vaultAccounts);
  };

  const pathParts = typeof _path === "string" ? splitPath(_path) : [];
  const address = typeof _address === "string" ? _address : undefined;
  const publicKey = typeof _publicKey === "string" ? _publicKey : undefined;
  const privateKey = typeof _privateKey === "string" ? _privateKey : undefined;
  const wif = typeof _wif === "string" ? _wif : undefined;
  const isTestnet =
    typeof _isTestnet === "string"
      ? !["false", "0"].includes(_isTestnet.toLowerCase())
      : undefined;

  // const handleAddWallets = (newWallets: Wallet[]) =>
  //   setWallets((prev) => formatWallets([...prev, ...newWallets]));

  // const handleDeleteWallets = (addresses: string[]) =>
  //   setWallets((prev) =>
  //     formatWallets(
  //       prev.filter((wallet) => !addresses.includes(wallet.address))
  //     )
  //   );

  const handleAddWallets = (newWallets: Wallet[]) => undefined;

  const handleDeleteWallets = (addresses: string[]) => undefined;

  const value: IWorkspaceContext = {
    isRecovered,
    asset,
    pathParts,
    address,
    publicKey,
    privateKey,
    wif,
    isTestnet,
    vaultAccounts,
    restoreVaultAccounts,
    restoreVaultAccount,
    restoreWallet,
    currentAssetWallets,
    setIsRecovered,
    handleAddWallets,
    handleDeleteWallets,
    resetWorkspace,
  };

  console.info({ value });

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
