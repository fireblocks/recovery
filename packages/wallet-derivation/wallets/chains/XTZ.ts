import bs58check from 'bs58check';
import blake2b from 'blake2b';
import { b58cencode, prefix } from '@taquito/utils';
import { EdDSAWallet } from '../EdDSAWallet';
import { Input } from '../../types';

export class Tezos extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 1729);
  }

  protected getAddress(): string {
    return b58cencode(
      Buffer.from(
        blake2b(20)
          .update(Buffer.from(this.publicKey.replace('0x', ''), 'hex'))
          .digest(),
      ),
      prefix.tz1,
    );
  }

  protected readonly KEY_REVEAL = 'r';
  protected readonly KEY_ESTIMATE = 'e';
  protected readonly KEY_BLOCK_HASH = 'b';
  protected readonly KEY_PROTOCOL_HASH = 'p';
  protected readonly KEY_ACCOUNT_LIMIT = 'a';
  protected readonly KEY_HEAD_COUNTER = 'h';
}
