import * as web3 from '@solana/web3.js';
import { Solana as BaseSolana, Input } from '@fireblocks/wallet-derivation';
import { RawSignature, TxPayload, GenerateTxInput } from '../types';
import { SigningWallet } from '../SigningWallet';

export class Solana extends BaseSolana implements SigningWallet {
  private readonly connection: web3.Connection;

  constructor(input: Input) {
    super(input);

    const endpoint = input.isTestnet ? web3.clusterApiUrl('devnet') : 'https://try-rpc.mainnet.solana.blockdaemon.tech';

    this.connection = new web3.Connection(endpoint, 'confirmed');
  }

  public async generateTx({ to, amount, blockHash }: GenerateTxInput): Promise<TxPayload> {
    const tx = new web3.Transaction({ feePayer: this.web3PubKey, recentBlockhash: blockHash });

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
    this.utilityLogger.debug(`Solana: Signing tx: ${JSON.stringify(tx, null, 2)}`);

    const signature = await this.sign(serializedTx);

    tx.addSignature(this.web3PubKey, signature as Buffer);
    // unsignedTx.addSignature(this.web3PubKey, Buffer.concat([Buffer.from(sig.r, 'hex'), Buffer.from(sig.s, 'hex')]));

    const encodedSerializedTx = tx.serialize();

    return {
      tx: encodedSerializedTx.toString('hex'),
    };
  }
}
