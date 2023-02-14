import { eddsaDerive } from "../eddsa";
import { BaseWallet } from "./BaseWallet";

export abstract class EDDSAWallet extends BaseWallet {
  protected publicKey: string;

  public constructor(
    fpub: string,
    protected coinId: number,
    protected account: number = 0,
    protected changeIndex: number = 0,
    protected addressIndex: number = 0
  ) {
    super();
    let undef; // ignored
    [undef, this.publicKey] = eddsaDerive(fpub, [
      44,
      coinId,
      account,
      changeIndex,
      addressIndex,
    ]);
  }
}
