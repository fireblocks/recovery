import semverRegex from 'semver-regex';
import { z } from 'zod';
import { getExtendedKeySchema } from './extendedKeys';

// A Relay URL is the interface between Recovery Utility and Recovery Relay.
// Relay URLs are encoded in QR codes which are scanned by either app to
// update their workspace states. Recovery Relay accepts these URLs to derive
// wallets from extended public keys, enabling balance queries, transaction
// creation, and transaction broadcasting. Recovery Utility accepts URLs using
// its URL scheme fireblocks-recovery:// to update wallet balances and sign
// transactions. Relay URL paths are always `/accounts/vault/:accountId`.

const nonnegativeIntSchema = (description: string) =>
  z.number().int(`${description} must be an integer`).nonnegative(`Invalid ${description}`);

const accountIdSchema = nonnegativeIntSchema('Account ID');

const versionSchema = (appType: 'Utility' | 'Relay') => z.string().regex(semverRegex(), `Invalid ${appType} version`);

const actionSchema = <Action extends string>(action: Action) => z.literal(action);

const newTxSchema = z.object({
  id: z.string().nonempty('Transaction ID is required'),
  assetId: z.string().nonempty('Asset ID is required'),
});

// Requests (Utility -> Relay)

const relayBaseRequestParams = z.object({
  accountId: accountIdSchema,
  version: versionSchema('Utility'),
  platform: z.string().nonempty('Platform is required'),
  xpub: getExtendedKeySchema('xpub'),
  fpub: getExtendedKeySchema('fpub'),
});

export const relayImportRequestParams = relayBaseRequestParams.extend({
  action: actionSchema('import'),
  assetId: z.string().nonempty('Asset ID is required'),
});

/** Import extended public keys into Recovery Relay */
export type RelayImportRequestParams = z.infer<typeof relayImportRequestParams>;

export const relayCreateTxRequestParams = relayBaseRequestParams.extend({
  action: actionSchema('tx/create'),
  newTx: newTxSchema,
});

/** Request new transaction creation from Recovery Relay */
export type RelayCreateTxRequestParams = z.infer<typeof relayCreateTxRequestParams>;

const preparedTxSchema = newTxSchema.extend({
  path: z.tuple([
    z.literal(44),
    nonnegativeIntSchema('Coin type'),
    accountIdSchema,
    nonnegativeIntSchema('Change index'),
    nonnegativeIntSchema('Address index'),
  ]),
  from: z.string().nonempty('From address is required'),
  to: z.string().nonempty('To address is required'),
  amount: z.number().positive('Amount is required'),
});

const hexString = z.string().regex(/^[0-9a-fA-F]*$/, 'Invalid hex');

export const relayBroadcastTxRequestParams = relayBaseRequestParams.extend({
  action: actionSchema('tx/broadcast'),
  signedTx: preparedTxSchema.extend({
    hex: hexString.nonempty('Serialized transaction is required'),
    signature: hexString.nonempty('Signature is required'),
  }),
});

/** Request transaction broadcast from Recovery Relay */
export type RelayBroadcastTxRequestParams = z.infer<typeof relayBroadcastTxRequestParams>;

// Responses (Relay -> Utility)

const relayBaseResponseParams = z.object({
  accountId: accountIdSchema,
  version: versionSchema('Relay'),
  host: z.string().url('Invalid host'),
  ip: z.string().ip('Invalid IP address').optional(),
});

export const relaySignTxResponseParams = relayBaseResponseParams.extend({
  action: actionSchema('tx/sign'),
  unsignedTx: preparedTxSchema.extend({
    misc: z.record(z.string()).optional(),
  }),
});

/** Respond to Recovery Utility with unsigned transaction for signing */
export type RelaySignTxResponseParams = z.infer<typeof relaySignTxResponseParams>;

// export const relayBalancesResponseParams = relayBaseResponseParams.extend({
//   action: actionSchema('balances/update'),
//   balances: z.array(z.tuple([z.string(), z.number().nonnegative()])),
// });

/** Respond to Recovery Utility with vault account balances */
// export type RelayBalancesResponseParams = z.infer<typeof relayBalancesResponseParams>;

/** Relay URL parameters for sending data to Recovery Relay */
export type RelayRequestParams = RelayImportRequestParams | RelayCreateTxRequestParams | RelayBroadcastTxRequestParams;

/** Relay URL parameters for sending data to Recovery Utility */
export type RelayResponseParams = RelaySignTxResponseParams; // | RelayBalancesResponseParams;

/** Relay URL parameters */
export type RelayParams = RelayRequestParams | RelayResponseParams;
