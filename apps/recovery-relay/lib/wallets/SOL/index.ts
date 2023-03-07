import * as web3 from "@solana/web3.js";
import { Solana as BaseSolana } from "@fireblocks/wallet-derivation";
import { RawSignature, AccountData, TxPayload } from "../types";
import { BaseWallet } from "../BaseWallet";

export class Solana extends BaseSolana implements BaseWallet {
  private readonly connection: web3.Connection;

  private readonly web3PubKey: web3.PublicKey;

  constructor(
    fpub: string,
    account: number,
    changeIndex: number,
    addressIndex: number,
    isTestnet = false
  ) {
    super({
      fpub,
      assetId: "SOL",
      path: { account, changeIndex, addressIndex },
      isTestnet,
    });

    const endpoint = isTestnet
      ? web3.clusterApiUrl("devnet")
      : "https://try-rpc.mainnet.solana.blockdaemon.tech";

    this.connection = new web3.Connection(endpoint, "confirmed");
    this.web3PubKey = new web3.PublicKey(Buffer.from(this.publicKey, "hex"));
  }

  public async getBalance() {
    const lamports = await this.connection.getBalance(this.web3PubKey);

    const balance = lamports / web3.LAMPORTS_PER_SOL;

    return balance;
  }

  public async broadcastTx(
    tx: string,
    sig: RawSignature
    // _?: string | undefined
  ): Promise<string> {
    const unsignedTx = web3.VersionedTransaction.deserialize(
      Buffer.from(tx, "hex")
    );
    unsignedTx.addSignature(
      this.web3PubKey,
      Buffer.concat([Buffer.from(sig.r, "hex"), Buffer.from(sig.s, "hex")])
    );
    const txHash = await this.connection.sendRawTransaction(
      unsignedTx.serialize()
    );

    return txHash;
  }

  public async prepare(): Promise<AccountData> {
    const accountBalance = await this.getBalance();
    return {
      balance: accountBalance,
    } as AccountData;
  }

  public async generateTx(
    to: string,
    amount: number
    // memo?: string | undefined,
    // utxos?: UTXO[] | undefined,
    // additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const tx: web3.Transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: this.web3PubKey,
        toPubkey: new web3.PublicKey(to),
        lamports: amount * web3.LAMPORTS_PER_SOL,
      })
    );

    // Check for sufficient fee
    const balance = (await this.getBalance()) * web3.LAMPORTS_PER_SOL;
    tx.feePayer = this.web3PubKey;
    const fee = await tx.getEstimatedFee(this.connection);
    if (fee !== null) {
      if (fee > balance - amount) {
        throw new Error(
          `Insufficient balance for fee - balance: ${
            balance / web3.LAMPORTS_PER_SOL
          }, tx amount: ${amount / web3.LAMPORTS_PER_SOL}, fee: ${
            fee / web3.LAMPORTS_PER_SOL
          }`
        );
      }
    }

    // Wait for blockhash rotation to give us as much time as possible
    let txBlockHash = (await this.connection.getLatestBlockhash()).blockhash;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const currentBlockHash = (await this.connection.getLatestBlockhash())
        .blockhash;
      if (txBlockHash !== currentBlockHash) {
        txBlockHash = currentBlockHash;
        break;
      }
    }

    tx.recentBlockhash = txBlockHash;
    const serializedTx = tx.serializeMessage();
    return {
      derivationPath: this.pathParts,
      tx: serializedTx.toString("hex"),
    };
  }
}
