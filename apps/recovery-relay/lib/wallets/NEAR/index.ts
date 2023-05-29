import { Near as BaseNEAR } from '@fireblocks/wallet-derivation';
import { connect, Near as NearApi } from 'near-api-js';
import { Signature, SignedTransaction, Transaction } from 'near-api-js/lib/transaction';
import { AccountData, RawSignature } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import BigNumber from 'bignumber.js';

export class Near extends BaseNEAR implements ConnectedWallet {
  private near: NearApi | undefined;

  public async getBalance(): Promise<number> {
    await this._getApi();
    const near = this.near!;
    const acc = await near.account(this.address);
    const balance = await acc.getAccountBalance();
    return parseFloat(balance.available) / 10 ** 24;
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
    return {
      balance,
      extraParams,
    };
  }

  public async broadcastTx(txHex: string): Promise<string> {
    await this._getApi();
    const near = this.near!;
    const signedTx = SignedTransaction.decode(Buffer.from(txHex, 'hex'));
    const txRes = await near.connection.provider.sendTransaction(signedTx);
    return txRes.transaction_outcome.id;
  }

  private async _getApi(): Promise<void> {
    if (this.near) {
      return;
    }
    const mainnetConfig = {
      networkId: 'mainnet',
      nodeUrl: 'https://rpc.mainnet.near.org',
      walletUrl: 'https://wallet.mainnet.near.org',
      helperUrl: 'https://helper.mainnet.near.org',
      explorerUrl: 'https://explorer.mainnet.near.org',
      headers: {},
    };
    const testnetConfig = {
      networkId: 'testnet',
      nodeUrl: 'https://rpc.testnet.near.org',
      walletUrl: 'https://wallet.testnet.near.org',
      helperUrl: 'https://helper.testnet.near.org',
      explorerUrl: 'https://explorer.testnet.near.org',
      headers: {},
    };
    this.near = await connect(this.isTestnet ? testnetConfig : mainnetConfig);
  }
}
