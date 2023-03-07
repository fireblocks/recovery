import JSONCrush from "jsoncrush";
import { AssetId } from "../types/index";

/**
 * Requests from Utility to Relay to load wallet(s)
 */
export type RelayBaseParameters = {
  xpub?: string;
  fpub?: string;
  assetId?: AssetId;
  accountId?: number;
};

/**
 * Responses from Relay to Utility to get balances
 *
 * [AssetId, balance, [account, addressIndex]][]
 */
export type RelayBalanceResponseParameters = [
  AssetId,
  number,
  [number, number]
][];

/**
 * Responses from Relay to Utility to sign a transaction
 */
export type RelaySigningResponseParameters = {
  assetId: AssetId;
  from: string;
  to: string;
  balance: string;
  amount: number;
  txHex: string;
};

/**
 * Requests from Utility to Relay to broadcast a transaction
 */
export type RelayBroadcastRequestParameters = {
  xpub?: string;
  fpub?: string;
  assetId: AssetId;
  from: string;
  to: string;
  amount: number;
  txHex: string;
  signature: string;
};

type RelayPathParams = {
  "/": RelayBaseParameters;
  "/balances": RelayBalanceResponseParameters;
  "/sign": RelaySigningResponseParameters;
  "/broadcast": RelayBroadcastRequestParameters;
};

type RelayPath = keyof RelayPathParams;

export type RelayParams<T extends RelayPath = RelayPath> = RelayPathParams[T];

export type RelayRequestParams = RelayBaseParameters &
  RelayBroadcastRequestParameters;

export const getRelayUrl = <P extends RelayPath>(
  path: P,
  params: RelayParams<P>,
  baseUrl: string
) => {
  const compressedParams = JSONCrush.crush(JSON.stringify(params));

  const encodedParams = encodeURIComponent(compressedParams);

  const relayUrl = `${baseUrl}${path}#${encodedParams}`;

  return relayUrl;
};

export const getRelayParams = <T extends RelayParams>(url: string) => {
  const encodedParams = url.split("#")[1];

  if (!encodedParams) {
    throw new Error("No Recovery Utility parameters found in URL");
  }

  const compressedParams = decodeURIComponent(encodedParams);

  const decompressedParams = JSONCrush.uncrush(compressedParams);

  const parsedParams = JSON.parse(decompressedParams) as T;

  return parsedParams;
};
