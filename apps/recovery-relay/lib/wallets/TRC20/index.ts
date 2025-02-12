import { Tron as BaseTron, Input } from '@fireblocks/wallet-derivation';
import { ConnectedWallet } from '../ConnectedWallet';
import { abi } from './trc20.abi';
import { AccountData } from '../types';
import { WalletClasses } from '..';
import { Tron } from '../TRON';
import zlib from 'node:zlib';
import { promisify } from 'util';

export class TRC20 extends BaseTron implements ConnectedWallet {
  constructor(private input: Input) {
    super(input);
  }

  protected backendWallet: Tron | undefined;

  public rpcURL: string | undefined;

  private decimals: number | undefined;

  private tokenAddress: string | undefined;

  private toAddress: string | undefined;

  private tronWeb: any | undefined;

  public setDecimals(decimals: number): void {
    this.decimals = decimals;
  }

  public setTokenAddress(tokenAddress: string): void {
    this.tokenAddress = tokenAddress;
  }

  public setToAddress(toAddress: string) {
    this.toAddress = toAddress;
  }

  public setRPCUrl(url: string): void {
    this.rpcURL = url;
    const TronWeb = require('tronweb');
    const { HttpProvider } = TronWeb.providers;
    const endpointUrl = this.rpcURL;
    const fullNode = new HttpProvider(endpointUrl);
    const solidityNode = new HttpProvider(endpointUrl);
    const eventServer = new HttpProvider(endpointUrl);
    //random prvKey is used for gas estimations
    const randomPrvKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    this.tronWeb = new TronWeb(fullNode, solidityNode, eventServer, randomPrvKey);
  }

  public async getBalance(): Promise<number> {
    const contract = await this.tronWeb.contract(abi, this.tokenAddress);
    return (await contract.balanceOf(this.address).call()).toNumber();
  }

  public async prepare(): Promise<AccountData> {
    if (!this.decimals) {
      this.relayLogger.error('TRC20: Decimals not set');
      throw new Error('TRC20: Decimals not set');
    }
    const balance = ((await this.getBalance()) / 10 ** this.decimals) as number;
    const trxBalance = await this.getTrxBalance();

    const blockData = await this.tronWeb!.fullNode.request('wallet/getblock', { detail: false }, 'post');
    const metadata = {
      ref_block_bytes: blockData.block_header.raw_data.number.toString(16).slice(-4).padStart(4, '0'),
      ref_block_hash: blockData.blockID.slice(16, 32),
      expiration: blockData.block_header.raw_data.timestamp + 600 * 1000,
      timestamp: blockData.block_header.raw_data.timestamp,
    };

    const extraParams = new Map<string, any>();

    extraParams.set(this.KEY_TOKEN_ADDRESS, this.tokenAddress);
    extraParams.set(this.KEY_DECIMALS, this.decimals);
    extraParams.set(this.KEY_METADATA, metadata);

    const feeRate = (await this.estimateGas()) ?? 40_000_000;

    const preparedData: AccountData = {
      balance,
      feeRate,
      extraParams,
      insufficientBalance: balance <= 0,
      insufficientBalanceForTokenTransfer: trxBalance < feeRate,
    };

    this.relayLogger.logPreparedData('TRC20', preparedData);
    return preparedData;
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      // decompress and decode
      const gunzip = promisify(zlib.gunzip);
      const compressedBuffer = Buffer.from(tx, 'base64');
      const decompressedBuffer = await gunzip(new Uint8Array(compressedBuffer));
      const signedTx = JSON.parse(decompressedBuffer.toString());

      //broadcast the tx
      const result = await this.tronWeb.trx.sendRawTransaction(signedTx);
      if ('code' in result) {
        this.relayLogger.error(`TRC20: Error broadcasting tx: ${JSON.stringify(result, null, 2)}`);
        throw new Error(result.code);
      }
      this.relayLogger.debug(`TRC20: Tx broadcasted: ${result.txid}`);
      return result.txid;
    } catch (e) {
      this.relayLogger.error('TRC20: Error broadcasting tx:', e);
      throw new Error(`TRC20: Error broadcasting tx: ${e}`);
    }
  }

  private async getTrxBalance(): Promise<number> {
    return await this.tronWeb.trx.getBalance(this.address);
  }

  private async estimateGas(): Promise<number | undefined> {
    try {
      const functionSelector = 'transfer(address,uint256)';
      const balance = await this.getBalance();
      const parameter = [
        { type: 'address', value: this.toAddress },
        { type: 'uint256', value: balance },
      ];
      // Trigger a dry-run of the transaction to estimate energy consumption
      const energyEstimate = await this.tronWeb.transactionBuilder.triggerConstantContract(
        this.tokenAddress,
        functionSelector,
        parameter,
      );

      // Get current energy prices from network
      const parameterInfo = await this.tronWeb.trx.getChainParameters();
      const energyFeeParameter = parameterInfo.find((param: any) => param.key === 'getEnergyFee');
      const energyFee = energyFeeParameter ? energyFeeParameter.value : 420;

      return energyEstimate.energy * energyFee * 1.1; // add 10% margin
    } catch (error) {
      this.relayLogger.error(`TRC20: Error estimating gas, ${error}`);
      return undefined;
    }
  }
}
