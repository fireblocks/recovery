import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { AssetId, EncryptedString, TransactionInput } from "shared";
import {
  isEncryptedString,
  decryptString,
  decodeUrl,
  parseUrl,
  ParsedUrlParams,
} from "../lib/relayUrl";
import { BaseWallet } from "../lib/wallets";

let initialUrlParams: ParsedUrlParams | undefined;

if (typeof window !== "undefined") {
  const { assetId, encodedParams } = decodeUrl();

  window.location.hash = "";

  if (assetId && encodedParams) {
    try {
      initialUrlParams = parseUrl(assetId, encodedParams);
    } catch {
      console.info("No wallet data in URL");
    }
  }
}

export type Transaction = TransactionInput &
  (
    | {
        state: "success";
        error?: never;
        hash: string;
      }
    | {
        state: "error";
        error: string;
        hash?: never;
      }
  );

type WalletData = {
  state: "init" | "encrypted" | "ready";
  assetId?: AssetId;
  address?: string;
  isTestnet?: boolean;
  newTx: TransactionInput;
  transactions: Transaction[];
  walletInstance?: BaseWallet;
};

type IWalletContext = WalletData & {
  handleRelayUrl: (encodedPayload: string) => void;
  handleDecryptPrivateKey: (passphrase: string) => string;
  handleTransaction: (tx: Transaction) => void;
};

const defaultWalletData: WalletData = {
  state: "init",
  assetId: undefined,
  address: "",
  isTestnet: undefined,
  newTx: { to: "", amount: 0 },
  transactions: [],
  walletInstance: undefined,
};

const defaultValue: IWalletContext = {
  ...defaultWalletData,
  handleRelayUrl: async () => undefined,
  handleDecryptPrivateKey: () => "",
  handleTransaction: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const router = useRouter();

  const privateKeyRef = useRef<EncryptedString | string | null>(
    initialUrlParams?.privateKey ?? null
  );

  const [wallet, setWallet] = useState<WalletData>(defaultWalletData);

  const setWalletFromUrlParams = (params: ParsedUrlParams) =>
    setWallet((prev) => ({
      ...prev,
      state: params.state,
      assetId: params.assetId,
      address: params.address,
      isTestnet: params.isTestnet,
      newTx: params.newTx ?? defaultWalletData.newTx,
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

      const parsedParams = parseUrl(assetId, encodedParams);

      privateKeyRef.current = parsedParams.privateKey;

      setWalletFromUrlParams(parsedParams);

      router.push("/[assetId]", `/${assetId}`);
    } catch (error) {
      privateKeyRef.current = null;

      console.error(error);

      throw new Error("Invalid relay URL");
    }
  };

  const handleDecryptPrivateKey = (passphrase: string) => {
    if (!privateKeyRef.current) {
      throw new Error("No private key provided");
    }

    if (!isEncryptedString(privateKeyRef.current)) {
      return privateKeyRef.current;
    }

    try {
      const privateKey = decryptString(privateKeyRef.current, passphrase);

      setWallet((prev) => ({ ...prev, state: "ready" }));

      return privateKey;
    } catch (error) {
      console.error(error);

      throw new Error("Invalid passphrase");
    }
  };

  const handleTransaction = (tx: Transaction) =>
    setWallet((prev) => ({
      ...prev,
      newTx: defaultWalletData.newTx,
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
    state: wallet.state,
    assetId: wallet.assetId,
    address: wallet.address,
    isTestnet: wallet.isTestnet,
    newTx: wallet.newTx,
    transactions: wallet.transactions,
    walletInstance: wallet.walletInstance,
    handleRelayUrl,
    handleDecryptPrivateKey,
    handleTransaction,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
