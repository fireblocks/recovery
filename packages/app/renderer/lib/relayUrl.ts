import { random, pkcs5, cipher, util } from "node-forge";
import JSONCrush from "jsoncrush";

export type RelayUrlParameters = {
  assetId: string;
  privateKey: string;
};

export type RelayUrlPayload = {
  iv?: string;
  salt?: string;
  data: string;
};

export const getRelayUrl = (
  params: RelayUrlParameters,
  baseUrl: string,
  passphrase?: string
) => {
  console.info("Getting relay URL", { params, baseUrl, passphrase });

  let payload: RelayUrlPayload;

  const paramString = JSON.stringify(params);

  if (passphrase?.length) {
    const salt = random.getBytesSync(128);
    const key = pkcs5.pbkdf2(passphrase, salt, 10000, 32);

    const encipher = cipher.createCipher("AES-CBC", key);
    const iv = random.getBytesSync(16);
    encipher.start({ iv });
    encipher.update(util.createBuffer(paramString));
    encipher.finish();

    payload = {
      iv: util.encode64(iv),
      salt: util.encode64(salt),
      data: util.encode64(encipher.output.data),
    };
  } else {
    payload = {
      data: paramString,
    };
  }

  const compressedPayload = JSONCrush.crush(JSON.stringify(payload));

  const encodedPayload = encodeURIComponent(compressedPayload);

  const relayUrl = `${baseUrl}#${encodedPayload}`;

  return relayUrl;
};
