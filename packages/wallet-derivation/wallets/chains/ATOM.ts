import { pubkeyToAddress } from '@cosmjs/amino';
import { ECDSAWallet } from '../ECDSAWallet';
import { Input } from '../../types';

export class Cosmos extends ECDSAWallet {
  constructor(input: Input) {
    super(input, 118);
  }

  protected getAddress(): string {
    return pubkeyToAddress(
      {
        value: Buffer.from(this.publicKey.replace('0x', ''), 'hex').toString('base64'),
        type: 'tendermint/PubKeySecp256k1',
      },
      'cosmos',
    );
  }
}
