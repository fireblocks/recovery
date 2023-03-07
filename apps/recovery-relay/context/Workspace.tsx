import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  SetStateAction,
} from "react";
import {
  AssetId,
  RelayRequestParams,
  getRelayParams,
  Derivation,
  Wallet,
  VaultAccount,
} from "@fireblocks/recovery-shared";
import { BaseWallet, WalletClasses } from "../lib/wallets";

let initialUrlParams: RelayRequestParams | undefined;

if (typeof window !== "undefined") {
  try {
    initialUrlParams = getRelayParams<RelayRequestParams>(window.location.href);
  } catch (error) {
    console.error(error);
  }

  window.location.hash = "";
}

export type Transaction = {
  assetId?: AssetId;
  accountId?: number;
  from?: string;
  to?: string;
  amount?: number;
  memo?: string;
  contractCall?: {
    abi: string;
    params: Record<string, string>;
  };
  hex: string;
} & (
  | {
      error: string;
      state: "error";
    }
  | {
      error?: never;
      state: "created";
    }
  | {
      error?: never;
      state: "signed";
      signature: string;
    }
  | {
      error?: never;
      state: "submitted";
      signature: string;
      hash: string;
    }
);

type Workspace = {
  xpub?: string;
  fpub?: string;
  assetId?: AssetId;
  accountId?: number;
  transactions: Transaction[];
  wallets: BaseWallet[];
};

type IWorkspaceContext = Workspace & {
  handleRelayUrl: (encodedPayload: string) => void;
  handleTransaction: (tx: Transaction) => void;
};

const defaultWorkspace: Workspace = {
  assetId: undefined,
  accountId: undefined,
  transactions: [],
  wallets: [],
};

const defaultValue: IWorkspaceContext = {
  ...defaultWorkspace,
  handleRelayUrl: async () => undefined,
  handleTransaction: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

const reduceWorkspaceUrlParams =
  (params: RelayRequestParams): SetStateAction<Workspace> =>
  (prev) => {
    const {
      xpub,
      fpub,
      assetId,
      accountId,
      from,
      to,
      amount,
      txHex,
      signature,
    } = params as RelayRequestParams;

    const hasTransaction = !!(
      assetId &&
      from &&
      to &&
      amount &&
      txHex &&
      signature
    );

    const tx: Transaction = {
      assetId,
      accountId,
      from,
      to,
      amount,
      hex: txHex,
      signature,
      state: "signed",
    };

    const transactions = hasTransaction
      ? [...prev.transactions, tx]
      : prev.transactions;

    const extendedKey = xpub || fpub;

    const hasWallet = !!assetId && !!extendedKey;

    const isTestnet = assetId?.includes("TEST");

    const WalletClass = hasWallet ? WalletClasses[assetId] : undefined;

    const wallets = WalletClass
      ? [
          ...prev.wallets,
          new WalletClass(
            extendedKey as string,
            accountId ?? 0,
            0,
            isTestnet,
            false
          ),
        ]
      : prev.wallets;

    return {
      ...prev,
      xpub,
      fpub,
      assetId,
      accountId,
      transactions,
      wallets,
    };
  };

export const WorkspaceProvider = ({ children }: Props) => {
  const [workspace, setWorkspace] = useState<Workspace>(defaultValue);

  const setWalletFromUrlParams = (params: RelayRequestParams) =>
    setWorkspace(reduceWorkspaceUrlParams(params));

  const handleRelayUrl = (url: string) => {
    try {
      setWalletFromUrlParams(getRelayParams<RelayRequestParams>(url));
    } catch (error) {
      console.error(error);

      throw new Error("Invalid relay URL");
    }
  };

  const handleTransaction = (tx: Transaction) =>
    setWorkspace((prev) => ({
      ...prev,
      transactions: [...prev.transactions, tx],
    }));

  useEffect(() => {
    if (initialUrlParams) {
      setWalletFromUrlParams(initialUrlParams);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const value: IWorkspaceContext = {
    xpub: workspace.xpub,
    fpub: workspace.fpub,
    assetId: workspace.assetId,
    accountId: workspace.accountId,
    transactions: workspace.transactions,
    wallets: workspace.wallets,
    handleRelayUrl,
    handleTransaction,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWorkspace = () => useContext(Context);
