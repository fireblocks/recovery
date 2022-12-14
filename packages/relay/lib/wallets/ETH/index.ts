import { ethers, Wallet } from "ethers";
import { BaseWallet } from "../BaseWallet";

export class Ethereum implements BaseWallet {
  private readonly provider: ethers.providers.JsonRpcProvider;

  constructor(private readonly address: string, isTestnet: boolean) {
    const cluster = isTestnet ? "rinkeby" : "mainnet";

    const endpoint = `https://${cluster}.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`;

    this.provider = new ethers.providers.JsonRpcProvider(endpoint);
  }

  public async getBalance() {
    const wei = await this.provider.getBalance(this.address);

    const balance = ethers.utils.formatEther(wei);

    return Number(balance);
  }

  public async sendTransaction(
    privateKeyHex: string,
    to: string,
    amount: number
  ) {
    const wallet = new Wallet(`0x${privateKeyHex}`, this.provider);

    // const signer = this.provider.getSigner(`0x${privateKeyHex}`);

    const tx = await wallet.sendTransaction({
      to,
      value: ethers.utils.parseEther(String(amount)),
      // TODO: Make this user-configurable
      gasLimit: "21000",
      maxPriorityFeePerGas: ethers.utils.parseUnits("5", "gwei"),
      maxFeePerGas: ethers.utils.parseUnits("20", "gwei"),
      nonce: 1,
      type: 2,
      chainId: 1,
    });

    return tx.hash;
  }
}
