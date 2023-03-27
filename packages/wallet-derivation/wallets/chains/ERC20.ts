import { Input } from '../../types';
import { Ethereum } from './ETH';

export class ERC20 extends Ethereum {
  constructor(input: Input, protected tokenAddress: string) {
    super(input);
  }
}
