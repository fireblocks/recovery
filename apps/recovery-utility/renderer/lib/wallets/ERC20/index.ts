import { ethers, Wallet } from 'ethers';
import { EVMWallet as EVMBase } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';
import { erc20Abi } from './erc20.abi';

export class ERC20 extends EVMBase implements SigningWallet {
  public async generateTx({ to, extraParams, nonce, chainId, gasPrice }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    const balanceWei = BigInt(extraParams?.get('weiBalance'));

    const tokenAddress = extraParams?.get('tokenAddress');

    const maxPriorityFeePerGas = (BigInt(extraParams?.get('priorityFee')) * 115n) / 100n; //increase priority fee by 15% to increase chance of tx to be included in next block
    const maxFeePerGas = BigInt(extraParams?.get('maxFee'));
    const gasLimit = BigInt(extraParams?.get('gasLimit'));

    const iface = new ethers.Interface(erc20Abi);
    const data = iface.encodeFunctionData('transfer', [to, balanceWei]);

    let txObject = {};
    // EIP-1559 chain
    if (maxFeePerGas && maxPriorityFeePerGas) {
      txObject = { to: tokenAddress, data, nonce, gasLimit, maxFeePerGas, maxPriorityFeePerGas, chainId };
      // non EIP-1559 chain
    } else {
      txObject = { to: tokenAddress, data, nonce, gasLimit, gasPrice, chainId };
    }

    this.utilityLogger.logSigningTx('ERC20', txObject);

    const serialized = await new Wallet(this.privateKey).signTransaction(txObject);

    return {
      tx: serialized,
    };
  }
}
