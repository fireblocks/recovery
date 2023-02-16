import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AssetId } from "shared";
import { decodeUrl, parseUrlParams, ParsedUrlParams } from "../lib/relayUrl";
import { decryptString } from "../lib/decryption";
import { BaseWallet } from "../lib/wallets";

let initialUrlParams: ParsedUrlParams | undefined;

if (typeof window !== "undefined") {
  const { assetId, encodedParams } = decodeUrl();

  window.location.hash = "";

  if (assetId && encodedParams) {
    try {
      initialUrlParams = parseUrlParams(assetId, encodedParams);
    } catch {
      console.info("No wallet data in URL");
    }
  }
}

export type Transaction = {
  to?: string;
  amount?: number;
  memo?: string;
  contractCall?: {
    abi: string;
    params: Record<string, string>;
  };
} & (
  | {
      state: "success";
      error?: never;
      hash: string;
    }
  | {
      state: "error";
      error: Error;
      hash?: never;
    }
);

type WalletData = {
  assetId?: AssetId;
  address?: string;
  isTestnet?: boolean;
  transactions: Transaction[];
  walletInstance?: BaseWallet;
};

type IWalletContext = WalletData & {
  handleRelayUrl: (encodedPayload: string) => void;
  handleTransaction: (tx: Transaction) => void;
};

const defaultWalletData: WalletData = {
  assetId: undefined,
  address: "",
  isTestnet: undefined,
  transactions: [],
  walletInstance: undefined,
};

const defaultValue: IWalletContext = {
  ...defaultWalletData,
  handleRelayUrl: async () => undefined,
  handleTransaction: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const router = useRouter();

  const [wallet, setWallet] = useState<WalletData>(defaultWalletData);

  const setWalletFromUrlParams = (params: ParsedUrlParams) =>
    setWallet((prev) => ({
      ...prev,
      assetId: params.assetId,
      address: params.address,
      isTestnet: params.isTestnet,
      walletInstance: params.walletInstance,
    }));

  const handleRelayUrl = (url: string) => {
    try {
      const { assetId, encodedParams } = decodeUrl(url);

      if (!assetId) {
        throw new Error("Invalid asset ID in URL");
      }

      if (!encodedParams) {
        throw new Error("No wallet data in URL");
      }

      const parsedParams = parseUrlParams(assetId, encodedParams);

      setWalletFromUrlParams(parsedParams);

      router.push("/[assetId]", `/${assetId}`);
    } catch (error) {
      console.error(error);

      throw new Error("Invalid relay URL");
    }
  };

  const handleTransaction = (tx: Transaction) =>
    setWallet((prev) => ({
      ...prev,
      transactions: [...prev.transactions, tx],
    }));

  useEffect(() => {
    if (initialUrlParams) {
      setWalletFromUrlParams(initialUrlParams);
    } else if (decodeUrl().assetId) {
      router.push("/");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: IWalletContext = {
    assetId: wallet.assetId,
    address: wallet.address,
    isTestnet: wallet.isTestnet,
    transactions: wallet.transactions,
    walletInstance: wallet.walletInstance,
    handleRelayUrl,
    handleTransaction,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
