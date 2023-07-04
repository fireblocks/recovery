import { Cardano } from './ADA';
import { Cosmos } from './ATOM';
import { Bitcoin, BitcoinCash, BitcoinSV, DASH, DogeCoin, LiteCoin, ZCash } from './BTCBased';
import { Polkadot } from './DOT';
import { EOS } from './EOS';
import { Arbitrum } from './EVM/AETH';
import { Aurora } from './EVM/AOA';
import { Avalanche } from './EVM/AVAX';
import { BinanceSmartChain } from './EVM/BNB_BSC';
import { Celo } from './EVM/CELO';
import { EthereumClassic } from './EVM/ETC';
import { Ethereum } from './EVM/ETH';
import { EthereumPoW } from './EVM/ETHW';
import { EVMOS } from './EVM/EVMOS';
import { Fantom } from './EVM/FTM';
import { Moonbeam } from './EVM/GLMR';
import { Matic } from './EVM/MATIC';
import { Moonriver } from './EVM/MOVR';
import { Optimism } from './EVM/OETH';
import { RootstockBTC } from './EVM/RBTC';
import { Ronin } from './EVM/RON';
import { Songbird } from './EVM/SGB';
import { TokenX } from './EVM/TKX';
import { Velas } from './EVM/VLX';
import { XinFin } from './EVM/XDC';
import { Hedera } from './HBAR';
import { Kusama } from './KSM';
import { Luna } from './LUNA';
import { Near } from './NEAR';
import { NEM } from './NEM';
import { Solana } from './SOL';
import { Tron } from './TRON';
import { Stellar } from './XLM';
import { Ripple } from './XRP';
import { Tezos } from './XTZ';

export { ConnectedWallet } from './ConnectedWallet';

export const WalletClasses = {
  AVAX: Avalanche,
  AVAXTEST: Avalanche,
  BTC: Bitcoin,
  BTC_TEST: Bitcoin,
  BCH: BitcoinCash,
  BCH_TEST: BitcoinCash,
  BSV: BitcoinSV,
  BSV_TEST: BitcoinSV,
  DOGE: DogeCoin,
  DOGE_TEST: DogeCoin,
  DOT: Polkadot,
  WND: Polkadot,
  KSM: Kusama,
  LTC: LiteCoin,
  LTC_TEST: LiteCoin,
  ZEC: ZCash,
  ZEC_TEST: ZCash,
  DASH,
  FTM_FANTOM: Fantom,
  ETC: EthereumClassic,
  ETC_TEST: EthereumClassic,
  ETH: Ethereum,
  ETH_TEST3: Ethereum,
  ETH_TEST5: Ethereum,
  ETHW: EthereumPoW,
  EVMOS,
  GLMR: Moonbeam,
  CELO: Celo,
  AURORA_DEV: Aurora,
  SOL: Solana,
  RON: Ronin,
  XDC: XinFin,
  XRP: Ripple,
  XRP_TEST: Ripple,
  RBTC: RootstockBTC,
  RBTC_TEST: RootstockBTC,
  SGB: Songbird,
  SGB_LEGACY: Songbird,
  MOVR: Moonriver,
  VLX_VLX: Velas,
  VLX_TEST: Velas,
  SOL_TEST: Solana,
  TKX: TokenX,
  ADA: Cardano,
  ADA_TEST: Cardano,
  MATIC_POLYGON: Matic,
  MATIC_POLYGON_MUMBAI: Matic,
  'ETH-OPT': Optimism,
  'ETH-OPT_KOV': Optimism,
  'ETH-AETH': Arbitrum,
  'ETH-AETH_RIN': Arbitrum,
  BNB_BSC: BinanceSmartChain,
  BNB_TEST: BinanceSmartChain,
  EOS,
  EOS_TEST: EOS,
  ATOM_COS: Cosmos,
  ATOM_COS_TEST: Cosmos,
  TRX: Tron,
  TRX_TEST: Tron,
  LUNA2: Luna,
  LUNA2_TEST: Luna,
  XLM: Stellar,
  XLM_TEST: Stellar,
  NEAR: Near,
  NEAR_TEST: Near,
  XTZ: Tezos,
  XTZ_TEST: Tezos,
  XEM: NEM,
  XEM_TEST: NEM,
  HBAR: Hedera,
  HBAR_TEST: Hedera,
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type { AccountData, TxPayload, RawSignature } from './types';
