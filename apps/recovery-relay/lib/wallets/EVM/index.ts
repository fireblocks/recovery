import { JsonRpcProvider, formatEther, Transaction } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData, RawSignature } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class EVM extends EVMBase implements ConnectedWallet {
  protected readonly provider: JsonRpcProvider;

  constructor(input: Input, rpcEndpoint: string, chainId?: number) {
    super(input);
    this.provider = new JsonRpcProvider(rpcEndpoint, chainId);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);
    const balance = formatEther(wei);
    const ethBalance = Number(balance);
    return ethBalance;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();

    const nonce = await this.provider.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();

    return {
      balance,
      nonce,
      gasPrice,
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
