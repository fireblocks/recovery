import { Cardano } from './ADA';
import { Algorand } from './ALGO';
import { Bitcoin } from './BTC';
import { ERC20 } from './ERC20';
import { EVMWallet } from './EVM';
import { Solana } from './SOL';

export const getWallet = (assetId: string) => {
  switch (assetId) {
    // ECDSA
    case 'BTC':
    case 'BTC_TEST':
      return Bitcoin;
    // EdDSA
    case 'SOL':
    case 'SOL_TEST':
      return Solana;
    case 'ALGO':
      return Algorand;
    case 'ADA':
    case 'ADA_TEST':
      return Cardano;
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

export { Bitcoin, EVMWallet, Solana, Algorand, Cardano, ERC20 };
