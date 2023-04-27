import { Ripple as BaseRipple, Input } from '@fireblocks/wallet-derivation';
import { Client, TxResponse } from 'xrpl';
import SuperJSON from 'superjson';
import { BaseWallet } from '../BaseWallet';
import { AccountData } from '../types';

export class Ripple extends BaseRipple implements BaseWallet {
  private xrpClient: Client;

  constructor(input: Input) {
    super(input);
    this.xrpClient = new Client(input.isTestnet ? 'wss://s.altnet.rippletest.net:51233' : 'wss://xrplcluster.com/');
  }

  public async getBalance(): Promise<number> {
    if (!this.xrpClient.isConnected()) {
      await this.xrpClient.connect();
    }
    const balances = await this.xrpClient.getBalances(this.address);
    return balances
      .filter((tokenBalance) => tokenBalance.currency === 'XRP')
      .map((tokenBalance) => parseFloat(tokenBalance.value))[0];
  }

  public async prepare(to?: string, memo?: string): Promise<AccountData> {
    const balance = await this.getBalance();
    const preparedTx = await this.xrpClient.autofill({
      TransactionType: 'Payment',
      Account: `${this.address}`,
      Amount: `${(balance - 10) * 10 ** 6}`,
      Destination: `${to}`,
      Memos: memo
        ? [
            {
              Memo: {
                MemoData: memo,
              },
            },
          ]
        : undefined,
      LastLedgerSequence: (await this.xrpClient.getLedgerIndex()) + 100, // ~5 Minutes
    });

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_TX, SuperJSON.stringify(preparedTx));
    return {
      balance: balance - 10,
      extraParams,
    };
  }

  public async broadcastTx(tx: string): Promise<string> {
    if (!this.xrpClient.isConnected()) {
      await this.xrpClient.connect();
    }
    const txRes = (await this.xrpClient.submitAndWait(tx)) as TxResponse;
    return txRes.result.hash;
  }
}
