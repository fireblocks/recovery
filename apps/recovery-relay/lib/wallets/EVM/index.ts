import { JsonRpcProvider, formatEther, parseEther } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import BigNumber from 'bignumber.js';

export class EVM extends EVMBase implements ConnectedWallet {
  protected readonly provider: JsonRpcProvider;

  protected weiBalance: bigint = BigInt(0);

  constructor(input: Input, rpcEndpoint: string, chainId?: number) {
    super(input);

    this.relayLogger.info('Creating EVM wallet:', { rpcEndpoint, chainId, input });

    this.provider = new JsonRpcProvider(rpcEndpoint, chainId, { cacheTimeout: -1 });
  }

  public async getBalance() {
    this.weiBalance = await this.provider.getBalance(this.address);
    const balance = formatEther(this.weiBalance);
    const ethBalance = Number(balance);

    console.info('Eth balance info', { ethBalance });

    return ethBalance;
  }

  public async prepare(): Promise<AccountData> {
    const displayBalance = await this.getBalance();

    if (displayBalance === 0) {
      return {
        balance: 0,
        insufficientBalance: true,
      };
    }

    const nonce = await this.provider.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();

    if (!gasPrice) {
      throw new Error('No gas price found');
    }

    const gas = gasPrice * 21000n;
    const balance = new BigNumber(this.weiBalance.toString());

    const adjustedBalance = balance.minus(new BigNumber(gas.toString()));

    if (adjustedBalance.lt(new BigNumber(0))) {
      this.relayLogger.error('Insufficient balance');
    }

    const chainId = (await this.provider.getNetwork()).chainId;

    const extraParams = new Map();
    extraParams.set(this.KEY_EVM_WEI_BALANCE, adjustedBalance.toString(16));

    const preparedData = {
      balance: displayBalance,
      nonce,
      gasPrice,
      chainId: parseInt(chainId.toString()),
      extraParams,
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
      this.relayLogger.error('EVM: Error broadcasting tx:', e);
      if ((e as Error).message.includes('insufficient funds for intrinsic transaction cost')) {
        throw new Error(
          'Insufficient funds for transfer, this might be due to a spike in network fees, please wait and try again',
        );
      }
      throw e;
    }
  }
}
