import * as web3 from "@solana/web3.js";
import bs58 from "bs58";
import { eddsaSign } from "../../eddsa";
import { BaseWallet } from "../BaseWallet";

const fromHexString = (hexString: string) => {
  const chars = hexString.match(/.{1,2}/g);

  if (!chars) {
    return new Uint8Array();
  }

  return Uint8Array.from(chars.map((byte) => parseInt(byte, 16)));
};

export class Solana extends BaseWallet {
  private readonly connection: web3.Connection;

  private readonly publicKey: web3.PublicKey;

  constructor(
    private readonly publicKeyHex: string,
    private readonly isTestnet: boolean
  ) {
    super(publicKeyHex, isTestnet);

    const endpoint = this.isTestnet
      ? web3.clusterApiUrl("devnet")
      : "https://try-rpc.mainnet.solana.blockdaemon.tech";

    this.connection = new web3.Connection(endpoint, "confirmed");

    const publicKeyBase58 = bs58.encode(fromHexString(publicKeyHex));

    this.publicKey = new web3.PublicKey(publicKeyBase58);
  }

  public getAddress() {
    return this.publicKey.toBase58();
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

    const toPubkey = new web3.PublicKey(to);

    const lamports = amount * web3.LAMPORTS_PER_SOL;

    const latestBlockhash = await this.connection.getLatestBlockhash();

    const instruction = web3.SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports,
    });

    const tx = new web3.Transaction().add(instruction);

    tx.recentBlockhash = latestBlockhash.blockhash;

    tx.feePayer = fromPubkey;

    const serializedTx = tx.serializeMessage();

    const signature = await eddsaSign(serializedTx, privateKeyHex);

    tx.addSignature(fromPubkey, signature as Buffer);

    const encodedSerializedTx = tx.serialize();

    const txHash = await this.connection.sendRawTransaction(
      encodedSerializedTx
    );

    console.info({ txHash });

    return txHash;
  }
}
