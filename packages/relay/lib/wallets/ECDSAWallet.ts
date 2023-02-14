import { ethers } from "ethers";
import { BaseWallet } from "./BaseWallet";

export abstract class ECDSAWallet extends BaseWallet {
  protected publicKey: string;

  public constructor(
    xpub: string,
    protected coinId: number,
    protected account: number = 0,
    protected changeIndex: number = 0,
    protected addressIndex: number = 0
  ) {
    super();
    this.publicKey = ethers.utils.HDNode.fromExtendedKey(xpub).derivePath(
      `m/44/${coinId}/${account}/${changeIndex}/${addressIndex}`
    ).publicKey;
  }
}
