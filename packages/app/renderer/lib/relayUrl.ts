import { random, pkcs5, cipher, util } from "node-forge";
import JSONCrush from "jsoncrush";
import { EncryptedString, RelayUrlInput, RelayUrlParameters } from "shared";

const encryptString = (input: string, passphrase: string) => {
  const salt = random.getBytesSync(128);
  const key = pkcs5.pbkdf2(passphrase, salt, 10000, 32);

  const encipher = cipher.createCipher("AES-CBC", key);
  const iv = random.getBytesSync(16);
  encipher.start({ iv });
  encipher.update(util.createBuffer(input));
  encipher.finish();

  return {
    iv: util.encode64(iv),
    salt: util.encode64(salt),
    data: util.encode64(encipher.output.data),
  };
};

const encodeRelayUrl = (params: RelayUrlParameters, baseUrl: string) => {
  const compressedParams = JSONCrush.crush(JSON.stringify(params));

  const encodedParams = encodeURIComponent(compressedParams);

  const relayUrl = `${baseUrl}#${encodedParams}`;

  return relayUrl;
};

export const getRelayUrl = (
  input: RelayUrlInput,
  baseUrl: string,
  passphrase?: string
): string => {
  let privateKey: EncryptedString | string;

  if (typeof passphrase === "string" && passphrase?.length) {
    privateKey = encryptString(input.privateKey, passphrase);
  } else {
    privateKey = input.privateKey;
  }

  const hasTxParams =
    !!input.tx &&
    (Object.keys(input.tx) as Array<keyof typeof input.tx>).some(
      (key) => !!input.tx?.[key]
    );

  const params: RelayUrlParameters = {
    assetId: input.assetId,
    privateKey,
    publicKey: input.publicKey,
    tx: hasTxParams ? input.tx : undefined,
  };

  const encodedRelayUrl = encodeRelayUrl(params, baseUrl);

  console.info({ params, encodedRelayUrl });

  return encodedRelayUrl;
};
