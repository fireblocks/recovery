import { Cardano } from './ADA';
import { Algorand } from './ALGO';
import { Bitcoin } from './BTC';
import { ERC20 } from './ERC20';
import { Ethereum } from './ETH';
import { Solana } from './SOL';

export const getWallet = (assetId: string) => {
  switch (assetId) {
    // ECDSA
    case 'BTC':
    case 'BTC_TEST':
      return Bitcoin;
    case 'ETH':
    case 'ETH_TEST':
    case 'ETH_TEST2':
    case 'ETH_TEST3':
    case 'ETH_TEST5':
      return Ethereum;
    // EdDSA
    case 'SOL':
    case 'SOL_TEST':
      return Solana;
    case 'ALGO':
      return Algorand;
    case 'ADA':
    case 'ADA_TEST':
      return Cardano;
    default:
      throw new Error(`Unsupported asset "${assetId}"`);
  }
};

export { Bitcoin, Ethereum, Solana, Algorand, Cardano, ERC20 };
