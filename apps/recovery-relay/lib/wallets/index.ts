import { Cardano } from './ADA';
import { Bitcoin, BitcoinCash, BitcoinSV, DogeCoin, LiteCoin, ZCash } from './BTCBased';
import { Arbitrum } from './EVM/AETH';
import { Aurora } from './EVM/AOA';
import { Avalanche } from './EVM/AVAX';
import { BinanceSmartChain } from './EVM/BNB_BSC';
import { Celo } from './EVM/CELO';
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
import { Solana } from './SOL';

export { ConnectedWallet as BaseWallet } from './ConnectedWallet';

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
  LTC: LiteCoin,
  LTC_TEST: LiteCoin,
  ZEC: ZCash,
  ZEC_TEST: ZCash,
  FTM_FANTOM: Fantom,
  ETH: Ethereum,
  ETH_TEST3: Ethereum,
  ETH_TEST5: Ethereum,
  ETHW: EthereumPoW,
  EVMOS,
  GLMR: Moonbeam,
  CELO: Celo,
  AOA: Aurora,
  SOL: Solana,
  RON: Ronin,
  XDC: XinFin,
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
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type {
  UTXO,
  AccountData,
  TxParamsRequest,
  TxParamsResponse,
  TxBroadcastVariables,
  TxPayload,
  RawSignature,
} from './types';
