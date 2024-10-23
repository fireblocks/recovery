import { Near as BaseNEAR } from '@fireblocks/wallet-derivation';
import { connect, Near as NearApi } from 'near-api-js';
import { SignedTransaction } from 'near-api-js/lib/transaction';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Near extends BaseNEAR implements ConnectedWallet {
  public rpcURL: string | undefined;

  private near: NearApi | undefined;

  public async getBalance(): Promise<number> {
    await this._getApi();
    const near = this.near!;
    const acc = await near.account(this.address);
    const balance = await acc.getAccountBalance();
    return parseFloat(balance.available) / 10 ** 24;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    const near = this.near!;
    const account = await near.account(this.address);
    const { nonce } = (await account.getAccessKeys())[0].access_key;
    const { hash } = (await near.connection.provider.block({ finality: 'final' })).header;

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_NONCE, nonce);
    extraParams.set(this.KEY_HASH, hash);
    const preparedData = {
      balance,
      extraParams,
      insufficientBalance: balance < 1e-10,
    };

    this.relayLogger.logPreparedData('NEAR', preparedData);
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    try {
      await this._getApi();
      const near = this.near!;
      const signedTx = SignedTransaction.decode(Buffer.from(txHex, 'hex'));
      const txRes = await near.connection.provider.sendTransaction(signedTx);
      this.relayLogger.debug(`NEAR: Tx broadcasted: ${txRes.transaction_outcome.id}`);
      return txRes.transaction_outcome.id;
    } catch (e) {
      this.relayLogger.error(`NEAR: Error broadcasting tx: ${e}`);
      throw e;
    }
  }

  private async _getApi(): Promise<void> {
    if (this.near) {
      return;
    }
    const mainnetConfig = {
      networkId: 'mainnet',
      nodeUrl: this.rpcURL!,
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
      headers: {},
    };
    const testnetConfig = {
      networkId: 'testnet',
      nodeUrl: this.rpcURL!,
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      headers: {},
    };
    this.near = await connect(this.isTestnet ? testnetConfig : mainnetConfig);
  }
}
