import * as web3 from '@solana/web3.js';
import { Solana as BaseSolana, Input } from '@fireblocks/wallet-derivation';
import { RawSignature, TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class Solana extends BaseSolana implements SigningWallet {
  private readonly connection: web3.Connection;

  constructor(input: Input) {
    super(input);

    const endpoint = input.isTestnet ? web3.clusterApiUrl('devnet') : web3.clusterApiUrl('mainnet-beta');

    this.connection = new web3.Connection(endpoint, 'confirmed');
  }

  public async generateTx({ to, amount, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const tx = new web3.Transaction({ feePayer: this.web3PubKey, recentBlockhash: extraParams?.get(this.KEY_RECENT_BLOCKHASH) });

    tx.add(
      web3.SystemProgram.transfer({
        fromPubkey: this.web3PubKey,
        toPubkey: new web3.PublicKey(to),
        lamports: amount * web3.LAMPORTS_PER_SOL,
      }),
    );

    if (!this.privateKey) {
      throw new Error('No private key found');
    }

    const serializedTx = tx.serializeMessage();
    this.utilityLogger.logSigningTx('Solana', tx);

    // const signature = await this.sign(serializedTx);
    const signature = await this.sign(Uint8Array.from(serializedTx));

    // tx.addSignature(this.web3PubKey, signature as Buffer);
    tx.addSignature(this.web3PubKey, Buffer.from(signature));

    // unsignedTx.addSignature(this.web3PubKey, Buffer.concat([Buffer.from(sig.r, 'hex'), Buffer.from(sig.s, 'hex')]));

    const encodedSerializedTx = tx.serialize();

    return {
      tx: encodedSerializedTx.toString('hex'),
    };
  }

  // public async rawSignTx(txHashBuffer: Buffer): Promise<string> {
  //   const signature = await this.sign(Uint8Array.from(txHashBuffer));
  //   return Buffer.from(signature).toString('hex');
  // }
}
