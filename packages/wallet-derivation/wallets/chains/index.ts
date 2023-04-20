import { Cardano } from './ADA';
import { Algorand } from './ALGO';
import { Cosmos } from './ATOM';
import { BitcoinCash } from './BCH';
import { BitcoinSV } from './BSV';
import { Bitcoin } from './BTC';
import { DogeCoin } from './DOGE';
import { ERC20 } from './ERC20';
import { EVMWallet } from './EVM';
import { LiteCoin } from './LTC';
import { Solana } from './SOL';

export const getWallet = (assetId: string) => {
  switch (assetId) {
    // EdDSA
    case 'ADA':
    case 'ADA_TEST':
      return Cardano;
    case 'ALGO':
      return Algorand;
    case 'SOL':
    case 'SOL_TEST':
      return Solana;
    // ECDSA
    case 'ATOM_COS':
    case 'ATOM_COS_TEST':
      return Cosmos;
    case 'BTC':
    case 'BTC_TEST':
      return Bitcoin;
    case 'BSV':
    case 'BSV_TEST':
      return BitcoinSV;
    case 'BCH':
    case 'BCH_TEST':
      return BitcoinCash;
    case 'DOGE':
    case 'DOGE_TEST':
      return DogeCoin;
    case 'LTE':
    case 'LTE_TEST':
      return LiteCoin;
    case 'AVAX':
    case 'AVAXTEST':
    case 'BNB_BSC':
    case 'BNB_TEST':
    case 'FTM_FANTOM':
    case 'EVMOS':
    case 'MORV':
    case 'MATIC_POLYGON':
    case 'MATIC_POLYGON_MUMBAI':
    case 'ETH-OPT':
    case 'ETH-OPT_KOV':
    case 'ETH-AETH':
    case 'ETH-AETH_RIN':
    case 'GLMR':
    case 'CELO':
    case 'RON':
    case 'SGB':
    case 'SGB_LEGACY':
    case 'RBTC':
    case 'XDC':
    case 'RBTC_TEST':
    case 'AOA':
    case 'TKX':
    case 'VLX_VLX':
    case 'VLX_TEST':
    case 'ETHW':
    case 'ETH':
    case 'ETH_TEST':
    case 'ETH_TEST2':
    case 'ETH_TEST3':
    case 'ETH_TEST5':
      return EVMWallet;
    default:
      throw new Error(`Unsupported asset "${assetId}"`);
  }
};

export { BitcoinSV, Bitcoin, BitcoinCash, DogeCoin, LiteCoin, EVMWallet, Solana, Algorand, Cardano, ERC20, Cosmos };
