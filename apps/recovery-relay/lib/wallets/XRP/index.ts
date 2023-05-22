import { Ripple as BaseRipple, Input } from '@fireblocks/wallet-derivation';
import { Client, TxResponse, xrpToDrops } from 'xrpl';
import getFeeXrp from 'xrpl/dist/npm/sugar/getFeeXrp';
import SuperJSON from 'superjson';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import BigNumber from 'bignumber.js';

export class Ripple extends BaseRipple implements ConnectedWallet {
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

    // Fee calculation
    const netFeeXRP = await getFeeXrp(this.xrpClient);
    const netFeeDrops = xrpToDrops(netFeeXRP);
    let baseFee = new BigNumber(netFeeDrops);
    baseFee = BigNumber.sum(baseFee, new BigNumber(netFeeDrops).times(2).toString());
    const maxFeeDrops = xrpToDrops(this.xrpClient.maxFeeXRP);
    const totalFee = BigNumber.min(baseFee, maxFeeDrops);
    const fee = totalFee.dp(0, BigNumber.ROUND_CEIL).toString(10);

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_LEDGER_SEQUENCE, (await this.xrpClient.getLedgerIndex()) + 100);
    extraParams.set(this.KEY_FEE, fee);
    extraParams.set(
      this.KEY_SEQUENCE,
      (
        await this.xrpClient.request({
          command: 'account_info',
          account: this.address,
          ledger_index: 'current',
        })
      ).result.account_data.Sequence,
    );

    return {
      balance: balance - this.MIN_XRP_BALANCE,
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
