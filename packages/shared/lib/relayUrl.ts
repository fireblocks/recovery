import { nanoid } from 'nanoid';
import JSONCrush from 'jsoncrush';
import { Transaction } from '../types';
import {
  relayImportRequestParams,
  relayCreateTxRequestParams,
  relayBroadcastTxRequestParams,
  relaySignTxResponseParams,
  RelayParams,
  RelayRequestParams,
  RelayResponseParams,
} from '../schemas/relayUrl';

/**
 * Get a Relay URL parameters validation schema for a given action
 *
 * @param action Relay action
 * @param app Targeted app (relay or utility)
 * @returns Relay URL parameters validation schema
 */
const getSchema = (action: RelayParams['action'], app: 'utility' | 'relay') => {
  const error = new Error(`Invalid ${app} action: ${action}`);

  if (app === 'relay') {
    switch (action) {
      case 'import':
        return relayImportRequestParams;
      case 'tx/create':
        return relayCreateTxRequestParams;
      case 'tx/broadcast':
        return relayBroadcastTxRequestParams;
      default:
        throw error;
    }
  }

  if (app === 'utility' && action === 'tx/sign') {
    return relaySignTxResponseParams;
  }

  throw error;
};

/**
 * Get parameters from a Relay URL
 *
 * @param app Targeted app (relay or utility)
 * @param relayUrl Relay URL
 * @returns Relay URL parameters
 */
export const getRelayParams = <
  Params extends App extends 'utility' ? RelayResponseParams : RelayRequestParams,
  App extends 'utility' | 'relay',
>(
  app: App,
  relayUrl: string,
) => {
  const url = new URL(relayUrl);

  // Extract account ID from URL path
  const pathMatch = url.pathname.match(/\/accounts\/vault\/([0-9]+)/);

  const accountId = pathMatch?.[1] ? parseInt(pathMatch[1], 10) : undefined;

  // Extract parameters from URL hash
  const encodedParams = url.hash.split('#')[1];

  if (!encodedParams) {
    throw new Error('No parameters found in Relay URL');
  }

  // Decode parameters
  const compressedParams = decodeURIComponent(encodedParams);

  // Decompress parameters
  const decompressedParams = JSONCrush.uncrush(compressedParams);

  if (!decompressedParams) {
    throw new Error('Relay URL parameter decompression failed');
  }

  const parsedParams = { accountId, ...JSON.parse(decompressedParams) } as Params;

  const schema = getSchema(parsedParams.action, app);

  // Validate parameters
  const validatedParams = schema.parse(parsedParams) as Params;

  return validatedParams;
};

/**
 * Get a Relay URL from a base URL and parameters
 *
 * @param target Targeted app (relay or utility)
 * @param baseUrl Relay base URL of the destination app (e.g. https://relay.fireblocks.solutions or fireblocks-recovery://)
 * @param params Relay URL parameters
 * @returns Relay URL
 */
export const getRelayUrl = <
  Params extends Target extends 'relay' ? RelayRequestParams : RelayResponseParams,
  Target extends 'relay' | 'utility',
>(
  target: Target,
  baseUrl: string,
  params: Params,
) => {
  const schema = getSchema(params.action, target);

  // Validate parameters
  const parsedParams = schema.parse(params);

  // Extract account ID from parameters as it's part of the URL path, not the hash
  const { accountId, ...hashParams } = parsedParams;

  // Compress hash parameters
  const compressedHashParams = JSONCrush.crush(JSON.stringify(hashParams));

  // Encode hash parameters
  const encodedHashParams = encodeURIComponent(compressedHashParams);

  const relayUrl = `${baseUrl}/accounts/vault/${accountId}#${encodedHashParams}` as const;

  return relayUrl;
};

const REQUIRED_TX_TRANSACTION_KEYS: (keyof Transaction)[] = [
  'id',
  'assetId',
  'accountId',
  'addressIndex',
  'from',
  'to',
  'amount',
  'hex',
];

export const getTxFromRelay = (txInput: Partial<Transaction>) => {
  const {
    id = nanoid(),
    state = txInput.signature ? 'signed' : 'created',
    assetId,
    accountId = 0,
    addressIndex = 0,
    from,
    to,
    amount = 0,
    remainingBalance = 0,
    memo,
    contractCall,
    hex,
    signature,
    hash,
    error,
  } = txInput;

  const hasTransaction = REQUIRED_TX_TRANSACTION_KEYS.every((key) => typeof txInput[key] !== 'undefined');

  if (hasTransaction) {
    return {
      id,
      state,
      assetId: assetId as string,
      accountId,
      addressIndex,
      from: from as string,
      to: to as string,
      amount,
      remainingBalance,
      memo,
      contractCall,
      hex,
      signature,
      hash,
      error,
    };
  }

  return undefined;
};
