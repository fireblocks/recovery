import { Input } from '../../types';
import { EVMWallet } from './EVM';

export class ERC20 extends EVMWallet {
  constructor(input: Input, protected tokenAddress: string) {
    super(input);
  }
}
