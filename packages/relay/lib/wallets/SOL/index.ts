import * as web3 from "@solana/web3.js";
import { BaseWallet } from "../BaseWallet";

export class Solana implements BaseWallet {
  private readonly connection: web3.Connection;

  private readonly keypair: web3.Keypair;

  constructor(privateKeyHex: string, isTestnet: boolean) {
    const endpoint = web3.clusterApiUrl(isTestnet ? "devnet" : "mainnet-beta");

    this.connection = new web3.Connection(endpoint, "confirmed");

    const privateKeyBuffer = Uint8Array.from(Buffer.from(privateKeyHex, "hex"));

    this.keypair = web3.Keypair.fromSecretKey(privateKeyBuffer);
  }

  public getAddress() {
    return this.keypair.publicKey.toBase58();
  }

  public async getBalance() {
    const lamports = await this.connection.getBalance(this.keypair.publicKey);

    const balance = lamports / web3.LAMPORTS_PER_SOL;

    return balance;
  }

  public async sendTransaction(to: string, amount: number) {
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: new web3.PublicKey(to),
        lamports: amount * web3.LAMPORTS_PER_SOL,
      })
    );

    const signature = await web3.sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.keypair]
    );

    console.info({ signature });

    return signature;
  }
}
