import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';

export class Velas extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 'https://api.testnet.velas.com' : 'https://api.velas.com');
  }
}
