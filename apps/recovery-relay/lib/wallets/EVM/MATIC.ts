import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Matic extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    let rpcEndpoint: string;

    switch (input.assetId) {
      case 'MATIC_POLYGON_MUMBAI':
        rpcEndpoint = 'https://polygon-mumbai-bor-rpc.publicnode.com';
        break;
      case 'AMOY_POLYGON_TEST':
        rpcEndpoint = 'https://polygon-amoy-bor-rpc.publicnode.com';
        break;
      case 'MATIC_POLYGON':
        rpcEndpoint = 'https://polygon-bor-rpc.publicnode.com';
        break;
      default:
        throw new Error('Unsupported asset');
    }
    super(input, rpcEndpoint);
  }
}
