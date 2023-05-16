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

  protected readonly KEY_FEE = 'f';

  protected readonly KEY_ACCOUNT_NUMBER = 'a';

  protected readonly KEY_SEQUENCE = 's';

  protected readonly KEY_CHAIN_ID = 'c';
}

export type CosmosFee = { gas: string; amount: { amount: string; denom: string }[] };
