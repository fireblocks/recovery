import { Cosmos } from './ATOM';
import { EOS } from './EOS';
import { Bitcoin } from './BTC';
import { EVM } from './EVM';
import { Solana } from './SOL';
import { Tron } from './TRON';

export { SigningWallet as BaseWallet } from './SigningWallet';

export const WalletClasses = {
  // ECDSA
  BTC: Bitcoin,
  BTC_TEST: Bitcoin,
  ETH: EVM,
  ETH_TEST3: EVM,
  ETH_TEST5: EVM,
  EOS,
  EOS_TEST: EOS,
  ATOM_COS: Cosmos,
  ATOM_COS_TEST: Cosmos,
  TRX: Tron,
  TRX_TEST: Tron,

  // EDDSA
  SOL: Solana,
  SOL_TEST: Solana,
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type { UTXO, AccountData, TxBroadcastVariables, TxPayload, RawSignature } from './types';
