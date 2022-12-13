import * as web3 from "@solana/web3.js";
import { eddsaSign } from "../../eddsa";
import { BaseWallet } from "../BaseWallet";

export class Solana implements BaseWallet {
  private readonly connection: web3.Connection;

  private readonly publicKey: web3.PublicKey;

  constructor(address: string, isTestnet: boolean) {
    const endpoint = isTestnet
      ? web3.clusterApiUrl("devnet")
      : "https://try-rpc.mainnet.solana.blockdaemon.tech";

    this.connection = new web3.Connection(endpoint, "confirmed");

    this.publicKey = new web3.PublicKey(address);
  }

  public async getBalance() {
    const lamports = await this.connection.getBalance(this.publicKey);

    const balance = lamports / web3.LAMPORTS_PER_SOL;

    return balance;
  }

  public async sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ) {
    const fromPubkey = this.publicKey;

    const instruction = web3.SystemProgram.transfer({
      fromPubkey,
      toPubkey: new web3.PublicKey(to),
      lamports: amount * web3.LAMPORTS_PER_SOL,
    });

    const tx = new web3.Transaction().add(instruction);

    const latestBlockhash = await this.connection.getLatestBlockhash();

    tx.recentBlockhash = latestBlockhash.blockhash;

    tx.feePayer = fromPubkey;

    const serializedTx = tx.serializeMessage();

    const signature = await eddsaSign(serializedTx, privateKeyHex);

    tx.addSignature(fromPubkey, signature as Buffer);

    const encodedSerializedTx = tx.serialize();

    const txHash = await this.connection.sendRawTransaction(
      encodedSerializedTx
    );

    return txHash;
  }
}
