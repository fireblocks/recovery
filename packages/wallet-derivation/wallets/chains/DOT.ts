import { encodeAddress } from '@polkadot/util-crypto';
import { PolkadotSS58Format } from '@substrate/txwrapper-polkadot';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Polkadot extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 354);
  }

  protected getAddress(): string {
    return encodeAddress(
      Buffer.from(this.publicKey.replace('0x', ''), 'hex'),
      this.isTestnet ? PolkadotSS58Format.westend : PolkadotSS58Format.polkadot,
    );
  }

  protected readonly KEY_METADATA_RPC = 'm';
  protected readonly KEY_GENESIS_HASH = 'g';
  protected readonly KEY_BLOCK_HASH = 'h';
  protected readonly KEY_BLOCK_NUM = 'n';
  protected readonly KEY_SPEC_VERSION = 'v';
  protected readonly KEY_SPEC_NAME = 's';
  protected readonly KEY_TX_VER = 't';
}
