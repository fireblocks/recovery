// import { Bitcoin } from './BTC';
import { assets } from '@fireblocks/asset-config';
import { ERC20, ETC } from '@fireblocks/wallet-derivation';
import { Ripple } from './XRP';
import { Cosmos } from './ATOM';
import { EOS } from './EOS';
import { BitcoinCash } from './BCH';
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
import { Algorand } from './ALGO';
import { Bitcoin, BitcoinSV, LiteCoin, Dash, ZCash, Doge } from './BTC';
import { Celestia } from './CELESTIA';
import { Ton } from './TON';
import { Jetton } from './Jetton';

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

// const fillJettons = () => {
//   const jettons = Object.keys(assets).reduce(
//     (o, assetId) => ({
//       ...o,
//       [assets[assetId].id]: assets[assetId].protocol === 'TON' && assets[assetId].address ? Ton : undefined,
//     }),
//     {},
//   ) as any;
//   Object.keys(jettons).forEach((key) => (jettons[key] === undefined ? delete jettons[key] : {}));
//   return jettons;
// };

export { SigningWallet as BaseWallet } from './SigningWallet';

export const WalletClasses = {
  // ECDSA
  ALGO: Algorand,
  ALGO_TEST: Algorand,
  ADA: Cardano,
  ADA_TEST: Cardano,
  BTC: Bitcoin,
  BTC_TEST: Bitcoin,
  BCH: BitcoinCash,
  BCH_TEST: BitcoinCash,
  BSV: BitcoinSV,
  BSV_TEST: BitcoinSV,
  DASH: Dash,
  DASH_TEST: Dash,
  DOGE: Doge,
  DOGE_TEST: Doge,
  LTC: LiteCoin,
  LTC_TEST: LiteCoin,
  ZEC: ZCash,
  ZEC_TEST: ZCash,
  ETC,
  ETC_TEST: ETC,
  ETH: EVM,
  ETH_TEST3: EVM,
  ETH_TEST5: EVM,
  ETH_TEST6: EVM,
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
  CELESTIA: Celestia,
  CELESTIA_TEST: Celestia,

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
  TON: Ton,
  TON_TEST: Ton,
  USDT_TON: Jetton,
  NOTCOIN_TON: Jetton,
  DOGS_TON: Jetton,

  ...fillEVMs(),
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type { UTXO, AccountData, TxPayload, RawSignature } from './types';
