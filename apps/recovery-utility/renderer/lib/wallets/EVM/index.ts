import { Wallet, parseEther } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class EVM extends EVMBase implements SigningWallet {
  constructor(input: Input, chainId?: number) {
    super(input);
  }

  public async generateTx({
    to,
    amount,
    nonce,
    gasPrice, // Should we use maxGasPrice? i.e. EIP1559.
    chainId,
  }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    this.utilityLogger.logSigningTx('EVM', {
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: parseEther(`${amount}`),
      chainId: chainId ? chainId : this.path.coinType === 1 ? 5 : 1,
    });

    const serialized = await new Wallet(this.privateKey).signTransaction({
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: parseEther(`${amount}`),
      chainId: chainId ? chainId : this.path.coinType === 1 ? 5 : 1,
    });

    return {
      tx: serialized,
    };
  }
}
