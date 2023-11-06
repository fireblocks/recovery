import { JsonRpcProvider, formatEther, parseEther } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class EVM extends EVMBase implements ConnectedWallet {
  protected readonly provider: JsonRpcProvider;

  constructor(input: Input, rpcEndpoint: string, chainId?: number) {
    super(input);

    this.relayLogger.info('Creating EVM wallet:', { rpcEndpoint, chainId, input });

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

    const gas = gasPrice * 21000n;

    const adjustedBalance = parseEther(String(balance)) - gas;

    this.relayLogger.info({ gas: gas.toString(), balance, adjustedBalance });

    if (adjustedBalance < 0) {
      this.relayLogger.error('Insufficient balance');
    }

    const preparedData = {
      balance: Number(formatEther(adjustedBalance)),
      nonce,
      gasPrice,
    };

    this.relayLogger.logPreparedData('EVM', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      const txRes = await this.provider.broadcastTransaction(tx);
      this.relayLogger.debug(`EVM: Tx broadcasted: ${JSON.stringify(txRes, null, 2)}`);
      return txRes.hash;
    } catch (e) {
      this.relayLogger.error(`EVM: Error broadcasting tx: ${(e as Error).message}`);
      throw e;
    }
  }
}
