// import { Bitcoin } from './BTC';
import { assets } from '@fireblocks/asset-config';
import { Ripple } from './XRP';
import { Cosmos } from './ATOM';
import { EOS } from './EOS';
import { Bitcoin } from './BTC';
import { EVM } from './EVM';
import { Solana } from './SOL';
import { Tron } from './TRON';
import { Luna } from './LUNA';
import { Cardano } from './ADA';
import { Stellar } from './XLM';
import { Near } from './NEAR';
import { Tezos } from './XTZ';
import { Polkadot } from './DOT';
import { Kusama } from './KSM';
import { NEM } from './NEM';
import { Hedera } from './HBAR';
import { ERC20 } from '@fireblocks/wallet-derivation';
// import { Algorand } from './ALGO';

const fillEVMs = () => {
  const evms = Object.keys(assets).reduce(
    (o, assetId) => ({
      ...o,
      [assets[assetId].id]:
        assets[assetId].protocol === 'ETH' && assets[assetId].address
          ? ERC20
          : assets[assetId].protocol === 'ETH' && !assets[assetId].address
          ? EVM
          : undefined,
    }),
    {},
  ) as any;
  Object.keys(evms).forEach((key) => (evms[key] === undefined ? delete evms[key] : {}));
  return evms;
};

export { SigningWallet as BaseWallet } from './SigningWallet';

export const WalletClasses = {
  // ECDSA
  // ALGO: Algorand,
  // ALGO_TEST: Algorand,
  ADA: Cardano,
  ADA_TEST: Cardano,
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
  XRP: Ripple,
  XRP_TEST: Ripple,
  LUNA2: Luna,
  LUNA2_TEST: Luna,

  // EDDSA
  SOL: Solana,
  SOL_TEST: Solana,
  XLM: Stellar,
  XLM_TEST: Stellar,
  NEAR: Near,
  NEAR_TEST: Near,
  XTZ: Tezos,
  XTZ_TEST: Tezos,
  DOT: Polkadot,
  WND: Polkadot,
  KSM: Kusama,
  XEM: NEM,
  XEM_TEST: NEM,
  HBAR: Hedera,
  HBAR_TEST: Hedera,

  ...fillEVMs(),
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type { UTXO, AccountData, TxPayload, RawSignature } from './types';
