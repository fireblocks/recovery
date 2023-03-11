import { JsonRpcProvider, formatEther, Transaction } from 'ethers';
import { Ethereum as BaseEthereum, Input } from '@fireblocks/wallet-derivation';
import { AccountData, TxPayload, RawSignature } from '../types';
import { BaseWallet } from '../BaseWallet';

export class Ethereum extends BaseEthereum implements BaseWallet {
  private readonly provider: JsonRpcProvider;

  constructor(input: Input) {
    super(input);

    const cluster = input.isTestnet ? 'goerli' : 'mainnet';
    const endpoint = `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    this.provider = new JsonRpcProvider(endpoint);
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
    sig: RawSignature,
    // customUrl?: string | undefined
  ): Promise<string> {
    const transaction = Transaction.from(tx);

    transaction.signature = sig;

    const signer = await this.provider.getSigner();

    const { hash } = await signer.sendTransaction(transaction);

    return hash;
  }
}
