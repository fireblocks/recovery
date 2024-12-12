import { Input } from '../../types';
import { Ton } from './TON';

export class Jetton extends Ton {
  constructor(input: Input, protected tokenAddress: string) {
    super(input);
  }
}
