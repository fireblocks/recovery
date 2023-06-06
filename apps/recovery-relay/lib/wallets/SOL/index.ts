import { Buffer } from 'buffer';
import * as web3 from '@solana/web3.js';
import { Solana as BaseSolana, Input } from '@fireblocks/wallet-derivation';
import { AccountData, TxPayload } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Solana extends BaseSolana implements ConnectedWallet {
  private readonly connection: web3.Connection;

  constructor(input: Input) {
    super(input);

    const endpoint = input.isTestnet ? web3.clusterApiUrl('devnet') : 'https://try-rpc.mainnet.solana.blockdaemon.tech';

    this.connection = new web3.Connection(endpoint, 'confirmed');
  }

  public async getBalance() {
    const lamports = await this.connection.getBalance(this.web3PubKey);
    const balance = lamports / web3.LAMPORTS_PER_SOL;
    return balance;
  }

  public async broadcastTx(tx: string): Promise<string> {
    const txHash = await this.connection.sendRawTransaction(Buffer.from(tx, 'hex'));

    return txHash;
  }

  public async prepare(): Promise<AccountData> {
    const accountBalance = await this.getBalance();
    return {
      balance: accountBalance,
      insufficientBalance: accountBalance < 0.00000001,
    } as AccountData;
  }

  // public async generateTx(
  //   to: string,
  //   amount: number,
  //   // memo?: string | undefined,
  //   // utxos?: UTXO[] | undefined,
  //   // additionalParameters?: Map<string, object> | undefined
  // ): Promise<TxPayload> {
  //   const tx: web3.Transaction = new web3.Transaction().add(
  //     web3.SystemProgram.transfer({
  //       fromPubkey: this.web3PubKey,
  //       toPubkey: new web3.PublicKey(to),
  //       lamports: amount * web3.LAMPORTS_PER_SOL,
  //     }),
  //   );

  //   // Check for sufficient fee
  //   const balance = (await this.getBalance()) * web3.LAMPORTS_PER_SOL;
  //   tx.feePayer = this.web3PubKey;
  //   const fee = await tx.getEstimatedFee(this.connection);
  //   if (fee !== null) {
  //     if (fee > balance - amount) {
  //       throw new Error(
  //         `Insufficient balance for fee - balance: ${balance / web3.LAMPORTS_PER_SOL}, tx amount: ${
  //           amount / web3.LAMPORTS_PER_SOL
  //         }, fee: ${fee / web3.LAMPORTS_PER_SOL}`,
  //       );
  //     }
  //   }

  //   // Wait for blockhash rotation to give us as much time as possible
  //   let txBlockHash = (await this.connection.getLatestBlockhash()).blockhash;

  //   // eslint-disable-next-line no-constant-condition
  //   while (true) {
  //     // eslint-disable-next-line no-await-in-loop
  //     const currentBlockHash = (await this.connection.getLatestBlockhash()).blockhash;
  //     if (txBlockHash !== currentBlockHash) {
  //       txBlockHash = currentBlockHash;
  //       break;
  //     }
  //   }

  //   tx.recentBlockhash = txBlockHash;
  //   const serializedTx = tx.serializeMessage();

  //   return {
  //     derivationPath: this.pathParts,
  //     tx: serializedTx.toString('hex'),
  //   };
  // }
}
