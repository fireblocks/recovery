import { pkcs5, cipher, util } from "node-forge";
import JSONCrush from "jsoncrush";
import {
  assetIds,
  AssetId,
  EncryptedString,
  TransactionInput,
  RelayUrlParameters,
} from "shared";
import { BaseWallet, WalletClasses } from "./wallets";

const ENCRYPTED_STRING_PROPERTIES: Array<keyof EncryptedString> = [
  "iv",
  "salt",
  "data",
];

export const isEncryptedString = (
  data: EncryptedString | string
): data is EncryptedString =>
  typeof data !== "string" &&
  ENCRYPTED_STRING_PROPERTIES.every((key) => data.hasOwnProperty(key));

export const decryptString = (
  encryptedString: EncryptedString,
  passphrase: string
) => {
  try {
    const encryptedData = util.decode64(encryptedString.data);
    const iv = util.decode64(encryptedString.iv);
    const salt = util.decode64(encryptedString.salt);
    const key = pkcs5.pbkdf2(passphrase, salt, 10000, 32);

    const decipher = cipher.createDecipher("AES-CBC", key);
    decipher.start({ iv });
    decipher.update(util.createBuffer(encryptedData));
    decipher.finish();

    const paramString = decipher.output.data;
    return paramString;
  } catch (error) {
    console.error(error);

    throw new Error("Failed to decrypt string");
  }
};

export const decodeUrl = (url = window.location.href) => {
  const [href, encodedParams] = url.split("#");

  const assetId = assetIds.find((assetId) => href.includes(`/${assetId}`));

  return { assetId, encodedParams: encodedParams as string | undefined };
};

export type ParsedUrlParams = {
  state: "encrypted" | "ready";
  assetId: AssetId;
  address: string;
  privateKey: string | EncryptedString;
  isTestnet: boolean;
  newTx?: TransactionInput;
  walletInstance: BaseWallet;
};

export const parseUrl = (assetId: AssetId, encodedParams: string) => {
  try {
    if (!assetId) {
      throw new Error("Invalid asset ID in URL");
    }

    if (!encodedParams) {
      throw new Error("No wallet data in URL");
    }

    const compressedParams = decodeURIComponent(encodedParams);

    const decompressedParams = JSONCrush.uncrush(compressedParams);

    const {
      adr: address,
      prv: privateKey,
      tx,
    } = JSON.parse(decompressedParams) as RelayUrlParameters;

    const state = isEncryptedString(privateKey) ? "encrypted" : "ready";

    const [baseAsset, assetSuffix] = assetId.split("_");

    const isTestnet = !!assetSuffix?.includes("TEST");

    const WalletClass = WalletClasses[baseAsset as AssetId];

    const walletInstance = new WalletClass(address, isTestnet);

    const parsedParams: ParsedUrlParams = {
      state,
      assetId,
      address,
      privateKey,
      isTestnet,
      newTx: tx,
      walletInstance,
    };

    return parsedParams;
  } catch (error) {
    console.error(error);

    throw new Error("Invalid relay URL");
  }
};
