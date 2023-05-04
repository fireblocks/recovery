import { JsonRpcProvider, formatEther, parseEther, Transaction } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class EVM extends EVMBase implements ConnectedWallet {
  protected readonly provider: JsonRpcProvider;

  constructor(input: Input, rpcEndpoint: string, chainId?: number) {
    super(input);

    console.info('EVM', { rpcEndpoint, chainId, input });

    this.provider = new JsonRpcProvider(rpcEndpoint, chainId);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);
    const balance = formatEther(wei);
    const ethBalance = Number(balance);

    console.info({ ethBalance });

    return ethBalance;
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();

    const nonce = await this.provider.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();

    if (!gasPrice) {
      throw new Error('No gas price found');
    }

    const gas = gasPrice * 22000n;

    const adjustedBalance = parseEther(String(balance)) - gas;

    console.info({ gas: Number(gas), balance, adjustedBalance });

    if (adjustedBalance < 0) {
      console.error('Insufficient balance');
    }

    return {
      balance: formatEther(adjustedBalance),
      nonce,
      gasPrice,
    };
  }

  public async broadcastTx(
    tx: string,
    // sigs: RawSignature[],
    // customUrl?: string | undefined
  ): Promise<string> {
    // const transaction = Transaction.from(tx);

    // eslint-disable-next-line prefer-destructuring
    // transaction.signature = sigs[0];

    // const signer = await this.provider.getSigner();

    // Deserialize the transaction
    const deserialized = Transaction.from(tx);
    console.info(deserialized);

    const { hash } = await this.provider.broadcastTransaction(tx);

    console.info({ hash });

    return hash;
  }
}
