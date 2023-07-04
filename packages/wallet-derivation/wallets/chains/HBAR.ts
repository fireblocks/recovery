import { EdDSAWallet } from '../EdDSAWallet';

export class Hedera extends EdDSAWallet {
  protected getAddress(evmAddress?: string | undefined): string {
    return 'Unknown';
  }

  protected readonly KEY_ACCOUNT_ID = 'a';
  protected readonly KEY_NODE_ACCOUNT_IDS = 'n';
}
