import { pkcs5, cipher, util } from "node-forge";
import JSONCrush from "jsoncrush";
import { EncryptedString, RelayUrlParameters } from "shared";

const ENCRYPTED_STRING_PROPERTIES: Array<keyof EncryptedString> = [
  "iv",
  "salt",
  "data",
];

export const decodeParams = (encodedParams: string) => {
  try {
    const compressedPayload = decodeURIComponent(encodedParams);

    const decompressedPayload = JSONCrush.uncrush(compressedPayload);

    const payload = JSON.parse(decompressedPayload) as RelayUrlParameters;

    return payload;
  } catch (error) {
    console.error(error);

    throw new Error("Failed to decode parameters");
  }
};

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

export const getHash = () =>
  typeof window === "undefined"
    ? undefined
    : window.location.hash.split("#")[1];
