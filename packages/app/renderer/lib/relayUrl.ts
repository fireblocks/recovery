import JSONCrush from "jsoncrush";
import { RelayUrlParameters } from "shared";

type RelayUrlInput = {
  baseUrl: string;
  data: RelayUrlParameters;
};

export const getRelayUrl = ({ baseUrl, data }: RelayUrlInput) => {
  const compressedParams = JSONCrush.crush(JSON.stringify(data));

  const encodedParams = encodeURIComponent(compressedParams);

  const relayUrl = `${baseUrl}#${encodedParams}`;

  return relayUrl;
};
