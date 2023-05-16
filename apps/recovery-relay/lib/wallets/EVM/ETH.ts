import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Ethereum extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    let cluster: string;

    switch (input.assetId) {
      case 'ETH':
        cluster = 'mainnet';
        break;
      case 'ETH_TEST3':
        cluster = 'goerli';
        break;
      case 'ETH_TEST5':
        cluster = 'sepolia';
        break;
      default:
        throw new Error('Unsupported asset');
    }

    const rpcEndpoint = `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    super(input, rpcEndpoint);
  }
}
