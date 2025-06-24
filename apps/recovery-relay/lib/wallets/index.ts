import { getAllJettons, getAllERC20s, getAllTRC20s } from '@fireblocks/asset-config';
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
import { Algorand } from './ALGO';
import { Celestia } from './CELESTIA';
import { CoreDAO } from './EVM/CORE_COREDAO';
import { Ton } from './TON';
import { Jetton } from './Jetton';
import { ERC20 } from './ERC20';
import { TRC20 } from './TRC20';
import { SPL } from './SPL';

export { ConnectedWallet } from './ConnectedWallet';

const fillJettons = () => {
  const jettonsList = getAllJettons();
  const jettons = jettonsList.reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: Jetton,
    }),
    {},
  ) as any;
  Object.keys(jettons).forEach((key) => (jettons[key] === undefined ? delete jettons[key] : {}));
  return jettons;
};

const fillERC20s = () => {
  const erc20List = getAllERC20s();
  const erc20Tokens = erc20List.reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: ERC20,
    }),
    {},
  ) as any;
  Object.keys(erc20Tokens).forEach((key) => (erc20Tokens[key] === undefined ? delete erc20Tokens[key] : {}));
  return erc20Tokens;
};

const fillTRC20s = () => {
  const trc20List = getAllTRC20s();
  const erc20Tokens = trc20List.reduce(
    (prev, curr) => ({
      ...prev,
      [curr]: TRC20,
    }),
    {},
  ) as any;
  Object.keys(erc20Tokens).forEach((key) => (erc20Tokens[key] === undefined ? delete erc20Tokens[key] : {}));
  return erc20Tokens;
};

export const WalletClasses = {
  ALGO: Algorand,
  ALGO_TEST: Algorand,
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
  ETH_TEST6: Ethereum,
  ETHW: EthereumPoW,
  EVMOS,
  GLMR: Moonbeam,
  CELO: Celo,
  AURORA_DEV: Aurora,
  SOL: Solana,

  SOL_TEST: Solana,
  CSOL_SOL: SPL,
  SAMO_SOL: SPL,
  RUN_SOL: SPL,
  LDO_SOL: SPL,
  $WIF_SOL: SPL,
  TTT_SPL: SPL,
  MNDE_SOL: SPL,
  ORCA_SOL: SPL,
  RENDER_SOL: SPL,
  TRUMP_B6KKMHK5_E95U: SPL,
  SONAR_SOL: SPL,
  FANT_SOL: SPL,
  YARD_SOL: SPL,
  RAY_SOL: SPL,
  STSOL_SOL: SPL,
  SYP_SOL: SPL,
  JTO_SOL: SPL,
  NINJA_SOL: SPL,
  SLRS_SOL: SPL,
  SOL_MAPS_FD7T: SPL,
  SHILL_SOL: SPL,
  SUNNY_SOL: SPL,
  UST_SOL: SPL,
  SOL_USDT_EWAY: SPL,
  UNI_SOL: SPL,
  SBR_SOL: SPL,
  GOFX_SOL: SPL,
  HNT_SOL: SPL,
  SOL_SRM_R62M: SPL,
  SB_SOL: SPL,
  TRYB_SOL: SPL,
  PYUSD_SOL: SPL,
  UNQ_SOL: SPL,
  HBB_SPL: SPL,
  W_SOL: SPL,
  CWAR_SOL: SPL,
  FTT_SOL: SPL,
  GMT_SOL: SPL,
  PYTH_SOL: SPL,
  RIN_SOL: SPL,
  CRP_SOL: SPL,
  SLND_SOL: SPL,
  ETH_SOL: SPL,
  SHIB_SOL: SPL,
  LIKE_SOL: SPL,
  GARI_SOL: SPL,
  SOL_OXY_4TTN: SPL,
  POLIS_SOL: SPL,
  STEP_SOL: SPL,
  BONK_SOL: SPL,
  SOLX_SOL: SPL,
  STR_SOL: SPL,
  DXL_SOL: SPL,
  ATLAS_SOL: SPL,
  MBS_SOL: SPL,
  NAXAR_SOL: SPL,
  SPWN_SOL: SPL,
  SLC_SOL: SPL,
  REAL_SOL: SPL,
  MSOL_SOL: SPL,
  GENE_SOL: SPL,
  MNGO_SOL: SPL,
  BLT_SOL: SPL,
  AI16Z_SOL: SPL,
  JUP_SOL: SPL,
  LARIX_SOL: SPL,
  SCY_SOL: SPL,
  MELANIA_B6KKMHK5_RMZH: SPL,
  PRT_SOL: SPL,
  NEST_SOL: SPL,
  CAVE_SOL: SPL,
  SCT_SOL: SPL,
  MEAN_SOL: SPL,
  SOETH_SOL: SPL,
  MDF_SOL: SPL,
  BOT_SOL: SPL,
  CYS_SOL: SPL,
  CHICKS_SOL: SPL,
  SLIM_SOL: SPL,
  ACM_SOL: SPL,
  KIN_SOL: SPL,
  SUSHI_SOL: SPL,
  SVT_SOL: SPL,
  SOL_USDC_PTHX: SPL,
  DYDX_SOL: SPL,
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
  TKX: TokenX,
  ADA: Cardano,
  ADA_TEST: Cardano,
  MATIC_POLYGON: Matic,
  MATIC_POLYGON_MUMBAI: Matic,
  AMOY_POLYGON_TEST: Matic,
  'ETH-OPT': Optimism,
  'ETH-OPT_KOV': Optimism,
  'ETH-AETH': Arbitrum,
  'ETH-AETH_RIN': Arbitrum,
  BNB_BSC: BinanceSmartChain,
  BNB_TEST: BinanceSmartChain,
  CORE_COREDAO: CoreDAO,
  CORE_COREDAO_TEST: CoreDAO,
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
  CELESTIA: Celestia,
  CELESTIA_TEST: Celestia,
  TON: Ton,
  TON_TEST: Ton,
  ...fillJettons(),
  ...fillERC20s(),
  ...fillTRC20s(),
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;

export type { AccountData, TxPayload, RawSignature } from './types';
