import { Hedera as BaseHBAR } from '@fireblocks/wallet-derivation';
import { Wallet, Client, PrivateKey, TransferTransaction, AccountBalanceQuery, AccountId } from '@hashgraph/sdk';
import { LateInitConnectedWallet } from '../LateInitConnectedWallet';
import { AccountData } from '../types';

export class Hedera extends BaseHBAR implements LateInitConnectedWallet {
  private wallet: Wallet | undefined;
  private client: Client | undefined;

  public updateDataEndpoint(endpoint: string): void {
    this.address = endpoint;
  }
  public getLateInitLabel(): string {
    return 'The address of your Hedera Hashgraph wallet';
  }

  public isLateInit(): boolean {
    return true;
  }

  public async getBalance(): Promise<number> {
    this.getWallet();
    if (this.address === 'Unknown') {
      throw new Error('Unknown address');
    }

    const balance = await new AccountBalanceQuery().setAccountId(this.address).execute(this.client!);
    return balance.hbars.toBigNumber().toNumber();
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();

    const network = this.client!.network;
    const nodeIdsKeys = Object.keys(network);
    const nodeIds = nodeIdsKeys.map((nodeIdKey) => {
      if (network[nodeIdKey] instanceof String) {
        return network[nodeIdKey];
      } else {
        return (network[nodeIdKey] as AccountId).toString();
      }
    });

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_ACCOUNT_ID, this.address);
    extraParams.set(this.KEY_NODE_ACCOUNT_IDS, nodeIds);

    return {
      balance,
      extraParams,
    };
  }
  public async broadcastTx(tx: string): Promise<string> {
    const transfer = TransferTransaction.fromBytes(Buffer.from(tx, 'hex'));
    this.address = transfer.nodeAccountIds![0].toString();
    this.getWallet();
    try {
      const txResp = await transfer.execute(this.client!);
      // const receipt = await txResp.getReceipt(this.client!);
      return txResp.transactionId.toString();
    } catch (e: any) {
      throw new Error(e.message);
    }
  }

  private getWallet() {
    this.client = this.isTestnet ? Client.forTestnet() : Client.forMainnet();
    this.client.setOperator(this.address, PrivateKey.generate());
  }
}
