/* eslint-disable prefer-destructuring */
import { Contract, ethers, formatEther, JsonRpcProvider } from 'ethers';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { EVM } from '../EVM';
import { erc20Abi } from './erc20.abi';

export class ERC20 extends EVM implements ConnectedWallet {
  protected provider: JsonRpcProvider | undefined;
  public rpcURL: string | undefined;
  public contract!: Contract;
  public tokenAddress: string | undefined;
  public decimals: number | undefined;
  public toAddress: string | undefined;

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    this.provider = new JsonRpcProvider(this.rpcURL);
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
  }

  public setToAddress(toAddress: string) {
    this.toAddress = toAddress;
  }

  public async getBalance(): Promise<number> {
    const weiBalance = await this.contract.balanceOf(this.address);
    return parseFloat(parseFloat(ethers.formatEther(weiBalance)).toFixed(2));
  }

  public async prepare(): Promise<AccountData> {
    this.init();
    const nonce = await this.provider!.getTransactionCount(this.address, 'latest');
    const chainId = (await this.provider!.getNetwork()).chainId;

    const displayBalance = await this.getBalance();
    const ethBalance = await this.getEthBalance();

    let { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await this.provider!.getFeeData();

    const iface = new ethers.Interface(erc20Abi);
    const data = iface.encodeFunctionData('transfer', [this.toAddress, ethers.parseUnits(displayBalance.toFixed(2), 'ether')]);

    const tx = {
      to: this.tokenAddress,
      from: this.address,
      data: data,
    };
    const gasLimit = await this.provider?.estimateGas(tx);

    const extraParams = new Map();
    extraParams.set('tokenAddress', this.tokenAddress);
    extraParams.set('gasLimit', gasLimit);
    extraParams.set('maxFee', maxFeePerGas);
    extraParams.set('priorityFee', maxPriorityFeePerGas);

    const preparedData: AccountData = {
      balance: displayBalance,
      extraParams,
      gasPrice,
      nonce,
      chainId: Number(chainId),
      insufficientBalance: displayBalance <= 0,
      insufficientBalanceForTokenTransfer: ethBalance <= gasPrice! * gasLimit!,
    };
    this.relayLogger.logPreparedData('ERC20', preparedData);
    return preparedData;
  }

  // public async generateTx(to: string, amount: number): Promise<TxPayload> {
  //   const nonce = await this.provider!.getTransactionCount(this.address, 'latest');

  //   // Should we use maxGasPrice? i.e. EIP1559.
  //   const { gasPrice } = await this.provider!.getFeeData();

  //   const tx = {
  //     from: this.address,
  //     to,
  //     nonce,
  //     gasLimit: 21000,
  //     gasPrice,
  //     value: 0,
  //     chainId: this.path.coinType === 1 ? 5 : 1,
  //     data: new Interface(transferAbi).encodeFunctionData('transfer', [
  //       to,
  //       BigInt(amount) * BigInt(await this.contract.decimals()),
  //     ]),
  //   };

  //   this.relayLogger.debug(`ERC20: Generated tx: ${JSON.stringify(tx, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}`);

  //   const unsignedTx = Transaction.from(tx).serialized;

  //   const preparedData = {
  //     derivationPath: this.pathParts,
  //     tx: unsignedTx,
  //   };

  //   this.relayLogger.debug(`ERC20: Prepared data: ${JSON.stringify(preparedData, null, 2)}`);
  //   return preparedData;
  // }

  public async broadcastTx(txHex: string): Promise<string> {
    return super.broadcastTx(txHex);
  }

  private async getEthBalance() {
    const weiBalance = await this.provider?.getBalance(this.address);
    const balance = formatEther(weiBalance!);
    const ethBalance = Number(balance);

    console.info('Eth balance info', { ethBalance });

    return ethBalance;
  }
}
