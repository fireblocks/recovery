import * as web3 from "@solana/web3.js";
import { EDDSAWallet } from "../EDDSAWallet";
import { encode } from "bs58";
import { RawSignature, AccountData, UTXO, TxPayload } from "../types";

export class Solana extends EDDSAWallet {
  private readonly connection: web3.Connection;

  private readonly web3PubKey: web3.PublicKey;

  constructor(
    fpub: string,
    account: number,
    changeIndex: number,
    accountIndex: number,
    private isTestnet: boolean = false
  ) {
    super(fpub, isTestnet ? 1 : 501, account, changeIndex, accountIndex);

    const endpoint = isTestnet
      ? web3.clusterApiUrl("devnet")
      : "https://try-rpc.mainnet.solana.blockdaemon.tech";

    this.connection = new web3.Connection(endpoint, "confirmed");
    this.web3PubKey = new web3.PublicKey(Buffer.from(this.publicKey, "hex"));
    this.address = encode(Buffer.from(this.publicKey, "hex"));
  }

  public async getBalance() {
    const lamports = await this.connection.getBalance(this.web3PubKey);

    const balance = lamports / web3.LAMPORTS_PER_SOL;

    return balance;
  }

  public async broadcastTx(
    tx: string,
    sig: RawSignature,
    _?: string | undefined
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
    amount: number,
    memo?: string | undefined,
    utxos?: UTXO[] | undefined,
    additionalParameters?: Map<string, object> | undefined
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
    while (true) {
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
      derivationPath: [
        44,
        this.coinId,
        this.account,
        this.changeIndex,
        this.addressIndex,
      ],
      tx: serializedTx.toString("hex"),
    };
  }
}
