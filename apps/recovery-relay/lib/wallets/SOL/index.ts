import { Buffer } from 'buffer';
import * as web3 from '@solana/web3.js';
import { ipcRenderer } from 'electron';
import { Solana as BaseSolana, Input } from '@fireblocks/wallet-derivation';
import { AccountData } from '../types';
import { ConnectedWallet } from '../ConnectedWallet';

export class Solana extends BaseSolana implements ConnectedWallet {
  private readonly solConnection: web3.Connection;

  constructor(input: Input) {
    super(input);

    const endpoint = input.isTestnet ? web3.clusterApiUrl('devnet') : web3.clusterApiUrl('mainnet-beta');

    this.solConnection = new web3.Connection(endpoint, {
      commitment: 'confirmed',
      //@ts-ignore
      fetch: async (input: string | URL | Request, init) => {
        const res = await ipcRenderer.invoke('main_proc_fetch', input, init);
        return new Response(res);
      },
    });
  }

  public async getBalance() {
    const lamports = await this.solConnection.getBalance(this.web3PubKey);
    const balance = lamports / web3.LAMPORTS_PER_SOL;
    return balance;
  }

  public async broadcastTx(tx: string): Promise<string> {
    try {
      const txHash = await this.solConnection.sendRawTransaction(Buffer.from(tx, 'hex'));
      this.relayLogger.debug(`Solana: Tx broadcasted: ${txHash}`);
      return txHash;
    } catch (e) {
      this.relayLogger.error(`Solana: Error broadcasting tx: ${e}`);
      throw e;
    }
  }

  public async prepare(): Promise<AccountData> {
    const accountBalance = await this.getBalance();
    let blockInfo = (await this.solConnection.getLatestBlockhash()).blockhash;

    //Simulate tx for fee
    const tx = new web3.Transaction({ feePayer: this.web3PubKey, recentBlockhash: blockInfo });
    tx.add(
      web3.SystemProgram.transfer({
        fromPubkey: this.web3PubKey,
        toPubkey: this.web3PubKey,
        lamports: accountBalance * web3.LAMPORTS_PER_SOL,
      }),
    );

    const feeForTx = ((await this.solConnection.getFeeForMessage(tx.compileMessage())).value ?? 0) / web3.LAMPORTS_PER_SOL;

    blockInfo = (await this.solConnection.getLatestBlockhash()).blockhash;
    const extraParams = new Map<string, string>();
    extraParams.set(this.KEY_RECENT_BLOCKHASH, blockInfo);

    const balance = Math.floor((accountBalance - feeForTx) * web3.LAMPORTS_PER_SOL) / web3.LAMPORTS_PER_SOL;

    const preparedData = {
      balance,
      insufficientBalance: accountBalance < 0.00000001,
      extraParams,
    } as AccountData;

    this.relayLogger.logPreparedData('Solana', preparedData);
    return preparedData;
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
