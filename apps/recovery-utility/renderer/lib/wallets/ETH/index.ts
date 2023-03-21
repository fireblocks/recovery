import { Transaction, Wallet } from 'ethers';
import { Ethereum as BaseEthereum } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class Ethereum extends BaseEthereum implements SigningWallet {
  public async generateTx({
    to,
    amount,
    nonce,
    gasPrice, // Should we use maxGasPrice? i.e. EIP1559.
  }: GenerateTxInput): Promise<TxPayload> {
    const tx = Transaction.from({
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: amount,
      chainId: this.path.coinType === 1 ? 5 : 1,
    });

    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    const serialized = await new Wallet(this.privateKey).signTransaction(tx);

    return {
      tx: serialized,
    };
  }
}
