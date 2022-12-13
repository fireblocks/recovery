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

export type Wallet = {
  assetId: AssetId;
  pathParts: number[];
  address: string;
  addressType: "Permanent" | "Deposit";
  addressDescription?: string;
  publicKey: string;
  privateKey: string;
};

const splitPath = (path: string) => path.split(",").map((p) => parseInt(p));

interface IWorkspaceContext {
  asset?: AssetInfo;
  pathParts: number[];
  address?: string;
  publicKey?: string;
  privateKey?: string;
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
  isTestnet: undefined,
  wallets: [],
  currentAssetWallets: [],
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WorkspaceProvider = ({ children }: Props) => {
  const {
    query: {
      assetId: _assetId,
      path: _path,
      address: _address,
      publicKey: _publicKey,
      privateKey: _privateKey,
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
      setWallets((prev) => [...prev, ...data]);

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
    isTestnet,
    wallets,
    currentAssetWallets,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
