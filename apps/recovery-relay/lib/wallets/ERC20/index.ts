import { Contract, ethers, JsonRpcProvider, parseUnits } from 'ethers';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { Input, EVMWallet as EVMBase } from '@fireblocks/wallet-derivation';
import { erc20Abi } from './erc20.abi';
import { WalletClasses } from '..';
import { EVM } from '../EVM';

export class ERC20 extends EVMBase implements ConnectedWallet {
  protected provider: JsonRpcProvider | undefined;
  protected backendWallet: EVM | undefined;
  public rpcURL: string | undefined;
  public contract: Contract | undefined;
  public tokenAddress: string | undefined;
  public decimals: number | undefined;
  public toAddress: string | undefined;
  private normalizingFactor: string | bigint | undefined;

  constructor(private input: Input) {
    super(input);
  }

  public setRPCUrl(url: string) {
    this.backendWallet?.setRPCUrl(url);
    //@ts-ignore
    this.provider = this.backendWallet?.provider;
  }

  public setTokenAddress(address: string) {
    this.tokenAddress = address;
  }

  public setNativeAsset(nativeAsset: String) {
    this.backendWallet = new WalletClasses[nativeAsset as keyof typeof WalletClasses]({ ...this.input, assetId: nativeAsset });
  }

  public init() {
    if (!this.tokenAddress) {
      this.relayLogger.error(`ERC20 Token address unavailable: ${this.assetId}`);
      throw new Error(`ERC20 Token address unavailable: ${this.assetId}`);
    }

    this.contract = new ethers.Contract(this.tokenAddress, erc20Abi, this.provider);

    if (!this.contract) {
      this.relayLogger.error(`ERC20 Token contract is undefined`);
      throw new Error(`ERC20 Token contract is undefined`);
    }
  }

  public setDecimals(decimals: number) {
    this.decimals = decimals;
    if (!this.decimals) {
      this.relayLogger.error(`ERC20 Token decimals are unavailable: ${this.assetId}`);
      throw new Error(`ERC20 Token decimals are unavailable: ${this.assetId}`);
    }

    this.normalizingFactor = (10 ** decimals).toString();
  }

  public setToAddress(toAddress: string) {
    this.toAddress = toAddress;
  }

  public async getBalance(): Promise<number> {
    const weiBalance: bigint = await this.contract?.balanceOf(this.address);
    return Number(weiBalance / BigInt(this.normalizingFactor!));
  }

  public async prepare(): Promise<AccountData> {
    this.init();
    const nonce = await this.provider?.getTransactionCount(this.address, 'latest');

    const displayBalance = await this.getBalance();
    const ethBalance = await this.backendWallet?.getBalance();
    if (!ethBalance) {
      this.relayLogger.error(`Fee asset balance not available`);
      throw new Error(`Fee asset balance not available`);
    }
    const ethBalanceInWei = parseUnits(ethBalance.toString(), 'ether');

    const { gasPrice, maxFeePerGas, maxPriorityFeePerGas } = await this.provider!.getFeeData();

    const abiInterface = new ethers.Interface(erc20Abi);
    const data = abiInterface.encodeFunctionData('transfer', [
      this.toAddress,
      BigInt(displayBalance) * BigInt(this.normalizingFactor!),
    ]);

    const tx = {
      to: this.tokenAddress,
      from: this.address,
      data: data,
    };
    const gasLimit = await this.provider?.estimateGas(tx);

    const extraParams = new Map<string, any>();
    extraParams.set('tokenAddress', this.tokenAddress);
    extraParams.set('gasLimit', gasLimit?.toString());
    extraParams.set('gasPrice', gasPrice?.toString());
    extraParams.set('maxFee', maxFeePerGas?.toString());
    extraParams.set('priorityFee', maxPriorityFeePerGas?.toString());
    extraParams.set('weiBalance', (BigInt(displayBalance) * BigInt(this.normalizingFactor!)).toString());

    const preparedData: AccountData = {
      balance: displayBalance,
      extraParams,
      nonce,
      //@ts-ignore
      chainId: this.backendWallet?.chainId,
      insufficientBalance: displayBalance <= 0,
      insufficientBalanceForTokenTransfer: Number(ethBalanceInWei!) <= Number(gasPrice! * gasLimit!),
    };
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      //@ts-ignore
      return await this.backendWallet.broadcastTx(tx);
    } catch (e) {
      this.relayLogger.error('ERC20: Error broadcasting tx:', e);
      throw new Error(`ERC20: Error broadcasting tx: ${e}`);
    }
  }
}
