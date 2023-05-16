import { Input, ETC as BaseETC } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '.';
import { AccountData, TxPayload, RawSignature } from '../types';

export class EthereumClassic extends BaseETC implements ConnectedWallet {
  private evmWallet: EVM;

  constructor(input: Input) {
    super(input);
    this.evmWallet = new EVM(
      input,
      input.isTestnet ? 'https://geth-mordor.etc-network.info' : 'https://geth-de.etc-network.info',
      input.isTestnet ? 63 : 61,
    );
  }

  public async getBalance(): Promise<number> {
    return this.evmWallet.getBalance();
  }

  public async prepare(): Promise<AccountData> {
    return this.evmWallet.prepare();
  }

  public async generateTx(
    to: string,
    amount: number,
    // memo?: string | undefined,
    // utxos?: UTXO[] | undefined,
    // additionalParameters?: Map<string, object> | undefined,
  ): Promise<TxPayload> {
    return this.evmWallet.generateTx(to, amount);
  }

  public broadcastTx(txHex: string, sigs: RawSignature[]): Promise<string> {
    return this.evmWallet.broadcastTx(txHex, sigs);
  }
}
