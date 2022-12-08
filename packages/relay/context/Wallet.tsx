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
  parseParams,
  getHash,
} from "../lib/urlParams";

interface IWalletContext {
  state: "init" | "encrypted" | "ready";
  encodedPayload?: string;
  assetId?: string;
  privateKey?: string;
  handleUrlPayload: (encodedPayload?: string, passphrase?: string) => void;
}

type WalletData = Omit<IWalletContext, "encodedPayload" | "handleUrlPayload">;

const defaultValue: IWalletContext = {
  state: "init",
  encodedPayload: undefined,
  assetId: undefined,
  privateKey: undefined,
  handleUrlPayload: () => undefined,
};

export const defaultSettings = defaultValue;

const Context = createContext(defaultValue);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const router = useRouter();

  const encodedPayloadRef = useRef<string | undefined>();

  const [wallet, setWallet] = useState<WalletData>(() => ({
    state: defaultValue.state,
    assetId: defaultValue.assetId,
    privateKey: defaultValue.privateKey,
  }));

  const handleUrlPayload = useCallback(
    (encodedPayload = encodedPayloadRef.current, passphrase?: string) => {
      try {
        if (!encodedPayload) {
          throw new Error("No URL hash");
        }

        encodedPayloadRef.current = encodedPayload;

        const payload = decodePayload(encodedPayload);

        const isEncrypted = isEncryptedPayload(payload);

        if (isEncrypted && !passphrase) {
          setWallet((prev) => ({
            ...prev,
            state: "encrypted",
          }));
        } else {
          const params = parseParams(payload, passphrase);

          setWallet((prev) => ({
            ...prev,
            state: "ready",
            assetId: params.assetId,
            privateKey: params.privateKey,
          }));
        }
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

    handleUrlPayload(hash);

    if (hash) {
      window.location.hash = "";
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: IWalletContext = {
    state: wallet.state,
    encodedPayload: encodedPayloadRef.current,
    assetId: wallet.assetId,
    privateKey: wallet.privateKey,
    handleUrlPayload,
  };

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useWallet = () => useContext(Context);
