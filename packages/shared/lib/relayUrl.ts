import JSONCrush from 'jsoncrush';

// A Relay URL is the interface between Recovery Utility and Recovery Relay.
// Relay URLs are encoded in QR codes which are scanned by either app to
// update their workspace states. Recovery Relay accepts these URLs to derive
// wallets from extended public keys, enabling balance queries and transaction
// creation. Recovery Utility accepts URLs using its URL scheme
// fireblocks-recovery:// to update wallet balances and sign transactions.

/**
 * Requests from Utility to Relay to load wallet(s)
 */
export type RelayBaseParameters = {
  xpub?: string;
  fpub?: string;
  assetId?: string;
  accountId?: number;
};

export type RelayBalanceResponse = {
  assetId: string;
  accountId: number;
  addressIndex?: number;
  address?: string;
  isLegacy?: boolean;
  isTestnet?: boolean;
  native: number;
  usd?: number;
};

/**
 * Responses from Relay to Utility to get balances
 */
export type RelayBalanceResponseParameters = {
  balances: RelayBalanceResponse[];
};

/**
 * Responses from Relay to Utility to sign a transaction
 */
export type RelaySigningResponseParameters = {
  txId: string;
  assetId: string;
  accountId: number;
  addressIndex: number;
  from: string;
  to: string;
  remaining: number;
  amount: number;
  txHex: string;
};

/**
 * Requests from Utility to Relay to broadcast a transaction
 */
export type RelayBroadcastRequestParameters = {
  xpub?: string;
  fpub?: string;
  txId: string;
  assetId: string;
  accountId: number;
  addressIndex: number;
  from: string;
  to: string;
  amount: number;
  txHex: string;
  signature: string;
};

type RelayPathParams = {
  '/': RelayBaseParameters;
  '/balances': RelayBalanceResponseParameters;
  '/sign': RelaySigningResponseParameters;
  '/broadcast': RelayBroadcastRequestParameters;
};

export type RelayPath = keyof RelayPathParams;

export type RelayParams<T extends RelayPath = RelayPath> = RelayPathParams[T];

export type AllRelayParams = Partial<
  RelayBaseParameters & RelayBalanceResponseParameters & RelaySigningResponseParameters & RelayBroadcastRequestParameters
>;

export const getRelayUrl = <P extends RelayPath>(path: P, params: RelayParams<P>, baseUrl: string) => {
  let relayUrl = `${baseUrl}${path}`;

  if (Object.keys(params).every((key) => !params[key as keyof typeof params])) {
    return relayUrl;
  }

  const compressedParams = JSONCrush.crush(JSON.stringify(params));

  const encodedParams = encodeURIComponent(compressedParams);

  relayUrl = `${relayUrl}#${encodedParams}`;

  return relayUrl;
};

export const getRelayParams = <P extends RelayPath = RelayPath>(url: string) => {
  const segments = url.split('/');

  const path = segments[segments.length - 1] as P;

  const encodedParams = path.split('#')[1];

  if (!encodedParams) {
    console.warn('No Relay parameters found in URL');
    return undefined;
  }

  const compressedParams = decodeURIComponent(encodedParams);

  const decompressedParams = JSONCrush.uncrush(compressedParams);

  if (!decompressedParams) {
    console.warn('Relay parameter decompression failed');
    return undefined;
  }

  const params = JSON.parse(decompressedParams) as RelayParams<P>;

  return { path, params };
};
