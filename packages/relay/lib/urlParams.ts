import { pkcs5, cipher, util } from "node-forge";
import JSONCrush from "jsoncrush";

type RelayUrlParameters = {
  assetId: string;
  privateKey: string;
};

type RelayUrlUnencryptedPayload = {
  data: string;
};

type RelayUrlEncryptedPayload = {
  iv: string;
  salt: string;
  data: string;
};

export type RelayUrlPayload =
  | RelayUrlUnencryptedPayload
  | RelayUrlEncryptedPayload;

export const isEncryptedPayload = (
  payload: RelayUrlPayload
): payload is RelayUrlEncryptedPayload =>
  payload.hasOwnProperty("iv") && payload.hasOwnProperty("salt");

export const decodePayload = (encodedPayload: string) => {
  try {
    const compressedPayload = decodeURIComponent(encodedPayload);

    const decompressedPayload = JSONCrush.uncrush(compressedPayload);

    const payload = JSON.parse(decompressedPayload) as RelayUrlPayload;

    return payload;
  } catch (error) {
    console.error(error);

    throw new Error("Failed to decode payload");
  }
};

const decryptParams = (
  payload: RelayUrlEncryptedPayload,
  passphrase: string
) => {
  try {
    const encryptedData = util.decode64(payload.data);
    const iv = util.decode64(payload.iv);
    const salt = util.decode64(payload.salt);
    const key = pkcs5.pbkdf2(passphrase, salt, 10000, 32);

    const decipher = cipher.createDecipher("AES-CBC", key);
    decipher.start({ iv });
    decipher.update(util.createBuffer(encryptedData));
    decipher.finish();

    const paramString = decipher.output.data;
    return paramString;
  } catch (error) {
    console.error(error);

    throw new Error("Failed to decrypt payload");
  }
};

export const parseParams = (payload: RelayUrlPayload, passphrase?: string) => {
  const paramString =
    passphrase?.length && isEncryptedPayload(payload)
      ? decryptParams(payload, passphrase)
      : payload.data;

  const params = JSON.parse(paramString) as RelayUrlParameters;

  return params;
};

export const getHash = () =>
  typeof window === "undefined"
    ? undefined
    : window.location.hash.split("#")[1];
