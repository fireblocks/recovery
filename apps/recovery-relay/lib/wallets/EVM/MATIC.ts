import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Matic extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    let chainId: number;

    switch (input.assetId) {
      case 'MATIC_POLYGON_MUMBAI':
        chainId = 80001;
        break;
      case 'AMOY_POLYGON_TEST':
        chainId = 80002;
        break;
      case 'MATIC_POLYGON':
        chainId = 137;
        break;
      default:
        throw new Error('Unsupported asset');
    }
    super(input, chainId);
  }
}
