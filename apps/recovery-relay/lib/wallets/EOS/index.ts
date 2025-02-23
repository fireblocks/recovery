import { Api, JsonRpc } from 'eosjs';
import { TransactResult } from 'eosjs/dist/eosjs-api-interfaces';
import { EOS as BaseEOS, Input } from '@fireblocks/wallet-derivation';
import { TransactionBuilder } from 'eosjs/dist/eosjs-api';
import { PushTransactionArgs } from 'eosjs/dist/eosjs-rpc-interfaces';
import superjson from 'superjson';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';
import { EmptySigProvider } from './EmptySigProvider';

export class EOS extends BaseEOS implements ConnectedWallet {
  private api: Api | undefined;

  private accounts: string[] | undefined;

  public rpcURL: string | undefined;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    const rpc = new JsonRpc(url, { fetch });
    const signatureProvider = new EmptySigProvider();
    this.api = new Api({
      rpc,
      signatureProvider,
    });
  }

  private async _getAccounts(): Promise<void> {
    const { accounts } = await this.api!.rpc.get_accounts_by_authorizers([], [this.address]);
    accounts.forEach((account) => {
      if (account.permission_name === 'owner') {
        if (!this.accounts) {
          this.accounts = [] as string[];
        }
        this.accounts!.push(account.account_name);
      }
    });
  }

  public async getBalance(): Promise<number> {
    if (!this.accounts) {
      await this._getAccounts();
    }
    // We should theoretically have only a single account that we're the owner of, but this should be adjusted if there exists a scenario where we are not owners of a single account.
    const accountName = this.accounts![0];
    const account = await this.api!.rpc.get_account(accountName);

    return parseFloat(account.core_liquid_balance!.replace(' EOS', ''));
  }

  public async prepare(to?: string, memo?: string): Promise<AccountData> {
    const balance = await this.getBalance();
    const extraParams = new Map<string, any>();
    if (!this.accounts) {
      await this._getAccounts();
    }
    if (balance < 0.001) {
      return {
        balance,
        insufficientBalance: true,
      };
    }
    await this.api!.getAbi('eosio.token');
    const txBuilder = this.api!.buildTransaction() as TransactionBuilder;
    const actionBuilder = txBuilder.with('eosio.token').as([{ actor: this.accounts![0], permission: 'owner' }]);
    const action = await actionBuilder.transfer(this.accounts![0], to!, `${balance} EOS`, memo ?? '');
    const tx: PushTransactionArgs = (await this.api!.transact(
      {
        actions: [action],
      },
      {
        broadcast: false,
        sign: false,
        blocksBehind: 10,
        expireSeconds: 600,
        requiredKeys: [this.address],
      },
    )) as PushTransactionArgs;
    const chainId = (await this.api!.rpc.get_info()).chain_id;
    const serTx = superjson.stringify(tx);
    extraParams.set(this.KEY_TX, serTx);
    extraParams.set(this.KEY_CHAIN_ID, chainId);
    // TODO: add memo
    const preparedData = {
      balance,
      extraParams,
    };

    this.relayLogger.logPreparedData('EOS', preparedData);
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    try {
      const tx = superjson.parse<PushTransactionArgs>(txHex);
      const txRes = (await this.api!.pushSignedTransaction(tx)) as TransactResult;
      this.relayLogger.debug(`EOS: Tx broadcasted: ${JSON.stringify(txRes, null, 2)}`);
      return txRes.transaction_id;
    } catch (e) {
      this.relayLogger.error(`EOS: Error broadcasting tx: ${(e as Error).message}`);
      throw e;
    }
  }
}
