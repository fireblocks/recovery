import JSONCrush from "jsoncrush";
import { AssetId, RelayUrlParameters } from "shared";
import { encryptString } from "./encryption";

export type RelayUrlInputData = {
  assetId: AssetId;
  address: string;
  privateKey: string;
};

type RelayUrlInput = {
  baseUrl: string;
  pin: string;
  data: RelayUrlInputData;
};

export const getRelayUrl = async ({ baseUrl, pin, data }: RelayUrlInput) => {
  const { assetId, address, privateKey } = data;

  const encryptedPrivateKey = await encryptString(privateKey, pin);

  const params: RelayUrlParameters = {
    adr: address,
    prv: encryptedPrivateKey,
  };

  const compressedParams = JSONCrush.crush(JSON.stringify(params));

  const encodedParams = encodeURIComponent(compressedParams);

  const relayUrl = `${baseUrl}/${assetId}#${encodedParams}`;

  return relayUrl;
};
