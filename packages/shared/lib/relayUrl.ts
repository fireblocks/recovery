import { nanoid } from 'nanoid';
import superjson from 'superjson';
import JSONCrush from 'jsoncrush';
import { Transaction } from '../types';
import {
  relayImportRequestParams,
  relayCreateTxRequestParams,
  relayBroadcastTxRequestParams,
  relaySignTxResponseParams,
  relayRawSignTxResponseParams,
  RelayParams,
  RelayRequestParams,
  RelayResponseParams,
  relayRawSignTxRequestParams,
} from '../schemas/relayUrl';
import { getLogger } from './getLogger';
import { LOGGER_NAME_SHARED } from '../constants';

const logger = getLogger(LOGGER_NAME_SHARED);

/**
 * Get a Relay URL parameters validation schema for a given action
 *
 * @param action Relay action
 * @param app Targeted app (relay or utility)
 * @returns Relay URL parameters validation schema
 */
const getSchema = (action: RelayParams['action'], app: 'utility' | 'relay') => {
  const error = new Error(`Invalid ${app} action: ${action}`);
  logger.debug('getSchema', { action, app });
  if (app === 'relay') {
    switch (action) {
      case 'import':
        return relayImportRequestParams;
      case 'tx/create':
        return relayCreateTxRequestParams;
      case 'tx/broadcast':
        return relayBroadcastTxRequestParams;
      case 'tx/raw-sign':
        return relayRawSignTxRequestParams;
      default:
        throw error;
    }
  }

  if (app === 'utility') {
    switch (action) {
      case 'tx/sign':
        return relaySignTxResponseParams;

      case 'tx/broadcast-raw-sign':
        return relayRawSignTxResponseParams;

      default:
        throw error;
    }
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

  logger.debug('Relay URL:', relayUrl);

  // Extract account ID from URL path
  const pathMatch = url.pathname.match(/\/accounts\/vault\/([0-9]+)/);

  const accountId = typeof pathMatch?.[1] !== 'undefined' ? parseInt(pathMatch[1], 10) : undefined;

  // Extract parameters from URL hash
  const encodedHashParams = url.hash.split('#')[1];

  if (!encodedHashParams) {
    throw new Error('No parameters found in Relay URL');
  }

  // Decode parameters
  const compressedHashParams = decodeURIComponent(encodedHashParams);

  // Decompress parameters
  const decompressedHashParams = JSONCrush.uncrush(compressedHashParams);

  if (!decompressedHashParams) {
    throw new Error('Relay URL parameter decompression failed');
  }

  // Deserialize parameters
  const deserializedHashParams = superjson.parse<Params>(decompressedHashParams);

  const parsedParams = { ...deserializedHashParams, accountId };

  const schema = getSchema(parsedParams.action, app);

  // Validate parameters
  const validatedParams = schema.parse(parsedParams) as Params;

  logger.info('Relay URL parameters:', validatedParams);

  return validatedParams;
};

/**
 * Get a Relay URL from a base URL and parameters
 *
 * @param target Targeted app (relay or utility)
 * @param baseUrl Relay base URL of the destination app (e.g. fireblocks-recovery://)
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
  const { accountId, ...deserializedParams } = parsedParams;

  // Serialize hash parameters
  const serializedHashParams = superjson.stringify(deserializedParams);

  // Compress hash parameters
  const compressedHashParams = JSONCrush.crush(serializedHashParams);

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

  logger.debug('getTxFromRelay', { txInput });

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
