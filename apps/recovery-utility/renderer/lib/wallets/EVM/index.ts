/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-nested-ternary */
import { Wallet } from 'ethers';
import { EVMWallet as EVMBase, Input } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class EVM extends EVMBase implements SigningWallet {
  constructor(input: Input, chainId?: number) {
    super(input);
  }

  public async generateTx({
    to,
    // amount,
    nonce,
    gasPrice, // Should we use maxGasPrice? i.e. EIP1559.
    chainId,
    extraParams,
  }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    const balanceHex = extraParams?.get(this.KEY_EVM_WEI_BALANCE);
    const forceLegacyTx = extraParams?.get(this.KEY_EVM_FORCE_LEGACY_TX);

    const txObject = {
      from: this.address,
      to,
      nonce,
      gasLimit: 21000,
      gasPrice,
      value: BigInt(`0x${balanceHex}`),
      chainId: chainId ? chainId : this.path.coinType === 1 ? 5 : 1,
      type: forceLegacyTx ? 0 : undefined,
    };

    if (txObject.type === undefined) {
      delete txObject.type;
    }

    this.utilityLogger.logSigningTx('EVM', txObject);

    const serialized = await new Wallet(this.privateKey).signTransaction(txObject);

    return {
      tx: serialized,
    };
  }
}
