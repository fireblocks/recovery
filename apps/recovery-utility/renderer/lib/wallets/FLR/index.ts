import { Input } from '@fireblocks/wallet-derivation';
import { EVM } from '../EVM';

export class FLR extends EVM {
  constructor(input: Input) {
    super(input, 554);
  }
}
