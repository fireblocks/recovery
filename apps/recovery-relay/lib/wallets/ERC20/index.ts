/* eslint-disable prefer-destructuring */
import { Contract, ethers, JsonRpcProvider } from 'ethers';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVMWallet as EVMBase } from '@fireblocks/wallet-derivation';
import { erc20Abi } from './erc20.abi';
import { getChainId } from './chains';

export class ERC20 extends EVMBase implements ConnectedWallet {
  protected provider: JsonRpcProvider | undefined;
  public rpcURL: string | undefined;
  public contract!: Contract;
  public tokenAddress: string | undefined;
  public decimals: number | undefined;
  public toAddress: string | undefined;
  private normalizingFactor: bigint | undefined;
  private chainId: number | undefined;

  public getNativeAsset(nativeAsset: string) {
    this.chainId = getChainId(nativeAsset);
    if (!this.chainId) {
      throw new Error('Unrecognaized native asset for ERC20 token withdrawal');
    }
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.provider = new JsonRpcProvider(this.rpcURL, this.chainId, { cacheTimeout: -1 });
  }

  public setTokenAddress(address: string) {
    this.tokenAddress = address;
  }

  public init() {
    if (!this.tokenAddress) {
      this.relayLogger.error(`ERC20 Token address unavailable: ${this.assetId}`);
      throw new Error(`ERC20 Token address unavailable: ${this.assetId}`);
    }
    this.contract = new ethers.Contract(this.tokenAddress, erc20Abi, this.provider);
  }

  public setDecimals(decimals: number) {
    this.decimals = decimals;
    this.normalizingFactor = BigInt(10 ** decimals);
  }

  public setToAddress(toAddress: string) {
    this.toAddress = toAddress;
  }

  public async getBalance(): Promise<number> {
    const weiBalance: bigint = await this.contract.balanceOf(this.address);
    return Number(weiBalance / this.normalizingFactor!);
  }

  public async prepare(): Promise<AccountData> {
    this.init();
    const nonce = await this.provider!.getTransactionCount(this.address, 'latest');

    const displayBalance = await this.getBalance();
    const ethBalance = await this.getEthBalance();

    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await this.provider!.getFeeData();

    const iface = new ethers.Interface(erc20Abi);
    const data = iface.encodeFunctionData('transfer', [this.toAddress, BigInt(displayBalance) * this.normalizingFactor!]);

    const tx = {
      to: this.tokenAddress,
      from: this.address,
      data: data,
    };
    const gasLimit = await this.provider?.estimateGas(tx);

    const extraParams = new Map<string, any>();
    extraParams.set('tokenAddress', this.tokenAddress);
    extraParams.set('gasLimit', gasLimit?.toString());
    extraParams.set('maxFee', maxFeePerGas?.toString());
    extraParams.set('priorityFee', maxPriorityFeePerGas?.toString());
    extraParams.set('weiBalance', (BigInt(displayBalance) * this.normalizingFactor!).toString());

    const preparedData: AccountData = {
      balance: displayBalance,
      extraParams,
      gasPrice,
      nonce,
      chainId: this.chainId,
      insufficientBalance: displayBalance <= 0,
      insufficientBalanceForTokenTransfer: Number(ethBalance!) <= Number(gasPrice! * gasLimit!),
    };
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    try {
      const txRes = await this.provider!.broadcastTransaction(txHex);
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

  private async getEthBalance() {
    const weiBalanceBN = await this.provider?.getBalance(this.address);
    console.info('Eth balance info', { weiBalanceBN });
    return weiBalanceBN;
  }
}
