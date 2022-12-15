import { ipcRenderer, IpcRendererEvent } from "electron";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
  useEffect,
} from "react";
import { useRouter } from "next/router";
import { getAssetInfo, AssetInfo, AssetId } from "shared";
import { deserializePath } from "../lib/bip44";

export type Wallet = {
  assetId: AssetId;
  pathParts: number[];
  address: string;
  addressType: "Permanent" | "Deposit";
  addressDescription?: string;
  publicKey: string;
  privateKey: string;
  wif?: string;
};

const splitPath = (path: string) => path.split(",").map((p) => parseInt(p));

interface IWorkspaceContext {
  asset?: AssetInfo;
  pathParts: number[];
  address?: string;
  publicKey?: string;
  privateKey?: string;
  wif?: string;
  isTestnet?: boolean;
  wallets: Wallet[];
  currentAssetWallets: Wallet[];
}

const defaultValue: IWorkspaceContext = {
  asset: undefined,
  pathParts: [],
  address: undefined,
  publicKey: undefined,
  privateKey: undefined,
  wif: undefined,
  isTestnet: undefined,
  wallets: [],
  currentAssetWallets: [],
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

const orderWallets = (a: Wallet, b: Wallet) => {
  const aPath = deserializePath(a.pathParts);
  const bPath = deserializePath(b.pathParts);

  // Keep wallets with the same path together
  if (aPath.accountId === bPath.accountId && aPath.index === bPath.index) {
    const aIsLegacy = a.address[0] === "1";
    const bIsLegacy = b.address[0] === "1";

    if (aIsLegacy && !bIsLegacy) {
      return -1;
    }

    if (!aIsLegacy && bIsLegacy) {
      return 1;
    }

    return 0;
  }

  if (aPath.accountId > bPath.accountId) {
    return 1;
  }

  if (aPath.accountId < bPath.accountId) {
    return -1;
  }

  if (aPath.index > bPath.index) {
    return 1;
  }

  if (aPath.index < bPath.index) {
    return -1;
  }

  return 0;
};

const formatWallets = (wallets: Wallet[]): Wallet[] => {
  const uniqueWallets = [
    ...new Map(wallets.map((wallet) => [wallet.address, wallet])).values(),
  ];

  const sortedWallets = uniqueWallets.sort(orderWallets);

  return sortedWallets;
};

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

  const pathParts = typeof _path === "string" ? splitPath(_path) : [];
  const address = typeof _address === "string" ? _address : undefined;
  const publicKey = typeof _publicKey === "string" ? _publicKey : undefined;
  const privateKey = typeof _privateKey === "string" ? _privateKey : undefined;
  const wif = typeof _wif === "string" ? _wif : undefined;
  const isTestnet =
    typeof _isTestnet === "string"
      ? !["false", "0"].includes(_isTestnet.toLowerCase())
      : undefined;

  const [wallets, setWallets] = useState(defaultValue.wallets);

  const currentAssetWallets = useMemo(
    () => wallets.filter((wallet) => wallet.assetId === assetId),
    [assetId, wallets]
  );

  useEffect(() => {
    const handleAddWallets = (event: IpcRendererEvent, data: Wallet[]) =>
      setWallets((prev) => formatWallets([...prev, ...data]));

    ipcRenderer.on("wallets/add", handleAddWallets);

    return () => {
      ipcRenderer.removeListener("wallets/add", handleAddWallets);
    };
  }, []);

  const value: IWorkspaceContext = {
    asset,
    pathParts,
    address,
    publicKey,
    privateKey,
    wif,
    isTestnet,
    wallets,
    currentAssetWallets,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);