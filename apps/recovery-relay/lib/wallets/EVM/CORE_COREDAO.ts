import { Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';
import { AccountData } from '../types';

export class CoreDAO extends EVM implements ConnectedWallet {
  constructor(input: Input) {
    super(input, input.isTestnet ? 'https://rpc.test.btcs.network	' : 'https://rpc.coredao.org', input.isTestnet ? 1115 : 1116);
  }

  public override async prepare(): Promise<AccountData> {
    const res = await super.prepare();
    if (!res.extraParams) {
      const extraParams = new Map();
      extraParams.set(this.KEY_EVM_FORCE_LEGACY_TX, true);
      res.extraParams = extraParams;
    } else {
      res.extraParams.set(this.KEY_EVM_FORCE_LEGACY_TX, true);
    }
    return res;
  }
}
