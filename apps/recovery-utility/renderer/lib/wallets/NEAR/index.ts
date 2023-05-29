import { Near as BaseNEAR } from '@fireblocks/wallet-derivation';
import { SignedTransaction, createTransaction, Signature } from 'near-api-js/lib/transaction';
import { transactions } from 'near-api-js';
import { PublicKey } from 'near-api-js/lib/utils';
import BN from 'bn.js';
import { baseDecode, baseEncode } from 'borsh';
import { SigningWallet } from '../SigningWallet';
import { GenerateTxInput, TxPayload } from '../types';
import { sha256 } from '@noble/hashes/sha256';

export class Near extends BaseNEAR implements SigningWallet {
  public async generateTx({ to, extraParams, amount }: GenerateTxInput): Promise<TxPayload> {
    const pubKey = PublicKey.from(baseEncode(Buffer.from(this.publicKey!.replace('0x', ''), 'hex')));

    const nonce = extraParams?.get(this.KEY_NONCE);
    const hash = extraParams?.get(this.KEY_HASH);
    const tx = createTransaction(
      this.address,
      pubKey,
      to,
      new BN(nonce, 'hex').add(new BN(1)),
      [transactions.transfer(new BN(amount).mul(new BN('1000000000000000000000000')))],
      baseDecode(hash),
    );

    const sig = await this.sign(sha256(tx.encode()));
    const signature = new Signature({
      data: sig,
      keyType: pubKey.keyType,
    });
    const signedTx = new SignedTransaction({
      transaction: tx,
      signature,
    });

    return {
      tx: Buffer.from(signedTx.encode()).toString('hex'),
    };
  }
}
