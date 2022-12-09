import { ethers } from "ethers";
import { BaseWallet } from "../BaseWallet";

export class Ethereum implements BaseWallet {
  private readonly provider: ethers.providers.JsonRpcProvider;

  private readonly signer: ethers.providers.JsonRpcSigner;

  constructor(privateKeyHex: string, isTestnet: boolean) {
    const endpoint = `https://${
      isTestnet ? "rinkeby" : "mainnet"
    }.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    this.provider = new ethers.providers.JsonRpcProvider(endpoint);

    this.signer = this.provider.getSigner(privateKeyHex);
  }

  public async getAddress() {
    return this.signer.getAddress();
  }

  public async getBalance() {
    const address = await this.getAddress();

    const wei = await this.provider.getBalance(address);

    const balance = ethers.utils.formatEther(wei);

    return Number(balance);
  }

  public async sendTransaction(to: string, amount: number) {
    const tx = await this.signer.sendTransaction({
      to,
      value: ethers.utils.parseEther(String(amount)),
    });

    return tx.hash;
  }
}
