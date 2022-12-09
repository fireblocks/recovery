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

type WalletData = {
  state: "init" | "encrypted" | "ready";
  assetId?: string;
  privateKey?: string;
};

type IWalletContext = WalletData & {
  handleUrlPayload: (encodedPayload: string) => void;
  handlePassphrase: (passphrase: string) => void;
};

const defaultWalletData: WalletData = {
  state: "init",
  assetId: undefined,
  privateKey: undefined,
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

  const handleParsingPayload = (
    payload: RelayUrlPayload,
    passphrase?: string
  ) => {
    const { assetId, privateKey } = parsePayload(payload, passphrase);

    setWallet((prev) => ({
      ...prev,
      state: "ready",
      assetId,
      privateKey,
    }));
  };

  const handleUrlPayload = useCallback(
    (encodedPayload: string) => {
      try {
        const payload = decodePayload(encodedPayload);

        payloadRef.current = payload;

        if (isEncryptedPayload(payload)) {
          setWallet((prev) => ({ ...prev, state: "encrypted" }));
        } else {
          handleParsingPayload(payload);
        }

        router.push("/");
      } catch (error) {
        console.error(error);

        router.push("/scan");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handlePassphrase = useCallback(
    (passphrase: string) => {
      try {
        if (!payloadRef.current) {
          throw new Error("No encoded payload provided");
        }

        handleParsingPayload(payloadRef.current, passphrase);

        payloadRef.current = null;

        router.push("/");
      } catch (error) {
        console.error(error);

        router.push("/scan");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const hash = getHash();

    if (hash) {
      handleUrlPayload(hash);

      window.location.hash = "";
    } else if (!payloadRef.current) {
      router.push("/scan");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeof window !== "undefined" ? window.location.hash : ""]);

  const value: IWalletContext = {
    state: wallet.state,
    assetId: wallet.assetId,
    privateKey: wallet.privateKey,
    handleUrlPayload,
    handlePassphrase,
  };

  console.info("Wallet", value);

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
