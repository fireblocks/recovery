import { ethers, Wallet } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';
import { erc20Abi } from './erc20.abi';

export class ERC20 extends EVMBase implements SigningWallet {
  constructor(input: Input, chainId?: number) {
    super(input);
  }

  public async generateTx({ to, amount, extraParams, gasPrice, nonce, chainId }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    const balanceWei = ethers.parseUnits(amount.toFixed(2), 'ether');
    const tokenAddress = extraParams?.get('tokenAddress');
    const maxPriorityFeePerGas = extraParams?.get('priorityFee');
    const maxFeePerGas = extraParams?.get('maxFee');
    const gasLimit = extraParams?.get('gasLimit');

    const iface = new ethers.Interface(erc20Abi);
    const data = iface.encodeFunctionData('transfer', [to, balanceWei]);

    const txObject = {
      to: tokenAddress,
      data,
      nonce,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
    };

    this.utilityLogger.logSigningTx('EVM', txObject);

    const serialized = await new Wallet(this.privateKey).signTransaction(txObject);

    return {
      tx: serialized,
    };
  }
}
