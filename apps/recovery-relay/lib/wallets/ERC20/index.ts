/* eslint-disable prefer-destructuring */
import { Input } from '@fireblocks/wallet-derivation';
import { Contract, Interface, InterfaceAbi, Transaction, ethers } from 'ethers';
import { BaseWallet } from '../BaseWallet';
import { AccountData, TxPayload, RawSignature } from '../types';
import { Ethereum } from '../EVM/ETH';
import erc20Abi from './erc20.abi.json';

export class ERC20 extends Ethereum implements BaseWallet {
  private contract: Contract;

  private transferAbi: InterfaceAbi = [
    {
      constant: false,
      inputs: [
        {
          name: '_to',
          type: 'address',
        },
        {
          name: '_value',
          type: 'uint256',
        },
      ],
      name: 'transfer',
      outputs: [
        {
          name: '',
          type: 'bool',
        },
      ],
      payable: false,
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

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
      data: new Interface(this.transferAbi).encodeFunctionData('transfer', [
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
