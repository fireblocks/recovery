import { Address, Networks, Transaction, Script, PrivateKey } from 'bitcore-lib-cash';
import * as tinysecp from 'tiny-secp256k1';
import { ECPairFactory } from 'ecpair';
import { Buffer } from 'buffer';
import { BitcoinCash as BaseBitcoinCash, Input } from '@fireblocks/wallet-derivation';
import { TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class BitcoinCash extends BaseBitcoinCash implements SigningWallet {
  private static readonly satsPerBch = 100000000;

  constructor(input: Input) {
    super(input);
  }

  private static _bchToSats(btc: number) {
    return btc * BitcoinCash.satsPerBch;
  }

  public async generateTx({ to, amount, utxos }: GenerateTxInput): Promise<TxPayload> {
    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    if (!utxos?.length) {
      throw new Error('No inputs found');
    }

    const satAmount = BitcoinCash._bchToSats(amount);
    // TODO: Compensate for fee

    const tx = new Transaction()
      .from(
        utxos.map((utxo) =>
          Transaction.UnspentOutput.fromObject({
            txId: Buffer.from(utxo.hash, 'hex'),
            outputIndex: utxo.index,
            satoshis: utxo.value,
          }),
        ),
      )
      .to(to, satAmount)
      .sign(this.privateKey);

    return {
      tx: tx.serialize(),
    };
  }
}
