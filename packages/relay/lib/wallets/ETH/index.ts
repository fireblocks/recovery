import { ethers } from "ethers";
import { ECDSAWallet } from "../ECDSAWallet";
import {
  serialize,
  parse,
  UnsignedTransaction,
} from "@ethersproject/transactions";

export class Ethereum extends ECDSAWallet {
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly address: string;

  constructor(
    xpub: string,
    account: number,
    changeIndex: number = 0,
    addressIndex: number = 0,
    isTestnet: boolean = false
  ) {
    super(xpub, isTestnet ? 1 : 60, account, changeIndex, addressIndex);
    const cluster = isTestnet ? "rinkeby" : "mainnet";
    const endpoint = `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    this.provider = new ethers.providers.JsonRpcProvider(endpoint);
    this.address = ethers.utils.HDNode.fromExtendedKey(xpub).derivePath(
      `m/44/${this.coinId}/${this.account}/${this.changeIndex}/${this.addressIndex}`
    ).address;
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);

    const balance = ethers.utils.formatEther(wei);

    return Number(balance);
  }

  public async prepare(publicAddr: string): Promise<AccountData> {
    const balance = await this.getBalance();
    return {
      balance,
    };
  }

  public async generateTx(
    from: string,
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: UTXO[] | undefined,
    additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const nonce = await this.provider.getTransactionCount(
      this.address,
      "latest"
    );
    // Should we use maxGasPrice? i.e. EIP1559.
    const gasPrice = (await this.provider.getFeeData()).gasPrice;
    const tx = {
      from: this.address,
      to,
      nonce,
      gasLimit: additionalParameters
        ? additionalParameters!.get("GAS-LIMIT")
        : 21000,
      gasPrice: additionalParameters
        ? additionalParameters!.get("GAS-PRICE")
        : gasPrice,
      value: amount,
      chainId: this.coinId === 1 ? 5 : 1,
    };

    const unsignedTx = serialize(tx as UnsignedTransaction);
    return {
      derivationPath: [
        44,
        this.account,
        this.coinId,
        this.changeIndex,
        this.addressIndex,
      ],
      tx: unsignedTx,
    };
  }
  public async broadcastTx(
    tx: string,
    sig: RawSignature,
    customUrl?: string | undefined
  ): Promise<string> {
    const unsginedTx = parse(Buffer.from(tx, "hex"));
    const signedTxData = serialize(unsginedTx, {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    });

    const txResponse = await this.provider.sendTransaction(signedTxData);
    return txResponse.hash;
  }
}
