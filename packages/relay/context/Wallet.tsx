import { useRouter } from "next/router";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { EncryptedString, RelayUrlParameters } from "shared";
import {
  isEncryptedString,
  decodeParams,
  decryptString,
  getHash,
} from "../lib/urlParams";
import { BaseWallet, WalletClasses } from "../lib/wallets";

export type Transaction = {
  state: "init" | "broadcasting" | "confirming" | "success" | "error";
  to?: string;
  amount?: number;
  memo?: string;
  hash?: string;
};

type WalletData = {
  state: "init" | "encrypted" | "ready";
  assetId?: string;
  address?: string;
  isTestnet?: boolean;
  transactions: Transaction[];
  walletInstance?: BaseWallet;
};

type IWalletContext = WalletData & {
  handleUrlParams: (encodedPayload: string) => void;
  handleDecryptPrivateKey: (passphrase: string) => string;
  handleTransaction: (tx: Transaction) => void;
};

const handleTransactionState = (
  transactions: Transaction[] = [],
  tx: Transaction
) => {
  const initTxIndex = transactions.findIndex(({ state }) => state === "init");

  if (initTxIndex > 0) {
    return [
      ...transactions.slice(0, initTxIndex),
      { ...transactions[initTxIndex], ...tx },
      ...transactions.slice(initTxIndex + 1),
    ];
  }

  return [...transactions, tx];
};

const defaultWalletData: WalletData = {
  state: "init",
  assetId: undefined,
  address: "",
  isTestnet: undefined,
  transactions: [],
  walletInstance: undefined,
};

const defaultValue: IWalletContext = {
  ...defaultWalletData,
  handleUrlParams: () => undefined,
  handleDecryptPrivateKey: () => "",
  handleTransaction: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const router = useRouter();

  const privateKeyRef = useRef<EncryptedString | string | null>(null);

  const [wallet, setWallet] = useState<WalletData>(defaultWalletData);

  const handleUrlParams = useCallback(async (encodedParams: string) => {
    try {
      const params = decodeParams(encodedParams);

      privateKeyRef.current = params.privateKey;

      const state = isEncryptedString(params.privateKey)
        ? "encrypted"
        : "ready";

      const assetIdParts = params.assetId.split("_");

      const isTestnet = !!assetIdParts[1]?.includes("TEST");

      const baseAsset = assetIdParts[0] as keyof typeof WalletClasses;

      const WalletClass = WalletClasses[baseAsset];

      if (!WalletClass) {
        throw new Error("Unsupported asset ID");
      }

      const walletInstance = new WalletClass(params.publicKey, isTestnet);

      const address = await walletInstance.getAddress();

      console.info({ address });

      setWallet((prev) => ({
        ...prev,
        state,
        assetId: params.assetId,
        address,
        isTestnet,
        transactions: params.tx
          ? handleTransactionState(prev.transactions, {
              state: "init",
              ...params.tx,
            })
          : prev.transactions,
        walletInstance,
      }));

      router.push("/[assetId]", `/${params.assetId}`);
    } catch (error) {
      privateKeyRef.current = null;

      console.error(error);

      throw new Error("Invalid relay URL");
    }
  }, []);

  const handleDecryptPrivateKey = useCallback((passphrase: string) => {
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
  }, []);

  const handleTransaction = useCallback(
    (tx: Transaction) =>
      setWallet((prev) => ({
        ...prev,
        transactions: handleTransactionState(prev.transactions, tx),
      })),
    []
  );

  const handleHashChange = useCallback(() => {
    try {
      const hash = getHash();

      if (hash) {
        handleUrlPayload(hash);

        window.location.hash = "";
      } else if (!payloadRef.current) {
        throw new Error("No hash provided");
      }
    } catch {
      router.push("/");
    }
  }, []);

  useEffect(handleHashChange, [
    typeof window !== "undefined" ? window.location.hash : "",
  ]);

  const value: IWalletContext = {
    state: wallet.state,
    assetId: wallet.assetId,
    address: wallet.address,
    isTestnet: wallet.isTestnet,
    transactions: wallet.transactions,
    walletInstance: wallet.walletInstance,
    handleUrlParams,
    handleDecryptPrivateKey,
    handleTransaction,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
