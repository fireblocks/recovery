import { Luna as BaseLuna, Input } from '@fireblocks/wallet-derivation';
import { LCDClient, MsgSend, PublicKey, Tx, TxError, TxBroadcastResult } from '@terra-money/terra.js';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import SuperJSON from 'superjson';

export class Luna extends BaseLuna implements ConnectedWallet {
  private lcdClient: LCDClient | undefined;

  public rpcURL: string | undefined;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;

    this.lcdClient = new LCDClient({
      URL: this.rpcURL,
      chainID: this.isTestnet ? 'pisco-1' : 'phoenix-1',
      isClassic: false,
    });
  }

  public async getBalance(): Promise<number> {
    const balances = await this.lcdClient!.bank.balance(this.address, {
      'pagination.limit': '500',
    });

    const coins = balances[0].toArray();

    if (coins.length === 0) {
      return 0;
    }

    const allLunaCoins = coins.filter((c) => c.denom === 'uluna');
    if (allLunaCoins.length === 0 && coins.length !== 0) {
      return 0;
    }

    return allLunaCoins[0].amount.toNumber() / 1_000_000;
  }

  public async prepare(to?: string, memo?: string): Promise<AccountData> {
    const balance = await this.getBalance();

    if (balance < 0.001) {
      return {
        balance,
        insufficientBalance: true,
      };
    }

    const account = await this.lcdClient!.auth.accountInfo(this.address);
    const sequence = account.getSequenceNumber();

    const sendMsg = new MsgSend(this.address, to!, { uluna: balance * 1000000 });

    const fee = await this.lcdClient!.tx.estimateFee([{ sequenceNumber: sequence, publicKey: account.getPublicKey() }], {
      msgs: [sendMsg],
      memo,
    });

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_SEQUENCE, sequence);
    extraParams.set(this.KEY_FEE_ESTIMATE, fee);
    extraParams.set(this.KEY_CHAIN_ID, this.lcdClient!.config.chainID);
    extraParams.set(this.KEY_ACCOUNT_NUMBER, account.getAccountNumber());

    const preparedData = {
      balance,
      extraParams,
    };
    this.relayLogger.logPreparedData('LUNA', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    let halfBaked: any = SuperJSON.parse(tx);
    halfBaked.body.messages = halfBaked.body.messages.map((x: string) => JSON.parse(x));
    halfBaked.auth_info.fee = JSON.parse(halfBaked.auth_info.fee);
    halfBaked.auth_info.signer_infos = halfBaked.auth_info.signer_infos.map(
      (x: { mode_info: any; public_key: string; sequence: number }) => ({
        ...x,
        public_key: JSON.parse(x.public_key),
      }),
    );
    const signedTx = Tx.fromData(halfBaked);
    const res = await this.lcdClient!.tx.broadcast(signedTx);
    if (res.txhash && res.logs.length > 0) {
      this.relayLogger.debug(`Luna: Tx broadcasted: ${JSON.stringify(res, null, 2)}`);
      return res.txhash;
    }
    this.relayLogger.error(`Luna: Error broadcasting tx: ${JSON.stringify(res, null, 2)}`);
    throw new Error(`${(res as TxBroadcastResult<any, TxError>).raw_log}`);
  }
}
