import { providers, utils, UnsignedTransaction } from "ethers";
import { Ethereum as BaseEthereum } from "@fireblocks/wallet-derivation";
import { AccountData, UTXO, TxPayload, RawSignature } from "../types";
import { BaseWallet } from "../BaseWallet";

export class Ethereum extends BaseEthereum implements BaseWallet {
  private readonly provider: providers.JsonRpcProvider;

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

    this.provider = new providers.JsonRpcProvider(endpoint);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);

    const balance = utils.formatEther(wei);

    const ethBalance = Number(balance);

    this.balance = ethBalance;
    this.lastUpdated = new Date();

    return ethBalance;
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
      this.address,
      "latest"
    );
    // Should we use maxGasPrice? i.e. EIP1559.
    const { gasPrice } = await this.provider.getFeeData();
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
      chainId: this.path.coinType === 1 ? 5 : 1,
    };

    const unsignedTx = utils.serializeTransaction(tx as UnsignedTransaction);
    return {
      derivationPath: this.pathParts,
      tx: unsignedTx,
    };
  }

  public async broadcastTx(
    tx: string,
    sig: RawSignature
    // customUrl?: string | undefined
  ): Promise<string> {
    const unsginedTx = utils.parseTransaction(Buffer.from(tx, "hex"));
    const signedTxData = utils.serializeTransaction(unsginedTx, {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    });

    const txResponse = await this.provider.sendTransaction(signedTxData);
    return txResponse.hash;
  }
}
