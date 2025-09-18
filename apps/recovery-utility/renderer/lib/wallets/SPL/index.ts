import * as web3 from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { Solana as SolanaBase, Input } from '@fireblocks/wallet-derivation';
import { SigningWallet } from '../SigningWallet';
import { TxPayload, GenerateTxInput } from '../types';

export class SPL extends SolanaBase implements SigningWallet {
  private readonly connection: web3.Connection;

  constructor(input: Input) {
    super(input);
    const endpoint = input.isTestnet ? web3.clusterApiUrl('devnet') : web3.clusterApiUrl('mainnet-beta');
    this.connection = new web3.Connection(endpoint, 'confirmed');
  }

  public async generateTx({ to, amount, extraParams }: GenerateTxInput): Promise<TxPayload> {
    const mint = extraParams?.get('mint');
    const createATA = extraParams?.get('createATA') === 'true';
    const decimals = extraParams?.get('decimals') || 6;

    if (!mint) throw new Error('Missing "mint" in extraParams');

    const recentBlockhash = extraParams?.get(this.KEY_RECENT_BLOCKHASH);
    if (!recentBlockhash) throw new Error('Missing "recentBlockhash" in extraParams');

    if (!this.privateKey) throw new Error('No private key found');

    const mintPubkey = new web3.PublicKey(mint);
    const from = this.web3PubKey;
    const toPubkey = new web3.PublicKey(to);

    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, from);
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, toPubkey);

    const amountRaw = Math.round(amount * Math.pow(10, decimals));

    const tx = new web3.Transaction();
    tx.feePayer = from;
    tx.recentBlockhash = recentBlockhash;
    if (createATA) {
      tx.add(
        createAssociatedTokenAccountInstruction(
          from, // payer
          toTokenAccount,
          toPubkey, // owner
          mintPubkey,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID,
        ),
      );
    }

    tx.add(createTransferInstruction(fromTokenAccount, toTokenAccount, from, amountRaw));

    this.utilityLogger.logSigningTx('SPL', tx);

    const serializedMsg = tx.serializeMessage();
    const signature = await this.sign(Uint8Array.from(serializedMsg));
    tx.addSignature(from, Buffer.from(signature));

    return {
      tx: tx.serialize().toString('hex'),
    };
  }
}
