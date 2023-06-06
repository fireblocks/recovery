import { Stellar as BaseXLM, Input } from '@fireblocks/wallet-derivation';
import { AccountResponse, Networks, Server, Transaction, xdr } from 'stellar-sdk';
import { ConnectedWallet } from '../ConnectedWallet';
import { AccountData } from '../types';

export class Stellar extends BaseXLM implements ConnectedWallet {
  private xlmServer: Server;

  private account: AccountResponse | undefined;

  constructor(input: Input) {
    super(input);
    this.xlmServer = new Server(input.isTestnet ? 'https://horizon-testnet.stellar.org/' : 'https://horizon.stellar.org/');
  }

  public async getBalance(): Promise<number> {
    await this._loadAccount();
    const { balances } = this.account!;
    const nativeBalances = balances.filter((balance) => balance.asset_type === 'native');
    if (nativeBalances.length === 0) {
      return 0;
    }
    return parseFloat(nativeBalances[0].balance);
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    const sequence = this.account!.sequenceNumber();

    const extraParams = new Map<string, any>();
    extraParams.set(this.KEY_SEQUENCE, sequence);
    extraParams.set(this.KEY_ACCOUNT_ID, this.account!.accountId());

    return {
      balance,
      feeRate: await this.xlmServer.fetchBaseFee(),
      extraParams,
      insufficientBalance: balance < 0.00001,
    };
  }

  public async broadcastTx(txXDR: string): Promise<string> {
    const tx = new Transaction(
      xdr.TransactionEnvelope.fromXDR(Buffer.from(txXDR, 'hex')),
      this.isTestnet ? Networks.TESTNET : Networks.PUBLIC,
    );
    try {
      const txResponse = await this.xlmServer.submitTransaction(tx);
      return txResponse.hash;
    } catch (e: any) {
      const resCodes: { transaction: string; operations?: string[] } = e.response.data.extras.result_codes;
      if (!resCodes.operations) {
        throw Error(`Node returned error: ${resCodes.transaction}`);
      } else {
        throw Error(
          `Transaction failed with error code: ${resCodes.transaction} and operation errors: ${resCodes.operations.join(',')}`,
        );
      }
    }
  }

  private async _loadAccount(): Promise<void> {
    if (this.account !== undefined) return;
    this.account = await this.xlmServer.loadAccount(this.address);
  }
}
