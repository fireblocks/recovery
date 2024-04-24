import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Ethereum extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    let cluster: string;
    let rpcEndpoint: string = '';

    switch (input.assetId) {
      case 'ETH':
        cluster = 'mainnet';
        break;
      case 'ETH_TEST3':
        cluster = 'goerli';
        break;
      case 'ETH_TEST6':
        cluster = 'holesky';
        rpcEndpoint = 'https://ethereum-holesky-rpc.publicnode.com';
        break;
      case 'ETH_TEST5':
        cluster = 'sepolia';
        rpcEndpoint = 'https://ethereum-sepolia-rpc.publicnode.com';
        break;
      default:
        throw new Error('Unsupported asset');
    }

    rpcEndpoint = rpcEndpoint === '' ? `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161` : rpcEndpoint;

    super(input, rpcEndpoint);
  }
}
