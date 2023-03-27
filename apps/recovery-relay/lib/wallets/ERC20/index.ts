/* eslint-disable prefer-destructuring */
import { Input } from '@fireblocks/wallet-derivation';
import { Contract, Interface, Transaction, ethers } from 'ethers';
import { BaseWallet } from '../BaseWallet';
import { AccountData, TxPayload, RawSignature } from '../types';
import { Ethereum } from '../EVM/ETH';
import { erc20Abi } from './erc20.abi';
import { transferAbi } from './transfer.abi';

export class ERC20 extends Ethereum implements BaseWallet {
  private contract: Contract;

  constructor(input: Input, tokenAddress: string) {
    super(input);

    this.contract = new ethers.Contract(tokenAddress, erc20Abi);
  }

  public async getBalance(): Promise<number> {
    const amountInWei = await this.contract.balanceOf(this.address);
    return parseFloat(parseFloat(ethers.formatEther(amountInWei)).toFixed(2));
  }

  public async prepare(): Promise<AccountData> {
    return {
      balance: await this.getBalance(),
    };
  }

  public async generateTx(to: string, amount: number): Promise<TxPayload> {
    const nonce = await this.provider.getTransactionCount(this.address, 'latest');

    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();

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

    const unsignedTx = Transaction.from(tx).serialized;

    return {
      derivationPath: this.pathParts,
      tx: unsignedTx,
    };
  }

  public async broadcastTx(txHex: string, sigs: RawSignature[]): Promise<string> {
    return super.broadcastTx(txHex, sigs);
  }
}
