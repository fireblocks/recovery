import JSONCrush from "jsoncrush";
import { RelayWalletUrlParameters } from "@fireblocks/recovery-shared";

type RelayUrlInput = {
  baseUrl: string;
  data: RelayWalletUrlParameters;
};

export const getRelayUrl = ({ baseUrl, data }: RelayUrlInput) => {
  const compressedParams = JSONCrush.crush(JSON.stringify(data));

  const encodedParams = encodeURIComponent(compressedParams);

  const relayUrl = `${baseUrl}#${encodedParams}`;

  return relayUrl;
};
