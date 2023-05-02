import { encodeAddress } from '@polkadot/util-crypto';
import { PolkadotSS58Format } from '@substrate/txwrapper-polkadot';
import { Input } from '../../types';
import { EdDSAWallet } from '../EdDSAWallet';

export class Kusama extends EdDSAWallet {
  constructor(input: Input) {
    super(input, 434);
    if (this.isTestnet) {
      throw new Error('Do not use Testnet with Kusama, please use Westend instead');
    }
  }

  protected getAddress(): string {
    return encodeAddress(Buffer.from(this.publicKey.replace('0x', ''), 'hex'), PolkadotSS58Format.kusama);
  }

  protected readonly KEY_METADATA_RPC = 'm';
  protected readonly KEY_GENESIS_HASH = 'g';
  protected readonly KEY_BLOCK_HASH = 'h';
  protected readonly KEY_BLOCK_NUM = 'n';
  protected readonly KEY_SPEC_VERSION = 'v';
  protected readonly KEY_SPEC_NAME = 's';
  protected readonly KEY_TX_VER = 't';
}
