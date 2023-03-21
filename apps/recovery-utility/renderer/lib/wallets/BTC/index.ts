import { Network, networks, Psbt } from 'bitcoinjs-lib';
import tinysecp from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { Buffer } from 'buffer';
import { Bitcoin as BaseBitcoin, Input } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class Bitcoin extends BaseBitcoin implements SigningWallet {
  private static readonly ECPair = ECPairFactory(tinysecp);

  private static readonly satsPerBtc = 100000000;

  private readonly network: Network;

  constructor(input: Input) {
    super(input);

    this.network = networks[input.isTestnet ? 'testnet' : 'bitcoin'];
  }

  private static _btcToSats(btc: number) {
    return btc * Bitcoin.satsPerBtc;
  }

  public async generateTx({ to, amount, inputs, feeRate }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!inputs?.length) {
      throw new Error('No inputs found');
    }

    if (typeof feeRate !== 'number') {
      throw new Error('Fee rate is not a number');
    }

    const tx = new Psbt({ network: this.network });

    // eslint-disable-next-line no-restricted-syntax
    for (const input of inputs) {
      tx.addInput({
        hash: input.hash,
        index: input.index,
        ...('witnessUtxo' in input
          ? {
              witnessUtxo: {
                script: Buffer.from(input.witnessUtxo.script, 'hex'),
                value: input.witnessUtxo.value,
              },
            }
          : { nonWitnessUtxo: Buffer.from(input.nonWitnessUtxo, 'hex') }),
      });
    }

    const satAmount = Bitcoin._btcToSats(amount);
    const vBytes = this.isLegacy ? 148 * inputs.length + 34 + 10 : 68 * inputs.length + 31 + 10.5;
    const fee = feeRate * Math.ceil(vBytes);
    const actualAmount = Math.ceil(satAmount - fee);

    tx.addOutput({
      address: to,
      value: actualAmount,
    });

    const signer = Bitcoin.ECPair.fromPrivateKey(Buffer.from(this.privateKey, 'hex'));
    tx.signAllInputs(signer);
    tx.finalizeAllInputs();

    return {
      tx: tx.toHex(),
    };
  }
}
