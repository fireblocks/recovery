import { BaseWallet, EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { JsonRpcProvider, Transaction, formatEther } from 'ethers';
import { AccountData, RawSignature, TxPayload } from '../types';

export class EVM extends EVMBase implements BaseWallet {
  protected readonly provider: JsonRpcProvider;

  constructor(input: Input, rpcEndpoint: string) {
    super(input);
    this.provider = new JsonRpcProvider(rpcEndpoint);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);

    const balance = formatEther(wei);

    const ethBalance = Number(balance);

    this.balance.native = ethBalance;
    this.lastUpdated = new Date();

    return ethBalance;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    return {
      balance,
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    // memo?: string | undefined,
    // utxos?: UTXO[] | undefined,
    // additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const nonce = await this.provider.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();

    const tx = {
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: amount,
      chainId: this.path.coinType === 1 ? 5 : 1,
    };

    const unsignedTx = Transaction.from(tx).serialized;

    return {
      derivationPath: this.pathParts,
      tx: unsignedTx,
    };
  }

  public async broadcastTx(
    tx: string,
    sigs: RawSignature[],
    // customUrl?: string | undefined
  ): Promise<string> {
    const transaction = Transaction.from(tx);

    // eslint-disable-next-line prefer-destructuring
    transaction.signature = sigs[0];

    const signer = await this.provider.getSigner();

    const { hash } = await signer.sendTransaction(transaction);

    return hash;
  }
}
