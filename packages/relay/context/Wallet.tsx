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
import {
  isEncryptedPayload,
  decodePayload,
  parsePayload,
  getHash,
  RelayUrlPayload,
} from "../lib/urlParams";

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
  privateKey?: string;
  transactions: Transaction[];
};

type IWalletContext = WalletData & {
  handleUrlPayload: (encodedPayload: string) => void;
  handlePassphrase: (passphrase: string) => void;
};

const defaultWalletData: WalletData = {
  state: "init",
  assetId: undefined,
  privateKey: undefined,
  transactions: [],
};

const defaultValue: IWalletContext = {
  ...defaultWalletData,
  handleUrlPayload: () => undefined,
  handlePassphrase: () => undefined,
};

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const router = useRouter();

  const payloadRef = useRef<RelayUrlPayload | null>(null);

  const [wallet, setWallet] = useState(defaultWalletData);

  const handleFullPayload = (payload: RelayUrlPayload, passphrase?: string) => {
    const { assetId, privateKey, to, amount, memo } = parsePayload(
      payload,
      passphrase
    );

    const hasTxInput = to || amount || memo;

    setWallet((prev) => ({
      ...prev,
      state: "ready",
      assetId,
      privateKey,
      transactions: hasTxInput
        ? [
            ...(prev.transactions ?? []),
            {
              state: "init",
              to,
              amount,
              memo,
            },
          ]
        : prev.transactions,
    }));

    router.push("/[assetId]", `/${assetId}`);
  };

  const handleUrlPayload = useCallback((encodedPayload: string) => {
    try {
      const payload = decodePayload(encodedPayload);

      payloadRef.current = payload;

      if (isEncryptedPayload(payload)) {
        setWallet((prev) => ({ ...prev, state: "encrypted" }));

        router.push("/");
      } else {
        handleFullPayload(payload);
      }
    } catch (error) {
      console.error(error);

      throw new Error("Invalid relay URL");
    }
  }, []);

  const handlePassphrase = useCallback((passphrase: string) => {
    try {
      if (!payloadRef.current) {
        throw new Error("No encoded payload provided");
      }

      handleFullPayload(payloadRef.current, passphrase);

      payloadRef.current = null;
    } catch (error) {
      console.error(error);

      throw new Error("Invalid passphrase");
    }
  }, []);

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
      router.push("/scan");
    }
  }, []);

  useEffect(handleHashChange, [
    typeof window !== "undefined" ? window.location.hash : "",
  ]);

  const value: IWalletContext = {
    state: wallet.state,
    assetId: wallet.assetId,
    privateKey: wallet.privateKey,
    transactions: wallet.transactions,
    handleUrlPayload,
    handlePassphrase,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
