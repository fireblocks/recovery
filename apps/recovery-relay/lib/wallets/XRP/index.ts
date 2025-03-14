import { Ripple as BaseRipple } from '@fireblocks/wallet-derivation';
import { Client, SubmitResponse, xrpToDrops } from 'xrpl';
import getFeeXrp from 'xrpl/dist/npm/sugar/getFeeXrp';
import BigNumber from 'bignumber.js';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Ripple extends BaseRipple implements ConnectedWallet {
  public rpcURL: string | undefined;

  private xrpClient: Client | undefined;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.xrpClient = new Client(url);
  }

  public async getBalance(): Promise<number> {
    if (!this.xrpClient!.isConnected()) {
      await this.xrpClient!.connect();
    }
    const balances = await this.xrpClient!.getBalances(this.address);
    return balances
      .filter((tokenBalance) => tokenBalance.currency === 'XRP')
      .map((tokenBalance) => parseFloat(tokenBalance.value))[0];
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    // Fee calculation
    const netFeeXRP = await getFeeXrp(this.xrpClient!);
    const netFeeDrops = xrpToDrops(netFeeXRP);
    let baseFee = new BigNumber(netFeeDrops);
    baseFee = BigNumber.sum(baseFee, new BigNumber(netFeeDrops).times(2).toString());
    const maxFeeDrops = xrpToDrops(this.xrpClient!.maxFeeXRP);
    const totalFee = BigNumber.min(baseFee, maxFeeDrops);
    const fee = totalFee.dp(0, BigNumber.ROUND_CEIL).toString(10);

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_LEDGER_SEQUENCE, (await this.xrpClient!.getLedgerIndex()) + 100);
    extraParams.set(this.KEY_FEE, fee);
    extraParams.set(
      this.KEY_SEQUENCE,
      (
        await this.xrpClient!.request({
          command: 'account_info',
          account: this.address,
          ledger_index: 'current',
        })
      ).result.account_data.Sequence,
    );

    const preparedData = {
      balance: parseFloat((balance - this.MIN_XRP_BALANCE).toFixed(6)),
      extraParams,
      insufficientBalance: balance - this.MIN_XRP_BALANCE < 0.0001,
    };

    this.relayLogger.logPreparedData('Ripple', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    if (!this.xrpClient!.isConnected()) {
      await this.xrpClient!.connect();
    }
    try {
      const { result: txResult } = (await this.xrpClient!.submit(tx)) as SubmitResponse;
      this.relayLogger.debug(`Ripple: Tx broadcasted: ${JSON.stringify(txResult, null, 2)}`);
      const { hash } = txResult.tx_json;
      if (!hash) {
        const errorMessage = txResult.accepted
          ? "Unknown error - Transaction didn't return hash"
          : `Transaction not accepted: ${txResult.engine_result_message}`;
        this.relayLogger.error('XRP: Failed to broadcast transaction', errorMessage, txResult);
        throw new Error(errorMessage);
      }
      return hash;
    } catch (e) {
      this.relayLogger.error(`Ripple: Error broadcasting tx: ${(e as Error).message}`);
      throw new Error(`${(e as Error).message}`);
    }
  }
}
