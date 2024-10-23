/* eslint-disable prefer-destructuring */
import { Input } from '@fireblocks/wallet-derivation';
import { Contract, Interface, Transaction, ethers } from 'ethers';
import { AccountData, TxPayload, RawSignature } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';
import { Ethereum } from '../EVM/ETH';
import { erc20Abi } from './erc20.abi';
import { transferAbi } from './transfer.abi';
import BigNumber from 'bignumber.js';

export class ERC20 extends Ethereum implements ConnectedWallet {
  private contract: Contract;

  constructor(input: Input, tokenAddress: string) {
    super(input);

    this.contract = new ethers.Contract(tokenAddress, erc20Abi);
  }

  public async getBalance(): Promise<number> {
    this.weiBalance = await this.contract.balanceOf(this.address);
    return parseFloat(parseFloat(ethers.formatEther(this.weiBalance)).toFixed(2));
  }

  public async prepare(): Promise<AccountData> {
    const displayBalance = await this.getBalance();
    const extraParams = new Map();
    extraParams.set(this.KEY_EVM_WEI_BALANCE, new BigNumber(this.weiBalance.toString()).toString(16));
    const preparedData = {
      balance: displayBalance,
      extraParams,
    };
    this.relayLogger.logPreparedData('ERC20', preparedData);
    return preparedData;
  }

  public async generateTx(to: string, amount: number): Promise<TxPayload> {
    const nonce = await this.provider!.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider!.getFeeData();

    const tx = {
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: 0,
      chainId: this.path.coinType === 1 ? 5 : 1,
      data: new Interface(transferAbi).encodeFunctionData('transfer', [
        to,
        BigInt(amount) * BigInt(await this.contract.decimals()),
      ]),
    };

    this.relayLogger.debug(`ERC20: Generated tx: ${JSON.stringify(tx, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2)}`);

    const unsignedTx = Transaction.from(tx).serialized;

    const preparedData = {
      derivationPath: this.pathParts,
      tx: unsignedTx,
    };

    this.relayLogger.debug(`ERC20: Prepared data: ${JSON.stringify(preparedData, null, 2)}`);
    return preparedData;
  }

  public async broadcastTx(txHex: string): Promise<string> {
    return super.broadcastTx(txHex);
  }
}
