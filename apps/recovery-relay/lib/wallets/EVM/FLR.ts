import { ConnectedWallet } from '../ConnectedWallet';
import { JsonRpcProvider, formatEther } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import BigNumber from 'bignumber.js';

export class Flare extends EVMBase implements ConnectedWallet {
  protected provider: JsonRpcProvider | undefined;

  protected weiBalance: bigint | string | undefined = BigInt(0);

  public rpcURL: string | undefined;
  public chainId = 554; // for derivation
  public evmChainId = 14; // for EVM tx

  constructor(input: Input) {
    super(input, 554);

    this.relayLogger.info('Creating FLR wallet:', { chainId: this.chainId, input });
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.relayLogger.info('setting FLR provider', { rpcURL: this.rpcURL, chainId: this.chainId });
    this.provider = new JsonRpcProvider(this.rpcURL, this.evmChainId, { cacheTimeout: -1 });
  }

  public async getBalance() {
    try {
      this.relayLogger.info('Getting FLR balance for address:', { address: this.address, provider: this.provider });
      this.weiBalance = await this.provider!.getBalance(this.address);
      const balance = formatEther(this.weiBalance);
      const flrBalance = Number(balance);

      this.relayLogger.info('FLR balance info', { flrBalance });

      return flrBalance;
    } catch (error) {
      this.relayLogger.error('Error getting FLR balance:', error);
      throw new Error(`Error getting FLR balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async prepare(): Promise<AccountData> {
    const displayBalance = await this.getBalance();

    if (displayBalance === 0) {
      return {
        balance: 0,
        insufficientBalance: true,
      };
    }

    const nonce = await this.provider!.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider!.getFeeData();

    if (!gasPrice) {
      throw new Error('No gas price found');
    }

    const gas = gasPrice * 21000n;
    //@ts-ignore
    const balance = new BigNumber(this.weiBalance.toString());

    const adjustedBalance = balance.minus(new BigNumber(gas.toString()));

    if (adjustedBalance.lt(new BigNumber(0))) {
      this.relayLogger.error('Insufficient balance');
    }

    const extraParams = new Map();
    extraParams.set(this.KEY_EVM_WEI_BALANCE, adjustedBalance.toString(16));

    const preparedData = {
      balance: displayBalance,
      nonce,
      gasPrice,
      chainId: parseInt(this.evmChainId.toString()),
      extraParams,
    };

    this.relayLogger.logPreparedData('FLR', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      const txRes = await this.provider!.broadcastTransaction(tx);
      this.relayLogger.debug(`FLR: Tx broadcasted: ${JSON.stringify(txRes, null, 2)}`);
      return txRes.hash;
    } catch (e) {
      this.relayLogger.error('FLR: Error broadcasting tx:', e);
      if ((e as Error).message.includes('insufficient funds for intrinsic transaction cost')) {
        throw new Error(
          'Insufficient funds for transfer, this might be due to a spike in network fees, please wait and try again',
        );
      }
      throw e;
    }
  }
}
