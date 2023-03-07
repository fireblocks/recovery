import { ethers } from "ethers";
import { Ethereum as BaseEthereum } from "@fireblocks/wallet-derivation";
import {
  serialize,
  parse,
  UnsignedTransaction,
} from "@ethersproject/transactions";
import { AccountData, UTXO, TxPayload, RawSignature } from "../types";

export class Ethereum extends BaseEthereum {
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor(
    xpub: string,
    account: number,
    changeIndex: number,
    addressIndex: number,
    isTestnet = false
  ) {
    super({
      xpub,
      assetId: "ETH",
      path: { account, changeIndex, addressIndex },
      isTestnet,
    });

    const cluster = isTestnet ? "goerli" : "mainnet";
    const endpoint = `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    this.provider = new ethers.providers.JsonRpcProvider(endpoint);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.data.address);

    const balance = ethers.utils.formatEther(wei);

    return Number(balance);
  }

  public async prepare(): Promise<AccountData> {
    const balance = await this.getBalance();
    return {
      balance,
    };
  }

  public async generateTx(
    to: string,
    amount: number,
    memo?: string | undefined,
    utxos?: UTXO[] | undefined,
    additionalParameters?: Map<string, object> | undefined
  ): Promise<TxPayload> {
    const nonce = await this.provider.getTransactionCount(
      this.data.address,
      "latest"
    );
    // Should we use maxGasPrice? i.e. EIP1559.
    const gasPrice = (await this.provider.getFeeData()).gasPrice;
    const tx = {
      from: this.data.address,
      to,
      nonce,
      gasLimit: additionalParameters
        ? additionalParameters!.get("GAS-LIMIT")
        : 21000,
      gasPrice: additionalParameters
        ? additionalParameters!.get("GAS-PRICE")
        : gasPrice,
      value: amount,
      chainId: this.data.path.coinType === 1 ? 5 : 1,
    };

    const unsignedTx = serialize(tx as UnsignedTransaction);
    return {
      derivationPath: [
        44,
        this.data.path.account,
        this.data.path.coinType,
        this.data.path.changeIndex,
        this.data.path.addressIndex,
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
