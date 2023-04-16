import { Cardano } from './ADA';
import { BitcoinCash } from './BCH';
import { Bitcoin } from './BTC';
import { Arbitrum } from './EVM/AETH';
import { Avalanche } from './EVM/AVAX';
import { BinanceSmartChain } from './EVM/BNB_BSC';
import { Celo } from './EVM/CELO';
import { Ethereum } from './EVM/ETH';
import { EthereumPoW } from './EVM/ETHW';
import { EVMOS } from './EVM/EVMOS';
import { Fantom } from './EVM/FTM';
import { Moonbeam } from './EVM/GLMR';
import { Matic } from './EVM/MATIC';
import { Solana } from './SOL';

export { BaseWallet } from './BaseWallet';

export const WalletClasses = {
  AVAX: Avalanche,
  AVAXTEST: Avalanche,
  BTC: Bitcoin,
  BTC_TEST: Bitcoin,
  BCH: BitcoinCash,
  BCH_TEST: BitcoinCash,
  FTM_FANTOM: Fantom,
  ETH: Ethereum,
  ETH_TEST3: Ethereum,
  ETH_TEST5: Ethereum,
  ETHW: EthereumPoW,
  EVMOS,
  GLMR: Moonbeam,
  CELO: Celo,
  SOL: Solana,
  SOL_TEST: Solana,
  ADA: Cardano,
  ADA_TEST: Cardano,
  MATIC_POLYGON: Matic,
  MATIC_POLYGON_MUMBAI: Matic,
  'ETH-AETH': Arbitrum,
  'ETH-AETH_RIN': Arbitrum,
  BNB_BSC: BinanceSmartChain,
  BNB_TEST: BinanceSmartChain,
} as const;

type WalletClass = (typeof WalletClasses)[keyof typeof WalletClasses];

export type Derivation = InstanceType<WalletClass>;
